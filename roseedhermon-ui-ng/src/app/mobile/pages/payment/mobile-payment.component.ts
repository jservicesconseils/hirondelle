import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { EventService } from '../../../shared/services/events/events.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
// Réseaux reconnus et somme de contrôle : partagés avec la réservation web.
import { CardBrand, luhn } from '../../../shared/utils/card';

@Component({
  selector: 'app-mobile-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pay-screen">

      <header class="pay-head">
        <button type="button" class="round-btn" (click)="goBack()" aria-label="Retour">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
        </button>
        <h1>Paiement</h1>
        <p>Réglez votre place par carte bancaire</p>
      </header>

      <p class="state" *ngIf="loading">Chargement…</p>
      <p class="state error" *ngIf="loadError">{{ loadError }}</p>

      <ng-container *ngIf="event && !loading && !loadError">

        <!-- Récapitulatif -->
        <section class="summary">
          <div class="summary-line">
            <span>{{ event.name || 'Événement' }}</span>
            <strong>{{ amountLabel }}</strong>
          </div>
          <p class="summary-meta">{{ dateLabel }}<span *ngIf="placeLabel"> · {{ placeLabel }}</span></p>
          <div class="summary-total">
            <span>Total à régler</span>
            <strong>{{ amountLabel }}</strong>
          </div>
        </section>

        <!-- Carte -->
        <section class="card-preview" [attr.data-brand]="brand">
          <span class="chip"></span>
          <span class="brand">{{ brandLabel }}</span>
          <span class="number">{{ maskedNumber }}</span>
          <span class="row">
            <small>{{ holder || 'NOM DU TITULAIRE' }}</small>
            <small>{{ expiry || 'MM/AA' }}</small>
          </span>
        </section>

        <form class="pay-form" (ngSubmit)="submit()" novalidate>
          <label class="field">
            <span>Numéro de carte</span>
            <input type="text"
                   inputmode="numeric"
                   autocomplete="cc-number"
                   placeholder="1234 5678 9012 3456"
                   maxlength="23"
                   [ngModel]="cardNumber"
                   (ngModelChange)="onCardNumberChange($event)"
                   name="cardNumber" />
            <em class="error" *ngIf="touched && !numberValid">Numéro de carte invalide.</em>
          </label>

          <label class="field">
            <span>Titulaire</span>
            <input type="text"
                   autocomplete="cc-name"
                   placeholder="Prénom Nom"
                   [(ngModel)]="holder"
                   (ngModelChange)="holder = $event.toUpperCase()"
                   name="holder" />
            <em class="error" *ngIf="touched && !holderValid">Indiquez le nom inscrit sur la carte.</em>
          </label>

          <div class="field-row">
            <label class="field">
              <span>Expiration</span>
              <input type="text"
                     inputmode="numeric"
                     autocomplete="cc-exp"
                     placeholder="MM/AA"
                     maxlength="5"
                     [ngModel]="expiry"
                     (ngModelChange)="onExpiryChange($event)"
                     name="expiry" />
              <em class="error" *ngIf="touched && !expiryValid">Date invalide.</em>
            </label>

            <label class="field">
              <span>Cryptogramme</span>
              <input type="password"
                     inputmode="numeric"
                     autocomplete="cc-csc"
                     placeholder="123"
                     maxlength="4"
                     [ngModel]="cvc"
                     (ngModelChange)="onCvcChange($event)"
                     name="cvc" />
              <em class="error" *ngIf="touched && !cvcValid">3 ou 4 chiffres.</em>
            </label>
          </div>

          <p class="notice">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9V6zm3 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" /></svg>
            Démonstration : aucun prestataire de paiement n'est raccordé. Rien n'est débité, et les
            données de carte ne quittent pas cet écran.
          </p>

          <button type="submit" class="pay-btn" [disabled]="paying">
            <span *ngIf="!paying">{{ payLabel }}</span>
            <span *ngIf="paying">Traitement…</span>
          </button>
        </form>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .pay-screen {
      min-height: 100vh;
      background: #fdf6f1;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1b1e23;
      padding-bottom: 40px;
    }

    .pay-head {
      position: relative;
      padding: 44px 24px 30px;
      text-align: center;
      color: #fff;
      /* Dégradé bleu des bandeaux, comme la réservation qui précède. */
      background: linear-gradient(135deg, #16346b 0%, #2b5fb8 62%, #3d78d6 100%);
      border-radius: 0 0 30px 30px;
    }

    .pay-head h1 { margin: 0; font-size: 27px; font-weight: 800; }
    .pay-head p { margin: 6px 0 0; font-size: 15px; color: rgba(255, 255, 255, 0.9); }

    .round-btn {
      position: absolute;
      top: 18px;
      left: 18px;
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .round-btn svg { width: 20px; height: 20px; }

    .state {
      text-align: center;
      color: #667a92;
      font-size: 15px;
      padding: 40px 24px;
      margin: 0;
    }

    .state.error { color: #b00020; font-weight: 600; }

    /* ---------- Récapitulatif ---------- */

    .summary {
      margin: -16px 18px 0;
      padding: 18px;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 10px 26px rgba(20, 30, 50, 0.1);
    }

    .summary-line {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      font-size: 17px;
      font-weight: 700;
    }

    .summary-meta { margin: 6px 0 0; font-size: 14px; color: #667a92; }

    .summary-total {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed #e3e7ec;
      font-size: 16px;
    }

    .summary-total strong { font-size: 22px; font-weight: 800; color: #d9600d; }

    /* ---------- Aperçu de la carte ---------- */

    .card-preview {
      position: relative;
      margin: 18px 18px 0;
      padding: 20px;
      height: 176px;
      border-radius: 20px;
      background: linear-gradient(135deg, #2a3550 0%, #1b2438 100%);
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 14px 30px rgba(20, 25, 40, 0.28);
    }

    .card-preview[data-brand='visa'] { background: linear-gradient(135deg, #1a5cc8 0%, #123b83 100%); }
    .card-preview[data-brand='mastercard'] { background: linear-gradient(135deg, #d9603c 0%, #8f2f28 100%); }
    .card-preview[data-brand='amex'] { background: linear-gradient(135deg, #1c8f8f 0%, #125c6b 100%); }

    .chip {
      width: 46px;
      height: 34px;
      border-radius: 8px;
      background: linear-gradient(135deg, #f7d97a 0%, #d9ac3c 100%);
    }

    .card-preview .brand {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .card-preview .number {
      font-size: 21px;
      letter-spacing: 0.09em;
      font-variant-numeric: tabular-nums;
    }

    .card-preview .row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-size: 12.5px;
      letter-spacing: 0.05em;
      color: rgba(255, 255, 255, 0.85);
      text-transform: uppercase;
    }

    /* ---------- Formulaire ---------- */

    .pay-form { padding: 18px; }

    .field { display: block; margin-bottom: 14px; }

    .field > span {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 600;
      color: #667a92;
    }

    .field input {
      width: 100%;
      height: 52px;
      padding: 0 16px;
      border: 1px solid #e1e5ea;
      border-radius: 14px;
      background: #fff;
      font: inherit;
      font-size: 16px;
      color: #1b1e23;
      outline: none;
      box-sizing: border-box;
    }

    .field input:focus { border-color: #f4551d; box-shadow: 0 0 0 3px rgba(244, 85, 29, 0.14); }

    .field .error {
      display: block;
      margin-top: 5px;
      font-size: 13px;
      font-style: normal;
      color: #b00020;
    }

    .field-row { display: flex; gap: 12px; }
    .field-row .field { flex: 1 1 0; min-width: 0; }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      margin: 4px 0 18px;
      padding: 12px 14px;
      border-radius: 14px;
      background: #eef4ff;
      font-size: 13px;
      line-height: 1.45;
      color: #3b5573;
    }

    .notice svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; }

    .pay-btn {
      width: 100%;
      height: 60px;
      border: none;
      border-radius: 30px;
      background: #f4551d;
      color: #fff;
      font: inherit;
      font-size: 19px;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 12px 26px rgba(244, 85, 46, 0.34);
    }

    .pay-btn:disabled { opacity: 0.65; cursor: default; }
  `]
})
export class MobilePaymentComponent implements OnInit {
  event: EventDTO | null = null;
  loading = true;
  loadError = '';
  paying = false;
  touched = false;

  cardNumber = '';
  holder = '';
  expiry = '';
  cvc = '';

  dateLabel = '';
  placeLabel = '';
  amountLabel = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.loadError = 'Aucun événement indiqué.';
      this.loading = false;
      return;
    }

    this.eventService.getEvent(eventId).subscribe({
      next: (event: EventDTO) => {
        this.event = event;
        this.buildLabels(event);
        this.loading = false;

        // Un événement explicitement gratuit n'a rien à payer : on va droit au billet.
        if (event.free === true) {
          this.router.navigate(['/mobile/ticket', eventId], { replaceUrl: true });
        }
      },
      error: (error: any) => {
        console.error("Erreur lors du chargement de l'événement", error);
        this.loadError = `Impossible de charger l'événement (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  goBack(): void {
    if (this.event?.id) {
      this.router.navigate(['/mobile/events', this.event.id]);
    } else {
      this.router.navigate(['/mobile/events']);
    }
  }

  // --- Saisie ---------------------------------------------------------------------

  onCardNumberChange(value: string): void {
    const digits = (value || '').replace(/\D/g, '').slice(0, 19);
    this.cardNumber = digits.replace(/(.{4})/g, '$1 ').trim();
  }

  onExpiryChange(value: string): void {
    const digits = (value || '').replace(/\D/g, '').slice(0, 4);
    this.expiry = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  }

  onCvcChange(value: string): void {
    this.cvc = (value || '').replace(/\D/g, '').slice(0, 4);
  }

  // --- Aperçu ---------------------------------------------------------------------

  get digits(): string {
    return this.cardNumber.replace(/\D/g, '');
  }

  get brand(): CardBrand {
    const digits = this.digits;
    if (/^4/.test(digits)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    return 'unknown';
  }

  get brandLabel(): string {
    switch (this.brand) {
      case 'visa': return 'Visa';
      case 'mastercard': return 'Mastercard';
      case 'amex': return 'Amex';
      default: return 'Carte';
    }
  }

  get maskedNumber(): string {
    const digits = this.digits;
    const groups = ['••••', '••••', '••••', '••••'];
    const typed = digits.replace(/(.{4})/g, '$1 ').trim().split(' ');
    typed.forEach((group, index) => {
      if (index < 4) groups[index] = group.padEnd(4, '•');
    });
    return groups.join(' ');
  }

  // --- Validation -----------------------------------------------------------------

  get numberValid(): boolean {
    const digits = this.digits;
    return digits.length >= 13 && digits.length <= 19 && luhn(digits);
  }

  get holderValid(): boolean {
    return this.holder.trim().length >= 3;
  }

  get expiryValid(): boolean {
    const match = /^(\d{2})\/(\d{2})$/.exec(this.expiry);
    if (!match) return false;
    const month = Number(match[1]);
    if (month < 1 || month > 12) return false;
    // Valide jusqu'au dernier jour du mois indiqué.
    const endOfMonth = new Date(2000 + Number(match[2]), month, 0, 23, 59, 59);
    return endOfMonth.getTime() >= Date.now();
  }

  get cvcValid(): boolean {
    const expected = this.brand === 'amex' ? 4 : 3;
    return this.cvc.length === expected;
  }

  get formValid(): boolean {
    return this.numberValid && this.holderValid && this.expiryValid && this.cvcValid;
  }

  submit(): void {
    this.touched = true;
    if (!this.formValid || !this.event?.id) return;

    this.paying = true;
    // Aucun prestataire n'est raccordé : on marque simplement le temps de traitement
    // avant de laisser l'écran du billet enregistrer l'inscription réelle.
    setTimeout(() => {
      this.router.navigate(['/mobile/ticket', this.event!.id], { replaceUrl: true });
    }, 900);
  }

  private buildLabels(event: EventDTO): void {
    const date = parseFrDate(event.date);
    const day = date
      ? capitalize(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }))
      : event.date || 'Date à définir';
    this.dateLabel = event.time ? `${day} · ${event.time}` : day;
    this.placeLabel = [event.location?.placeName, event.location?.city].filter(Boolean).join(', ');

    // Trois cas distincts : gratuit, tarif connu, et tarif simplement pas renseigné.
    if (event.free === true) {
      this.amountLabel = 'Gratuit';
    } else if (typeof event.amount === 'number' && event.amount > 0) {
      this.amountLabel = `${event.amount} $`;
    } else {
      this.amountLabel = 'Montant non renseigné';
    }
  }

  /** Sans montant connu, on ne promet pas un paiement : on confirme la place. */
  get payLabel(): string {
    const amount = this.event?.amount;
    return typeof amount === 'number' && amount > 0 ? `Payer ${amount} $` : 'Confirmer ma place';
  }
}

/** Contrôle de Luhn : rejette une coquille de saisie sans rien envoyer au réseau. */
function parseFrDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
