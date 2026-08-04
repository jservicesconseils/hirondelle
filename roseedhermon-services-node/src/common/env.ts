import * as path from 'node:path';
import * as dotenv from 'dotenv';

// Charge le .env situé à la racine de roseedhermon-services-node
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** Racine du projet Node (roseedhermon-services-node), quelle que soit l'exécution (tsx ou dist). */
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

export function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

export function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Résout un chemin par rapport à la racine du projet Node s'il est relatif. */
export function resolveFromRoot(target: string): string {
  return path.isAbsolute(target) ? target : path.resolve(PROJECT_ROOT, target);
}
