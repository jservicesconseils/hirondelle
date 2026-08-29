import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Feature, FEATURES, Role, ROLES } from './auth.model';
import { firstAvailableMobileRoute, MobileModules, PlatformSettingsService } from '../platform-settings.service';

/**
 * Exige une session ouverte.
 *
 * La garde s'applique de la même façon avec Cognito et avec la connexion simulée :
 * dans les deux cas, `isAuthenticated()` reflète ce que le serveur a répondu à
 * `/api/v1/me`. Le contrôle réel reste côté serveur — une garde ne protège qu'un
 * affichage.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  // La session peut exister sans avoir encore été restaurée (rechargement de page).
  const user = await auth.restore();
  if (user.sub) return true;

  return router.createUrlTree([loginRouteFor(state.url)], { queryParams: { redirect: state.url } });
};

/** Exige au moins un des rôles indiqués. */
export function roleGuard(...allowed: Role[]): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      const user = await auth.restore();
      if (!user.sub) {
        return router.createUrlTree([loginRouteFor(state.url)], { queryParams: { redirect: state.url } });
      }
    }

    if (auth.user().roles.some((role) => allowed.includes(role))) return true;

    // Connecté mais sans le rôle : on renvoie vers l'espace qui lui correspond,
    // sur la plateforme d'où il vient.
    if (auth.canAdminister()) return router.createUrlTree(['/app/dashboard']);
    return router.createUrlTree([state.url.startsWith('/mobile') ? '/mobile/dashboard' : '/web/mes-evenements']);
  };
}

/**
 * Exige que le module soit attribué au groupe de l'utilisateur.
 *
 * Un groupe qui ne tient que son annuaire n'a pas de pages d'événements, et
 * réciproquement. Sans cette garde, la page s'ouvrirait pour n'afficher qu'une
 * erreur 403 : mieux vaut ne pas y conduire. Le refus reste appliqué par le
 * serveur — c'est lui qui fait autorité, la garde n'évite qu'un détour.
 */
export function featureGuard(feature: Feature): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      const user = await auth.restore();
      if (!user.sub) {
        return router.createUrlTree([loginRouteFor(state.url)], { queryParams: { redirect: state.url } });
      }
    }

    if (auth.features().includes(feature)) return true;

    // Le module manque : on renvoie vers celui qui reste, à défaut vers l'accueil.
    return router.createUrlTree([fallbackFor(auth, state.url)]);
  };
}

/**
 * Première page utilisable pour cet utilisateur, selon ce que son groupe ouvre.
 *
 * Les pages `/app/*` sont réservées aux administrateurs : y renvoyer un membre le
 * ferait rebondir sur `adminGuard`. Il repart donc vers son agenda sur le site.
 */
function fallbackFor(auth: AuthService, url: string): string {
  if (url.startsWith('/mobile')) {
    if (auth.canSeeEvents()) return '/mobile/events';
    if (auth.canSeeMembers()) return '/mobile/members';
    return '/mobile/dashboard';
  }

  if (!auth.canAdminister()) return '/web/mes-evenements';
  if (auth.canSeeEvents()) return '/app/events';
  if (auth.canSeeMembers()) return '/app/members';
  return '/web';
}

/** Une page mobile renvoie vers la connexion mobile, pas vers celle du bureau. */
function loginRouteFor(url: string): string {
  return url.startsWith('/mobile') ? '/mobile/login' : '/login';
}

/**
 * Exige qu'un module mobile soit activé par le super administrateur.
 *
 * Un interrupteur global (voir `PlatformSettingsService`), indépendant des
 * modules ouverts au groupe (`featureGuard`) : là où celui-ci répond « votre
 * communauté n'a pas ce module », celui-là répond « ce module est
 * temporairement coupé pour tout le monde ». S'applique même sans connexion,
 * puisqu'on peut parcourir le mobile sans compte.
 */
export function moduleGuard(module: keyof MobileModules): CanActivateFn {
  return async () => {
    const settings = inject(PlatformSettingsService);
    const router = inject(Router);

    const modules = await settings.ready();
    if (modules[module]) return true;

    return router.createUrlTree([firstAvailableMobileRoute(modules)]);
  };
}

/** Raccourcis lisibles dans la table de routes. */
export const superAdminGuard: CanActivateFn = roleGuard(ROLES.SUPER_ADMIN);
export const adminGuard: CanActivateFn = roleGuard(ROLES.SUPER_ADMIN, ROLES.GROUP_ADMIN);
export const eventsGuard: CanActivateFn = featureGuard(FEATURES.EVENTS);
export const membersGuard: CanActivateFn = featureGuard(FEATURES.MEMBERS);
export const mobileEventsGuard: CanActivateFn = moduleGuard('mobileEvents');
export const mobileTicketsGuard: CanActivateFn = moduleGuard('mobileTickets');
export const mobileContactsGuard: CanActivateFn = moduleGuard('mobileContacts');
export const mobileProfileGuard: CanActivateFn = moduleGuard('mobileProfile');
