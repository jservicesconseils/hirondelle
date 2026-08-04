import { randomUUID } from 'node:crypto';
import { constants as fsConstants } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ApiError } from '../../common';
import { config } from '../config';
import { fileExtensionOf, thumbnailName } from '../mappers/event-file.mapper';
import type { EventFileInput } from '../mappers/event-file.mapper';
import type { FileType } from '../models/event-file.model';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.wmv', '.flv'];
const ALLOWED_AUDIO_EXTENSIONS = ['.mp3', '.wav', '.aac', '.ogg', '.flac'];

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/rtf',
];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv'];
const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg', 'audio/flac'];

/**
 * Erreur équivalente à l'`IOException` levée par `FileStorageService` : le contrôleur
 * Java la traduisait en HTTP 400 avec un corps vide.
 */
export class FileStorageError extends ApiError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'FileStorageError';
  }
}

/** Équivalent de `@PostConstruct init()` : crée le dossier d'upload principal. */
export async function initUploadDir(): Promise<void> {
  await fs.mkdir(config.uploadDir, { recursive: true });
  console.log(`[${config.serviceName}] dossier d'upload : ${config.uploadDir}`);
}

function isImageMimeType(contentType: string | null | undefined): boolean {
  return contentType !== null && contentType !== undefined && IMAGE_MIME_TYPES.includes(contentType);
}

function isDocumentMimeType(contentType: string | null | undefined): boolean {
  return contentType !== null && contentType !== undefined && DOCUMENT_MIME_TYPES.includes(contentType);
}

function isVideoMimeType(contentType: string | null | undefined): boolean {
  return contentType !== null && contentType !== undefined && VIDEO_MIME_TYPES.includes(contentType);
}

function isAudioMimeType(contentType: string | null | undefined): boolean {
  return contentType !== null && contentType !== undefined && AUDIO_MIME_TYPES.includes(contentType);
}

/** Équivalent de `determineFileType`. */
function determineFileType(contentType: string | null | undefined): FileType {
  if (isImageMimeType(contentType)) return 'PRESENTATION_PHOTO';
  if (isDocumentMimeType(contentType)) return 'DOCUMENT';
  if (isVideoMimeType(contentType)) return 'VIDEO';
  if (isAudioMimeType(contentType)) return 'AUDIO';
  return 'OTHER';
}

function hasExtensionIn(filename: string, extensions: string[]): boolean {
  return extensions.includes(fileExtensionOf(filename).toLowerCase());
}

/** Équivalent de `hasValidExtension` : le type est déduit de l'extension, puis validé. */
function hasValidExtension(filename: string): boolean {
  if (hasExtensionIn(filename, ALLOWED_IMAGE_EXTENSIONS)) return true;
  if (hasExtensionIn(filename, ALLOWED_DOCUMENT_EXTENSIONS)) return true;
  if (hasExtensionIn(filename, ALLOWED_VIDEO_EXTENSIONS)) return true;
  if (hasExtensionIn(filename, ALLOWED_AUDIO_EXTENSIONS)) return true;
  return false;
}

/** Fichier reçu, sous la forme fournie par multer en mémoire. */
export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * Équivalent de `validateFile`.
 *
 * La comparaison des types MIME reprend volontairement `allowedTypes.contains(contentType)`,
 * c'est-à-dire une recherche de sous-chaîne dans la liste : `image/jpeg` est accepté
 * parce qu'il apparaît dans la chaîne de configuration.
 */
function validateFile(file: UploadedFile): void {
  if (file.size === 0) {
    throw new FileStorageError('Le fichier est vide');
  }

  if (file.size > config.maxFileSize) {
    const maxMb = Math.trunc(config.maxFileSize / 1024 / 1024);
    throw new FileStorageError(`Le fichier est trop volumineux. Taille maximale: ${maxMb}MB`);
  }

  const contentType = file.mimetype;
  const originalFilename = file.originalname;
  const isAllowedType = contentType !== null && contentType !== '' && config.allowedTypes.includes(contentType);

  if (originalFilename !== null && originalFilename.toLowerCase().includes('whatsapp')) {
    // Validation assouplie pour les fichiers WhatsApp, dont le type MIME est souvent absent.
    if (!isAllowedType && !hasExtensionIn(originalFilename, ALLOWED_IMAGE_EXTENSIONS)) {
      throw new FileStorageError(
        'Fichier WhatsApp avec extension non autorisée. Extensions autorisées: jpg, jpeg, png, gif, webp',
      );
    }
  } else if (!isAllowedType) {
    throw new FileStorageError(`Type de fichier non autorisé. Types autorisés: ${config.allowedTypes}`);
  }

  if (originalFilename === null || originalFilename === '' || !hasValidExtension(originalFilename)) {
    throw new FileStorageError('Extension de fichier non autorisée');
  }
}

/**
 * Équivalent de `createThumbnail` : vignette d'au plus 300 px de côté, encodée en JPEG.
 *
 * Comme en Java, le nom du thumbnail conserve l'extension du fichier d'origine
 * (`thumb_<uuid>.png` peut donc contenir du JPEG) et un échec n'interrompt jamais l'upload.
 */
export async function createThumbnail(
  originalFilePath: string,
  outputDir: string,
  filename: string,
): Promise<void> {
  try {
    const target = path.join(outputDir, thumbnailName(filename));
    const buffer = await sharp(originalFilePath)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: false })
      // `BufferedImage.TYPE_INT_RGB` : pas de canal alpha, fond blanc.
      .flatten({ background: '#ffffff' })
      .jpeg()
      .toBuffer();
    await fs.writeFile(target, buffer);
  } catch (error) {
    console.error(
      `[${config.serviceName}] Erreur lors de la création du thumbnail: ${(error as Error).message}`,
    );
  }
}

/** Équivalent de `storeFile` : valide, écrit sur disque, puis décrit le fichier stocké. */
export async function storeFile(
  file: UploadedFile,
  eventId: string,
  description: string | null,
): Promise<EventFileInput> {
  validateFile(file);

  const eventUploadDir = path.join(config.uploadDir, eventId);
  try {
    await fs.mkdir(eventUploadDir, { recursive: true });
  } catch (error) {
    throw new FileStorageError(`Impossible de créer le dossier d'upload: ${(error as Error).message}`);
  }

  const originalFilename = file.originalname;
  const extension = fileExtensionOf(originalFilename);
  const uniqueFilename = `${randomUUID()}${extension}`;
  const filePath = path.join(eventUploadDir, uniqueFilename);

  try {
    await fs.writeFile(filePath, file.buffer);
  } catch (error) {
    throw new FileStorageError(`Impossible de sauvegarder le fichier: ${(error as Error).message}`);
  }

  let fileSize: number;
  try {
    fileSize = (await fs.stat(filePath)).size;
  } catch {
    throw new FileStorageError("Le fichier n'a pas été créé correctement");
  }

  const isImage = isImageMimeType(file.mimetype);
  const stored: EventFileInput = {
    // `UUID.randomUUID().toString()` côté Java : l'identifiant est donc stocké en String.
    id: randomUUID(),
    eventId,
    fileName: originalFilename,
    filePath,
    fileExtension: extension,
    fileSize,
    mimeType: file.mimetype,
    description,
    uploadDate: new Date(),
    fileType: determineFileType(file.mimetype),
    isPresentationPhoto: isImage,
    isMainPhoto: false,
  };

  if (isImage) {
    await createThumbnail(filePath, eventUploadDir, uniqueFilename);
  }

  return stored;
}

/** Équivalent de `deleteFile` : supprime le fichier et son thumbnail. */
export async function deleteFile(eventId: string, filename: string): Promise<void> {
  const filePath = path.join(config.uploadDir, eventId, filename);
  const thumbnailPath = path.join(config.uploadDir, eventId, thumbnailName(filename));
  await fs.rm(filePath, { force: true });
  await fs.rm(thumbnailPath, { force: true });
}

/** Équivalent de `deleteEventFiles` : supprime le dossier de l'événement. */
export async function deleteEventDirectory(eventId: string): Promise<void> {
  await fs.rm(path.join(config.uploadDir, eventId), { recursive: true, force: true });
}

/** Équivalent de `getFilePath`. */
export function getFilePath(eventId: string, filename: string): string {
  return path.join(config.uploadDir, eventId, filename);
}

/** Équivalent de `getThumbnailPath`. */
export function getThumbnailPath(eventId: string, filename: string): string {
  return path.join(config.uploadDir, eventId, thumbnailName(filename));
}

/** Le fichier existe et est lisible (équivalent de `resource.exists() && isReadable()`). */
export async function isReadableFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) return false;
    await fs.access(filePath, fsConstants.R_OK);
    return true;
  } catch {
    return false;
  }
}
