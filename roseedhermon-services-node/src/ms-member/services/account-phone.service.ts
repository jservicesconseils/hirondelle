import { AccountPhoneModel } from '../models/account-phone.model';
import { toE164 } from './invitation.service';

/**
 * Attache un numéro au compte de la session — à l'inscription, ou depuis le
 * profil pour un compte créé avant que ce champ n'existe. Un seul numéro par
 * personne : l'ancien, s'il diffère, est retiré pour ne plus mener au compte.
 */
export async function registerAccountPhone(email: string, phoneNumber: string): Promise<void> {
  const phoneE164 = toE164(phoneNumber);
  if (!phoneE164) throw new Error('Numéro de téléphone invalide.');
  const normalizedEmail = email.trim().toLowerCase();

  await AccountPhoneModel.deleteMany({ email: normalizedEmail, phoneE164: { $ne: phoneE164 } }).exec();

  await AccountPhoneModel.findOneAndUpdate(
    { phoneE164 },
    { phoneE164, email: normalizedEmail },
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

/** Numéro déjà enregistré pour ce compte, pour préremplir le profil. */
export async function findPhoneByEmail(email: string): Promise<string | null> {
  const entry = await AccountPhoneModel.findOne({ email: email.trim().toLowerCase() }).exec();
  return entry?.get('phoneE164') ?? null;
}
