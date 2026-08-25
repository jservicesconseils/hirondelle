import { AccountPhoneModel } from '../models/account-phone.model';
import { toE164 } from './invitation.service';

/**
 * Attache un numéro au compte de la session — appelé juste après l'inscription.
 * `upsert` : une personne qui change de numéro republie simplement l'entrée,
 * plutôt que d'échouer sur l'unicité du champ.
 */
export async function registerAccountPhone(email: string, phoneNumber: string): Promise<void> {
  const phoneE164 = toE164(phoneNumber);
  if (!phoneE164) throw new Error('Numéro de téléphone invalide.');

  await AccountPhoneModel.findOneAndUpdate(
    { phoneE164 },
    { phoneE164, email: email.trim().toLowerCase() },
    { upsert: true },
  ).exec();
}

/** Courriel du compte associé à ce numéro, ou `null` si aucun ne correspond. */
export async function findEmailByPhone(phoneNumber: string): Promise<string | null> {
  const phoneE164 = toE164(phoneNumber);
  if (!phoneE164) return null;

  const entry = await AccountPhoneModel.findOne({ phoneE164 }).exec();
  return entry?.get('email') ?? null;
}
