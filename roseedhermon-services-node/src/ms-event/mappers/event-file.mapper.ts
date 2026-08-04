import path from 'node:path';
import {
  ApiError,
  formatLocalDateTime,
  parseLocalDateTime,
  pickAny,
  toPrimitiveBoolean,
  toPrimitiveNumber,
  toStringOrNull,
  springIdToString,
  toPlainObject,
} from '../../common';
import { FILE_TYPES, type FileType } from '../models/event-file.model';

/** Champs métier d'un `EventFile`, sans l'identifiant. */
export interface EventFileFields {
  eventId: string | null;
  fileName: string | null;
  filePath: string | null;
  fileExtension: string | null;
  /** `long` Java : primitif, donc jamais null. */
  fileSize: number;
  mimeType: string | null;
  description: string | null;
  uploadDate: Date | null;
  fileType: FileType | null;
  /** Noms de champs Spring Data ; le JSON expose `presentationPhoto` / `mainPhoto`. */
  isPresentationPhoto: boolean;
  isMainPhoto: boolean;
}

export interface EventFileInput extends EventFileFields {
  id: string | null;
}

/** Reproduit `extractFilenameFromPath` : dernier segment séparé par `/`. */
export function extractFilenameFromPath(filePath: string | null | undefined): string {
  if (filePath === null || filePath === undefined || filePath === '') {
    return '';
  }
  const parts = filePath.split('/');
  return parts[parts.length - 1] ?? '';
}

function toFileType(value: unknown): FileType | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const name = String(value);
  if (!(FILE_TYPES as readonly string[]).includes(name)) {
    // Jackson rejetait une valeur d'énumération inconnue avec un HTTP 400.
    throw new ApiError(`Valeur de fileType inconnue : ${name}`, 400);
  }
  return name as FileType;
}

/** Équivalent de `convertToEntity(EventFileDTO)`. */
export function eventFileFromBody(body: unknown): EventFileInput {
  const source = (body ?? {}) as Record<string, unknown>;
  return {
    id: toStringOrNull(source.id),
    eventId: toStringOrNull(source.eventId),
    fileName: toStringOrNull(source.fileName),
    filePath: toStringOrNull(source.filePath),
    fileExtension: toStringOrNull(source.fileExtension),
    fileSize: toPrimitiveNumber(source.fileSize),
    mimeType: toStringOrNull(source.mimeType),
    description: toStringOrNull(source.description),
    uploadDate: parseLocalDateTime(source.uploadDate),
    fileType: toFileType(source.fileType),
    // Lombok exposait `presentationPhoto` / `mainPhoto` ; le modèle TypeScript généré
    // pour Angular utilise `isPresentationPhoto` / `isMainPhoto`. On accepte les deux.
    isPresentationPhoto: toPrimitiveBoolean(pickAny(source, 'presentationPhoto', 'isPresentationPhoto')),
    isMainPhoto: toPrimitiveBoolean(pickAny(source, 'mainPhoto', 'isMainPhoto')),
  };
}

/**
 * Équivalent de `convertToDTO(EventFile)`, y compris le calcul des URLs.
 *
 * Accepte un document Mongoose comme un sous-document du tableau `event.files`.
 *
 * Les deux orthographes des booléens sont émises : Java ne produisait que
 * `presentationPhoto` / `mainPhoto`, mais le client Angular généré lit
 * `isPresentationPhoto` / `isMainPhoto`.
 */
export function eventFileToJson(file: unknown): Record<string, unknown> {
  const raw = toPlainObject(file);

  const id = springIdToString(raw._id ?? raw.id);
  const eventId = toStringOrNull(raw.eventId);
  const filePath = toStringOrNull(raw.filePath);
  const isPresentationPhoto = toPrimitiveBoolean(raw.isPresentationPhoto);
  const isMainPhoto = toPrimitiveBoolean(raw.isMainPhoto);

  let accessUrl: string | null = null;
  let thumbnailUrl: string | null = null;
  if (filePath !== null) {
    const filename = extractFilenameFromPath(filePath);
    accessUrl = `/api/v1/files/events/${eventId}/${filename}`;
    if (isPresentationPhoto) {
      thumbnailUrl = `/api/v1/files/events/${eventId}/thumbnails/${filename}`;
    }
  }

  return {
    id,
    eventId,
    fileName: toStringOrNull(raw.fileName),
    filePath,
    fileExtension: toStringOrNull(raw.fileExtension),
    fileSize: toPrimitiveNumber(raw.fileSize),
    mimeType: toStringOrNull(raw.mimeType),
    description: toStringOrNull(raw.description),
    uploadDate: formatLocalDateTime(raw.uploadDate as Date | null | undefined),
    fileType: toStringOrNull(raw.fileType),
    presentationPhoto: isPresentationPhoto,
    mainPhoto: isMainPhoto,
    isPresentationPhoto,
    isMainPhoto,
    accessUrl,
    thumbnailUrl,
  };
}

/** Nom du thumbnail associé à un fichier : préfixe `thumb_` (identique au Java). */
export function thumbnailName(filename: string): string {
  return `thumb_${filename}`;
}

/** Extension d'un nom de fichier, à partir du dernier point (comme `getFileExtension`). */
export function fileExtensionOf(filename: string | null | undefined): string {
  if (filename === null || filename === undefined) {
    return '';
  }
  const index = filename.lastIndexOf('.');
  return index === -1 ? '' : filename.substring(index);
}

/** Base du nom de fichier, en tolérant les séparateurs Windows. */
export function basename(filePath: string): string {
  return path.basename(filePath);
}
