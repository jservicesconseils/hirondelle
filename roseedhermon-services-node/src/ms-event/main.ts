import { bootstrap } from '../common';
import { createApp } from './app';
import { config } from './config';
import { initUploadDir } from './services/file-storage.service';

void bootstrap({
  serviceName: config.serviceName,
  app: createApp(),
  port: config.port,
  mongoUri: config.mongoUri,
  // Équivalent du `@PostConstruct` de `FileStorageService`.
  onReady: initUploadDir,
});
