import { runtimeError, springIdFilter, toSpringId, toStringOrNull, withoutNulls } from '../../common';
import {
  EVENT_REGISTRATION_CLASS,
  EventRegistrationModel,
  type EventRegistrationDocument,
} from '../models/event-registration.model';

/** Reprend `EventRegistrationDTO`. */
export interface EventRegistrationInput {
  id: string | null;
  eventId: string | null;
  userId: string | null;
  status: string | null;
}

export function registrationFromBody(body: unknown): EventRegistrationInput {
  const source = (body ?? {}) as Record<string, unknown>;
  return {
    id: toStringOrNull(source.id),
    eventId: toStringOrNull(source.eventId),
    userId: toStringOrNull(source.userId),
    status: toStringOrNull(source.status),
  };
}

export function registrationToJson(document: EventRegistrationDocument): Record<string, unknown> {
  const raw = document.toObject() as Record<string, unknown>;
  return {
    id: String(raw._id),
    eventId: toStringOrNull(raw.eventId),
    userId: toStringOrNull(raw.userId),
    status: toStringOrNull(raw.status),
  };
}

/** Équivalent de `registerForEvent`. */
export async function registerForEvent(input: EventRegistrationInput): Promise<Record<string, unknown>> {
  const document = withoutNulls({
    eventId: input.eventId,
    userId: input.userId,
    status: input.status,
    _class: EVENT_REGISTRATION_CLASS,
  });

  if (input.id === null) {
    const created = await EventRegistrationModel.create({ _id: toSpringId(null), ...document });
    return registrationToJson(created);
  }

  const replaced = await EventRegistrationModel.findOneAndReplace(
    springIdFilter(input.id),
    { _id: toSpringId(input.id), ...document },
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
