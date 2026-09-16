import { env, envNumber, resolveFromRoot } from '../common';

/** Types MIME acceptés — valeur par défaut identique à `app.file.allowed-types`. */
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'audio/mpeg',
].join(',');

/** Équivalent de `application.yml` / `application-local.yml` du service Spring ms-event. */
export const config = {
  serviceName: 'ms-event',
  /** server.port: 8081 */
  port: envNumber('MS_EVENT_PORT', 8081),
  /** spring.data.mongodb.uri */
  mongoUri: env('SPRING_DATA_MONGODB_URI', env('MONGODB_URI', 'mongodb://localhost:27017/db_rdh')),
  /** app.file.upload-dir */
  uploadDir: resolveFromRoot(env('APP_FILE_UPLOAD_DIR', 'uploads/events')),
  /** app.file.max-size (10 Mo) */
  maxFileSize: envNumber('APP_FILE_MAX_SIZE', 10_485_760),
  /**
   * app.file.allowed-types — conservé sous forme de chaîne car le code Java
   * testait l'appartenance avec `allowedTypes.contains(contentType)`.
   */
  allowedTypes: env('APP_FILE_ALLOWED_TYPES', DEFAULT_ALLOWED_TYPES),
  /** Clé secrète du compte Stripe principal de la plateforme. Vide en local sans .env. */
  stripeSecretKey: env('STRIPE_SECRET_KEY', ''),
  /** Secret de signature du webhook Stripe (`whsec_...`), pour vérifier `Stripe-Signature`. */
  stripeWebhookSecret: env('STRIPE_WEBHOOK_SECRET', ''),
  /** URL du site web, pour les `success_url`/`cancel_url` des Checkout Sessions. */
  webBaseUrl: env('WEB_BASE_URL', 'http://localhost:4200'),
} as const;
