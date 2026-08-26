import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../shared/services/events/events.service';
import { EventDTO } from '../../../shared/services/api/model/eventDTO';
import { EventFileControllerService } from '../../../shared/services/api/api/eventFileController.service';
import { EventFileDTO } from '../../../shared/services/api/model/eventFileDTO';
import { environment } from '../../../../environments/environment';
import { startOfToday } from '../../../shared/utils/event-presentation';

/** Un présentateur prêt à afficher (aucune photo n'est stockée : on met les initiales). */
interface PresenterView {
  initials: string;
  name: string;
  title: string;
}

/** Un document téléchargeable de l'événement. */
interface DocumentView {
  name: string;
  meta: string;
  url: string;
}

/** Une case de la grille « Informations » : icône, intitulé, valeur — jamais de ligne à l'excel. */
interface InfoCard {
  icon: string;
  label: string;
  value: string;
  /** Ton d'accent particulier (ex. la clôture, en orange), sinon le bleu par défaut. */
  accent?: boolean;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const DAY_MS = 24 * 60 * 60 * 1000;
/** Vitesse de lecture retenue pour l'estimation affichée sous la description. */
const WORDS_PER_MINUTE = 200;

@Component({
  selector: 'app-mobile-event-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-screen">
      <p class="state" *ngIf="loading">Chargement de l'événement…</p>
      <p class="state error" *ngIf="loadError">{{ loadError }}</p>

      <ng-container *ngIf="event && !loading">

        <!-- Frange bleue : visuel s'il existe, dégradé de la charte sinon -->
        <header class="hero" [style.background-image]="heroImage ? 'url(' + heroImage + ')' : null">
          <div class="hero-shade"></div>

          <div class="hero-top">
            <button type="button" class="round-btn back" (click)="goBack()" aria-label="Retour">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
            </button>

            <div class="hero-actions">
              <button type="button" class="round-btn" (click)="share()" aria-label="Partager">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L7.04 9.81C6.5 9.31 5.79 9 5 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>
              </button>
              <button type="button" class="round-btn fav" [class.on]="favorite" (click)="favorite = !favorite" aria-label="Favori">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              </button>
            </div>
          </div>

          <div class="hero-text">
            <div class="hero-title-row">
              <h1>{{ event.name || 'Sans titre' }}</h1>
              <span class="price-badge" [class.is-free]="event.free">{{ priceLabel }}</span>
            </div>
            <div class="hero-meta">
              <span>
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z" /></svg>
                {{ dateLabel }}
              </span>
              <span *ngIf="placeLabel">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" /></svg>
                {{ placeLabel }}
              </span>
            </div>
          </div>

          <!-- Pastille de compte à rebours, à cheval sur le bord de la frange -->
          <span class="countdown-pill" *ngIf="countdownLabel">
            <i class="dot"></i>{{ countdownLabel }}
          </span>
        </header>

        <!-- Feuille blanche remontant sur la frange -->
        <div class="sheet">
          <span class="grabber"></span>

          <section class="section" *ngIf="presenters.length">
            <h2>Présentateurs</h2>
            <div class="presenter-row">
              <figure class="presenter" *ngFor="let presenter of presenters">
                <span class="presenter-avatar">{{ presenter.initials }}</span>
                <figcaption>
                  <strong>{{ presenter.name }}</strong>
                  <small *ngIf="presenter.title">{{ presenter.title }}</small>
                </figcaption>
              </figure>
            </div>
          </section>

          <section class="section">
            <h2><i class="pi pi-file-edit"></i> Description</h2>
            <div class="description-box">
              <p>{{ event.description || 'Aucune description n’a été renseignée pour cet événement.' }}</p>
              <span class="reading-time" *ngIf="readingMinutes">
                <i class="pi pi-clock"></i> Lecture {{ readingMinutes }} min
              </span>
            </div>
          </section>

          <!-- Informations complémentaires réellement présentes en base -->
          <section class="section" *ngIf="infoCards.length">
            <h2>Informations</h2>
            <div class="info-grid">
              <div class="info-card" *ngFor="let card of infoCards" [class.is-accent]="card.accent">
                <span class="info-icon"><i class="pi" [ngClass]="card.icon"></i></span>
                <span class="info-label">{{ card.label }}</span>
                <strong class="info-value">{{ card.value }}</strong>
              </div>
            </div>
          </section>

          <!-- Tarif, mis en avant à part : c'est ce qui décide le plus souvent -->
          <section class="section">
            <div class="price-card" [class.is-free]="event.free">
              <span class="price-icon"><i class="pi" [ngClass]="event.free ? 'pi-gift' : 'pi-wallet'"></i></span>
              <div class="price-body">
                <span class="price-kicker">Tarif</span>
                <strong>{{ priceLabel }}</strong>
              </div>
              <span class="price-note" *ngIf="visibilityLabel">
                <i class="dot"></i>{{ visibilityLabel }}
              </span>
            </div>
          </section>

          <!-- Lieu : carte stylisée, faute d'intégration cartographique réelle -->
          <section class="section" *ngIf="placeLabel || event.location?.address">
            <div class="section-head">
              <h2><i class="pi pi-map-marker"></i> Lieu</h2>
              <a class="directions-link" *ngIf="directionsUrl" [href]="directionsUrl" target="_blank" rel="noopener">
                <i class="pi pi-send"></i> Itinéraire
              </a>
            </div>

            <div class="map-card">
              <div class="map-art">
                <span class="map-road one"></span>
                <span class="map-road two"></span>
                <span class="map-pin">
                  <i class="pi pi-map-marker"></i>
                </span>
              </div>
              <div class="map-address">
                <strong>{{ event.location?.placeName || event.location?.city }}</strong>
                <span>{{ fullAddress }}</span>
              </div>
            </div>
          </section>

          <section class="section" *ngIf="documents.length">
            <h2>Documents</h2>
            <a class="document" *ngFor="let document of documents" [href]="document.url" target="_blank" rel="noopener">
              <span class="doc-icon">{{ extensionOf(document.name) }}</span>
              <span class="doc-body">
                <strong>{{ document.name }}</strong>
                <small>{{ document.meta }}</small>
              </span>
              <svg class="doc-download" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
            </a>
          </section>

          <section class="section" *ngIf="gallery.length">
            <h2>Galerie photos</h2>
            <div class="gallery">
              <a class="gallery-item" *ngFor="let photo of gallery" [href]="photo" target="_blank" rel="noopener">
                <img [src]="photo" alt="Photo de l'événement" loading="lazy" />
              </a>
            </div>
          </section>
        </div>

        <!-- Action principale, ancrée en bas -->
        <div class="action-bar">
          <button type="button" class="reserve" (click)="reserve()">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2a2 2 0 0 1 0 4v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2 2 0 0 1 0-4z" />
            </svg>
            Réserver ma place
          </button>
          <!-- Vraie donnée publique (jauge affichée par l'organisateur), pas un compte d'inscrits. -->
          <p class="seats-nudge" *ngIf="event.availableSeats">
            <i class="dot"></i>{{ event.availableSeats }} place{{ event.availableSeats! > 1 ? 's' : '' }} disponible{{ event.availableSeats! > 1 ? 's' : '' }} — Dépêchez-vous
          </p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .detail-screen {
      min-height: 100vh;
      background: #fdf6f1;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #16202f;
      padding-bottom: 0;
    }

    .state {
      text-align: center;
      color: #667a92;
      font-size: 15px;
      padding: 60px 24px;
      margin: 0;
    }

    .state.error { color: #b00020; font-weight: 600; }

    /* ---------- Frange ---------- */

    .hero {
      position: relative;
      z-index: 2;
      height: 220px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 16px 20px 34px;
      /* Faute de photo : le dégradé demandé, dans la charte du produit. */
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      background-size: cover;
      background-position: center;
      border-radius: 0 0 32px 32px;
      // Sans propriété overflow ici : la pastille de compte à rebours déborde
      // volontairement du bas pour chevaucher la feuille blanche.
    }

    .hero-shade {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0) 42%, rgba(0, 0, 0, 0.55) 100%);
    }

    .hero-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: auto;
    }

    .hero-actions {
      display: flex;
      gap: 10px;
    }

    .round-btn {
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.28);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .round-btn svg { width: 19px; height: 19px; }
    .round-btn.fav.on { color: #ff6b6b; }

    .hero-text { position: relative; z-index: 1; color: #fff; margin-top: 14px; }

    .hero-title-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 0 0 10px;
    }

    .hero-text h1 {
      flex: 1 1 auto;
      min-width: 0;
      margin: 0;
      // Une règle globale fixe la couleur des h1 : sans cette redéfinition, ici plus
      // spécifique, elle l'emporterait sur le blanc hérité du bandeau.
      color: #fff;
      font-size: 32px;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.01em;
      text-transform: uppercase;
      text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
      overflow-wrap: anywhere;
    }

    .price-badge {
      flex: 0 0 auto;
      margin-top: 4px;
      padding: 0.32rem 0.8rem;
      border-radius: 999px;
      background: #f4551d;
      color: #fff;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      box-shadow: 0 6px 14px rgba(244, 85, 29, 0.4);

      &.is-free { background: #1faa59; box-shadow: 0 6px 14px rgba(31, 170, 89, 0.4); }
    }

    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 18px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.95);
    }

    .hero-meta span { display: inline-flex; align-items: center; gap: 6px; }
    .hero-meta svg { width: 16px; height: 16px; flex-shrink: 0; }

    /** Verre flou, à cheval sur le bord bas de la frange. */
    .countdown-pill {
      position: absolute;
      z-index: 2;
      left: 20px;
      bottom: -16px;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.35);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #3ddc84;
      }
    }

    /* ---------- Feuille de contenu ---------- */

    .sheet {
      position: relative;
      z-index: 1;
      margin-top: -22px;
      padding: 28px 20px 8px;
      background: #fff;
      border-radius: 28px 28px 0 0;
    }

    .grabber {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 34px;
      height: 4px;
      border-radius: 999px;
      background: #e7eaf0;
    }

    .section { margin-bottom: 26px; }

    .section h2 {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 12px;
      font-size: 17px;
      font-weight: 800;

      i { color: #2b5fb8; font-size: 0.9rem; }
    }

    .section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 12px;

      h2 { margin: 0; }
    }

    .directions-link {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      color: #2b5fb8;
      font-size: 0.85rem;
      font-weight: 700;
      text-decoration: none;

      i { font-size: 0.75rem; }
    }

    /* ---------- Description ---------- */

    .description-box {
      padding: 14px 16px;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid #eef1f7;

      p {
        margin: 0;
        font-size: 14px;
        line-height: 1.65;
        color: #3a4658;
      }
    }

    .reading-time {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      margin-top: 10px;
      color: #8a96a8;
      font-size: 0.74rem;
      font-weight: 700;

      i { font-size: 0.7rem; }
    }

    /* ---------- Présentateurs ---------- */

    .presenter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }

    .presenter {
      margin: 0;
      width: 96px;
      text-align: center;
    }

    .presenter-avatar {
      width: 76px;
      height: 76px;
      margin: 0 auto 8px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d3410d 0%, #f4551d 100%);
      color: #fff;
      font-size: 24px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .presenter figcaption strong {
      display: block;
      font-size: 14px;
      font-weight: 700;
    }

    .presenter figcaption small {
      display: block;
      font-size: 12px;
      color: #667a92;
      margin-top: 2px;
    }

    /* ---------- Informations : grille façon Stripe ---------- */

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .info-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 14px;
      border: 1px solid #eef1f7;
      border-radius: 16px;
      background: #fff;

      &.is-accent .info-value { color: #f4551d; }
    }

    .info-icon {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      margin-bottom: 2px;
      border-radius: 10px;
      background: #eef4ff;
      color: #2b5fb8;

      i { font-size: 0.82rem; }
    }

    .info-card.is-accent .info-icon { background: #fff0ea; color: #f4551d; }

    .info-label {
      color: #8a96a8;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .info-value {
      font-size: 0.98rem;
      font-weight: 800;
      color: #16202f;
      overflow-wrap: anywhere;
    }

    /* ---------- Tarif ---------- */

    .price-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 18px;
      background: linear-gradient(135deg, #eef4ff 0%, #e3ecff 100%);
      border: 1px solid #dbe6ff;
      overflow: hidden;

      &.is-free {
        background: linear-gradient(135deg, #e9fbf1 0%, #dbf5e7 100%);
        border-color: #cdeedb;
      }
    }

    .price-icon {
      display: grid;
      place-items: center;
      flex: 0 0 42px;
      width: 42px;
      height: 42px;
      border-radius: 13px;
      background: #fff;
      color: #2b5fb8;
      box-shadow: 0 4px 10px rgba(16, 28, 48, 0.08);

      i { font-size: 1.05rem; }
    }

    .price-card.is-free .price-icon { color: #1faa59; }

    .price-body {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: 1px;
      min-width: 0;
    }

    .price-kicker {
      color: #667a92;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .price-body strong {
      font-size: 1.15rem;
      font-weight: 800;
      color: #16202f;
    }

    .price-card.is-free .price-body strong { color: #128c4a; }

    .price-note {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.65rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.7);
      color: #3a4658;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #1faa59;
      }
    }

    /* ---------- Lieu ---------- */

    .map-card {
      border: 1px solid #eef1f7;
      border-radius: 18px;
      overflow: hidden;
      background: #fff;
    }

    .map-art {
      position: relative;
      height: 110px;
      background: linear-gradient(135deg, #eef4ff 0%, #dbe6ff 100%);
      overflow: hidden;
    }

    .map-road {
      position: absolute;
      background: rgba(43, 95, 184, 0.14);

      &.one { top: 0; bottom: 0; left: 30%; width: 14px; transform: skewX(-12deg); }
      &.two { left: 0; right: 0; top: 55%; height: 10px; transform: skewY(-3deg); }
    }

    .map-pin {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -100%);
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      transform-origin: bottom;
      background: #f4551d;
      color: #fff;
      box-shadow: 0 6px 14px rgba(244, 85, 29, 0.4);
      rotate: -45deg;

      i { rotate: 45deg; font-size: 1rem; }
    }

    .map-address {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 14px;

      strong {
        display: block;
        font-size: 0.92rem;
        font-weight: 800;
        color: #16202f;
      }

      span {
        display: block;
        margin-top: 2px;
        color: #667a92;
        font-size: 0.78rem;
      }
    }

    /* ---------- Documents ---------- */

    .document {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      text-decoration: none;
      color: inherit;
    }

    .doc-icon {
      flex: 0 0 42px;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: linear-gradient(135deg, #ff8a5c 0%, #f4551d 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .doc-body { flex: 1 1 auto; min-width: 0; }

    .doc-body strong {
      display: block;
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .doc-body small { font-size: 13px; color: #667a92; }

    .doc-download { width: 22px; height: 22px; color: #2b5fb8; flex-shrink: 0; }

    /* ---------- Galerie ---------- */

    .gallery {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .gallery-item {
      display: block;
      border-radius: 12px;
      overflow: hidden;
      background: #f2f6fd;
      aspect-ratio: 1;
    }

    .gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }

    /* ---------- Action ---------- */

    .action-bar {
      position: sticky;
      bottom: 0;
      z-index: 950;
      padding: 12px 18px 14px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 42%);
      text-align: center;
    }

    .reserve {
      width: 100%;
      height: 56px;
      border: none;
      border-radius: 28px;
      background: #f4551d;
      color: #fff;
      font: inherit;
      font-size: 18px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 12px 26px rgba(244, 85, 29, 0.4);
    }

    .reserve svg { width: 22px; height: 22px; }
    .reserve:active { transform: scale(0.99); }

    .seats-nudge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin: 8px 0 0;
      color: #d3410d;
      font-size: 0.78rem;
      font-weight: 700;

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #f4551d;
      }
    }
  `]
})
export class MobileEventDetailComponent implements OnInit {
  event: EventDTO | null = null;
  loading = true;
  loadError = '';
  favorite = false;

  heroImage = '';
  gallery: string[] = [];
  documents: DocumentView[] = [];
  presenters: PresenterView[] = [];
  infoCards: InfoCard[] = [];

  dateLabel = '';
  placeLabel = '';
  fullAddress = '';
  directionsUrl = '';
  priceLabel = '';
  visibilityLabel = '';
  readingMinutes = 0;

  countdownLabel = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private eventFiles: EventFileControllerService
  ) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (!eventId) {
      this.loadError = 'Événement introuvable.';
      this.loading = false;
      return;
    }

    this.eventService.getEvent(eventId).subscribe({
      next: (event: EventDTO) => {
        this.event = event;
        this.buildView(event);
        this.loading = false;
        this.loadFiles(eventId);
      },
      error: (error: any) => {
        console.error("Erreur lors du chargement de l'événement", error);
        this.loadError = `Impossible de charger l'événement (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/mobile/events']);
  }

  /** Partage natif s'il est disponible ; sinon copie le lien dans le presse-papiers. */
  share(): void {
    const url = window.location.href;
    const title = this.event?.name || 'Événement';
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => undefined);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => undefined);
    }
  }

  /**
   * La réservation demande d'abord qui vient : sans nom ni courriel, le serveur
   * refuse l'inscription, et un billet anonyme ne se contrôle pas à l'entrée.
   */
  reserve(): void {
    if (!this.event?.id) return;
    this.router.navigate(['/mobile/reservation', this.event.id]);
  }

  extensionOf(fileName: string): string {
    const dot = fileName.lastIndexOf('.');
    return dot > -1 ? fileName.slice(dot + 1).toUpperCase().slice(0, 4) : 'DOC';
  }

  // --- Construction ---------------------------------------------------------------

  private buildView(event: EventDTO): void {
    const date = parseFrDate(event.date);
    const dayLabel = date
      ? capitalize(date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' }))
      : event.date || 'Date à définir';
    this.dateLabel = event.time ? `${dayLabel} · ${event.time}` : dayLabel;

    this.placeLabel = [event.location?.placeName, event.location?.city].filter(Boolean).join(', ');
    this.fullAddress = [event.location?.address, event.location?.city, event.location?.country]
      .filter(Boolean)
      .join(' · ');

    this.directionsUrl = this.buildDirectionsUrl(event);

    this.presenters = (event.presenters || []).map((presenter) => ({
      initials: `${(presenter.firstName || '').charAt(0)}${(presenter.lastName || '').charAt(0)}`.toUpperCase() || '?',
      name: `${presenter.firstName || ''} ${presenter.lastName || ''}`.trim() || 'Présentateur',
      title: presenter.title || ''
    }));

    // Uniquement les champs réellement renseignés : rien n'est inventé.
    const infoCards: InfoCard[] = [];
    if (event.category) infoCards.push({ icon: 'pi-tag', label: 'Catégorie', value: event.category });
    if (event.numberOfDays) {
      infoCards.push({ icon: 'pi-clock', label: 'Durée', value: `${event.numberOfDays} jour(s)` });
    }
    if (event.availableSeats) {
      infoCards.push({ icon: 'pi-users', label: 'Places', value: `${event.availableSeats}` });
    }
    if (event.lastRegistrationDate) {
      infoCards.push({
        icon: 'pi-calendar-times',
        label: 'Clôture',
        value: event.lastRegistrationDate,
        accent: true
      });
    }
    this.infoCards = infoCards;

    this.priceLabel = event.free ? 'Gratuit' : event.amount ? `${event.amount} $` : 'Non renseigné';

    // Vraie donnée serveur (`visibility`), pas une promesse marketing.
    this.visibilityLabel =
      event.visibility === 'PRIVATE' ? 'Réservé au groupe organisateur' : event.visibility === 'PUBLIC' ? 'Ouvert à tous' : '';

    this.readingMinutes = estimateReadingMinutes(event.description);

    this.countdownLabel = buildCountdownLabel(date);
  }

  /** Coordonnées si elles sont connues, sinon l'adresse en texte : les deux ouvrent Google Maps. */
  private buildDirectionsUrl(event: EventDTO): string {
    const { latitude, longitude } = event.location || {};
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    }
    const query = [event.location?.address, event.location?.city, event.location?.country]
      .filter(Boolean)
      .join(', ');
    return query ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}` : '';
  }

  private loadFiles(eventId: string): void {
    this.eventFiles.getEventFiles(eventId).subscribe({
      next: (files: EventFileDTO[]) => {
        const list = files || [];

        const images = list.filter((file) => isImage(file.fileName));
        this.gallery = images.map((file) => this.fileUrl(eventId, file));
        // La photo principale sert de visuel ; sinon la première image disponible.
        const main = images.find((file) => file.isMainPhoto) || images[0];
        this.heroImage = main ? this.fileUrl(eventId, main) : '';

        this.documents = list
          .filter((file) => !isImage(file.fileName))
          .map((file) => ({
            name: file.fileName || 'Document',
            meta: [formatSize(file.fileSize), this.extensionOf(file.fileName || '')].filter(Boolean).join(' · '),
            url: this.fileUrl(eventId, file)
          }));
      },
      error: (error: any) => {
        // Un événement sans fichiers reste parfaitement consultable.
        console.warn('Fichiers de l\'événement indisponibles', error);
      }
    });
  }

  /** Route de service des fichiers : `/api/v1/files/events/:eventId/:filename`. */
  private fileUrl(eventId: string, file: EventFileDTO): string {
    if (file.accessUrl) return file.accessUrl;
    return `${environment.host}/api/v1/files/events/${eventId}/${encodeURIComponent(file.fileName || '')}`;
  }
}

// --- Utilitaires ------------------------------------------------------------------

function isImage(fileName?: string): boolean {
  const name = (fileName || '').toLowerCase();
  return IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension));
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

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

/** ≈200 mots/minute : une estimation, pas une mesure — arrondie à la minute pleine. */
function estimateReadingMinutes(description?: string): number {
  const words = (description || '').trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Même formulation que le tableau de bord mobile, pour un événement passé ou à venir. */
function buildCountdownLabel(date: Date | null): string {
  if (!date) return '';

  const days = Math.round((date.getTime() - startOfToday()) / DAY_MS);
  if (days < 0) return '';
  if (days === 0) return "C'est aujourd'hui";
  if (days === 1) return "C'est demain";
  if (days < 7) return `Dans ${days} jours`;
  if (days < 31) {
    const weeks = Math.round(days / 7);
    return `Dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.round(days / 30);
  return `Dans ${months} mois`;
}
