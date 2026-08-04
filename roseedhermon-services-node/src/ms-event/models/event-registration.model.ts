import { Schema, model } from 'mongoose';

export const EVENT_REGISTRATION_CLASS = 'com.roseedhermon.msevent.entity.EventRegistrationEntity';

/** Reprend `EventRegistrationEntity` (@Document(collection = "event_registration")). */
const eventRegistrationSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    eventId: String,
    userId: String,
    /** ex: registered, canceled, pending */
    status: String,
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
