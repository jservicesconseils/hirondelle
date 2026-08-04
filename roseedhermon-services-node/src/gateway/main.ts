import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from './config';

const app = express();
app.disable('x-powered-by');

// Même politique que la `CorsConfig` des deux services Spring.
app.use(cors({ origin: '*', methods: '*', allowedHeaders: '*' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'UP',
    service: config.serviceName,
    routes: {
      '/api/v1/members': config.memberTarget,
      '/api/v1/groups': config.memberTarget,
      '*': config.eventTarget,
    },
  });
});

const proxyOptions = {
  changeOrigin: true,
  // Aucun body-parser n'est monté avant : les requêtes (JSON comme multipart)
  // sont relayées telles quelles, en streaming.
  xfwd: true,
} as const;

const MEMBER_PREFIXES = ['/api/v1/members', '/api/v1/groups'];

/** `true` pour `/api/v1/members`, `/api/v1/members/...`, mais pas `/api/v1/membersXYZ`. */
const isMemberPath = (pathname: string): boolean =>
  MEMBER_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

// Les deux proxys sont montés sur la racine et filtrent eux-mêmes : monter sur
// `/api/v1/members` ferait tronquer le préfixe par Express, et ms-member le
// recevrait sans son chemin de base.
const memberProxy = createProxyMiddleware({
  target: config.memberTarget,
  pathFilter: (pathname) => isMemberPath(pathname),
  ...proxyOptions,
});

// Tout le reste (`/api/v1/events`, `/api/v1/files`, `/api/v1/registrations`,
// `/api/v1/feedback`, `/api/v1/admin`) part vers ms-event.
const eventProxy = createProxyMiddleware({
  target: config.eventTarget,
  pathFilter: (pathname) => !isMemberPath(pathname),
  ...proxyOptions,
});

app.use(memberProxy);
app.use(eventProxy);

const server = app.listen(config.port, () => {
  console.log(`[${config.serviceName}] à l'écoute sur http://localhost:${config.port}`);
  console.log(`[${config.serviceName}]   /api/v1/members, /api/v1/groups -> ${config.memberTarget}`);
  console.log(`[${config.serviceName}]   reste                            -> ${config.eventTarget}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[${config.serviceName}] Le port ${config.port} est déjà utilisé.`);
  } else {
    console.error(`[${config.serviceName}] Erreur serveur :`, err.message);
  }
  process.exit(1);
});

const shutdown = (signal: string) => {
  console.log(`[${config.serviceName}] ${signal} reçu, arrêt en cours...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
