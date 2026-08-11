import type { Request } from 'express';
import { FEATURES, isSuperAdmin, requestAllows, ROLES } from '../common';

/**
 * Règles de visibilité d'un événement, partagées par les routes d'événements et
 * celles d'inscription : une place ne doit pas pouvoir être réservée sur un
 * événement que l'on n'a pas le droit de voir.
 */

/**
 * Un visiteur non connecté ne voit que les événements publics. Un membre y ajoute
 * ceux de son groupe. Le super administrateur voit tout. Les documents antérieurs
 * aux groupes n'ont pas de champ `visibility` : le mapper les considère publics.
 *
 * Les événements **publics** restent visibles de tous, y compris d'un membre dont
 * le groupe ne gère pas d'événements : ils appartiennent au catalogue du site, que
 * n'importe quel visiteur consulte déjà sans session. Ce sont les événements
 * **réservés au groupe** qui disparaissent quand le module EVENTS ne lui est pas
 * attribué — ils n'ont alors, littéralement, pas lieu d'être.
 */
export function isVisibleTo(req: Request, event: Record<string, unknown>): boolean {
  if (isSuperAdmin(req)) return true;
  if (!isPrivate(event.visibility)) return true;
  if (!requestAllows(req, FEATURES.EVENTS)) return false;
  const groupId = event.groupId ? String(event.groupId) : null;
  return groupId !== null && groupId === (req.auth?.groupId ?? null);
}

/** Vrai pour « PRIVATE » comme pour « PRIVE » : les deux formes existent en base. */
export function isPrivate(visibility: unknown): boolean {
  const value = String(visibility ?? '').toUpperCase();
  return value === 'PRIVATE' || value === 'PRIVE';
}

/** Groupe auquel rattacher un événement créé ou modifié. */
export function ownerGroupId(req: Request, body: Record<string, unknown>): string | null {
  if (isSuperAdmin(req)) {
    const requested = body.groupId;
    return requested ? String(requested) : (req.auth?.groupId ?? null);
  }
  return req.auth?.groupId ?? null;
}

/**
 * Vrai si la requête administre l'événement : super administrateur, ou
 * administrateur du groupe organisateur.
 */
export function administers(req: Request, event: Record<string, unknown>): boolean {
  if (isSuperAdmin(req)) return true;
  // Administrer un événement suppose que le groupe en gère : un groupe qui ne tient
  // que son annuaire n'a pas d'organisateur.
  if (!requestAllows(req, FEATURES.EVENTS)) return false;
  if (!req.auth?.roles.includes(ROLES.GROUP_ADMIN)) return false;
  const groupId = event.groupId ? String(event.groupId) : null;
  return groupId !== null && groupId === (req.auth?.groupId ?? null);
}

/**
 * Vrai si l'inscription appartient à la personne qui interroge.
 *
 * Le rapprochement se fait sur le courriel : c'est la seule donnée que le jeton
 * et l'inscription ont en commun. `userId` porte l'identifiant de la fiche membre,
 * que ce service ne connaît pas — le comparer au `sub` du jeton serait faux.
 */
export function ownsRegistration(req: Request, registration: Record<string, unknown>): boolean {
  const email = req.auth?.email?.trim().toLowerCase() ?? null;
  const registrationEmail = registration.email ? String(registration.email).toLowerCase() : null;
  return !!email && !!registrationEmail && email === registrationEmail;
}
