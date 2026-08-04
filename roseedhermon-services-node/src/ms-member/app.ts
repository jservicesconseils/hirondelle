import type { Express } from 'express';
import { createBaseApp, errorHandler, notFoundHandler } from '../common';
import { config } from './config';
import { groupRouter } from './routes/group.routes';
import { memberRouter } from './routes/member.routes';

export function createApp(): Express {
  const app = createBaseApp();

  app.get('/health', (_req, res) => {
    res.json({ status: 'UP', service: config.serviceName });
  });

  app.use('/api/v1/members', memberRouter);
  app.use('/api/v1/groups', groupRouter);

  app.use(notFoundHandler);
  app.use(errorHandler(config.serviceName));

  return app;
}
