import { Router } from 'express';
import { asyncHandler } from '../../common';
import { feedbackFromBody, getFeedbackByEventId, submitFeedback } from '../services/event-feedback.service';

/** Routes de `EventFeedbackController`, montées sur `/api/v1/feedback`. */
export const feedbackRouter = Router();

feedbackRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await submitFeedback(feedbackFromBody(req.body)));
  }),
);

feedbackRouter.get(
  '/:eventId',
  asyncHandler(async (req, res) => {
    res.json(await getFeedbackByEventId(String(req.params.eventId)));
  }),
);
