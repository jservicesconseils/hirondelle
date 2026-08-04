import { env, envNumber } from '../common';

/**
 * Passerelle HTTP sur le port 8080.
 *
 * Le client Angular n'utilise pas une base d'URL unique :
 *  - `members.service.ts` lit `environment.dev.memberHost` → http://localhost:8080
 *  - `eventFileController.service.ts` lit `environment.local.host` → http://localhost:8081
 *  - `events.service.ts` et `event-image.service.ts` codent http://localhost:8081 en dur
 *
 * Le port 8080 doit donc répondre pour les membres et les groupes. On y expose aussi
 * les routes d'événements afin que les deux bases d'URL soient interchangeables et
 * qu'aucun fichier du front n'ait à être modifié.
 */
export const config = {
  serviceName: 'gateway',
  port: envNumber('GATEWAY_PORT', 8080),
  memberTarget: env('MS_MEMBER_URL', `http://localhost:${envNumber('MS_MEMBER_PORT', 8082)}`),
  eventTarget: env('MS_EVENT_URL', `http://localhost:${envNumber('MS_EVENT_PORT', 8081)}`),
} as const;
