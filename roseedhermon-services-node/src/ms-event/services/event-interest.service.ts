import { toSpringId, toStringOrNull, withoutNulls } from '../../common';
import {
  EVENT_INTEREST_CLASS,
  EventInterestModel,
  type EventInterestDocument,
} from '../models/event-interest.model';

/** Marque d'intérêt : qui, sur quel événement. */
export interface EventInterestInput {
  eventId: string | null;
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  groupId: string | null;
}

export function interestFromBody(body: unknown): EventInterestInput {
  const source = (body ?? {}) as Record<string, unknown>;
  return {
    eventId: toStringOrNull(source.eventId),
    userId: toStringOrNull(source.userId),
    email: normalizeEmail(toStringOrNull(source.email)),
    firstName: toStringOrNull(source.firstName),
    lastName: toStringOrNull(source.lastName),
    groupId: toStringOrNull(source.groupId),
  };
}

export function interestToJson(document: EventInterestDocument): Record<string, unknown> {
  const raw = document.toObject() as Record<string, unknown>;
  return {
    id: String(raw._id),
    eventId: toStringOrNull(raw.eventId),
    userId: toStringOrNull(raw.userId),
    email: toStringOrNull(raw.email),
    firstName: toStringOrNull(raw.firstName),
    lastName: toStringOrNull(raw.lastName),
    groupId: toStringOrNull(raw.groupId),
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : null,
  };
}

/**
 * Enregistre l'intérêt, sans jamais le compter deux fois.
 *
 * Un second clic renvoie la marque existante avec `alreadyInterested` à vrai —
 * même contrat que la réservation, où un rechargement ne crée pas un deuxième
 * billet. L'index unique reste le garde-fou : deux requêtes simultanées ne
 * passeraient pas toutes les deux la lecture qui précède.
 */
export async function markInterest(
  input: EventInterestInput,
): Promise<{ interest: Record<string, unknown>; created: boolean }> {
  const existing = await findInterest(input.eventId, input.userId, input.email);
  if (existing !== null) {
    return { interest: existing, created: false };
  }

  const document = withoutNulls({
    eventId: input.eventId,
    userId: input.userId,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    groupId: input.groupId,
    _class: EVENT_INTEREST_CLASS,
  });

  try {
    const created = await EventInterestModel.create({
      _id: toSpringId(null),
      createdAt: new Date(),
      ...document,
    });
    return { interest: interestToJson(created), created: true };
  } catch (error) {
    // Course entre deux clics : l'index a tranché, on relit la marque gagnante.
    if (isDuplicateKey(error)) {
      const winner = await findInterest(input.eventId, input.userId, input.email);
      if (winner !== null) return { interest: winner, created: false };
    }
    throw error;
  }
}

/** Retire la marque. Vrai si quelque chose a effectivement été retiré. */
export async function removeInterest(
  eventId: string,
  userId: string | null,
  email: string | null,
): Promise<boolean> {
  const clauses = identityClauses(userId, email);
  if (clauses.length === 0) return false;

  const result = await EventInterestModel.deleteOne({ eventId, $or: clauses }).exec();
  return (result.deletedCount ?? 0) > 0;
}

export async function findInterest(
  eventId: string | null,
  userId: string | null,
  email: string | null,
): Promise<Record<string, unknown> | null> {
  if (!eventId) return null;
  const clauses = identityClauses(userId, email);
  if (clauses.length === 0) return null;

  const existing = await EventInterestModel.findOne({ eventId, $or: clauses }).exec();
  return existing === null ? null : interestToJson(existing);
}

/** Personnes intéressées par un événement, de la plus récente à la plus ancienne. */
export async function getInterestsByEvent(eventId: string): Promise<Record<string, unknown>[]> {
  const interests = await EventInterestModel.find({ eventId }).exec();
  return interests.map(interestToJson).sort(byNewest);
}

export async function countInterests(eventId: string): Promise<number> {
  return EventInterestModel.countDocuments({ eventId }).exec();
}

/**
 * Nombre d'intéressés pour plusieurs événements, en une seule requête.
 *
 * Sans cela, classer les événements par engouement demanderait un appel par
 * ligne : tenable à quatre événements, intenable à deux cents.
 */
export async function countInterestsByEvents(eventIds: string[]): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};

  const rows = await EventInterestModel.aggregate<{ _id: string; count: number }>([
    { $match: { eventId: { $in: eventIds } } },
    { $group: { _id: '$eventId', count: { $sum: 1 } } },
  ]).exec();

  const counts: Record<string, number> = {};
  eventIds.forEach((id) => {
    counts[id] = 0;
  });
  rows.forEach((row) => {
    counts[String(row._id)] = row.count;
  });
  return counts;
}

// --- Fonctions utilitaires --------------------------------------------------------

/**
 * Identité d'une personne : son identifiant de fiche quand il existe, sinon son
 * courriel. Sans l'un ou l'autre, il n'y a personne à reconnaître.
 */
function identityClauses(userId: string | null, email: string | null): Record<string, unknown>[] {
  const clauses: Record<string, unknown>[] = [];
  if (userId) clauses.push({ userId });
  if (email) clauses.push({ email: normalizeEmail(email) });
  return clauses;
}

function byNewest(a: Record<string, unknown>, b: Record<string, unknown>): number {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
}

/** Le courriel sert de clé de rapprochement : il est comparé sans casse. */
export function normalizeEmail(value: string | null): string | null {
  return value ? value.trim().toLowerCase() || null : null;
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}
