import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { MobileModules, PlatformSettingsService } from '../../../core/platform-settings.service';

/** Une bascule de la page : sa clé côté API, ce qu'elle affiche, l'icône de sa pastille. */
interface ModuleToggle {
  key: keyof MobileModules;
  label: string;
  description: string;
  icon: string;
}

const TOGGLES: ModuleToggle[] = [
  {
    key: 'mobileEvents',
    label: 'Événements',
    description: "Accueil, fil des événements à venir, page d'un événement.",
    icon: 'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z'
  },
  {
    key: 'mobileTickets',
    label: 'Billets',
    description: "Onglet Billets : les réservations et billets de la personne connectée.",
    icon: 'M20 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4zm-5.5 6L12 12.6 9.5 14l.7-2.8-2.2-1.9 2.9-.2L12 6.5l1.1 2.6 2.9.2-2.2 1.9.7 2.8z'
  },
  {
    key: 'mobileContacts',
    label: 'Contacts',
    description: "Onglet Contacts : l'annuaire des membres (reste soumis au module Membres du groupe).",
    icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
  },
  {
    key: 'mobileProfile',
    label: 'Profil',
    description: 'Onglet Profil : les informations personnelles de la personne connectée.',
    icon: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
  }
];

@Component({
  selector: 'app-web-settings',
  standalone: true,
  imports: [CommonModule, ToastModule],
  templateUrl: './web-settings.component.html',
  styleUrls: ['./web-settings.component.scss'],
  providers: [MessageService]
})
export class WebSettingsComponent implements OnInit {
  readonly toggles = TOGGLES;
  loading = true;
  /** Bascule en cours d'enregistrement : désactive son interrupteur le temps de la requête. */
  saving: keyof MobileModules | null = null;

  modules: MobileModules = {
    mobileEvents: true,
    mobileTickets: true,
    mobileContacts: true,
    mobileProfile: true
  };

  constructor(
    private settings: PlatformSettingsService,
    private messageService: MessageService
  ) {}

  async ngOnInit(): Promise<void> {
    this.modules = await this.settings.ready();
    this.loading = false;
  }

  get activeCount(): number {
    return Object.values(this.modules).filter(Boolean).length;
  }

  async onToggle(item: ModuleToggle): Promise<void> {
    if (this.saving) return;

    const next = !this.modules[item.key];
    this.saving = item.key;
    // Optimiste : l'interrupteur bouge tout de suite, et revient en arrière si le
    // serveur refuse — plus réactif qu'attendre la réponse pour l'état visuel.
    this.modules = { ...this.modules, [item.key]: next };

    try {
      this.modules = await this.settings.update({ [item.key]: next });
      this.messageService.add({
        severity: 'success',
        summary: next ? 'Module activé' : 'Module désactivé',
        detail: `${item.label} — ${next ? 'accessible' : 'masqué'} sur le mobile dès la prochaine ouverture de l'app.`,
        life: 4000
      });
    } catch (error) {
      console.error('Enregistrement du réglage impossible', error);
      this.modules = { ...this.modules, [item.key]: !next };
      this.messageService.add({
        severity: 'error',
        summary: 'Échec',
        detail: `Le réglage de « ${item.label} » n'a pas pu être enregistré.`,
        life: 5000
      });
    } finally {
      this.saving = null;
    }
  }
}
