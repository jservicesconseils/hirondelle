import type { Express } from 'express';
import { attachAuth, attachGroupFeatures, createBaseApp, errorHandler, notFoundHandler } from '../common';
import { config } from './config';
import { adminRouter } from './routes/admin.routes';
import { eventFileRouter } from './routes/event-file.routes';
import { eventRouter } from './routes/event.routes';
import { feedbackRouter } from './routes/feedback.routes';
import { fileRouter } from './routes/file.routes';
import { registrationRouter } from './routes/registration.routes';

export function createApp(): Express {
  const app = createBaseApp();

  // L'identité est attachée à toute requête ; ce sont les routes qui exigent un rôle.
  app.use(attachAuth);
  // Puis les modules ouverts à son groupe, que les règles de visibilité lisent.
  app.use(attachGroupFeatures);

  app.get('/health', (_req, res) => {
    res.json({ status: 'UP', service: config.serviceName });
  });

  // Monté avant `/api/v1/events` : `/events/:id` ne capture qu'un seul segment, mais
  // l'ordre rend l'intention explicite.
  app.use('/api/v1/events/:eventId/files', eventFileRouter);
  app.use('/api/v1/events', eventRouter);
  app.use('/api/v1/files', fileRouter);
  app.use('/api/v1/registrations', registrationRouter);
  app.use('/api/v1/feedback', feedbackRouter);
  app.use('/api/v1/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler(config.serviceName));

  return app;
}
