import { Router } from 'express';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import { asyncHandler } from '../../common';
import { config } from '../config';
import { cancelRegistrationByCheckoutSession, confirmRegistrationPayment } from '../services/event-registration.service';

/**
 * Webhook Stripe, monté sur `/api/v1/webhooks/stripe` (voir `ms-event/app.ts`).
 *
 * `/api/v1/webhooks` n'est pas dans `MEMBER_PREFIXES` (`gateway/config.ts`),
 * donc tout arrive ici par défaut — y compris `account.updated` pour un
 * compte de **groupe**, dont le document vit dans `ms-member`. On met à jour
 * la collection `groups` par le pilote plutôt que d'importer un service de
 * ms-member : les deux services restent indépendants, même s'ils partagent
 * la même base (voir `payment-destination.service.ts`, même pattern).
 */
export const webhookRouter = Router();

const stripeClient = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

function statusOf(account: Stripe.Account): 'pending' | 'active' | 'restricted' {
  if (account.charges_enabled && account.payouts_enabled) return 'active';
  if (account.requirements?.disabled_reason) return 'restricted';
  return 'pending';
}

/** Le compte peut appartenir à un groupe ou à l'override d'un événement — on tente les deux. */
async function syncStripeAccountStatus(account: Stripe.Account): Promise<void> {
  const status = statusOf(account);

  const groupUpdate = await mongoose.connection
    .collection('groups')
    .updateOne({ stripeAccountId: account.id }, { $set: { stripeAccountStatus: status } });
  if (groupUpdate.matchedCount > 0) return;

  await mongoose.connection
    .collection('event')
    .updateOne({ stripeAccountId: account.id }, { $set: { stripeAccountStatus: status } });
}

webhookRouter.post(
  '/stripe',
  asyncHandler(async (req, res) => {
    if (!stripeClient || !config.stripeWebhookSecret) {
      res.status(400).json({ error: "Webhook Stripe non configuré (STRIPE_WEBHOOK_SECRET manquant)." });
      return;
    }

    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string' || !req.rawBody) {
      res.status(400).json({ error: 'Signature Stripe manquante.' });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripeClient.webhooks.constructEvent(req.rawBody, signature, config.stripeWebhookSecret);
    } catch (error) {
      res.status(400).json({ error: `Signature invalide : ${(error as Error).message}` });
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null);
        if (paymentIntentId) {
          await confirmRegistrationPayment(session.id, paymentIntentId, (session.amount_total ?? 0) / 100);
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await cancelRegistrationByCheckoutSession(session.id);
        break;
      }

      case 'account.updated': {
        await syncStripeAccountStatus(event.data.object as Stripe.Account);
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  }),
);
