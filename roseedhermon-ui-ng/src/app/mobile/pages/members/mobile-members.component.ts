import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MemberService } from '../../../shared/services/members/members.service';
import { Member } from '../../../shared/services/api/model/member';
import { AuthService } from '../../../core/auth/auth.service';

/** Une fiche de l'annuaire, préparée pour l'affichage. */
interface MemberRow {
  member: Member;
  fullName: string;
  initials: string;
  role: string;
  phone: string;
  city: string;
  email: string;
  /** Lettre de classement, tirée du nom de famille quand il existe. */
  letter: string;
  search: string;
}

/** Les fiches d'une même lettre, sous son intitulé. */
interface LetterGroup {
  letter: string;
  rows: MemberRow[];
}

@Component({
  selector: 'app-mobile-members',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mobile-members.component.html',
  styleUrls: ['./mobile-members.component.scss']
})
export class MobileMembersComponent implements OnInit {
  rows: MemberRow[] = [];
  filteredRows: MemberRow[] = [];
  /**
   * Groupes visibles, recalculés à la demande et non à chaque cycle de détection.
   *
   * Un accesseur qui reconstruirait ces objets à chaque lecture ferait recréer
   * toutes les vues de `*ngFor`, qui suivent l'identité des objets.
   */
  groups: LetterGroup[] = [];

  searchTerm = '';
  loading = true;
  loadError = '';

  /** Nombre de fiches ajoutées à chaque « Charger plus ». */
  private readonly pageSize = 12;
  private visibleCount = this.pageSize;

  constructor(
    private memberService: MemberService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.memberService.getMembers().subscribe({
      next: (members: Member[] | any) => {
        const list: Member[] = Array.isArray(members) ? members : (members?.content ?? members?.data ?? []);
        this.rows = list.map((member) => this.toRow(member)).sort(byName);
        this.applyFilter();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des membres', error);
        this.loadError = `Impossible de charger les membres (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  // --- Entête ------------------------------------------------------------------------

  get groupName(): string {
    return this.auth.user().group?.name?.trim() || "Rosée d'Hermon";
  }

  /** Villes distinctes, comptées sur les fiches réellement chargées. */
  get cityCount(): number {
    return new Set(this.rows.map((row) => row.city).filter(Boolean)).size;
  }

  /** Fiches joignables : celles qui portent un numéro. */
  get reachableCount(): number {
    return this.rows.filter((row) => row.phone).length;
  }

  // --- Filtrage et pagination --------------------------------------------------------

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredRows = term ? this.rows.filter((row) => row.search.includes(term)) : this.rows;
    // Une nouvelle recherche repart de la première page.
    this.visibleCount = this.pageSize;
    this.rebuild();
  }

  /** Reconstruit les groupes de lettres sur la tranche visible. */
  private rebuild(): void {
    const visible = this.filteredRows.slice(0, this.visibleCount);
    const groups: LetterGroup[] = [];
    const index = new Map<string, LetterGroup>();

    visible.forEach((row) => {
      let group = index.get(row.letter);
      if (!group) {
        group = { letter: row.letter, rows: [] };
        index.set(row.letter, group);
        groups.push(group);
      }
      group.rows.push(row);
    });

    this.groups = groups;
  }

  get remainingCount(): number {
    return Math.max(0, this.filteredRows.length - this.visibleCount);
  }

  get shownCount(): number {
    return Math.min(this.visibleCount, this.filteredRows.length);
  }

  loadMore(): void {
    this.visibleCount += this.pageSize;
    this.rebuild();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  trackByGroup(_index: number, group: LetterGroup): string {
    return group.letter;
  }

  trackByRow(_index: number, row: MemberRow): string {
    return row.member.id || row.fullName;
  }

  // --- Actions -----------------------------------------------------------------------

  call(row: MemberRow): void {
    if (row.phone) window.location.href = `tel:${row.phone.replace(/\s/g, '')}`;
  }

  openWhatsApp(row: MemberRow): void {
    const digits = row.phone.replace(/\D/g, '');
    if (!digits) return;
    const message = `Bonjour ${row.member.firstName || ''}, je vous contacte depuis l'application ${this.groupName}.`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank');
  }

  // --- Construction ------------------------------------------------------------------

  private toRow(member: Member): MemberRow {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Sans nom';
    const lastName = (member.lastName || '').trim();

    return {
      member,
      fullName,
      initials:
        `${(member.firstName || '').charAt(0)}${(member.lastName || '').charAt(0)}`.toUpperCase() || '?',
      role: (member.profession || '').trim(),
      phone: (member.phoneNumber || '').trim(),
      city: (member.city || '').trim(),
      email: (member.email || '').trim(),
      // Classement sur le nom de famille, comme un annuaire ; le prénom à défaut.
      letter: firstLetter(lastName || fullName),
      search: [fullName, member.profession, member.phoneNumber, member.city, member.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    };
  }
}

/* ---------- Utilitaires ---------- */

/**
 * Première lettre de classement, accents retirés : « Émile » se range sous E,
 * et non dans une catégorie à part.
 */
function firstLetter(value: string): string {
  const clean = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase();
  const letter = clean.charAt(0);
  return /[A-Z]/.test(letter) ? letter : '#';
}

/** Tri d'annuaire : nom de famille, puis prénom, sans tenir compte des accents. */
function byName(a: MemberRow, b: MemberRow): number {
  const key = (row: MemberRow) =>
    `${row.member.lastName || ''} ${row.member.firstName || ''}`.trim() || row.fullName;
  return key(a).localeCompare(key(b), 'fr', { sensitivity: 'base' });
}
