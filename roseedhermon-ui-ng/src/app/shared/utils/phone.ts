/**
 * Format E.164 attendu par Cognito et par le serveur ; `null` si le numéro
 * reste inexploitable. Partagé entre la connexion par téléphone et le profil.
 */
export function toE164(value: string): string | null {
  if (!value) return null;
  if (value.startsWith('+')) {
    const digits = value.slice(1).replace(/\D/g, '');
    return digits.length >= 8 ? `+${digits}` : null;
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8) return null;
  // Dix chiffres : numéro nord-américain sans indicatif.
  return digits.length === 10 ? `+1${digits}` : `+${digits}`;
}
