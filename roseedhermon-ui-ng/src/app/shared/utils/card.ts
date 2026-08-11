/**
 * Validation et mise en forme d'une carte bancaire, côté saisie uniquement.
 *
 * Rien ici ne débite quoi que ce soit : aucune passerelle de paiement n'est
 * branchée. Ces contrôles évitent seulement de laisser passer un numéro
 * manifestement faux.
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'unknown';

/** Groupe les chiffres par quatre, en s'arrêtant à 19 — la longueur maximale. */
export function formatCardNumber(value: string): string {
  const digits = onlyDigits(value).slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Insère la barre oblique après le mois : « 1226 » devient « 12/26 ». */
export function formatExpiry(value: string): string {
  const digits = onlyDigits(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function formatCvc(value: string): string {
  return onlyDigits(value).slice(0, 4);
}

export function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/** Réseau déduit des premiers chiffres, comme le font les formulaires de paiement. */
export function detectBrand(cardNumber: string): CardBrand {
  const digits = onlyDigits(cardNumber);
  if (/^4/.test(digits)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'unknown';
}

export function brandLabel(brand: CardBrand): string {
  switch (brand) {
    case 'visa':
      return 'Visa';
    case 'mastercard':
      return 'Mastercard';
    case 'amex':
      return 'Amex';
    default:
      return 'Carte';
  }
}

/** Numéro masqué pour l'aperçu de la carte : les chiffres saisis, puis des points. */
export function maskedNumber(cardNumber: string): string {
  const groups = ['••••', '••••', '••••', '••••'];
  const typed = formatCardNumber(cardNumber).split(' ').filter(Boolean);
  typed.forEach((group, index) => {
    if (index < 4) groups[index] = group.padEnd(4, '•');
  });
  return groups.join(' ');
}

export function cardNumberValid(cardNumber: string): boolean {
  const digits = onlyDigits(cardNumber);
  return digits.length >= 13 && digits.length <= 19 && luhn(digits);
}

/** Valide jusqu'au dernier jour du mois indiqué. */
export function expiryValid(expiry: string): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return false;

  const month = Number(match[1]);
  if (month < 1 || month > 12) return false;

  const endOfMonth = new Date(2000 + Number(match[2]), month, 0, 23, 59, 59);
  return endOfMonth.getTime() >= Date.now();
}

export function cvcValid(cvc: string, brand: CardBrand): boolean {
  return cvc.length === (brand === 'amex' ? 4 : 3);
}

/** Somme de contrôle de Luhn, celle qu'utilisent tous les réseaux de cartes. */
export function luhn(digits: string): boolean {
  let sum = 0;
  let double = false;

  for (let index = digits.length - 1; index >= 0; index--) {
    let value = Number(digits[index]);
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }

  return sum % 10 === 0;
}
