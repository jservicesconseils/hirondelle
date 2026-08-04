import { Router } from 'express';
import { asyncHandler, emptyResponse } from '../../common';
import { createEventWithPhotosFromBody, eventFromBody } from '../mappers/event.mapper';
import {
  createEvent,
  createEventWithPhotos,
  deleteEvent,
  getAllEvents,
  getAllEventsWithFiles,
  getEvent,
  updateEvent,
} from '../services/event.service';
import { feedbackFromBody, getFeedbackByEventId, submitFeedback } from '../services/event-feedback.service';
import { registerForEvent, registrationFromBody } from '../services/event-registration.service';

/** Routes de `EventController`, montées sur `/api/v1/events`. */
export const eventRouter = Router();

// Les chemins littéraux sont déclarés avant `/:id`, comme le fait la résolution Spring.
eventRouter.get(
  '/with-files',
  asyncHandler(async (_req, res) => {
    res.json(await getAllEventsWithFiles());
  }),
);

eventRouter.post(
  '/with-photos',
  asyncHandler(async (req, res) => {
    res.json(await createEventWithPhotos(createEventWithPhotosFromBody(req.body)));
  }),
);

/**
 * Alias attendus par le client Angular.
 *
 * `EventService` (front) appelle `/api/v1/events/registrations`, `/api/v1/events/feedback`
 * et `/api/v1/events/{id}/feedback`, alors que les contrôleurs Java exposaient
 * `/api/v1/registrations` et `/api/v1/feedback`. Ces trois routes renvoyaient donc une
 * erreur ; on les branche sur les mêmes services pour que le front fonctionne, sans
 * retirer les chemins d'origine.
 */
eventRouter.post(
  '/registrations',
  asyncHandler(async (req, res) => {
    res.json(await registerForEvent(registrationFromBody(req.body)));
  }),
);

eventRouter.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    res.json(await submitFeedback(feedbackFromBody(req.body)));
  }),
);

eventRouter.get(
  '/:eventId/feedback',
  asyncHandler(async (req, res) => {
    res.json(await getFeedbackByEventId(String(req.params.eventId)));
  }),
);

eventRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await createEvent(eventFromBody(req.body)));
  }),
);

eventRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await getAllEvents());
  }),
);

eventRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getEvent(String(req.params.id)));
  }),
);

eventRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await updateEvent(String(req.params.id), eventFromBody(req.body)));
  }),
);

eventRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteEvent(String(req.params.id));
    emptyResponse.noContent(res);
  }),
);
