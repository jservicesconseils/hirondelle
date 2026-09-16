import mongoose from 'mongoose';
import { springIdFilter } from '../../common';

/**
 * Résolution du compte Stripe destinataire, de la commission plateforme et de
 * la devise pour un événement donné.
 *
 * `GroupModel` n'est déclaré que dans ms-member ; les deux services partagent
 * la même base Mongo, donc on lit la collection `groups` par le pilote plutôt
 * que d'enregistrer une seconde fois le modèle (même pattern que
 * `common/group-features.ts`).
 *
 * Toujours lu à la fraîche (pas de cache) : une décision de paiement ne doit
 * jamais s'appuyer sur un statut de compte périmé.
 */

export interface PaymentDestination {
  /** Compte Stripe Express qui recevra les fonds, ou `null` si aucun n'est configuré. */
  accountId: string | null;
  /** 'active' seulement si le compte résolu a terminé son onboarding Stripe. */
  accountStatus: 'none' | 'pending' | 'active' | 'restricted';
  /** Commission de 10 % à appliquer, après résolution événement > groupe > défaut vrai. */
  applicationFeeEnabled: boolean;
  /** Devise ISO 4217 du groupe organisateur, en minuscules (attendu par l'API Stripe). */
  currency: string;
}

interface GroupPaymentFields {
  stripeAccountId?: string;
  stripeAccountStatus?: string;
  currency?: string;
  applicationFeeEnabled?: boolean;
}

async function readGroupPaymentFields(groupId: string | null): Promise<GroupPaymentFields> {
  if (!groupId) return {};
  try {
    const document = await mongoose.connection
      .collection('groups')
      .findOne(springIdFilter(groupId) as never, {
        projection: { stripeAccountId: 1, stripeAccountStatus: 1, currency: 1, applicationFeeEnabled: 1 },
      });
    return (document ?? {}) as GroupPaymentFields;
  } catch (error) {
    console.warn('[payment-destination] groupe illisible :', (error as Error).message);
    return {};
  }
}

function normalizeStatus(value: unknown): PaymentDestination['accountStatus'] {
  return value === 'pending' || value === 'active' || value === 'restricted' ? value : 'none';
}

/**
 * `event` est l'objet déjà mappé par `eventToJson` (donc porteur, le cas
 * échéant, de `stripeAccountId`/`stripeAccountStatus`/`applicationFeeEnabled`).
 */
export async function resolvePaymentDestination(event: Record<string, unknown>): Promise<PaymentDestination> {
  const eventAccountId = typeof event.stripeAccountId === 'string' ? event.stripeAccountId : null;
  const groupId = typeof event.groupId === 'string' ? event.groupId : null;
  const group = await readGroupPaymentFields(groupId);

  const accountId = eventAccountId ?? group.stripeAccountId ?? null;
  const accountStatus = eventAccountId
    ? normalizeStatus(event.stripeAccountStatus)
    : normalizeStatus(group.stripeAccountStatus);

  const eventFeeOverride = event.applicationFeeEnabled;
  const applicationFeeEnabled =
    typeof eventFeeOverride === 'boolean' ? eventFeeOverride : group.applicationFeeEnabled !== false;

  return {
    accountId,
    accountStatus,
    applicationFeeEnabled,
    currency: (group.currency ?? 'CAD').toLowerCase(),
  };
}

/** Un événement payant ne peut être proposé au paiement que si sa destination est prête. */
export function isPaymentDestinationReady(destination: PaymentDestination): boolean {
  return destination.accountId !== null && destination.accountStatus === 'active';
}
