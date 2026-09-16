import Stripe from 'stripe';
import { ApiError } from '../../common';
import { config } from '../config';
import { resolvePaymentDestination, isPaymentDestinationReady } from './payment-destination.service';
import {
  cancelRegistration,
  registerForEvent,
  setRegistrationCheckoutSession,
  type EventRegistrationInput,
} from './event-registration.service';

const stripeClient = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

function requireStripe(): Stripe {
  if (!stripeClient) {
    throw new ApiError("Le paiement n'est pas configuré sur cette instance (STRIPE_SECRET_KEY manquant).", 400);
  }
  return stripeClient;
}

/** Une Checkout Session non réglée expire vite : voir le filtre appliqué par `countReservedSeats`. */
const CHECKOUT_SESSION_TTL_SECONDS = 30 * 60;

export interface CheckoutSessionInput extends EventRegistrationInput {
  seats: number;
}

/**
 * Crée l'inscription (en attente de paiement) puis la Checkout Session Stripe
 * correspondante. Reprend, en amont, exactement les contrôles de
 * `POST /registrations` (visibilité, idempotence, places restantes) — c'est à
 * l'appelant (la route) de les avoir déjà faits, comme pour une inscription
 * gratuite ; cette fonction se concentre sur le paiement.
 */
export async function createCheckoutSession(
  event: Record<string, unknown>,
  input: CheckoutSessionInput,
): Promise<{ url: string; registrationId: string }> {
  const client = requireStripe();

  const destination = await resolvePaymentDestination(event);
  if (!isPaymentDestinationReady(destination)) {
    throw new ApiError(
      "Ce groupe n'a pas encore configuré la réception des paiements pour ses événements.",
      409,
    );
  }

  const amount = Number(event.amount ?? 0);
  if (!(amount > 0)) {
    throw new ApiError('Cet événement est gratuit : aucun paiement à effectuer.', 400);
  }

  const registration = await registerForEvent({
    ...input,
    status: 'PENDING_PAYMENT',
  });
  const registrationId = String(registration.id);

  const unitAmount = Math.round(amount * 100);
  const eventName = typeof event.name === 'string' ? event.name : 'Événement';

  let session: Stripe.Checkout.Session;
  try {
    session = await client.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: destination.currency,
            product_data: { name: eventName },
            unit_amount: unitAmount,
          },
          quantity: input.seats,
        },
      ],
      payment_intent_data: {
        transfer_data: { destination: destination.accountId as string },
        on_behalf_of: destination.accountId as string,
        ...(destination.applicationFeeEnabled
          ? { application_fee_amount: Math.round(unitAmount * input.seats * 0.1) }
          : {}),
      },
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_SESSION_TTL_SECONDS,
      // Routes réelles du site (voir `app.routes.ts`) : le billet se lit par
      // `?inscription=<id>`, pas par un segment d'URL dédié.
      success_url: `${config.webBaseUrl}/web/evenements/${String(event.id)}/billet?inscription=${registrationId}`,
      cancel_url: `${config.webBaseUrl}/web/evenements/${String(event.id)}/reservation`,
    });
  } catch (error) {
    // La place tenue par l'inscription ne doit pas rester bloquée si Stripe refuse.
    await cancelRegistration(registrationId);
    throw error;
  }

  await setRegistrationCheckoutSession(registrationId, session.id);

  if (!session.url) {
    throw new ApiError('Stripe n’a renvoyé aucune URL de paiement.', 502);
  }

  return { url: session.url, registrationId };
}

/**
 * Rembourse intégralement une inscription payée, lors de son annulation.
 *
 * `reverse_transfer` retire les fonds déjà transférés au compte connecté du
 * groupe (destination charge) ; `refund_application_fee` rend aussi la
 * commission de la plateforme au client — sans effet si aucune commission
 * n'avait été prélevée. Sans ça, annuler une réservation payée effaçait la
 * fiche mais laissait le débit en place.
 */
export async function refundRegistrationPayment(paymentIntentId: string): Promise<void> {
  const client = requireStripe();
  await client.refunds.create({
    payment_intent: paymentIntentId,
    reverse_transfer: true,
    refund_application_fee: true,
  });
}
