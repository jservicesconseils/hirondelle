import { Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'fr' | 'en';

const LANG_KEY = 'rdh.lang';
/** Distinct de LANG_KEY : une valeur détectée automatiquement (langue du
 *  téléphone) ne doit pas empêcher l'écran de premier lancement de s'afficher —
 *  seul un choix explicite de la personne doit le faire. */
const LANG_CHOSEN_KEY = 'rdh.lang.chosen';

/**
 * Langue courante de l'application, appliquée à l'exécution (aucune
 * recompilation nécessaire) via ngx-translate. Persistée dans localStorage
 * pour survivre à la fermeture de l'appli, comme la session de connexion.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly _lang = signal<AppLanguage>('fr');
  readonly lang = this._lang.asReadonly();

  constructor(private translate: TranslateService) {
    const initial = this.storedLanguage() ?? this.detectDeviceLanguage();
    this._lang.set(initial);
    this.translate.use(initial);
  }

  /** Faux tant que la personne n'a pas explicitement choisi une langue — même si
   *  une langue par défaut (détectée) est déjà active. Pilote l'écran de premier lancement. */
  hasChosenLanguage(): boolean {
    try {
      return localStorage.getItem(LANG_CHOSEN_KEY) === '1';
    } catch {
      // Stockage indisponible (navigation privée, etc.) : on ne bloque pas
      // l'appli avec l'écran de choix à chaque lancement.
      return true;
    }
  }

  setLanguage(lang: AppLanguage): void {
    this._lang.set(lang);
    this.translate.use(lang);
    try {
      localStorage.setItem(LANG_KEY, lang);
      localStorage.setItem(LANG_CHOSEN_KEY, '1');
    } catch {
      // La langue reste active pour la session en cours même sans persistance.
    }
  }

  private storedLanguage(): AppLanguage | null {
    try {
      const value = localStorage.getItem(LANG_KEY);
      return value === 'fr' || value === 'en' ? value : null;
    } catch {
      return null;
    }
  }

  private detectDeviceLanguage(): AppLanguage {
    const nav = typeof navigator !== 'undefined' ? navigator.language : '';
    return nav?.toLowerCase().startsWith('en') ? 'en' : 'fr';
  }
}
