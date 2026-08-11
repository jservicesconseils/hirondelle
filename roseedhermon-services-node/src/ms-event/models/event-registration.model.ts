import { Schema, model } from 'mongoose';

export const EVENT_REGISTRATION_CLASS = 'com.roseedhermon.msevent.entity.EventRegistrationEntity';

/**
 * Reprend `EventRegistrationEntity` (@Document(collection = "event_registration")).
 *
 * Les champs ajoutés après la reprise du service Java — coordonnées du participant,
 * nombre de places, date de création — sont **additifs** : Spring Data ignore les
 * propriétés qu'il ne connaît pas, les services d'origine peuvent donc être
 * redémarrés sur la même base sans migration.
 *
 * Aucune donnée de carte bancaire n'est stockée ici, et ne doit jamais l'être.
 */
const eventRegistrationSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    eventId: String,
    userId: String,
    /** ex: registered, canceled, pending */
    status: String,

    // --- Participant -------------------------------------------------------------
    firstName: String,
    lastName: String,
    email: String,
    phoneNumber: String,
    /** Nombre de places demandées ; au moins une. */
    seats: Number,
    /** Remarque libre laissée à l'organisateur. */
    note: String,

    // --- Traçabilité -------------------------------------------------------------
    /** Groupe organisateur, recopié depuis l'événement pour filtrer sans jointure. */
    groupId: String,
    createdAt: Date,

    _class: { type: String, default: EVENT_REGISTRATION_CLASS },
  },
  {
    collection: 'event_registration',
    versionKey: false,
    minimize: false,
  },
);

export const EventRegistrationModel = model('EventRegistration', eventRegistrationSchema);

/** Dérivé du modèle pour rester strictement identique au type renvoyé par les requêtes. */
export type EventRegistrationDocument = ReturnType<(typeof EventRegistrationModel)['hydrate']>;
