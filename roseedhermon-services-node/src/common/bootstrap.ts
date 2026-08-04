import type { Express } from 'express';
import { connectMongo, disconnectMongo } from './mongo';

export interface BootstrapOptions {
  serviceName: string;
  app: Express;
  port: number;
  mongoUri: string;
  /** Exécuté après la connexion MongoDB, avant l'ouverture du port. */
  onReady?: () => Promise<void> | void;
}

/**
 * Démarre un service : MongoDB d'abord (comme Spring Boot qui échoue au
 * démarrage si la base est injoignable), puis le serveur HTTP.
 */
export async function bootstrap({ serviceName, app, port, mongoUri, onReady }: BootstrapOptions): Promise<void> {
  try {
    await connectMongo({ uri: mongoUri, serviceName });
    if (onReady) await onReady();
  } catch (err) {
    console.error(`[${serviceName}] Démarrage impossible :`, err instanceof Error ? err.message : err);
    process.exit(1);
  }

  const server = app.listen(port, () => {
    console.log(`[${serviceName}] à l'écoute sur http://localhost:${port}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[${serviceName}] Le port ${port} est déjà utilisé (l'ancien service Spring tourne peut-être encore).`);
    } else {
      console.error(`[${serviceName}] Erreur serveur :`, err.message);
    }
    process.exit(1);
  });

  const shutdown = (signal: string) => {
    console.log(`[${serviceName}] ${signal} reçu, arrêt en cours...`);
    server.close(() => {
      void disconnectMongo().finally(() => process.exit(0));
    });
    // Filet de sécurité si des connexions restent ouvertes
    setTimeout(() => process.exit(0), 5_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
