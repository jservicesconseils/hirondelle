/**
 * Couche de compatibilité avec la sérialisation Java (Jackson + Spring Data MongoDB).
 *
 * Deux conversions distinctes existaient côté Spring et doivent être préservées :
 *  - MongoDB <-> Java  : Spring Data convertit `Date` (BSON) <-> `LocalDate`/`LocalDateTime`
 *                        en utilisant le fuseau horaire système (ZoneId.systemDefault()).
 *  - Java <-> JSON     : Jackson sérialise `LocalDate` en "YYYY-MM-DD" et `LocalDateTime`
 *                        en "YYYY-MM-DDTHH:mm:ss[.SSS]" (sans fuseau, millisecondes omises si nulles).
 *
 * On reproduit donc volontairement les composantes de date en heure LOCALE, et non en UTC.
 */

function pad(value: number, width = 2): string {
  return String(value).padStart(width, '0');
}

/** Équivalent Jackson de `LocalDate` : "YYYY-MM-DD" (composantes locales). */
export function formatLocalDate(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.length > 10 ? value.slice(0, 10) : value;
  if (Number.isNaN(value.getTime())) return null;
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

/** Équivalent Jackson de `LocalDateTime` : "YYYY-MM-DDTHH:mm:ss[.SSS]" (composantes locales). */
export function formatLocalDateTime(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (Number.isNaN(value.getTime())) return null;
  const base =
    `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` +
    `T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  const ms = value.getMilliseconds();
  return ms === 0 ? base : `${base}.${pad(ms, 3)}`;
}

/**
 * Inverse de `formatLocalDate` : "YYYY-MM-DD" -> `Date` à minuit LOCAL,
 * ce que faisait `LocalDate.atStartOfDay(ZoneId.systemDefault())` côté Spring.
 */
export function parseLocalDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const [, y, m, d] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Inverse de `formatLocalDateTime` : accepte une chaîne ISO locale ou une `Date`. */
export function parseLocalDateTime(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== 'string') return null;

  // "2025-08-29T14:03:22.123" est interprété en heure locale par le moteur JS
  // (pas de suffixe de fuseau), ce qui correspond au comportement de LocalDateTime.
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Équivalent d'un `BigDecimal` Java sérialisé par Jackson : un nombre JSON.
 * Tolère les formes de stockage possibles (number, string, Decimal128).
 */
export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  // Decimal128 / BSON : possède un toString() numérique
  const parsed = Number(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Équivalent d'un `int`/`long` Java : jamais null, 0 par défaut (primitives Java). */
export function toPrimitiveNumber(value: unknown, fallback = 0): number {
  const parsed = toNumberOrNull(value);
  return parsed === null ? fallback : parsed;
}

/** Équivalent d'un `boolean` Java (primitif) : jamais null, false par défaut. */
export function toPrimitiveBoolean(value: unknown, fallback = false): boolean {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

/**
 * Lit la première clé présente dans l'objet.
 *
 * Utile car Lombok génère `setFree()` ET le code ajoutait `setIsFree()` : Jackson acceptait
 * donc `free` comme `isFree` en entrée. On garde cette tolérance.
 */
export function pickAny(source: Record<string, unknown> | null | undefined, ...names: string[]): unknown {
  if (!source) return undefined;
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(source, name) && source[name] !== undefined) {
      return source[name];
    }
  }
  return undefined;
}

/** Normalise une valeur en `string | null` (les champs `String` Java sont nullables). */
export function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return String(value);
}
