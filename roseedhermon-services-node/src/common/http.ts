import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';

/**
 * Erreur transportant un code HTTP explicite.
 *
 * Par défaut on reste sur 500 : c'est ce que renvoyait Spring pour les
 * `RuntimeException` levées dans les services (aucun @ExceptionHandler n'était défini).
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Équivalent de `throw new RuntimeException(...)` côté Spring : aboutit à un HTTP 500. */
export function runtimeError(message: string): ApiError {
  return new ApiError(message, 500);
}

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

/** Propage les rejets de promesse vers le middleware d'erreur Express. */
export function asyncHandler(handler: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Application Express de base : CORS permissif et corps JSON large,
 * comme la `CorsConfig` et la configuration multipart des deux services Spring.
 */
export function createBaseApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  // CorsConfig Java : addAllowedOrigin("*"), addAllowedMethod("*"), addAllowedHeader("*")
  app.use(cors({ origin: '*', methods: '*', allowedHeaders: '*' }));

  // Spring acceptait des requêtes multipart jusqu'à 50 Mo : on aligne le JSON
  // pour que `POST /events/with-photos` (photos encodées) passe aussi.
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  return app;
}

/** Corps d'erreur par défaut de Spring Boot (`server.error.include-message=never`). */
function springErrorBody(status: number, error: string, path: string) {
  return {
    timestamp: new Date().toISOString().replace('Z', '+00:00'),
    status,
    error,
    path,
  };
}

const REASON_PHRASES: Record<number, string> = {
  400: 'Bad Request',
  404: 'Not Found',
  405: 'Method Not Allowed',
  413: 'Payload Too Large',
  415: 'Unsupported Media Type',
  500: 'Internal Server Error',
};

/** 404 pour une route inconnue, au format d'erreur Spring Boot. */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(springErrorBody(404, 'Not Found', req.originalUrl));
}

export function errorHandler(serviceName: string) {
  return (err: unknown, req: Request, res: Response, next: NextFunction): void => {
    if (res.headersSent) {
      next(err);
      return;
    }

    const status = err instanceof ApiError ? err.status : mapUnknownErrorStatus(err);
    const message = err instanceof Error ? err.message : String(err);

    if (status >= 500) {
      console.error(`[${serviceName}] ${req.method} ${req.originalUrl} -> ${status} : ${message}`);
      if (err instanceof Error && err.stack) console.error(err.stack);
    } else {
      console.warn(`[${serviceName}] ${req.method} ${req.originalUrl} -> ${status} : ${message}`);
    }

    res.status(status).json(springErrorBody(status, REASON_PHRASES[status] ?? 'Error', req.originalUrl));
  };
}

function mapUnknownErrorStatus(err: unknown): number {
  const code = (err as { code?: string } | null)?.code;
  // Erreurs Multer (taille dépassée, champ inattendu…) : Spring répondait 400.
  if (typeof code === 'string' && code.startsWith('LIMIT_')) return 400;
  if (err instanceof SyntaxError && 'body' in (err as object)) return 400;
  return 500;
}

/**
 * Réponses vides, identiques à celles produites par `ResponseEntity` :
 *  - noContent() -> 204 sans corps
 *  - notFound()  -> 404 sans corps
 *  - badRequest().body(null) -> 400 sans corps
 */
export const emptyResponse = {
  noContent: (res: Response) => res.status(204).end(),
  notFound: (res: Response) => res.status(404).end(),
  badRequest: (res: Response) => res.status(400).end(),
  serverError: (res: Response) => res.status(500).end(),
};
