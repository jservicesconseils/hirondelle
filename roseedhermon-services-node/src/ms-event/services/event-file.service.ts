import { runtimeError, springIdFilter, toSpringId, withoutNulls } from '../../common';
import { config } from '../config';
import { extractFilenameFromPath, eventFileToJson, type EventFileInput } from '../mappers/event-file.mapper';
import { EVENT_FILE_CLASS, EventFileModel, type EventFileDocument } from '../models/event-file.model';
import type { FileType } from '../models/event-file.model';
import { deleteEventDirectory, deleteFile } from './file-storage.service';

/**
 * Document tel que Spring Data l'écrirait : les propriétés nulles sont omises et
 * `_class` est conservé pour qu'un retour au service Java reste possible.
 */
function toDocument(input: EventFileInput): Record<string, unknown> {
  return withoutNulls({
    eventId: input.eventId,
    fileName: input.fileName,
    filePath: input.filePath,
    fileExtension: input.fileExtension,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    description: input.description,
    uploadDate: input.uploadDate,
    fileType: input.fileType,
    isPresentationPhoto: input.isPresentationPhoto,
    isMainPhoto: input.isMainPhoto,
    _class: EVENT_FILE_CLASS,
  });
}

/**
 * Équivalent de `MongoRepository.save` : insertion quand l'identifiant est absent,
 * remplacement complet du document (upsert) sinon.
 */
async function save(input: EventFileInput): Promise<EventFileDocument> {
  const document = toDocument(input);

  if (input.id === null) {
    const created = await EventFileModel.create({ _id: toSpringId(null), ...document });
    return created;
  }

  const replaced = await EventFileModel.findOneAndReplace(
    springIdFilter(input.id),
    { _id: toSpringId(input.id), ...document },
    { upsert: true, returnDocument: 'after' },
  ).exec();

  // `upsert: true` garantit un document, mais le typage de Mongoose reste nullable.
  if (replaced === null) {
    throw runtimeError(`Échec de l'enregistrement du fichier ${input.id}`);
  }
  return replaced;
}

async function findById(fileId: string): Promise<EventFileDocument | null> {
  return EventFileModel.findOne(springIdFilter(fileId)).exec();
}

/** Reprend `convertToEntity` appliqué à un document existant. */
function documentToInput(document: EventFileDocument): EventFileInput {
  const raw = document.toObject() as Record<string, unknown>;
  return {
    id: String(raw._id),
    eventId: (raw.eventId as string | undefined) ?? null,
    fileName: (raw.fileName as string | undefined) ?? null,
    filePath: (raw.filePath as string | undefined) ?? null,
    fileExtension: (raw.fileExtension as string | undefined) ?? null,
    fileSize: (raw.fileSize as number | undefined) ?? 0,
    mimeType: (raw.mimeType as string | undefined) ?? null,
    description: (raw.description as string | undefined) ?? null,
    uploadDate: (raw.uploadDate as Date | undefined) ?? null,
    fileType: (raw.fileType as FileType | undefined) ?? null,
    isPresentationPhoto: (raw.isPresentationPhoto as boolean | undefined) ?? false,
    isMainPhoto: (raw.isMainPhoto as boolean | undefined) ?? false,
  };
}

/**
 * Équivalent de `setOtherPhotosAsNotMain`.
 *
 * Comme en Java (`Optional<EventFile> findByEventIdAndIsMainPhotoTrue`), une seule
 * photo est désactivée : celle que MongoDB renvoie en premier.
 */
async function setOtherPhotosAsNotMain(eventId: string | null): Promise<void> {
  if (eventId === null) return;
  const current = await EventFileModel.findOne({ eventId, isMainPhoto: true }).exec();
  if (current !== null) {
    current.set('isMainPhoto', false);
    await current.save();
  }
}

/** Équivalent de `createEventFile`. */
export async function createEventFile(input: EventFileInput): Promise<Record<string, unknown>> {
  if (input.isMainPhoto) {
    await setOtherPhotosAsNotMain(input.eventId);
  }
  // `file.setUploadDate(LocalDateTime.now())` écrase toujours la valeur reçue.
  const saved = await save({ ...input, uploadDate: new Date() });
  return eventFileToJson(saved);
}

/** Équivalent de `updateEventFile`. */
export async function updateEventFile(
  fileId: string,
  input: EventFileInput,
): Promise<Record<string, unknown>> {
  const existing = await findById(fileId);
  if (existing === null) {
    throw runtimeError(`Fichier non trouvé avec l'ID: ${fileId}`);
  }

  const updated: EventFileInput = {
    ...input,
    id: fileId,
    // L'événement d'origine est conservé, comme dans le code Java.
    eventId: (existing.get('eventId') as string | undefined) ?? null,
  };

  if (updated.isMainPhoto) {
    await setOtherPhotosAsNotMain(updated.eventId);
  }

  const saved = await save(updated);
  return eventFileToJson(saved);
}

/** Équivalent de `setMainPhoto`. */
export async function setMainPhoto(fileId: string): Promise<Record<string, unknown>> {
  const file = await findById(fileId);
  if (file === null) {
    throw runtimeError(`Fichier non trouvé avec l'ID: ${fileId}`);
  }

  if (file.get('isPresentationPhoto') !== true) {
    throw runtimeError('Seules les images peuvent être définies comme photo principale');
  }

  await setOtherPhotosAsNotMain((file.get('eventId') as string | undefined) ?? null);

  const input = documentToInput(file);
  const saved = await save({ ...input, isMainPhoto: true });
  return eventFileToJson(saved);
}

/** Équivalent de `getEventFiles`. */
export async function getEventFiles(eventId: string): Promise<Record<string, unknown>[]> {
  const files = await EventFileModel.find({ eventId }).exec();
  return files.map((file) => eventFileToJson(file));
}

/** Équivalent de `getEventFilesByType`. */
export async function getEventFilesByType(
  eventId: string,
  fileType: FileType,
): Promise<Record<string, unknown>[]> {
  const files = await EventFileModel.find({ eventId, fileType }).exec();
  return files.map((file) => eventFileToJson(file));
}

/** Équivalent de `getEventPresentationPhotos`. */
export async function getEventPresentationPhotos(eventId: string): Promise<Record<string, unknown>[]> {
  const files = await EventFileModel.find({ eventId, isPresentationPhoto: true }).exec();
  return files.map((file) => eventFileToJson(file));
}

/** Équivalent de `getMainPhoto` : `null` si aucune photo principale. */
export async function getMainPhoto(eventId: string): Promise<Record<string, unknown> | null> {
  const file = await EventFileModel.findOne({ eventId, isMainPhoto: true }).exec();
  return file === null ? null : eventFileToJson(file);
}

/** Équivalent de `deleteEventFile` : fichier physique puis document. */
export async function deleteEventFile(fileId: string): Promise<void> {
  const file = await findById(fileId);
  if (file === null) {
    throw runtimeError(`Fichier non trouvé avec l'ID: ${fileId}`);
  }

  try {
    const filename = extractFilenameFromPath((file.get('filePath') as string | undefined) ?? null);
    await deleteFile((file.get('eventId') as string | undefined) ?? '', filename);
  } catch (error) {
    // Comme en Java : on journalise mais on poursuit la suppression en base.
    console.error(
      `[${config.serviceName}] Erreur lors de la suppression du fichier: ${(error as Error).message}`,
    );
  }

  await EventFileModel.deleteOne(springIdFilter(fileId)).exec();
}

/** Équivalent de `deleteEventFiles`. */
export async function deleteEventFiles(eventId: string): Promise<void> {
  try {
    await deleteEventDirectory(eventId);
  } catch (error) {
    console.error(
      `[${config.serviceName}] Erreur lors de la suppression des fichiers: ${(error as Error).message}`,
    );
  }

  await EventFileModel.deleteMany({ eventId }).exec();
}
