import { Router } from 'express';
import { asyncHandler, emptyResponse } from '../../common';
import {
  cancelRegistration,
  getRegistrationStatus,
  registerForEvent,
  registrationFromBody,
} from '../services/event-registration.service';

/** Routes de `EventRegistrationController`, montées sur `/api/v1/registrations`. */
export const registrationRouter = Router();

registrationRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await registerForEvent(registrationFromBody(req.body)));
  }),
);

registrationRouter.get(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const status = await getRegistrationStatus(String(req.params.id));
    // `ResponseEntity<String>` passait par le StringHttpMessageConverter : le corps est
    // le texte brut, pas une chaîne JSON.
    res.type('text/plain; charset=utf-8').send(status);
  }),
);

registrationRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await cancelRegistration(String(req.params.id));
    emptyResponse.noContent(res);
  }),
);
