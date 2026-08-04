import { env, envNumber } from '../common';

/** Équivalent de `application.yml` / `application-local.yml` du service Spring ms-member. */
export const config = {
  serviceName: 'ms-member',
  /** server.port: 8082 */
  port: envNumber('MS_MEMBER_PORT', 8082),
  /** spring.data.mongodb.uri */
  mongoUri: env('SPRING_DATA_MONGODB_URI', env('MONGODB_URI', 'mongodb://localhost:27017/db_rdh')),
} as const;
