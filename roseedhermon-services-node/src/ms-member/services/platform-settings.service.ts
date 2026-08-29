import { PLATFORM_SETTINGS_ID, PlatformSettingsModel } from '../models/platform-settings.model';

export interface MobileModules {
  mobileEvents: boolean;
  mobileTickets: boolean;
  mobileContacts: boolean;
  mobileProfile: boolean;
}

/** Crée le document par défaut (tout activé) au tout premier appel. */
export async function getMobileModules(): Promise<MobileModules> {
  const doc = await PlatformSettingsModel.findOneAndUpdate(
    { _id: PLATFORM_SETTINGS_ID },
    { $setOnInsert: { _id: PLATFORM_SETTINGS_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  return {
    mobileEvents: doc!.mobileEvents,
    mobileTickets: doc!.mobileTickets,
    mobileContacts: doc!.mobileContacts,
    mobileProfile: doc!.mobileProfile,
  };
}

/** Ne modifie que les clés fournies ; les autres gardent leur valeur actuelle. */
export async function updateMobileModules(patch: Partial<MobileModules>): Promise<MobileModules> {
  const doc = await PlatformSettingsModel.findOneAndUpdate(
    { _id: PLATFORM_SETTINGS_ID },
    { $set: patch, $setOnInsert: { _id: PLATFORM_SETTINGS_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  return {
    mobileEvents: doc!.mobileEvents,
    mobileTickets: doc!.mobileTickets,
    mobileContacts: doc!.mobileContacts,
    mobileProfile: doc!.mobileProfile,
  };
}
