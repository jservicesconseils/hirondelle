import { Types } from 'mongoose';

const OBJECT_ID_HEX = /^[0-9a-fA-F]{24}$/;

/**
 * Reproduit la conversion d'identifiant de `MappingMongoConverter` pour une entité
 * dont l'`@Id` est un `String` :
 *
 * - id `null` → un nouvel `ObjectId` est généré et stocké **en tant qu'ObjectId** ;
 * - id valant 24 caractères hexadécimaux → converti en `ObjectId` ;
 * - tout autre texte (un UUID par exemple) → conservé tel quel, en `String`.
 *
 * C'est ce qui explique que `event._id` et `members._id` soient des ObjectId
 * alors que `event_files._id` contient les UUID produits par `FileStorageService`.
 */
export function toSpringId(value: string | null | undefined): string | Types.ObjectId {
  if (value === null || value === undefined || value === '') {
    return new Types.ObjectId();
  }
  return OBJECT_ID_HEX.test(value) ? new Types.ObjectId(value) : value;
}

/**
 * Filtre de recherche par identifiant tolérant les deux représentations possibles.
 *
 * Nécessaire pour `event_files`, dont le `_id` est soit un UUID (`String`, cas des
 * fichiers uploadés) soit un `ObjectId` (cas des fichiers créés sans id via
 * `/events/with-photos`).
 */
export function springIdFilter(value: string): { _id: { $in: (string | Types.ObjectId)[] } } {
  const candidates: (string | Types.ObjectId)[] = [value];
  if (OBJECT_ID_HEX.test(value)) {
    candidates.push(new Types.ObjectId(value));
  }
  return { _id: { $in: candidates } };
}

/**
 * Objet simple à partir d'un document Mongoose ou d'un objet déjà brut.
 *
 * Les mappers travaillent sur des clés dynamiques (`isFree`, `isMainPhoto`…) : passer
 * par un objet indexable évite de dupliquer les types générés par Mongoose.
 */
export function toPlainObject(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }
  const candidate = value as { toObject?: () => unknown };
  if (typeof candidate.toObject === 'function') {
    return candidate.toObject() as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
}

/** Représentation textuelle d'un `_id`, quel que soit son type BSON. */
export function springIdToString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return String(value);
}

/**
 * Supprime les clés `null`/`undefined` d'un document avant écriture.
 *
 * Spring Data n'écrit pas les propriétés nulles : les documents existants n'ont
 * par exemple aucune clé `amount` ou `mainPhotoId`. On reproduit ce comportement
 * pour que la forme des documents reste identique à celle produite par Spring.
 */
export function withoutNulls<T extends Record<string, unknown>>(document: T): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(document)) {
    if (value !== null && value !== undefined) {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
