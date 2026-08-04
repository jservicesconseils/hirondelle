import { Schema, model } from 'mongoose';

export const EVENT_FEEDBACK_CLASS = 'com.roseedhermon.msevent.entity.EventFeedbackEntity';

/** Reprend `EventFeedbackEntity` (@Document(collection = "event_feedback")). */
const eventFeedbackSchema = new Schema(
  {
    _id: { type: Schema.Types.Mixed },
    eventId: String,
    userId: String,
    comment: String,
    _class: { type: String, default: EVENT_FEEDBACK_CLASS },
  },
  {
    collection: 'event_feedback',
    versionKey: false,
    minimize: false,
  },
);

export const EventFeedbackModel = model('EventFeedback', eventFeedbackSchema);

/** Dérivé du modèle pour rester strictement identique au type renvoyé par les requêtes. */
export type EventFeedbackDocument = ReturnType<(typeof EventFeedbackModel)['hydrate']>;
