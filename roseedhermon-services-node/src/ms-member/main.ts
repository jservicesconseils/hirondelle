import { bootstrap } from '../common';
import { createApp } from './app';
import { config } from './config';

void bootstrap({
  serviceName: config.serviceName,
  app: createApp(),
  port: config.port,
  mongoUri: config.mongoUri,
});
