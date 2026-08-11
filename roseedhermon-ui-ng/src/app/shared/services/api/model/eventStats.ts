/**
 * Chiffres de participation d'un événement, calculés par le service et réservés
 * à son organisateur.
 *
 * Ce type n'est pas généré depuis OpenAPI : il décrit une route ajoutée au
 * service Node, `GET /api/v1/events/{id}/stats`.
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
  /** Taux de remplissage ; peut dépasser 100 si la jauge a été forcée. */
  fillRate: number | null;
  /** Vrai quand l'événement porte un tarif. */
  paid: boolean;
  /** Prix unitaire d'une place, ou `null` pour un événement gratuit. */
  amount: number | null;
  /** Total encaissé : places retenues × prix. */
  totalPaid: number;
  /** Personnes ayant marqué leur intérêt, sans forcément s'inscrire. */
  interested: number;
  /** Parmi elles, celles qui ont fini par réserver, rapprochées par courriel. */
  interestedWhoRegistered: number;
}

/** Une marque d'intérêt, telle que la renvoie la liste réservée à l'organisateur. */
export interface EventInterestDTO {
  id?: string;
  eventId?: string;
  userId?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  groupId?: string | null;
  createdAt?: string | null;
}

/** Réponse des routes d'intérêt : le compteur, et si celui qui demande en fait partie. */
export interface EventInterestState {
  eventId: string;
  count: number;
  interested: boolean;
}
