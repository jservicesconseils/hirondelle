import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ROLES } from '../../core/auth/auth.model';

/**
 * Barre supérieure de la maquette : recherche, notifications, aide et compte.
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

        <div class="account">
          <span class="user-avatar" title="Mon compte">{{ initials }}</span>

          <div class="account-identity">
            <strong>{{ userName }}</strong>
            <small>{{ userRole }}</small>
          </div>

          <a class="account-item" routerLink="/web/profil">
            <i class="pi pi-user"></i> Mon profil
          </a>
          <button type="button" class="account-item" (click)="signOut()">
            <i class="pi pi-sign-out"></i> Se déconnecter
          </button>
        </div>
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

    .account {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding-left: 0.85rem;
      margin-left: 0.25rem;
      border-left: 1px solid #e7eaf0;
    }

    .user-avatar {
      flex: 0 0 44px;
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 14px;
      background: linear-gradient(135deg, #f4551d 0%, #ff8748 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font: inherit;
      font-weight: 700;
      box-shadow: 0 8px 20px rgba(244, 85, 29, 0.28);
    }

    .account-identity {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
      white-space: nowrap;

      strong { font-size: 0.88rem; color: #14243c; }
      small { color: #667a92; font-size: 0.76rem; }
    }

    .account-item {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 0.9rem;
      border: 1px solid #e7eaf0;
      border-radius: 999px;
      background: #fff;
      color: #14243c;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      white-space: nowrap;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

      &:hover { background: #fff0ea; color: #d3410d; border-color: #ffd6c2; }

      i { color: #667a92; font-size: 0.8rem; }
      &:hover i { color: #f4551d; }
    }

    @media (max-width: 1100px) {
      .menu-btn { display: inline-flex; align-items: center; justify-content: center; }
    }

    @media (max-width: 900px) {
      .account-identity { display: none; }
    }

    @media (max-width: 700px) {
      .topbar-search { display: none; }
    }
  `]
})
export class AppHeader {
  /** Ouvre ou ferme le menu latéral sur petit écran. */
  @Output() toggleMenu = new EventEmitter<void>();

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  /** Nom affiché : celui de la fiche membre liée au compte, sinon le courriel. */
  get userName(): string {
    const user = this.auth.user();
    const member = user.member;
    const full = `${member?.firstName || ''} ${member?.lastName || ''}`.trim();
    return full || user.email || 'Utilisateur';
  }

  get userRole(): string {
    const user = this.auth.user();
    if (user.roles.includes(ROLES.SUPER_ADMIN)) return 'Super administrateur';
    if (user.roles.includes(ROLES.GROUP_ADMIN)) return user.group?.name || 'Administrateur de groupe';
    return user.group?.name || 'Membre';
  }

  get initials(): string {
    return this.userName
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }

  signOut(): void {
    this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
