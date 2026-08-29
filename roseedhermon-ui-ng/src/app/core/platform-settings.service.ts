import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

/** Bascules globales des modules mobiles, réglées par le super administrateur. */
export interface MobileModules {
  mobileEvents: boolean;
  mobileTickets: boolean;
  mobileContacts: boolean;
  mobileProfile: boolean;
}

/**
 * Première page mobile encore ouverte, dans l'ordre de la barre du bas —
 * utilisée après la connexion et par les gardes de route quand celle
 * demandée est désactivée.
 */
export function firstAvailableMobileRoute(modules: MobileModules): string {
  if (modules.mobileEvents) return '/mobile/dashboard';
  if (modules.mobileContacts) return '/mobile/members';
  if (modules.mobileProfile) return '/mobile/profile';
  if (modules.mobileTickets) return '/mobile/tickets';
  // Tout est désactivé à la fois : cas dégénéré, sans page à proposer de mieux.
  return '/mobile/profile';
}

/**
 * Modules ouverts tant que le réglage n'a pas encore été lu — mieux vaut montrer un
 * onglet qui se cachera une fraction de seconde plus tard qu'en faire disparaître
 * un par erreur si la requête échoue (une coupure réseau ne doit pas amputer l'app).
 */
const OPEN_BY_DEFAULT: MobileModules = {
  mobileEvents: true,
  mobileTickets: true,
  mobileContacts: true,
  mobileProfile: true,
};

/**
 * Lit et modifie les bascules globales des modules mobiles.
 *
 * Public en lecture (même une personne qui « parcourt sans compte » doit voir les
 * mêmes onglets masqués) ; `update()` échoue côté serveur pour qui n'est pas super
 * administrateur, cette page n'étant de toute façon accessible qu'à lui.
 */
@Injectable({ providedIn: 'root' })
export class PlatformSettingsService {
  private readonly _modules = signal<MobileModules>(OPEN_BY_DEFAULT);
  readonly modules = this._modules.asReadonly();

  /** Résolue une fois la première lecture faite — pour les gardes de route, qui doivent l'attendre. */
  private readonly loaded: Promise<MobileModules>;

  constructor(private http: HttpClient) {
    this.loaded = firstValueFrom(
      this.http.get<MobileModules>(`${environment.host}/api/v1/settings/mobile-modules`)
    )
      .then((modules) => {
        this._modules.set(modules);
        return modules;
      })
      .catch(() => this._modules());
  }

  ready(): Promise<MobileModules> {
    return this.loaded;
  }

  async update(patch: Partial<MobileModules>): Promise<MobileModules> {
    const modules = await firstValueFrom(
      this.http.put<MobileModules>(`${environment.host}/api/v1/settings/mobile-modules`, patch)
    );
    this._modules.set(modules);
    return modules;
  }
}
