import { Component, EventEmitter, Input, Output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FEATURES, Feature, ROLES, Role } from '../../core/auth/auth.model';

/**
 * Une entrée du menu. `route` absente = la page n'existe pas encore dans
 * l'application ; l'entrée est affichée mais signalée « Bientôt ».
 */
interface NavItem {
  label: string;
  /**
   * Tracé de l'icône, dans un carré de 24. Un SVG intégré plutôt qu'une classe
   * de police : le menu ne dépend plus du chargement de PrimeIcons, et aucune
   * entrée ne peut se retrouver sans glyphe.
   */
  icon: string;
  route?: string;
  /** Rôles autorisés ; absent = visible par tous les administrateurs. */
  roles?: Role[];
  /** Module requis ; absent = l'entrée ne dépend d'aucun module. */
  feature?: Feature;
}

/** Un groupe d'entrées, précédé de son intitulé. */
interface NavSection {
  label: string;
  items: NavItem[];
}

/** Tracés d'icônes, dans un carré de 24. */
const ICONS = {
  dashboard: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  groups: 'M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z',
  members:
    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  attendance:
    'M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  events:
    'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z',
  donations:
    'M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z',
  messages: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 9h10v2H7V9zm7 5H7v-2h7v2zm3-6H7V6h10v2z',
  settings:
    'M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.3 7.3 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.44.32.68.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.24.42.49.42h4c.25 0 .45-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.24.1.54.02.68-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z',
  signOut: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8v-2H4V5z'
} as const;

/**
 * Menu vertical de gauche, repris de la maquette : bloc de marque, navigation
 * principale en pastilles, séparateur, paramètres, puis la carte utilisateur en bas.
 */
@Component({
  standalone: true,
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.open]="open">
      <a class="brand" routerLink="/app/dashboard" (click)="closed.emit()">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M21 4c-4.2.5-7.4 2.2-9.6 5.1C9.6 11.6 8.6 14.6 8.3 18l-2.6 3h3.5c.4-2.9 1.2-5.3 2.6-7.2 1.9-2.6 4.7-4.1 8.2-4.6L21 4z"
              fill="currentColor" />
          </svg>
        </span>
        <span class="brand-text">
          <strong>Hirondelle</strong>
          <small>Communauté</small>
        </span>
      </a>

      <!--
        Entrées regroupées par famille. Un intitulé de section se lit mieux qu'une
        liste plate coupée d'un seul trait, et une section entièrement masquée par
        les droits ou les modules disparaît avec son titre.
      -->
      <nav class="sidebar-nav">
        <section class="nav-section" *ngFor="let section of visibleSections(); trackBy: trackBySection">
          <h2>{{ section.label }}</h2>

          <ng-container *ngFor="let item of section.items; trackBy: trackByItem">
            <a *ngIf="item.route; else soon"
               [routerLink]="item.route"
               routerLinkActive="active"
               (click)="closed.emit()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="item.icon" /></svg>
              <span>{{ item.label }}</span>
            </a>

            <ng-template #soon>
              <span class="nav-soon" title="Page pas encore disponible">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="item.icon" /></svg>
                <span>{{ item.label }}</span>
                <em>Bientôt</em>
              </span>
            </ng-template>
          </ng-container>
        </section>
      </nav>

      <button type="button" class="user-card" (click)="signOut()" title="Se déconnecter">
        <span class="user-avatar">{{ initials }}</span>
        <span class="user-text">
          <strong>{{ userName }}</strong>
          <small>{{ userRole }}</small>
        </span>
        <svg class="user-out" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="icons.signOut" /></svg>
      </button>
    </aside>
  `,
  styles: [`
    :host {
      flex: 0 0 272px;
      width: 272px;
      display: flex;
      min-height: 0;
      /* Même pile que le reste de l'application. */
      font-family: 'Lato', 'Segoe UI', system-ui, sans-serif;
    }

    /**
     * Rail sombre.
     *
     * Le menu reprend le dégradé des bandeaux de page plutôt que le blanc, qui le
     * confondait avec le contenu. La rangée du gabarit fixe déjà la hauteur : il
     * la remplit, sans défilement propre.
     */
    .sidebar {
      /*
       * L'hôte du composant fixe déjà la largeur totale à 272px (plus haut) —
       * cet élément doit donc se rétrécir pour laisser la place à ses propres
       * marges, pas garder 272px pour lui seul. Une largeur figée ici
       * referait déborder la boîte visible hors de son propre hôte.
       */
      flex: 1 1 auto;
      min-height: 0;
      /*
       * Le retrait vertical vient de la rangée, commun aux deux colonnes. À
       * droite, sans cette marge, le contenu touchait le menu : comme le menu
       * a des coins arrondis sur tout son pourtour, le contenu — carré, lui —
       * venait combler l'espace laissé par la courbe, donnant l'impression
       * qu'un bloc blanc mordait sur le menu.
       */
      margin: 0 1rem;
      padding: 1.5rem 0.9rem 1rem;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #1b3f7d 0%, #16346b 45%, #14243c 100%);
      border-radius: 24px;
      box-shadow: 0 18px 44px rgba(16, 28, 48, 0.22);
      color: #fff;
    }

    /* ---------- Marque ---------- */

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 0 0.5rem 1.4rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.14);
      text-decoration: none;
      color: #fff;
    }

    .brand-mark {
      flex: 0 0 44px;
      width: 44px;
      height: 44px;
      border-radius: 14px;
      background: linear-gradient(135deg, #f4551d 0%, #ff8748 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(244, 85, 29, 0.4);
    }

    .brand-mark svg { width: 23px; height: 23px; }

    .brand-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* Le nom se replie de lui-même si la place manque : plus de coupure forcée
       au milieu, qui séparait « Rosée » de « d'Hermon ». */
    .brand-text strong {
      font-size: 1.05rem;
      font-weight: 800;
      line-height: 1.2;
      letter-spacing: -0.015em;
    }

    .brand-text small {
      margin-top: 0.1rem;
      font-size: 0.64rem;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.5);
    }

    /* ---------- Navigation ---------- */

    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      flex: 1 1 auto;
      overflow-y: auto;
      /* Barre de défilement discrète sur fond sombre. */
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.24) transparent;
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .nav-section h2 {
      margin: 0 0 0.4rem;
      padding-left: 0.9rem;
      font-size: 0.62rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.42);
    }

    .sidebar-nav a,
    .nav-soon {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.68rem 0.9rem;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.78);
      text-decoration: none;
      white-space: nowrap;
      transition: background 0.16s ease, color 0.16s ease;
    }

    .sidebar-nav svg {
      flex: 0 0 20px;
      width: 20px;
      height: 20px;
      fill: currentColor;
      opacity: 0.72;
    }

    .sidebar-nav a:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    .sidebar-nav a:hover svg { opacity: 1; }

    /* Entrée courante : la pastille orange des pages publiques. */
    .sidebar-nav a.active {
      background: linear-gradient(135deg, #f4551d 0%, #ff8748 100%);
      color: #fff;
      font-weight: 700;
      box-shadow: 0 10px 22px rgba(244, 85, 29, 0.34);
    }

    .sidebar-nav a.active svg { opacity: 1; }

    .sidebar-nav a:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55);
    }

    /* Page pas encore développée : même gabarit, mais inerte. */
    .nav-soon {
      color: rgba(255, 255, 255, 0.42);
      cursor: default;
    }

    .nav-soon svg { opacity: 0.5; }

    .nav-soon em {
      margin-left: auto;
      font-style: normal;
      font-size: 0.6rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      padding: 0.12rem 0.45rem;
    }

    /* ---------- Carte du compte ---------- */

    .user-card {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      width: 100%;
      margin-top: 1rem;
      padding: 0.65rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 16px;
      cursor: pointer;
      text-align: left;
      font: inherit;
      color: #fff;
      transition: background 0.16s ease, border-color 0.16s ease;
    }

    .user-card:hover {
      background: rgba(255, 255, 255, 0.16);
      border-color: rgba(255, 255, 255, 0.3);
    }

    .user-card:focus-visible {
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.55);
    }

    .user-avatar {
      flex: 0 0 38px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f4551d 0%, #ff8748 100%);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.88rem;
    }

    .user-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      line-height: 1.25;
    }

    .user-text strong {
      font-size: 0.9rem;
      font-weight: 700;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-text small {
      font-size: 0.76rem;
      color: rgba(255, 255, 255, 0.58);
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-out {
      flex: 0 0 18px;
      width: 18px;
      height: 18px;
      margin-left: auto;
      fill: rgba(255, 255, 255, 0.6);
    }

    .user-card:hover .user-out { fill: #ff8748; }

    /* ---------- Adaptatif : tiroir coulissant ---------- */

    @media (max-width: 1100px) {
      :host { flex: 0 0 0; width: 0; }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 60;
        height: 100vh;
        width: 272px;
        margin: 0;
        border-radius: 0 24px 24px 0;
        transform: translateX(-105%);
        transition: transform 0.25s ease;
      }

      .sidebar.open { transform: translateX(0); }
    }
  `]
})
export class AppSidebar {
  /** Ouverture du tiroir sur petit écran. */
  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

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

  readonly icons = ICONS;

  /**
   * Le menu ne montre que ce que le rôle autorise **et** ce que le groupe a comme
   * modules : un groupe qui ne tient que son annuaire n'a pas d'entrée
   * « Événements », et réciproquement. Une section vidée par ces règles disparaît
   * avec son intitulé.
   *
   * `computed` et non un accesseur : la liste contient des objets fabriqués sur
   * place, et un accesseur en aurait rendu de neufs à chaque cycle de détection.
   * `*ngFor` suit l'identité — il aurait donc détruit et recréé tout le menu en
   * boucle, `routerLinkActive` relançant un cycle à chaque fois. Ici le calcul ne
   * rejoue que si les rôles ou les modules changent.
   */
  readonly visibleSections = computed<NavSection[]>(() => {
    const roles = this.auth.user().roles;
    const features = this.auth.features();

    return this.sections
      .map((section) => ({
        label: section.label,
        items: section.items.filter((item) => {
          const roleOk = !item.roles || !this.auth.configured || item.roles.some((role) => roles.includes(role));
          const featureOk = !item.feature || features.includes(item.feature);
          return roleOk && featureOk;
        })
      }))
      .filter((section) => section.items.length > 0);
  });

  /** Identifie par l'intitulé : le menu ne se réorganise pas en cours de session. */
  trackBySection(_index: number, section: NavSection): string {
    return section.label;
  }

  trackByItem(_index: number, item: NavItem): string {
    return item.label;
  }

  signOut(): void {
    this.auth.signOut();
    this.router.navigate(['/login']);
  }

  // Les entrées sans `route` reprennent la maquette mais n'ont pas encore de page.
  sections: NavSection[] = [
    {
      label: 'Pilotage',
      items: [
        { label: 'Tableau de bord', icon: ICONS.dashboard, route: '/app/dashboard' },
        { label: 'Groupes', icon: ICONS.groups, route: '/app/groups', roles: [ROLES.SUPER_ADMIN] }
      ]
    },
    {
      label: 'Communauté',
      items: [
        { label: 'Membres', icon: ICONS.members, route: '/app/members', feature: FEATURES.MEMBERS },
        { label: 'Présences', icon: ICONS.attendance, feature: FEATURES.MEMBERS }
      ]
    },
    {
      label: 'Activité',
      items: [
        { label: 'Événements', icon: ICONS.events, route: '/app/events', feature: FEATURES.EVENTS },
        { label: 'Dons', icon: ICONS.donations },
        { label: 'Communications', icon: ICONS.messages }
      ]
    },
    {
      label: 'Réglages',
      items: [{ label: 'Paramètres', icon: ICONS.settings }]
    }
  ];

  get initials(): string {
    return this.userName
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase();
  }
}
