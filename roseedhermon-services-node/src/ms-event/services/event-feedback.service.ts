import { runtimeError, springIdFilter, toSpringId, toStringOrNull, withoutNulls } from '../../common';
import {
  EVENT_FEEDBACK_CLASS,
  EventFeedbackModel,
  type EventFeedbackDocument,
} from '../models/event-feedback.model';

/** Reprend `EventFeedbackDTO`. */
export interface EventFeedbackInput {
  id: string | null;
  eventId: string | null;
  userId: string | null;
  comment: string | null;
}

export function feedbackFromBody(body: unknown): EventFeedbackInput {
  const source = (body ?? {}) as Record<string, unknown>;
  return {
    id: toStringOrNull(source.id),
    eventId: toStringOrNull(source.eventId),
    userId: toStringOrNull(source.userId),
    comment: toStringOrNull(source.comment),
  };
}

export function feedbackToJson(document: EventFeedbackDocument): Record<string, unknown> {
  const raw = document.toObject() as Record<string, unknown>;
  return {
    id: String(raw._id),
    eventId: toStringOrNull(raw.eventId),
    userId: toStringOrNull(raw.userId),
    comment: toStringOrNull(raw.comment),
  };
}

/** Équivalent de `submitFeedback`. */
export async function submitFeedback(input: EventFeedbackInput): Promise<Record<string, unknown>> {
  const document = withoutNulls({
    eventId: input.eventId,
    userId: input.userId,
    comment: input.comment,
    _class: EVENT_FEEDBACK_CLASS,
  });

  if (input.id === null) {
    const created = await EventFeedbackModel.create({ _id: toSpringId(null), ...document });
    return feedbackToJson(created);
  }

  const replaced = await EventFeedbackModel.findOneAndReplace(
    springIdFilter(input.id),
    { _id: toSpringId(input.id), ...document },
    { upsert: true, returnDocument: 'after' },
  ).exec();

  if (replaced === null) {
    throw runtimeError(`Échec de l'enregistrement de l'avis ${input.id}`);
  }
  return feedbackToJson(replaced);
}

/** Équivalent de `getFeedbackByEventId`. */
export async function getFeedbackByEventId(eventId: string): Promise<Record<string, unknown>[]> {
  const feedback = await EventFeedbackModel.find({ eventId }).exec();
  return feedback.map((entry) => feedbackToJson(entry));
}
