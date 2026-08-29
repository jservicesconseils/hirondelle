import { Router } from 'express';
import { asyncHandler, requireAuth, requireRole, ROLES } from '../../common';
import { getMobileModules, updateMobileModules, type MobileModules } from '../services/platform-settings.service';

/**
 * Bascules globales des modules mobiles (Événements, Billets, Contacts, Profil).
 *
 * `GET` est public — l'application mobile en a besoin avant même la connexion (une
 * personne qui « parcourt sans compte » doit voir les mêmes onglets masqués que
 * les autres). Seul `PUT` exige le rôle super administrateur.
 */
export const settingsRouter = Router();

const BOOLEAN_KEYS: (keyof MobileModules)[] = ['mobileEvents', 'mobileTickets', 'mobileContacts', 'mobileProfile'];

function toBooleanPatch(body: unknown): Partial<MobileModules> {
  const patch: Partial<MobileModules> = {};
  if (!body || typeof body !== 'object') return patch;

  for (const key of BOOLEAN_KEYS) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === 'boolean') patch[key] = value;
  }
  return patch;
}

settingsRouter.get(
  '/mobile-modules',
  asyncHandler(async (_req, res) => {
    res.json(await getMobileModules());
  }),
);

settingsRouter.put(
  '/mobile-modules',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  asyncHandler(async (req, res) => {
    res.json(await updateMobileModules(toBooleanPatch(req.body)));
  }),
);
