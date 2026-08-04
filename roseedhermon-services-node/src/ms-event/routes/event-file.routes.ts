import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { asyncHandler, emptyResponse, toStringOrNull } from '../../common';
import { config } from '../config';
import { eventFileFromBody, eventFileToJson } from '../mappers/event-file.mapper';
import { FILE_TYPES, type FileType } from '../models/event-file.model';
import {
  createEventFile,
  deleteEventFile,
  deleteEventFiles,
  getEventFiles,
  getEventFilesByType,
  getEventPresentationPhotos,
  getMainPhoto,
  setMainPhoto,
  updateEventFile,
} from '../services/event-file.service';
import { storeFile, type UploadedFile } from '../services/file-storage.service';

/**
 * Routes de `EventFileController`, montées sur `/api/v1/events/:eventId/files`.
 * `mergeParams` rend `:eventId` accessible depuis ce routeur.
 */
export const eventFileRouter = Router({ mergeParams: true });

const upload = multer({
  // Comme en Java, la validation précède l'écriture sur disque : on garde donc le
  // fichier en mémoire jusqu'à ce que `storeFile` l'ait accepté.
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize, files: 20 },
});

/**
 * Enveloppe multer pour reproduire les `catch` du contrôleur Java : toute erreur de
 * lecture du multipart (taille dépassée, champ inattendu…) donne un 400 sans corps.
 */
function handleMultipart(
  middleware: (req: Request, res: Response, next: (err?: unknown) => void) => void,
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    middleware(req, res, (err?: unknown) => {
      if (err !== undefined && err !== null) {
        console.warn(`[${config.serviceName}] multipart refusé : ${(err as Error).message}`);
        emptyResponse.badRequest(res);
        return;
      }
      handler(req, res, next).catch(next);
    });
  };
}

function toUploadedFile(file: Express.Multer.File): UploadedFile {
  return {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  };
}

eventFileRouter.post(
  '/upload',
  handleMultipart(upload.single('file'), async (req, res) => {
    const eventId = String(req.params.eventId ?? '');
    const file = req.file;

    if (file === undefined || file.size === 0) {
      emptyResponse.badRequest(res);
      return;
    }
    if (eventId.trim() === '') {
      emptyResponse.badRequest(res);
      return;
    }

    const description = toStringOrNull((req.body as Record<string, unknown> | undefined)?.description);

    try {
      const stored = await storeFile(toUploadedFile(file), eventId, description);
      const created = await createEventFile(stored);
      res.json(created);
    } catch (error) {
      // `catch (IOException)` -> 400 sans corps ; `catch (Exception)` -> 500 sans corps.
      const status = (error as { status?: number }).status === 400 ? 400 : 500;
      console.error(`[${config.serviceName}] upload échoué : ${(error as Error).message}`);
      if (status === 400) emptyResponse.badRequest(res);
      else emptyResponse.serverError(res);
    }
  }),
);

eventFileRouter.post(
  '/upload-multiple',
  handleMultipart(upload.array('files'), async (req, res) => {
    const eventId = String(req.params.eventId ?? '');
    const files = Array.isArray(req.files) ? req.files : [];
    const rawDescriptions = (req.body as Record<string, unknown> | undefined)?.descriptions;
    const descriptions = Array.isArray(rawDescriptions)
      ? rawDescriptions.map((value) => String(value))
      : rawDescriptions === undefined || rawDescriptions === null
        ? null
        : [String(rawDescriptions)];

    const created: Record<string, unknown>[] = [];
    try {
      for (let index = 0; index < files.length; index += 1) {
        const description = descriptions !== null && index < descriptions.length ? descriptions[index] : '';
        const stored = await storeFile(toUploadedFile(files[index]), eventId, description);
        created.push(await createEventFile(stored));
      }
      res.json(created);
    } catch (error) {
      console.error(`[${config.serviceName}] upload multiple échoué : ${(error as Error).message}`);
      // `catch (IOException)` -> `ResponseEntity.badRequest().build()`
      emptyResponse.badRequest(res);
    }
  }),
);

eventFileRouter.get(
  '/type/:fileType',
  asyncHandler(async (req, res) => {
    const eventId = String(req.params.eventId);
    const fileType = String(req.params.fileType);
    if (!(FILE_TYPES as readonly string[]).includes(fileType)) {
      // Spring refusait une valeur d'énumération inconnue avec un HTTP 400.
      res.status(400).json({
        timestamp: new Date().toISOString().replace('Z', '+00:00'),
        status: 400,
        error: 'Bad Request',
        path: req.originalUrl,
      });
      return;
    }
    res.json(await getEventFilesByType(eventId, fileType as FileType));
  }),
);

eventFileRouter.get(
  '/photos',
  asyncHandler(async (req, res) => {
    res.json(await getEventPresentationPhotos(String(req.params.eventId)));
  }),
);

eventFileRouter.get(
  '/main-photo',
  asyncHandler(async (req, res) => {
    const mainPhoto = await getMainPhoto(String(req.params.eventId));
    if (mainPhoto === null) {
      emptyResponse.notFound(res);
      return;
    }
    res.json(mainPhoto);
  }),
);

eventFileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await getEventFiles(String(req.params.eventId)));
  }),
);

eventFileRouter.put(
  '/:fileId/set-main-photo',
  asyncHandler(async (req, res) => {
    res.json(await setMainPhoto(String(req.params.fileId)));
  }),
);

eventFileRouter.put(
  '/:fileId',
  asyncHandler(async (req, res) => {
    const input = eventFileFromBody(req.body);
    // `fileDTO.setEventId(eventId)` avant l'appel au service.
    input.eventId = String(req.params.eventId);
    res.json(await updateEventFile(String(req.params.fileId), input));
  }),
);

eventFileRouter.delete(
  '/:fileId',
  asyncHandler(async (req, res) => {
    await deleteEventFile(String(req.params.fileId));
    emptyResponse.noContent(res);
  }),
);

eventFileRouter.delete(
  '/',
  asyncHandler(async (req, res) => {
    await deleteEventFiles(String(req.params.eventId));
    emptyResponse.noContent(res);
  }),
);

/** Réexporté pour les tests manuels : mise en forme identique à celle du contrôleur. */
export { eventFileToJson };
