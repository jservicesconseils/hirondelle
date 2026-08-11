import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * Barre supérieure de la maquette : recherche, notifications, aide et avatar.
 * La navigation, elle, vit dans le menu vertical de gauche (`app-sidebar`).
 */
@Component({
  standalone: true,
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  template: `
    <header class="topbar">
      <button type="button" class="menu-btn" (click)="toggleMenu.emit()" aria-label="Ouvrir le menu">
        <i class="pi pi-bars"></i>
      </button>

      <div class="topbar-actions">
        <div class="topbar-search">
          <i class="pi pi-search"></i>
          <input type="text" placeholder="Rechercher un membre, un événement..." />
        </div>

        <button type="button" class="icon-btn has-dot" aria-label="Notifications">
          <i class="pi pi-bell"></i>
        </button>
        <button type="button" class="icon-btn" aria-label="Aide">
          <i class="pi pi-question-circle"></i>
        </button>
        <span class="user-avatar">{{ initials }}</span>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem 1.5rem 0;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    /* Le bouton de menu n'apparaît que quand la barre latérale devient un tiroir. */
    .menu-btn {
      display: none;
      background: #fff;
      border: 1px solid #e7eaf0;
      border-radius: 12px;
      width: 42px;
      height: 42px;
      color: #14243c;
      font-size: 1.1rem;
      cursor: pointer;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-left: auto;
    }

    .topbar-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .topbar-search i {
      position: absolute;
      left: 1.1rem;
      color: #8f96b8;
      font-size: 1rem;
    }

    .topbar-search input {
      width: 340px;
      max-width: 42vw;
      padding: 0.8rem 1.1rem 0.8rem 2.9rem;
      border: 1px solid #e7eaf0;
      border-radius: 999px;
      background: #fff;
      font: inherit;
      font-size: 0.95rem;
      color: #14243c;
      outline: none;
    }

    .topbar-search input::placeholder { color: #8f96b8; }

    .topbar-search input:focus {
      border-color: #ff8748;
      box-shadow: 0 0 0 3px rgba(63, 110, 240, 0.15);
    }

    .icon-btn {
      background: none;
      border: none;
      color: #667a92;
      font-size: 1.25rem;
      cursor: pointer;
      position: relative;
      padding: 0.25rem;
    }

    .icon-btn:hover { color: #14243c; }

    .icon-btn.has-dot::after {
      content: '';
      position: absolute;
      top: 2px;
      right: 0;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f4552e;
    }

    .user-avatar {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: linear-gradient(135deg, #f4551d 0%, #ff8748 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(244, 85, 29, 0.28);
    }

    @media (max-width: 1100px) {
      .menu-btn { display: inline-flex; align-items: center; justify-content: center; }
    }

    @media (max-width: 700px) {
      .topbar-search { display: none; }
    }
  `]
})
export class AppHeader {
  /** Ouvre ou ferme le menu latéral sur petit écran. */
  @Output() toggleMenu = new EventEmitter<void>();

  userName = 'Jean Dupont';

  get initials(): string {
    return this.userName
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }
}
