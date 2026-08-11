import type { NextFunction, Request, Response } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from './env';

/**
 * Rôles de la plateforme, portés par les groupes Amazon Cognito du même nom.
 *
 *  - SUPER_ADMIN : voit tous les groupes et tous leurs membres.
 *  - GROUP_ADMIN : administre un seul groupe (membres, événements).
 *  - MEMBER      : consulte son groupe et les événements publics.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  GROUP_ADMIN: 'GROUP_ADMIN',
  MEMBER: 'MEMBER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Identité déduite du jeton, attachée à la requête. */
export interface AuthContext {
  sub: string;
  email: string | null;
  phoneNumber: string | null;
  roles: Role[];
  /** Groupe d'appartenance, porté par l'attribut personnalisé `custom:groupId`. */
  groupId: string | null;
  /** Vrai lorsque l'authentification est désactivée (développement local). */
  anonymous: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const USER_POOL_ID = env('COGNITO_USER_POOL_ID', '');
const CLIENT_ID = env('COGNITO_CLIENT_ID', '');
const TOKEN_USE = env('COGNITO_TOKEN_USE', 'id') as 'id' | 'access';

/**
 * L'authentification ne s'active que si le pool est configuré.
 *
 * Sans variables d'environnement — le cas du poste de développement — toute requête
 * passe avec les droits de super administrateur, ce qui laisse le projet utilisable
 * hors AWS. En production, `COGNITO_USER_POOL_ID` est défini et la vérification
 * cryptographique du jeton devient obligatoire.
 */
export const authEnabled = USER_POOL_ID !== '' && CLIENT_ID !== '';

const verifier = authEnabled
  ? CognitoJwtVerifier.create({
      userPoolId: USER_POOL_ID,
      clientId: CLIENT_ID,
      tokenUse: TOKEN_USE,
    })
  : null;

/**
 * Contexte accordé lorsque l'authentification est désactivée.
 *
 * Trois en-têtes permettent d'endosser un rôle, un groupe et un courriel afin
 * d'éprouver le cloisonnement sans monter un pool Cognito :
 *
 *   X-Dev-Role: GROUP_ADMIN | MEMBER | SUPER_ADMIN
 *   X-Dev-Group: <identifiant du groupe>
 *   X-Dev-Email: <courriel simulé>
 *
 * Ces en-têtes ne sont lus QUE lorsque `authEnabled` est faux. Dès que le pool
 * est configuré, ils sont ignorés : ils ne peuvent donc rien contourner en
 * production.
 */
function developmentContext(req: Request): AuthContext | null {
  const declared = req.header('x-dev-role') ?? env('DEV_ROLE', '');

  // Aucun rôle déclaré : la requête est anonyme, exactement comme un visiteur sans
  // jeton en production. C'est ce qui rend la page de connexion utile en local —
  // sans cela, un navigateur déconnecté aurait encore tous les droits.
  if (!declared) return null;

  const headerRole = String(declared).toUpperCase();
  const role = (headerRole in ROLES ? headerRole : ROLES.MEMBER) as Role;
  const groupId = req.header('x-dev-group') ?? (env('DEV_GROUP_ID', '') || null);

  return {
    sub: `development-${role.toLowerCase()}`,
    // Le courriel identifie la personne pour ses inscriptions : il est simulable
    // comme le rôle, afin d'éprouver « mes réservations » sans pool Cognito.
    email: req.header('x-dev-email') ?? (env('DEV_EMAIL', '') || null),
    phoneNumber: null,
    roles: [role],
    groupId,
    anonymous: true,
  };
}

function readBearer(req: Request): string | null {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (!token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim();
}

function toRoles(payload: Record<string, unknown>): Role[] {
  const groups = payload['cognito:groups'];
  const list = Array.isArray(groups) ? groups.map((item) => String(item)) : [];
  const known = list.filter((name): name is Role => name in ROLES);
  // Un utilisateur authentifié sans groupe Cognito est un membre ordinaire.
  return known.length ? known : [ROLES.MEMBER];
}

function toContext(payload: Record<string, unknown>): AuthContext {
  const groupId = payload['custom:groupId'];
  return {
    sub: String(payload.sub ?? ''),
    email: payload.email ? String(payload.email) : null,
    phoneNumber: payload.phone_number ? String(payload.phone_number) : null,
    roles: toRoles(payload),
    groupId: groupId ? String(groupId) : null,
    anonymous: false,
  };
}

/**
 * Attache l'identité à la requête sans jamais la rejeter.
 *
 * Les routes publiques (liste des événements publics, consultation d'un événement)
 * doivent rester accessibles sans jeton : c'est `requireAuth` et `requireRole` qui
 * refusent, pas ce middleware.
 */
export async function attachAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!authEnabled) {
    const context = developmentContext(req);
    if (context) req.auth = context;
    return next();
  }

  const token = readBearer(req);
  if (!token) return next();

  try {
    const payload = (await verifier!.verify(token)) as unknown as Record<string, unknown>;
    req.auth = toContext(payload);
  } catch (error) {
    // Jeton illisible ou expiré : la requête poursuit en anonyme et sera refusée
    // par la garde si la route l'exige.
    console.warn('[security] jeton refusé :', (error as Error).message);
  }
  return next();
}

/** Refuse les requêtes sans identité vérifiée. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Authentification requise.' });
    return;
  }
  next();
}

/** Refuse les requêtes dont l'identité ne porte aucun des rôles attendus. */
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    if (!req.auth.roles.some((role) => allowed.includes(role))) {
      res.status(403).json({ error: 'Droits insuffisants.' });
      return;
    }
    next();
  };
}

export function hasRole(req: Request, role: Role): boolean {
  return req.auth?.roles.includes(role) ?? false;
}

export function isSuperAdmin(req: Request): boolean {
  return hasRole(req, ROLES.SUPER_ADMIN);
}

/**
 * Groupe sur lequel la requête a le droit de travailler.
 *
 * Un super administrateur peut viser n'importe quel groupe via `?groupId=`.
 * Les autres sont confinés au groupe inscrit dans leur jeton, quelle que soit la
 * valeur qu'ils envoient.
 */
export function resolveScopeGroupId(req: Request): string | null {
  const requested = typeof req.query.groupId === 'string' ? req.query.groupId : null;
  if (isSuperAdmin(req)) return requested;
  return req.auth?.groupId ?? null;
}
