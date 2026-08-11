import type { Express } from 'express';
import { attachAuth, attachGroupFeatures, createBaseApp, errorHandler, notFoundHandler } from '../common';
import { config } from './config';
import { groupRouter } from './routes/group.routes';
import { memberRouter } from './routes/member.routes';
import { meRouter } from './routes/me.routes';

export function createApp(): Express {
  const app = createBaseApp();

  // L'identité est attachée à toute requête ; ce sont les routes qui exigent un rôle.
  app.use(attachAuth);
  // Puis les modules ouverts à son groupe, que les gardes de fonctionnalité lisent.
  app.use(attachGroupFeatures);

  app.get('/health', (_req, res) => {
    res.json({ status: 'UP', service: config.serviceName });
  });

  app.use('/api/v1/members', memberRouter);
  app.use('/api/v1/groups', groupRouter);
  app.use('/api/v1/me', meRouter);

  app.use(notFoundHandler);
  app.use(errorHandler(config.serviceName));

  return app;
}
