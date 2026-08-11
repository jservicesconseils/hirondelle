import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { Member } from '../../../../shared/services/api/model/member';
import { GroupEntity } from '../../../../shared/services/api/model/groupEntity';
import { GroupService } from '../../../../shared/services/groups/groups.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PublicHeaderComponent } from '../../../components/public-header.component';
import { PublicFooterComponent } from '../../../components/public-footer.component';

/** Une fiche prête à afficher : rien n'est inventé, un champ absent vaut `null`. */
interface MemberCard {
  member: Member;
  name: string;
  initials: string;
  role: string;
  profession: string | null;
  city: string | null;
  email: string | null;
  phoneNumber: string | null;
  photo: string | null;
  /** Couleur dérivée du nom, pour que chaque fiche garde la même teinte. */
  color: string;
}

const AVATAR_COLORS = [
  'linear-gradient(140deg, #ff9a6b 0%, #e0491c 100%)',
  'linear-gradient(140deg, #b79bff 0%, #6d3be4 100%)',
  'linear-gradient(140deg, #6fe3c0 0%, #0e8f72 100%)',
  'linear-gradient(140deg, #8fb8ff 0%, #2360d4 100%)',
  'linear-gradient(140deg, #ffd879 0%, #c07a06 100%)',
  'linear-gradient(140deg, #ff9cc2 0%, #c42e6b 100%)'
];

const PAGE_SIZE = 12;

/**
 * Annuaire des membres.
 *
 * Visible uniquement une fois connecté — la garde de route s'en charge, le serveur
 * aussi. Le groupe se choisit : un super administrateur les parcourt tous, les
 * autres ne voient que le leur, et le serveur applique la même règle.
 */
@Component({
  selector: 'app-web-members',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './web-members.component.html',
  styleUrls: ['./web-members.component.scss']
})
export class WebMembersComponent implements OnInit {
  groups: GroupEntity[] = [];
  selectedGroupId = '';

  cards: MemberCard[] = [];
  loading = true;
  loadError = '';

  query = '';
  visible = PAGE_SIZE;

  constructor(
    public auth: AuthService,
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        // Le groupe de la session d'abord ; sinon le premier de la liste.
        this.selectedGroupId = this.auth.user().groupId || groups[0]?.id || '';
        if (this.selectedGroupId) {
          this.loadMembers();
        } else {
          this.loading = false;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.loadError = `Les groupes n'ont pas pu être chargés (${error?.status || 'réseau'}).`;
      }
    });
  }

  /** Un super administrateur peut passer d'un groupe à l'autre ; pas les autres. */
  get canSwitchGroup(): boolean {
    return this.auth.isSuperAdmin() && this.groups.length > 1;
  }

  get selectedGroup(): GroupEntity | null {
    return this.groups.find((group) => group.id === this.selectedGroupId) ?? null;
  }

  onGroupChange(): void {
    this.visible = PAGE_SIZE;
    this.loadMembers();
  }

  loadMembers(): void {
    if (!this.selectedGroupId) return;

    this.loading = true;
    this.loadError = '';

    this.groupService.getGroupMembers(this.selectedGroupId).subscribe({
      next: (members) => {
        this.cards = members.map((member, index) => toCard(member, index));
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.cards = [];
        this.loadError =
          error?.status === 403
            ? "Vous n'avez pas accès à l'annuaire de ce groupe."
            : `L'annuaire n'a pas pu être chargé (${error?.status || 'réseau'}).`;
      }
    });
  }

  // --- Recherche --------------------------------------------------------------------

  get filtered(): MemberCard[] {
    const needle = this.query.trim().toLowerCase();
    if (!needle) return this.cards;

    return this.cards.filter((card) =>
      [card.name, card.profession, card.city, card.email]
        .filter((value): value is string => !!value)
        .some((value) => value.toLowerCase().includes(needle))
    );
  }

  get shown(): MemberCard[] {
    return this.filtered.slice(0, this.visible);
  }

  get remaining(): number {
    return Math.max(0, this.filtered.length - this.visible);
  }

  loadMore(): void {
    this.visible += PAGE_SIZE;
  }
}

function toCard(member: Member, index: number): MemberCard {
  const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();

  return {
    member,
    name: name || 'Sans nom',
    initials: initialsOf(member),
    role: roleLabel(member.roles),
    profession: member.profession?.trim() || null,
    city: member.city?.trim() || null,
    email: member.email?.trim() || null,
    phoneNumber: member.phoneNumber?.trim() || null,
    photo: member.photo?.trim() || null,
    color: AVATAR_COLORS[index % AVATAR_COLORS.length]
  };
}

function initialsOf(member: Member): string {
  const letters = `${member.firstName?.charAt(0) ?? ''}${member.lastName?.charAt(0) ?? ''}`.trim();
  return (letters || '?').toUpperCase();
}

function roleLabel(roles?: Array<string>): string {
  if (roles?.includes('SUPER_ADMIN')) return 'Super administrateur';
  if (roles?.includes('GROUP_ADMIN')) return 'Administrateur';
  return 'Membre';
}
