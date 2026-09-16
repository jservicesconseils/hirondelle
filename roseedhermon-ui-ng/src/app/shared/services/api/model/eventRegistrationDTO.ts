/**
 * Inscription à un événement.
 *
 * Les champs au-delà de `status` ont été ajoutés au service Node ; ils sont
 * additifs, les services Java d'origine les ignorent à la lecture.
 */
export interface EventRegistrationDTO {
    id?: string;
    eventId?: string;
    /** Identifiant de la fiche membre, quand une session est ouverte. */
    userId?: string;
    status?: string;

    // --- Participant ---
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    /** Nombre de places demandées ; au moins une. */
    seats?: number;
    /** Remarque libre laissée à l'organisateur. */
    note?: string;

    // --- Renseignés par le serveur ---
    /** Groupe organisateur, recopié depuis l'événement. */
    groupId?: string;
    createdAt?: string;
    /**
     * Vrai quand le serveur a renvoyé une inscription déjà existante au lieu d'en
     * créer une seconde — un rechargement de la confirmation, par exemple.
     */
    alreadyRegistered?: boolean;
    /**
     * Champs additifs — paiement. `not_required` pour un événement gratuit ;
     * `pending` tant que la Checkout Session n'est pas réglée ; `paid` une
     * fois le webhook Stripe traité. Voir `web-ticket.component.ts`.
     */
    paymentStatus?: 'not_required' | 'pending' | 'paid' | 'failed';
    amountPaid?: number | null;
}
