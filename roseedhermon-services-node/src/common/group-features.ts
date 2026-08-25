import mongoose from 'mongoose';
import type { NextFunction, Request, Response } from 'express';
import { isSuperAdmin } from './security';
import { springIdFilter } from './spring-data';

/**
 * Fonctionnalités attribuées à un groupe.
 *
 * Tous les groupes ne font pas la même chose : certains ne gèrent que leurs
 * événements, d'autres que leur annuaire, d'autres les deux. La liste est portée
 * par le champ `features` du document `groups`.
 *
 *   EVENTS  : les événements du groupe — création, agenda, inscriptions.
 *   MEMBERS : l'annuaire du groupe — fiches, invitations, import.
 *
 * **Un champ absent vaut « tout ».** Les groupes créés avant cette notion n'ont
 * pas ce champ ; les priver de tout à la première lecture serait une régression
 * silencieuse. C'est aussi le cas qui correspond au groupe « qui a tout », le
 * plus courant.
 */
export const FEATURES = {
  EVENTS: 'EVENTS',
  MEMBERS: 'MEMBERS',
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

export const ALL_FEATURES: Feature[] = [FEATURES.EVENTS, FEATURES.MEMBERS];

/**
 * Normalise ce qui a été lu en base : on n'accepte que les noms connus, et une
 * liste vide ou absente rend toutes les fonctionnalités.
 */
export function normalizeFeatures(value: unknown): Feature[] {
  if (!Array.isArray(value)) return [...ALL_FEATURES];

  const known = value
    .map((entry) => String(entry).toUpperCase())
    .filter((entry): entry is Feature => entry in FEATURES);

  // Doublons écartés, ordre stable : la réponse JSON ne dépend pas de la saisie.
  const unique = ALL_FEATURES.filter((feature) => known.includes(feature));
  return unique.length ? unique : [...ALL_FEATURES];
}

/**
 * Cache de courte durée.
 *
 * Sans lui, chaque appel à l'annuaire relirait le groupe : une lecture de plus
 * par requête, pour une donnée qui change une fois par mois. Quinze secondes
 * suffisent à absorber une page qui enchaîne plusieurs appels, et
 * `forgetGroupFeatures` supprime l'attente après une modification.
 */
const TTL_MS = 15_000;

interface GroupSettings {
  features: Feature[];
  /** Absent ou vrai : le groupe voit le catalogue public des autres groupes. */
  showPublicCatalog: boolean;
}

const cache = new Map<string, { settings: GroupSettings; readAt: number }>();

export function forgetGroupFeatures(groupId?: string | null): void {
  if (groupId) cache.delete(groupId);
  else cache.clear();
}

/**
 * Réglages d'un groupe, lus directement dans la collection.
 *
 * On passe par le pilote plutôt que par un modèle Mongoose : `GroupModel` n'est
 * déclaré que dans ms-member, et l'enregistrer une seconde fois dans ms-event
 * lèverait `OverwriteModelError`. Les deux services partagent la même base.
 *
 * Le filtre passe par `springIdFilter` : l'`@Id` est un `String` côté Java, mais
 * Spring Data l'écrit en `ObjectId` quand il tient sur 24 caractères hexadécimaux.
 * Chercher la chaîne telle quelle ne trouverait rien.
 */
async function settingsOfGroup(groupId: string | null | undefined): Promise<GroupSettings> {
  if (!groupId) return { features: [...ALL_FEATURES], showPublicCatalog: true };

  const cached = cache.get(groupId);
  if (cached && Date.now() - cached.readAt < TTL_MS) return cached.settings;

  let settings: GroupSettings = { features: [...ALL_FEATURES], showPublicCatalog: true };
  try {
    const document = await mongoose.connection
      .collection('groups')
      .findOne(springIdFilter(groupId) as never, { projection: { features: 1, showPublicCatalog: 1 } });
    settings = {
      features: normalizeFeatures(document?.features),
      showPublicCatalog: document?.showPublicCatalog !== false,
    };
  } catch (error) {
    // La base est injoignable : on n'invente pas un refus. La garde d'authentification
    // a déjà fait son travail, et l'appel échouera de lui-même s'il a besoin de Mongo.
    console.warn('[features] groupe illisible :', (error as Error).message);
  }

  cache.set(groupId, { settings, readAt: Date.now() });
  return settings;
}

export async function featuresOfGroup(groupId: string | null | undefined): Promise<Feature[]> {
  return (await settingsOfGroup(groupId)).features;
}

export async function groupAllows(groupId: string | null | undefined, feature: Feature): Promise<boolean> {
  const features = await featuresOfGroup(groupId);
  return features.includes(feature);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Modules ouverts à l'appelant, posés par `attachGroupFeatures`. */
      features?: Feature[];
      /**
       * Faux seulement si le groupe de l'appelant a fermé le catalogue public
       * des autres groupes à ses propres membres — voir `isVisibleTo`.
       */
      showPublicCatalog?: boolean;
    }
  }
}

/**
 * Charge une fois par requête les réglages de groupe de l'appelant.
 *
 * Les règles de visibilité s'appliquent dans des `filter()` synchrones : sans ce
 * chargement en amont, il faudrait une lecture asynchrone par événement. Un
 * visiteur sans session n'appartient à aucun groupe et garde tout, sans quoi le
 * catalogue public deviendrait invisible aux non-connectés.
 */
export async function attachGroupFeatures(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.auth || isSuperAdmin(req)) {
    req.features = [...ALL_FEATURES];
    req.showPublicCatalog = true;
    return next();
  }
  const settings = await settingsOfGroup(req.auth.groupId);
  req.features = settings.features;
  req.showPublicCatalog = settings.showPublicCatalog;
  return next();
}

/** Version synchrone, à n'utiliser qu'après `attachGroupFeatures`. */
export function requestAllows(req: Request, feature: Feature): boolean {
  return (req.features ?? ALL_FEATURES).includes(feature);
}

/**
 * Refuse une route dont la fonctionnalité n'est pas attribuée au groupe de
 * l'appelant.
 *
 * Le super administrateur passe toujours : il administre des groupes qui n'ont
 * pas forcément le module, et doit pouvoir le leur donner.
 *
 * Le refus porte un `feature` en clair dans le corps, pour que le client puisse
 * afficher un message juste plutôt qu'un « droits insuffisants » qui laisserait
 * croire à un problème de rôle.
 */
export function requireGroupFeature(feature: Feature) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentification requise.' });
      return;
    }
    if (isSuperAdmin(req)) return next();

    // `attachGroupFeatures` a déjà résolu la liste dans la plupart des cas ; sinon
    // on la lit ici, pour que la garde reste utilisable seule.
    const allowed = req.features ? req.features.includes(feature) : await groupAllows(req.auth.groupId, feature);
    if (allowed) return next();

    res.status(403).json({
      error: "Cette fonctionnalité n'est pas activée pour votre groupe.",
      feature,
    });
  };
}
