import { Component, Input, OnChanges, Signal, SimpleChanges, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EventInterestState } from '../../shared/services/api/model/eventStats';
import { EventInterestService } from '../../shared/services/events/event-interest.service';

/**
 * « Je suis intéressé ».
 *
 * Se signaler sans réserver : le geste précède la réservation dans le parcours,
 * et donne à l'organisateur la mesure de l'engouement avant que les places ne
 * partent. Le bouton apparaît donc sur les cartes de la liste comme sur la fiche
 * détaillée, avant l'appel à réserver.
 *
 * Deux tailles pour un seul comportement :
 * - `compact` sur les cartes, une pastille avec le compteur ;
 * - `full` sur la fiche, un bouton large avec le compteur en dessous.
 *
 * L'état vient du service, partagé par événement : cliquer sur une carte met à
 * jour la fiche, et inversement.
 */
@Component({
  selector: 'app-interest-button',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interest-button.component.html',
  styleUrls: ['./interest-button.component.scss']
})
export class InterestButtonComponent implements OnChanges {
  @Input({ required: true }) eventId!: string;
  /**
   * `full` sur la fiche, `compact` en pastille avec libellé, `icon` en bouton
   * rond posé sur un visuel — la place y est comptée, le cœur parle seul.
   */
  @Input() variant: 'compact' | 'full' | 'icon' = 'full';

  /**
   * État partagé de l'événement courant — un signal *dans* un signal.
   *
   * L'enveloppe n'est pas un ornement : `*ngFor` réutilise une carte pour un
   * autre événement, et il faut alors pointer sur un autre état. Une simple
   * propriété réassignée laisserait les `computed` accrochés à l'ancien signal,
   * qui ne changerait plus jamais — le compteur resterait figé sur l'événement
   * précédent.
   */
  private readonly source = signal<Signal<EventInterestState> | null>(null);

  busy = false;
  error = '';
  /** Champ de courriel, déplié quand le visiteur n'est pas reconnu. */
  askEmail = false;
  emailInput = '';

  readonly count = computed(() => this.source()?.().count ?? 0);
  readonly interested = computed(() => this.source()?.().interested ?? false);

  constructor(private interest: EventInterestService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['eventId'] || !this.eventId) return;
    this.source.set(this.interest.state(this.eventId));
    this.askEmail = false;
    this.error = '';
    this.busy = false;
  }

  /**
   * Clic sur la pastille d'une carte.
   *
   * Sur « Mes événements », le visuel de la carte est lui-même un lien vers la
   * fiche : sans ces deux appels, se déclarer intéressé changerait de page.
   */
  onChipClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.toggle();
  }

  /**
   * Un clic suffit quand la personne est reconnue — session ouverte, ou courriel
   * déjà donné sur ce navigateur. Sinon il faut un courriel : c'est la seule
   * façon de ne compter chacun qu'une fois, et de le reconnaître s'il revient.
   *
   * Le geste ne se reprend pas : une fois signalé, le bouton grise et ne réagit
   * plus. Le retrait reste possible côté serveur, mais pas d'un clic distrait.
   */
  toggle(): void {
    if (this.busy || !this.eventId || this.interested()) return;

    const email = this.interest.knownEmail();
    if (!email) {
      this.askEmail = true;
      return;
    }

    this.declare(email);
  }

  /** Validation du champ de courriel. */
  submitEmail(): void {
    const email = this.emailInput.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error = 'Indiquez un courriel valide.';
      return;
    }
    this.declare(email);
  }

  cancelEmail(): void {
    this.askEmail = false;
    this.emailInput = '';
    this.error = '';
  }

  private declare(email: string): void {
    this.busy = true;
    this.error = '';

    this.interest.mark(this.eventId, email).subscribe({
      next: () => {
        this.askEmail = false;
        this.emailInput = '';
        this.busy = false;
      },
      error: (failure: { error?: { error?: string } }) => {
        this.error = failure?.error?.error || "Votre intérêt n'a pas pu être enregistré.";
        this.busy = false;
      }
    });
  }

  /** Le libellé ne change pas : c'est l'état grisé qui dit que c'est fait. */
  readonly label = 'Je suis intéressé';

  get countLabel(): string {
    const count = this.count();
    if (!count) return '';
    return `${count} personne${count > 1 ? 's' : ''} intéressée${count > 1 ? 's' : ''}`;
  }
}
