import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

/**
 * Joint l'identité aux appels vers notre API — et à eux seuls : l'envoyer à
 * Nominatim ou à un autre service tiers exposerait l'utilisateur sans raison.
 *
 * Avec Cognito : le jeton d'identité. Sans Cognito : les en-têtes `X-Dev-*` de la
 * session simulée, que le serveur n'écoute que lorsque son pool est vide lui aussi.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  /**
   * Toutes les adresses qui sont les nôtres, pas seulement la passerelle.
   *
   * `memberHost` a longtemps visé ms-member en direct : la requête ne
   * commençait alors pas par `environment.host`, l'identité n'était pas jointe,
   * et le service répondait 401 sans que rien n'indique pourquoi. Les deux sont
   * désormais reconnues, même si elles pointent au même endroit.
   */
  const targets = [environment.host, environment.memberHost].filter(Boolean);

  const isOwnApi = targets.length
    ? targets.some((target) => request.url.startsWith(target))
    : request.url.startsWith('/api/');
  if (!isOwnApi) return next(request);

  if (!auth.configured) {
    const session = auth.mockSession();
    // Personne n'est connecté : la requête part en visiteur anonyme, comme en production.
    if (!session) return next(request);

    const headers: Record<string, string> = {
      'X-Dev-Role': session.role,
      'X-Dev-Email': session.email
    };
    if (session.groupId) headers['X-Dev-Group'] = session.groupId;

    return next(request.clone({ setHeaders: headers }));
  }

  const token = auth.idToken;
  if (!token) return next(request);

  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
