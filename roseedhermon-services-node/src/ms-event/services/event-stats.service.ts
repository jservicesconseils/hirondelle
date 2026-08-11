import { getRegistrationsByEvent } from './event-registration.service';
import { getInterestsByEvent } from './event-interest.service';

/**
 * Chiffres de participation d'un événement, tels que son organisateur les
 * demande : combien de personnes inscrites, combien encaissé, combien
 * d'intéressés.
 */
export interface EventStats {
  eventId: string;
  /** Nombre de fiches d'inscription. */
  registrations: number;
  /** Nombre de personnes attendues : la somme des places demandées. */
  seats: number;
  /** Jauge annoncée, ou `null` si l'organisateur n'en a pas fixé. */
  availableSeats: number | null;
  /** Places restantes, jamais négatives ; `null` sans jauge. */
  remainingSeats: number | null;
  /** Taux de remplissage en pourcentage ; peut dépasser 100 si la jauge a été forcée. */
  fillRate: number | null;
  /** Vrai quand l'événement porte un tarif : payant, montant renseigné. */
  paid: boolean;
  /** Prix unitaire d'une place, ou `null` pour un événement gratuit. */
  amount: number | null;
  /** Total encaissé : places retenues × prix. Zéro pour un événement gratuit. */
  totalPaid: number;
  /** Nombre de personnes ayant marqué leur intérêt sans forcément s'inscrire. */
  interested: number;
  /**
   * Parmi les intéressés, ceux qui ont effectivement réservé, rapprochés par
   * courriel.
   *
   * Ce n'est pas `registrations` rapporté à `interested` : on réserve très bien
   * sans s'être déclaré intéressé, et ce rapport-là dépasserait allègrement cent
   * pour cent sans rien vouloir dire. Ici les deux ensembles sont réellement
   * croisés.
   */
  interestedWhoRegistered: number;
}

/**
 * Calcule les chiffres d'un événement à partir de ses inscriptions réelles.
 *
 * Le montant n'est jamais lu sur l'inscription : c'est le prix de l'événement qui
 * fait foi, multiplié par les places retenues. Une inscription ne porte aucune
 * donnée de paiement, et ne doit pas en porter.
 */
export async function getEventStats(
  eventId: string,
  event: Record<string, unknown>,
): Promise<EventStats> {
  const [registrations, interests] = await Promise.all([
    getRegistrationsByEvent(eventId),
    getInterestsByEvent(eventId),
  ]);

  const seats = registrations.reduce((total, registration) => total + seatsOf(registration), 0);

  // Croisement des deux listes sur le courriel : c'est la seule donnée qu'une
  // marque d'intérêt et une inscription ont en commun.
  const registeredEmails = new Set(
    registrations.map((registration) => emailOf(registration)).filter((email): email is string => email !== null),
  );
  const interestedWhoRegistered = interests.filter((interest) => {
    const email = emailOf(interest);
    return email !== null && registeredEmails.has(email);
  }).length;

  const amount = priceOf(event);
  const paid = amount !== null;

  const announced = Number(event.availableSeats ?? 0);
  const availableSeats = Number.isFinite(announced) && announced > 0 ? announced : null;

  return {
    eventId,
    registrations: registrations.length,
    seats,
    availableSeats,
    remainingSeats: availableSeats === null ? null : Math.max(0, availableSeats - seats),
    fillRate: availableSeats === null ? null : Math.round((seats / availableSeats) * 100),
    paid,
    amount,
    totalPaid: paid ? round2(seats * (amount as number)) : 0,
    interested: interests.length,
    interestedWhoRegistered,
  };
}

/** Courriel normalisé d'une inscription ou d'une marque d'intérêt. */
function emailOf(row: Record<string, unknown>): string | null {
  const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
  return email || null;
}

/** Prix unitaire retenu : `null` pour un événement gratuit ou sans tarif saisi. */
function priceOf(event: Record<string, unknown>): number | null {
  if (event.free === true || event.isFree === true) return null;
  const amount = Number(event.amount);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

/** Au moins une place : une inscription sans nombre reste une personne. */
function seatsOf(registration: Record<string, unknown>): number {
  const seats = Number(registration.seats);
  return Number.isFinite(seats) && seats > 0 ? Math.floor(seats) : 1;
}

/** Les montants s'arrêtent au cent : la multiplication en virgule flottante dérive. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
