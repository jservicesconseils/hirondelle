import {
  pickAny,
  springIdToString,
  toNumberOrNull,
  toPrimitiveBoolean,
  toPlainObject,
  toPrimitiveNumber,
  toStringOrNull,
} from '../../common';
import { eventFileFromBody, eventFileToJson, type EventFileFields, type EventFileInput } from './event-file.mapper';

/** Reprend `EventLocation`. */
export interface EventLocationFields {
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
}

/** Reprend `Presenter` / `PresenterDTO`. */
export interface PresenterFields {
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  resume: string | null;
}

/** Champs métier d'un `EventEntity`, sans l'identifiant. */
export interface EventFields {
  name: string | null;
  date: string | null;
  location: EventLocationFields | null;
  description: string | null;
  /** Champ `isFree` en base, propriété JSON `free`. */
  isFree: boolean;
  amount: number | null;
  numberOfDays: number;
  presenters: PresenterFields[] | null;
  category: string | null;
  availableSeats: number;
  lastRegistrationDate: string | null;
  eventType: string | null;
  eventStatus: string | null;
  files: EventFileInput[] | null;
  mainPhotoId: string | null;
}

function locationFromBody(value: unknown): EventLocationFields | null {
  if (value === null || value === undefined || typeof value !== 'object') {
    return null;
  }
  const source = value as Record<string, unknown>;
  return {
    address: toStringOrNull(source.address),
    city: toStringOrNull(source.city),
    postalCode: toStringOrNull(source.postalCode),
    country: toStringOrNull(source.country),
    placeName: toStringOrNull(source.placeName),
    latitude: toNumberOrNull(source.latitude),
    longitude: toNumberOrNull(source.longitude),
  };
}

function presentersFromBody(value: unknown): PresenterFields[] | null {
  // `convertPresenterDTOsToEntities` renvoyait null pour une liste absente : la
  // distinction null / liste vide est visible dans la réponse, on la conserve.
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry) => {
    const source = (entry ?? {}) as Record<string, unknown>;
    return {
      firstName: toStringOrNull(source.firstName),
      lastName: toStringOrNull(source.lastName),
      title: toStringOrNull(source.title),
      resume: toStringOrNull(source.resume),
    };
  });
}

function filesFromBody(value: unknown): EventFileInput[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry) => eventFileFromBody(entry));
}

/** Équivalent de `dtoToEntity(EventDTO)`. */
export function eventFromBody(body: unknown): EventFields & { id: string | null } {
  const source = (body ?? {}) as Record<string, unknown>;
  return {
    id: toStringOrNull(source.id),
    name: toStringOrNull(source.name),
    date: toStringOrNull(source.date),
    location: locationFromBody(source.location),
    description: toStringOrNull(source.description),
    // `EventDTO` déclarait `setIsFree` (Jackson attendait donc `isFree`) tandis que
    // `CreateEventWithPhotosDTO` attendait `free`. On accepte les deux partout.
    isFree: toPrimitiveBoolean(pickAny(source, 'isFree', 'free')),
    amount: toNumberOrNull(source.amount),
    numberOfDays: toPrimitiveNumber(source.numberOfDays),
    presenters: presentersFromBody(source.presenters),
    category: toStringOrNull(source.category),
    availableSeats: toPrimitiveNumber(source.availableSeats),
    lastRegistrationDate: toStringOrNull(source.lastRegistrationDate),
    eventType: toStringOrNull(source.eventType),
    eventStatus: toStringOrNull(source.eventStatus),
    files: filesFromBody(source.files),
    mainPhotoId: toStringOrNull(source.mainPhotoId),
  };
}

/** Reprend `CreateEventWithPhotosDTO`. */
export interface CreateEventWithPhotosInput extends EventFields {
  photos: EventFileInput[] | null;
  /** `private boolean setFirstPhotoAsMain = true` : la valeur par défaut est `true`. */
  setFirstPhotoAsMain: boolean;
}

/** Équivalent de la désérialisation de `CreateEventWithPhotosDTO`. */
export function createEventWithPhotosFromBody(body: unknown): CreateEventWithPhotosInput {
  const source = (body ?? {}) as Record<string, unknown>;
  const base = eventFromBody(body);
  const setFirstPhotoAsMain = pickAny(source, 'setFirstPhotoAsMain', 'firstPhotoAsMain');
  return {
    ...base,
    // `CreateEventWithPhotosDTO` n'a ni `files` ni `mainPhotoId` : ils restent nuls.
    files: null,
    mainPhotoId: null,
    photos: filesFromBody(source.photos),
    setFirstPhotoAsMain: toPrimitiveBoolean(setFirstPhotoAsMain, true),
  };
}

function locationToJson(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) {
    return null;
  }
  const source = value as Record<string, unknown>;
  // Jackson sérialise les propriétés nulles : les sept clés sont toujours présentes.
  return {
    address: toStringOrNull(source.address),
    city: toStringOrNull(source.city),
    postalCode: toStringOrNull(source.postalCode),
    country: toStringOrNull(source.country),
    placeName: toStringOrNull(source.placeName),
    latitude: toNumberOrNull(source.latitude),
    longitude: toNumberOrNull(source.longitude),
  };
}

function presentersToJson(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry) => {
    const source = (entry ?? {}) as Record<string, unknown>;
    return {
      firstName: toStringOrNull(source.firstName),
      lastName: toStringOrNull(source.lastName),
      title: toStringOrNull(source.title),
      resume: toStringOrNull(source.resume),
    };
  });
}

/**
 * Équivalent de `entityToDto(EventEntity)`.
 *
 * `files` correspond au tableau imbriqué dans le document `event` (et non à la
 * collection `event_files`), exactement comme le faisait `EventService`.
 * `overrideFiles` sert à `GET /events/with-files`, qui remplace ce tableau par les
 * fichiers issus de la collection.
 */
export function eventToJson(
  event: unknown,
  overrideFiles?: Record<string, unknown>[] | null,
): Record<string, unknown> {
  const raw = toPlainObject(event);

  const embeddedFiles = Array.isArray(raw.files)
    ? (raw.files as Record<string, unknown>[]).map((file) => eventFileToJson(file))
    : null;
  const isFree = toPrimitiveBoolean(raw.isFree);

  return {
    id: springIdToString(raw._id ?? raw.id),
    name: toStringOrNull(raw.name),
    date: toStringOrNull(raw.date),
    location: locationToJson(raw.location),
    description: toStringOrNull(raw.description),
    // Jackson produisait `free` (getter `isFree()`) ; `isFree` est ajouté pour le
    // client Angular généré, qui déclare cette propriété.
    free: isFree,
    isFree,
    amount: toNumberOrNull(raw.amount),
    numberOfDays: toPrimitiveNumber(raw.numberOfDays),
    presenters: presentersToJson(raw.presenters),
    category: toStringOrNull(raw.category),
    availableSeats: toPrimitiveNumber(raw.availableSeats),
    lastRegistrationDate: toStringOrNull(raw.lastRegistrationDate),
    eventType: toStringOrNull(raw.eventType),
    eventStatus: toStringOrNull(raw.eventStatus),
    files: overrideFiles === undefined ? embeddedFiles : overrideFiles,
    mainPhotoId: toStringOrNull(raw.mainPhotoId),
  };
}

/** Champs d'un fichier imbriqué tels qu'ils sont écrits dans le document `event`. */
export type EmbeddedEventFileFields = EventFileFields;
