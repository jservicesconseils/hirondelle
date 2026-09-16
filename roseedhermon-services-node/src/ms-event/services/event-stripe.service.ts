import Stripe from 'stripe';
import { ApiError, springIdFilter } from '../../common';
import { config } from '../config';
import { EventModel } from '../models/event.model';

const stripeClient = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

function requireStripe(): Stripe {
  if (!stripeClient) {
    throw new ApiError("Le paiement n'est pas configuré sur cette instance (STRIPE_SECRET_KEY manquant).", 400);
  }
  return stripeClient;
}

/** Même logique que côté groupe (voir `group-stripe.service.ts`) : texte libre -> ISO 3166-1 alpha-2. */
function isoCountryOf(value: unknown): string {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (/^[a-z]{2}$/.test(normalized)) return normalized.toUpperCase();
  if (normalized.includes('canada')) return 'CA';
  if (normalized.includes('united states') || normalized.includes('états-unis') || normalized === 'usa') return 'US';
  if (normalized.includes('france')) return 'FR';
  return 'CA';
}

function statusOf(account: Stripe.Account): 'pending' | 'active' | 'restricted' {
  if (account.charges_enabled && account.payouts_enabled) return 'active';
  if (account.requirements?.disabled_reason) return 'restricted';
  return 'pending';
}

async function loadEventOrThrow(eventId: string) {
  const event = await EventModel.findOne(springIdFilter(eventId)).exec();
  if (!event) throw new ApiError(`Événement introuvable : ${eventId}`, 404);
  return event;
}

/**
 * Compte Stripe Express propre à cet événement (override du compte du
 * groupe). Même mécanique que `createGroupOnboardingLink` : créé une fois,
 * puis un nouveau lien d'onboarding à chaque appel.
 */
export async function createEventOnboardingLink(eventId: string): Promise<string> {
  const client = requireStripe();
  const event = await loadEventOrThrow(eventId);

  let accountId = event.get('stripeAccountId') as string | undefined;
  if (!accountId) {
    const location = event.get('location') as { country?: string } | undefined;
    const account = await client.accounts.create({
      type: 'express',
      country: isoCountryOf(location?.country),
      email: (event.get('createdByEmail') as string | undefined) || undefined,
      business_type: 'non_profit',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    event.set('stripeAccountId', accountId);
    event.set('stripeAccountStatus', 'pending');
    await event.save();
  }

  // Pas d'écran dédié « /events/edit/:id » dans ce projet — la fiche d'un
  // événement s'ouvre en modale depuis la liste. On revient donc sur la liste,
  // avec l'id en paramètre pour que `ListEventsComponent` relise l'état du
  // compte sans attendre le webhook `account.updated`.
  const accountLink = await client.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${config.webBaseUrl}/app/events?stripeOnboarding=refresh&eventId=${eventId}`,
    return_url: `${config.webBaseUrl}/app/events?stripeOnboarding=return&eventId=${eventId}`,
  });

  return accountLink.url;
}

export async function refreshEventAccountStatus(eventId: string): Promise<string> {
  const client = requireStripe();
  const event = await loadEventOrThrow(eventId);

  const accountId = event.get('stripeAccountId') as string | undefined;
  if (!accountId) return 'none';

  const account = await client.accounts.retrieve(accountId);
  const status = statusOf(account);
  event.set('stripeAccountStatus', status);
  await event.save();
  return status;
}

/** Retire l'override : l'événement retombe sur le compte du groupe. */
export async function clearEventStripeAccount(eventId: string): Promise<void> {
  const event = await loadEventOrThrow(eventId);
  event.set('stripeAccountId', undefined);
  event.set('stripeAccountStatus', undefined);
  await event.save();
}

/** Réservé au super admin (voir la route) : override de la commission pour cet événement seul. */
export async function setEventApplicationFeeEnabled(eventId: string, enabled: boolean | null): Promise<void> {
  const event = await loadEventOrThrow(eventId);
  // `null` retire l'override : l'événement hérite à nouveau du réglage du groupe.
  event.set('applicationFeeEnabled', enabled === null ? undefined : enabled);
  await event.save();
}

/** Retrouve l'événement propriétaire d'un compte Stripe donné, pour le webhook `account.updated`. */
export async function findEventIdByStripeAccount(accountId: string): Promise<string | null> {
  const event = await EventModel.findOne({ stripeAccountId: accountId }).exec();
  return event ? String(event._id) : null;
}
