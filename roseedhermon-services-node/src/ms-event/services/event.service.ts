import { runtimeError, springIdFilter, toSpringId, withoutNulls } from '../../common';
import {
  eventToJson,
  type CreateEventWithPhotosInput,
  type EventFields,
} from '../mappers/event.mapper';
import type { EventFileInput } from '../mappers/event-file.mapper';
import { EVENT_CLASS, EventModel, type EventDocument } from '../models/event.model';
import { EVENT_FILE_CLASS } from '../models/event-file.model';
import { createEventFile, deleteEventFiles, getEventFiles } from './event-file.service';

/** Fichier imbriqué dans `event.files` (stockage distinct de la collection `event_files`). */
function embeddedFileToDocument(file: EventFileInput): Record<string, unknown> {
  return withoutNulls({
    _id: file.id,
    eventId: file.eventId,
    fileName: file.fileName,
    filePath: file.filePath,
    fileExtension: file.fileExtension,
    fileSize: file.fileSize,
    mimeType: file.mimeType,
    description: file.description,
    uploadDate: file.uploadDate,
    fileType: file.fileType,
    isPresentationPhoto: file.isPresentationPhoto,
    isMainPhoto: file.isMainPhoto,
    _class: EVENT_FILE_CLASS,
  });
}

/**
 * Document tel que Spring Data l'écrirait, propriétés nulles omises comprises :
 * les documents existants n'ont par exemple aucune clé `amount` ni `mainPhotoId`.
 */
function toDocument(fields: EventFields): Record<string, unknown> {
  return withoutNulls({
    name: fields.name,
    date: fields.date,
    time: fields.time,
    location: fields.location === null ? null : withoutNulls({ ...fields.location }),
    description: fields.description,
    isFree: fields.isFree,
    amount: fields.amount,
    numberOfDays: fields.numberOfDays,
    presenters:
      fields.presenters === null ? null : fields.presenters.map((presenter) => withoutNulls({ ...presenter })),
    category: fields.category,
    availableSeats: fields.availableSeats,
    lastRegistrationDate: fields.lastRegistrationDate,
    eventType: fields.eventType,
    eventStatus: fields.eventStatus,
    visibility: fields.visibility,
    groupId: fields.groupId,
    files: fields.files === null ? null : fields.files.map((file) => embeddedFileToDocument(file)),
    mainPhotoId: fields.mainPhotoId,
    _class: EVENT_CLASS,
  });
}

/** Équivalent de `EventRepository.save` : insertion sans id, remplacement complet sinon. */
async function save(id: string | null, fields: EventFields): Promise<EventDocument> {
  const document = toDocument(fields);

  if (id === null) {
    return EventModel.create({ _id: toSpringId(null), ...document });
  }

  const replaced = await EventModel.findOneAndReplace(
    springIdFilter(id),
    { _id: toSpringId(id), ...document },
    { upsert: true, returnDocument: 'after' },
  ).exec();

  if (replaced === null) {
    throw runtimeError(`Échec de l'enregistrement de l'événement ${id}`);
  }
  return replaced;
}

async function findByIdOrThrow(id: string): Promise<EventDocument> {
  const event = await EventModel.findOne(springIdFilter(id)).exec();
  if (event === null) {
    // `orElseThrow(() -> new RuntimeException("Event not found"))` -> HTTP 500
    throw runtimeError('Event not found');
  }
  return event;
}

/** Équivalent de `createEvent`. */
export async function createEvent(
  input: EventFields & { id: string | null },
): Promise<Record<string, unknown>> {
  const saved = await save(input.id, input);
  return eventToJson(saved);
}

/** Équivalent de `getEvent`. */
export async function getEvent(id: string): Promise<Record<string, unknown>> {
  const event = await findByIdOrThrow(id);
  return eventToJson(event);
}

/** Équivalent de `getAllEvents`. */
export async function getAllEvents(): Promise<Record<string, unknown>[]> {
  const events = await EventModel.find().exec();
  return events.map((event) => eventToJson(event));
}

/**
 * Équivalent de `getAllEventsWithFiles` : le tableau `files` du JSON provient ici de
 * la collection `event_files`, et non du tableau imbriqué dans le document.
 */
export async function getAllEventsWithFiles(): Promise<Record<string, unknown>[]> {
  const events = await EventModel.find().exec();
  const result: Record<string, unknown>[] = [];
  for (const event of events) {
    const files = await getEventFiles(String(event._id));
    result.push(eventToJson(event, files));
  }
  return result;
}

/** Équivalent de `updateEvent` : tous les champs sont écrasés, y compris par des nulls. */
export async function updateEvent(id: string, input: EventFields): Promise<Record<string, unknown>> {
  const existing = await findByIdOrThrow(id);
  const saved = await save(String(existing._id), input);
  return eventToJson(saved);
}

/** Équivalent de `deleteEvent` : les fichiers (physiques et en base) partent d'abord. */
export async function deleteEvent(id: string): Promise<void> {
  await deleteEventFiles(id);
  await EventModel.deleteOne(springIdFilter(id)).exec();
}

/** Équivalent de `createEventWithPhotos`. */
export async function createEventWithPhotos(
  input: CreateEventWithPhotosInput,
): Promise<Record<string, unknown>> {
  const savedEvent = await save(null, input);
  const eventId = String(savedEvent._id);

  const photos = input.photos;
  if (photos !== null && photos.length > 0) {
    let mainPhotoId: string | null = null;

    for (let index = 0; index < photos.length; index += 1) {
      const photo: EventFileInput = { ...photos[index], eventId };
      if (index === 0 && input.setFirstPhotoAsMain) {
        photo.isMainPhoto = true;
      }

      const created = await createEventFile(photo);

      // Le code Java lisait `fileDTO.getId()`, qui est nul pour une photo envoyée sans
      // identifiant : `mainPhotoId` restait donc vide. On reprend l'identifiant réellement
      // attribué, ce qui rend le champ exploitable sans changer le format de la réponse.
      if (index === 0 && input.setFirstPhotoAsMain && mainPhotoId === null) {
        mainPhotoId = (created.id as string | null) ?? null;
      }
    }

    if (mainPhotoId !== null) {
      const updated = await EventModel.findOneAndUpdate(
        springIdFilter(eventId),
        { $set: { mainPhotoId } },
        { returnDocument: 'after' },
      ).exec();
      if (updated !== null) {
        return eventToJson(updated);
      }
    }
  }

  return eventToJson(savedEvent);
}
