import { Injectable } from '@angular/core';

const STORAGE_KEY = 'rdh.mobile.memberId';

/**
 * Qui utilise l'application sur cet appareil.
 *
 * Le projet n'a pas encore d'authentification : l'écran Profil demande donc une
 * fois pour toutes à quel membre correspond l'appareil, et retient ce choix.
 * Le jour où une connexion existera, seul ce service sera à remplacer.
 */
@Injectable({ providedIn: 'root' })
export class IdentityService {
  get memberId(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  }

  set memberId(value: string) {
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEY, value);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Identité non enregistrée', error);
    }
  }
}
