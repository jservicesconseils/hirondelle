import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ROLES } from '../../core/auth/auth.model';

/**
 * En-tête commun aux pages publiques.
 *
 * Les entrées de navigation pointent vers des sections de l'accueil : depuis
 * l'accueil on y défile, depuis une autre page on y revient d'abord.
 */
@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-header.component.html',
  styleUrls: ['./public-header.component.scss']
})
export class PublicHeaderComponent implements AfterViewInit, OnDestroy {
  /** Repère placé au-dessus de l'en-tête : sa sortie de l'écran déclenche l'ombre. */
  @ViewChild('sentinel', { static: true }) sentinel!: ElementRef<HTMLElement>;

  scrolled = false;
  menuOpen = false;

  private observer?: IntersectionObserver;

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  /** Nom affiché : celui de la fiche membre liée au compte, sinon le courriel. */
  get userName(): string {
    const user = this.auth.user();
    const full = `${user.member?.firstName ?? ''} ${user.member?.lastName ?? ''}`.trim();
    return full || user.email || 'Mon compte';
  }

  get initials(): string {
    const user = this.auth.user();
    const letters = `${user.member?.firstName?.charAt(0) ?? ''}${user.member?.lastName?.charAt(0) ?? ''}`;
    return (letters || this.userName.charAt(0)).toUpperCase();
  }

  get roleLabel(): string {
    const roles = this.auth.user().roles;
    if (roles.includes(ROLES.SUPER_ADMIN)) return 'Super administrateur';
    if (roles.includes(ROLES.GROUP_ADMIN)) return 'Administrateur';
    return 'Membre';
  }

  /** Les administrateurs vont à leur espace ; les autres à la création d'événement. */
  get workspaceLink(): string {
    return this.auth.canAdminister() ? '/app/dashboard' : '/app/events';
  }

  signOut(): void {
    this.auth.signOut();
    this.menuOpen = false;
    this.router.navigate(['/web']);
  }

  /**
   * `styles.scss` fait de `app-root` le conteneur de défilement : la fenêtre ne
   * défile donc pas et `window:scroll` ne serait jamais émis. Un observateur
   * d'intersection fonctionne quel que soit l'élément qui défile réellement.
   */
  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(([entry]) => (this.scrolled = !entry.isIntersecting));
    this.observer.observe(this.sentinel.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  goTo(anchor: string): void {
    this.menuOpen = false;

    if (this.currentPath === '/web') {
      scrollToAnchor(anchor);
      return;
    }

    // La section n'existe pas sur cette page : revenir à l'accueil, puis y défiler
    // une fois le nouveau gabarit rendu.
    this.router.navigate(['/web']).then(() => setTimeout(() => scrollToAnchor(anchor), 60));
  }

  private get currentPath(): string {
    return this.router.url.split('?')[0].split('#')[0];
  }
}

export function scrollToAnchor(anchor: string): void {
  document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
