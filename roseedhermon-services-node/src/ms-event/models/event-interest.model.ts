import { Schema, model } from 'mongoose';

export const EVENT_INTEREST_CLASS = 'com.roseedhermon.msevent.entity.EventInterestEntity';

/**
 * Marque d'intérêt portée sur un événement — « je suis intéressé », sans réserver
 * de place.
 *
 * Collection **nouvelle** : les services Java d'origine ne la connaissent pas et
 * l'ignoreront simplement s'ils sont redémarrés sur la même base. Elle suit
 * néanmoins les conventions Spring Data des autres collections (`_id` libre,
 * `_class`) pour qu'une reprise côté Java n'ait rien à migrer.
 *
 * Le couple (`eventId`, `email`) sert de clé de dédoublonnage : une personne ne
 * compte qu'une fois, quel que soit le nombre de fois où elle clique.
 */
const eventInterestSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    eventId: String,
    /** Identifiant de fiche membre, quand une session est ouverte. */
    userId: String,
    /** Clé de rapprochement, toujours en minuscules. */
    email: String,
    firstName: String,
    lastName: String,
    /** Groupe organisateur, recopié depuis l'événement pour filtrer sans jointure. */
    groupId: String,
    createdAt: Date,

    _class: { type: String, default: EVENT_INTEREST_CLASS },
  },
  {
    collection: 'event_interest',
    versionKey: false,
    minimize: false,
  },
);

// Une seule marque par personne et par événement, garantie par la base et non
// seulement par la lecture qui précède l'écriture.
eventInterestSchema.index({ eventId: 1, email: 1 }, { unique: true, sparse: true });

export const EventInterestModel = model('EventInterest', eventInterestSchema);

/** Dérivé du modèle pour rester strictement identique au type renvoyé par les requêtes. */
export type EventInterestDocument = ReturnType<(typeof EventInterestModel)['hydrate']>;
