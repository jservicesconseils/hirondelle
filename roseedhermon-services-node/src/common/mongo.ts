import mongoose from 'mongoose';

export interface MongoOptions {
  uri: string;
  /** Nom du service, uniquement pour les logs. */
  serviceName: string;
}

/**
 * Ouvre la connexion MongoDB partagée par le service.
 *
 * Spring Data créait les collections à la demande : Mongoose fait de même,
 * il n'y a donc aucune migration à prévoir sur une base existante.
 */
export async function connectMongo({ uri, serviceName }: MongoOptions): Promise<void> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('error', (err) => {
    console.error(`[${serviceName}] Erreur MongoDB :`, err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn(`[${serviceName}] Connexion MongoDB perdue`);
  });

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`[${serviceName}] MongoDB connecté : ${redactUri(uri)} (db: ${mongoose.connection.name})`);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.connection.close();
}

/** Masque les identifiants éventuels avant d'écrire l'URI dans les logs. */
function redactUri(uri: string): string {
  return uri.replace(/\/\/([^@/]+)@/, '//***@');
}
