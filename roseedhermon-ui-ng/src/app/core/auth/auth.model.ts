import { Member } from '../../shared/services/api/model/member';
import { GroupEntity } from '../../shared/services/api/model/groupEntity';

/** Rôles de la plateforme, portés par les groupes Amazon Cognito du même nom. */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  GROUP_ADMIN: 'GROUP_ADMIN',
  MEMBER: 'MEMBER'
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/**
 * Modules attribuables à un groupe.
 *
 * Tous les groupes ne font pas la même chose : certains ne gèrent que leurs
 * événements, d'autres que leur annuaire, d'autres les deux. Le serveur applique
 * la règle sur chaque route ; le client s'en sert seulement pour ne pas proposer
 * une page qui serait refusée.
 */
export const FEATURES = {
  EVENTS: 'EVENTS',
  MEMBERS: 'MEMBERS'
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

/** Réponse de `GET /api/v1/me` : l'identité, son groupe et sa fiche membre. */
export interface CurrentUser {
  sub: string | null;
  email: string | null;
  roles: Role[];
  groupId: string | null;
  group: GroupEntity | null;
  member: Member | null;
  /** Modules ouverts à cette personne, calculés par le serveur. */
  features: Feature[];
}

/** Un utilisateur non connecté : aucun rôle, aucun groupe, aucun module. */
export const ANONYMOUS: CurrentUser = {
  sub: null,
  email: null,
  roles: [],
  groupId: null,
  group: null,
  member: null,
  features: []
};
