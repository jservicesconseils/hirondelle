import path from 'node:path';
import { Router, type Response } from 'express';
import { PROJECT_ROOT, asyncHandler, emptyResponse } from '../../common';
import { config } from '../config';
import { extractFilenameFromPath, thumbnailName } from '../mappers/event-file.mapper';
import { getEventFiles } from '../services/event-file.service';
import { createThumbnail, isReadableFile } from '../services/file-storage.service';

/** Routes de `FileController`, montées sur `/api/v1/files`. */
export const fileRouter = Router();

/** Équivalent de `determineContentType` : uniquement les images sont reconnues. */
function determineContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Retrouve le fichier visé parmi ceux de l'événement.
 *
 * Le code Java comparait le nom demandé au nom unique (UUID) pour le téléchargement,
 * mais au nom d'origine pour le thumbnail — si bien que les URLs produites par l'API
 * (`accessUrl`, `thumbnailUrl`) et celles construites par le front (à partir de
 * `fileName`) tombaient chacune sur la mauvaise route. On accepte donc les deux noms.
 */
async function findTargetFile(
  eventId: string,
  filename: string,
): Promise<Record<string, unknown> | null> {
  const files = await getEventFiles(eventId);

  const byUniqueName = files.find(
    (file) => extractFilenameFromPath(file.filePath as string | null) === filename,
  );
  if (byUniqueName !== undefined) {
    return byUniqueName;
  }

  const byOriginalName = files.find((file) => file.fileName === filename);
  return byOriginalName ?? null;
}

/** Chemin absolu du fichier stocké (les chemins historiques peuvent être relatifs). */
function resolveStoredPath(storedFilePath: string): string {
  return path.isAbsolute(storedFilePath) ? storedFilePath : path.resolve(PROJECT_ROOT, storedFilePath);
}

function sendInline(res: Response, absolutePath: string, contentType: string, downloadName: string): void {
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
  res.sendFile(absolutePath);
}

// Déclarée avant la route de téléchargement, sinon `:filename(.*)` capturerait
// « thumbnails/xxx » (Spring donnait la priorité au chemin le plus spécifique).
fileRouter.get(
  '/events/:eventId/thumbnails/:filename(.*)',
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const filename = String(req.params.filename);

    const target = await findTargetFile(eventId, filename);
    const storedFilePath = (target?.filePath as string | null | undefined) ?? null;
    if (target === null || storedFilePath === null || storedFilePath === '') {
      emptyResponse.notFound(res);
      return;
    }

    const originalFileName = path.basename(resolveStoredPath(storedFilePath));
    const thumbnailPath = path.join(config.uploadDir, eventId, thumbnailName(originalFileName));

    if (await isReadableFile(thumbnailPath)) {
      sendInline(res, thumbnailPath, 'image/jpeg', thumbnailName(originalFileName));
      return;
    }

    // Le thumbnail est reconstruit à la demande s'il a disparu, comme en Java.
    await createThumbnail(
      resolveStoredPath(storedFilePath),
      path.join(config.uploadDir, eventId),
      originalFileName,
    );

    if (await isReadableFile(thumbnailPath)) {
      sendInline(res, thumbnailPath, 'image/jpeg', thumbnailName(originalFileName));
      return;
    }

    emptyResponse.notFound(res);
  }),
);

fileRouter.get(
  '/events/:eventId/:filename(.*)',
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const filename = String(req.params.filename);

    const target = await findTargetFile(eventId, filename);
    const storedFilePath = (target?.filePath as string | null | undefined) ?? null;
    if (target === null || storedFilePath === null || storedFilePath === '') {
      emptyResponse.notFound(res);
      return;
    }

    const absolutePath = resolveStoredPath(storedFilePath);
    if (!(await isReadableFile(absolutePath))) {
      emptyResponse.notFound(res);
      return;
    }

    const basename = path.basename(absolutePath);
    // Java déterminait le type MIME depuis le nom demandé ; on retombe sur le nom
    // réellement stocké quand le nom demandé n'a pas d'extension exploitable.
    const contentType = determineContentType(filename) === 'application/octet-stream'
      ? determineContentType(basename)
      : determineContentType(filename);

    sendInline(res, absolutePath, contentType, basename);
  }),
);
