import Stripe from 'stripe';
import { ApiError, springIdFilter } from '../../common';
import { config } from '../config';
import { GroupModel } from '../models/group.model';

const stripeClient = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

function requireStripe(): Stripe {
  if (!stripeClient) {
    throw new ApiError("Le paiement n'est pas configuré sur cette instance (STRIPE_SECRET_KEY manquant).", 400);
  }
  return stripeClient;
}

/**
 * Le champ `country` du groupe est un texte libre (voir `group.model.ts`,
 * saisie sans liste de choix), là où Stripe exige un code ISO 3166-1 alpha-2
 * exact. On ne reconnaît que les intitulés attendus dans ce projet — la valeur
 * par défaut du formulaire de création de groupe est "Canada" — et on retombe
 * sur `CA`, cohérent avec le contexte de la plateforme plutôt que d'échouer.
 */
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

async function loadGroupOrThrow(groupId: string) {
  const group = await GroupModel.findOne(springIdFilter(groupId)).exec();
  if (!group) throw new ApiError(`Groupe introuvable : ${groupId}`, 404);
  return group;
}

/**
 * Crée le compte Stripe Express du groupe s'il n'en a pas encore, puis
 * renvoie un lien d'onboarding hébergé à usage unique — à régénérer à chaque
 * clic (il expire en quelques minutes), jamais à mettre en cache.
 */
export async function createGroupOnboardingLink(groupId: string): Promise<string> {
  const client = requireStripe();
  const group = await loadGroupOrThrow(groupId);

  let accountId = group.get('stripeAccountId') as string | undefined;
  if (!accountId) {
    const account = await client.accounts.create({
      type: 'express',
      country: isoCountryOf(group.get('country')),
      email: (group.get('email') as string | undefined) || undefined,
      business_type: 'non_profit',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    accountId = account.id;
    group.set('stripeAccountId', accountId);
    group.set('stripeAccountStatus', 'pending');
    await group.save();
  }

  const accountLink = await client.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${config.webBaseUrl}/app/groups?stripeOnboarding=refresh`,
    return_url: `${config.webBaseUrl}/app/groups?stripeOnboarding=return&groupId=${groupId}`,
  });

  return accountLink.url;
}

/**
 * Relit l'état du compte connecté directement sur Stripe et met à jour
 * `stripeAccountStatus`. Appelé au retour synchrone de l'onboarding (pour ne
 * pas attendre le webhook `account.updated`) et par ce webhook lui-même.
 */
export async function refreshGroupAccountStatus(groupId: string): Promise<string> {
  const client = requireStripe();
  const group = await loadGroupOrThrow(groupId);

  const accountId = group.get('stripeAccountId') as string | undefined;
  if (!accountId) return 'none';

  const account = await client.accounts.retrieve(accountId);
  const status = statusOf(account);
  group.set('stripeAccountStatus', status);
  await group.save();
  return status;
}

export interface GroupPaymentStatus {
  stripeAccountId: string | null;
  stripeAccountStatus: string;
  currency: string;
}

export async function getGroupPaymentStatus(groupId: string): Promise<GroupPaymentStatus> {
  const group = await loadGroupOrThrow(groupId);
  return {
    stripeAccountId: (group.get('stripeAccountId') as string | undefined) ?? null,
    stripeAccountStatus: (group.get('stripeAccountStatus') as string | undefined) ?? 'none',
    currency: (group.get('currency') as string | undefined) ?? 'CAD',
  };
}

/** Réservé au super admin (voir la route) : active ou désactive la commission plateforme. */
export async function setGroupApplicationFeeEnabled(groupId: string, enabled: boolean): Promise<void> {
  const group = await loadGroupOrThrow(groupId);
  group.set('applicationFeeEnabled', enabled);
  await group.save();
}

/** Retrouve le groupe propriétaire d'un compte Stripe donné, pour le webhook `account.updated`. */
export async function findGroupIdByStripeAccount(accountId: string): Promise<string | null> {
  const group = await GroupModel.findOne({ stripeAccountId: accountId }).exec();
  return group ? String(group._id) : null;
}
