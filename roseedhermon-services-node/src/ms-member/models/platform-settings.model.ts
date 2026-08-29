import { Schema, model } from 'mongoose';

/**
 * Bascules globales des modules mobiles, réglées par le super administrateur.
 *
 * Document singleton (un seul, identifiant fixe) : pas de portée par groupe,
 * c'est une décision qui s'applique à toute l'application mobile d'un coup.
 */
export const PLATFORM_SETTINGS_ID = 'mobile-modules';

const platformSettingsSchema = new Schema(
  {
    _id: { type: String, default: PLATFORM_SETTINGS_ID },
    mobileEvents: { type: Boolean, default: true },
    mobileTickets: { type: Boolean, default: true },
    mobileContacts: { type: Boolean, default: true },
    mobileProfile: { type: Boolean, default: true },
  },
  {
    collection: 'platform_settings',
    versionKey: false,
  },
);

export const PlatformSettingsModel = model('PlatformSettings', platformSettingsSchema);
