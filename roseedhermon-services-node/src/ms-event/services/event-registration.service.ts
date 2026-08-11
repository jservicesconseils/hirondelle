import { runtimeError, springIdFilter, toSpringId, toStringOrNull, withoutNulls } from '../../common';
import {
  EVENT_REGISTRATION_CLASS,
  EventRegistrationModel,
  type EventRegistrationDocument,
} from '../models/event-registration.model';

/** Reprend `EventRegistrationDTO`, enrichi des coordonnées du participant. */
export interface EventRegistrationInput {
  id: string | null;
  eventId: string | null;
  userId: string | null;
  status: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  seats: number | null;
  note: string | null;
  groupId: string | null;
}

export function registrationFromBody(body: unknown): EventRegistrationInput {
  const source = (body ?? {}) as Record<string, unknown>;
  return {
    id: toStringOrNull(source.id),
    eventId: toStringOrNull(source.eventId),
    userId: toStringOrNull(source.userId),
    status: toStringOrNull(source.status),
    firstName: toStringOrNull(source.firstName),
    lastName: toStringOrNull(source.lastName),
    email: normalizeEmail(toStringOrNull(source.email)),
    phoneNumber: toStringOrNull(source.phoneNumber),
    seats: toSeats(source.seats),
    note: toStringOrNull(source.note),
    groupId: toStringOrNull(source.groupId),
  };
}

export function registrationToJson(document: EventRegistrationDocument): Record<string, unknown> {
  const raw = document.toObject() as Record<string, unknown>;
  return {
    id: String(raw._id),
    eventId: toStringOrNull(raw.eventId),
    userId: toStringOrNull(raw.userId),
    status: toStringOrNull(raw.status),
    firstName: toStringOrNull(raw.firstName),
    lastName: toStringOrNull(raw.lastName),
    email: toStringOrNull(raw.email),
    phoneNumber: toStringOrNull(raw.phoneNumber),
    // Les inscriptions antérieures à ce champ valent une place.
    seats: typeof raw.seats === 'number' && raw.seats > 0 ? raw.seats : 1,
    note: toStringOrNull(raw.note),
    groupId: toStringOrNull(raw.groupId),
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : null,
  };
}

/** Équivalent de `registerForEvent`. */
export async function registerForEvent(input: EventRegistrationInput): Promise<Record<string, unknown>> {
  const document = withoutNulls({
    eventId: input.eventId,
    userId: input.userId,
    status: input.status,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phoneNumber: input.phoneNumber,
    seats: input.seats,
    note: input.note,
    groupId: input.groupId,
    _class: EVENT_REGISTRATION_CLASS,
  });

  if (input.id === null) {
    const created = await EventRegistrationModel.create({
      _id: toSpringId(null),
      createdAt: new Date(),
      ...document,
    });
    return registrationToJson(created);
  }

  const replaced = await EventRegistrationModel.findOneAndReplace(
    springIdFilter(input.id),
    { _id: toSpringId(input.id), createdAt: new Date(), ...document },
    { upsert: true, returnDocument: 'after' },
  ).exec();

  if (replaced === null) {
    throw runtimeError(`Échec de l'enregistrement de l'inscription ${input.id}`);
  }
  return registrationToJson(replaced);
}

/** Équivalent de `cancelRegistration` : `deleteById` ignore un identifiant inconnu. */
export async function cancelRegistration(registrationId: string): Promise<void> {
  await EventRegistrationModel.deleteOne(springIdFilter(registrationId)).exec();
}

/** Équivalent de `getRegistrationStatus` : « not_found » si l'inscription n'existe pas. */
export async function getRegistrationStatus(registrationId: string): Promise<string> {
  const registration = await EventRegistrationModel.findOne(springIdFilter(registrationId)).exec();
  if (registration === null) {
    return 'not_found';
  }
  // Un statut nul en base donnait un corps vide côté Spring (`ResponseEntity.ok(null)`).
  return (registration.get('status') as string | undefined) ?? '';
}

// --- Lectures ajoutées ------------------------------------------------------------

export async function getRegistration(registrationId: string): Promise<Record<string, unknown> | null> {
  const registration = await EventRegistrationModel.findOne(springIdFilter(registrationId)).exec();
  return registration === null ? null : registrationToJson(registration);
}

export async function getRegistrationsByEvent(eventId: string): Promise<Record<string, unknown>[]> {
  const registrations = await EventRegistrationModel.find({ eventId }).exec();
  return registrations.map(registrationToJson).sort(byNewest);
}

export async function getRegistrationsByEvents(eventIds: string[]): Promise<Record<string, unknown>[]> {
  if (eventIds.length === 0) return [];
  const registrations = await EventRegistrationModel.find({ eventId: { $in: eventIds } }).exec();
  return registrations.map(registrationToJson).sort(byNewest);
}

/**
 * Inscriptions d'une personne, retrouvées par son identifiant de membre ou par son
 * courriel : une place réservée avant la connexion n'est pas perdue pour autant.
 */
export async function getRegistrationsByUser(
  userId: string | null,
  email: string | null,
): Promise<Record<string, unknown>[]> {
  const clauses: Record<string, unknown>[] = [];
  if (userId) clauses.push({ userId });
  if (email) clauses.push({ email: normalizeEmail(email) });
  if (clauses.length === 0) return [];

  const registrations = await EventRegistrationModel.find({ $or: clauses }).exec();
  return registrations.map(registrationToJson).sort(byNewest);
}

export async function getAllRegistrations(): Promise<Record<string, unknown>[]> {
  const registrations = await EventRegistrationModel.find().exec();
  return registrations.map(registrationToJson).sort(byNewest);
}

/**
 * Inscription déjà enregistrée pour le même événement et la même personne.
 *
 * Sans ce contrôle, un rechargement de la page de confirmation créerait un
 * deuxième billet pour la même personne.
 */
export async function findExistingRegistration(
  eventId: string,
  userId: string | null,
  email: string | null,
): Promise<Record<string, unknown> | null> {
  const clauses: Record<string, unknown>[] = [];
  if (userId) clauses.push({ userId });
  if (email) clauses.push({ email: normalizeEmail(email) });
  if (clauses.length === 0) return null;

  const existing = await EventRegistrationModel.findOne({ eventId, $or: clauses }).exec();
  return existing === null ? null : registrationToJson(existing);
}

/** Places déjà retenues sur un événement, toutes inscriptions confondues. */
export async function countReservedSeats(eventId: string): Promise<number> {
  const registrations = await EventRegistrationModel.find({ eventId }).exec();
  return registrations.reduce((total, registration) => {
    const seats = registration.get('seats') as number | undefined;
    return total + (typeof seats === 'number' && seats > 0 ? seats : 1);
  }, 0);
}

// --- Fonctions utilitaires --------------------------------------------------------

function byNewest(a: Record<string, unknown>, b: Record<string, unknown>): number {
  return String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''));
}

/** Le courriel sert de clé de rapprochement : il est comparé sans casse. */
function normalizeEmail(value: string | null): string | null {
  return value ? value.trim().toLowerCase() || null : null;
}

function toSeats(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.min(Math.floor(parsed), 50);
}
