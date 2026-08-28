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
  color: string;
  photo: string;
  role: string;
  subgroup: string;
  phone: string;
  city: string;
  address: string;
  email: string;
  gender: string;
  birthDate: string;
  /** Colonnes importées sans équivalent connu : en-tête exact du fichier -> valeur. */
  customFieldEntries: { label: string; value: string }[];
  search: string;
}

/** Un sous-groupe réel, tiré des fonctions déjà renseignées sur les fiches — jamais inventé. */
interface Subgroup {
  name: string;
  count: number;
}

/** Teintes des initiales, quand aucune photo n'est déposée sur la fiche. */
const AVATAR_COLORS = ['#dc4a22', '#6d3be4', '#0e8f72', '#2360d4', '#c07a06', '#c42e6b'];

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
   * Sous-groupes réellement présents dans l'annuaire, avec leur effectif.
   *
   * Recalculés à la demande et non à chaque cycle de détection : un accesseur
   * qui reconstruirait ce tableau à chaque lecture ferait recréer toutes les
   * vues de `*ngFor`, qui suivent l'identité des objets.
   */
  subgroups: Subgroup[] = [];
  /** `''` = tous les sous-groupes confondus. */
  activeSubgroup = '';

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
        this.rows = list.map((member, index) => this.toRow(member, index)).sort(byName);
        this.buildSubgroups();
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
    return this.auth.user().group?.name?.trim() || 'Hirondelle';
  }

  /** Villes distinctes, comptées sur les fiches réellement chargées. */
  get cityCount(): number {
    return new Set(this.rows.map((row) => row.city).filter(Boolean)).size;
  }

  /** Fiches joignables : celles qui portent un numéro. */
  get reachableCount(): number {
    return this.rows.filter((row) => row.phone).length;
  }

  // --- Sous-groupes --------------------------------------------------------------------

  /**
   * Un onglet par sous-groupe distinct (ex. Pasteur, Diacre, Administrateur) —
   * reprise de ce que chaque fiche porte déjà comme sous-groupe (import ou fiche
   * manuelle), jamais une catégorie ajoutée pour l'occasion. Distinct de la
   * profession, qui reste affichée sur la fiche mais ne sert plus à grouper.
   * Sans sous-groupe renseigné sur aucune fiche, seul l'onglet « Tous » reste.
   */
  private buildSubgroups(): void {
    const counts = new Map<string, number>();
    this.rows.forEach((row) => {
      if (row.subgroup) counts.set(row.subgroup, (counts.get(row.subgroup) ?? 0) + 1);
    });

    this.subgroups = [...counts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'fr', { sensitivity: 'base' }))
      .map(([name, count]) => ({ name, count }));
  }

  pickSubgroup(name: string): void {
    // Un second appui retire le filtre : pas de bouton « Tous » à aller chercher.
    this.activeSubgroup = this.activeSubgroup === name ? '' : name;
    this.applyFilter();
  }

  // --- Filtrage et pagination --------------------------------------------------------

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredRows = this.rows.filter((row) => {
      if (this.activeSubgroup && row.subgroup !== this.activeSubgroup) return false;
      if (term && !row.search.includes(term)) return false;
      return true;
    });

    // Un nouveau filtre repart de la première page.
    this.visibleCount = this.pageSize;
  }

  get remainingCount(): number {
    return Math.max(0, this.filteredRows.length - this.visibleCount);
  }

  get shownCount(): number {
    return Math.min(this.visibleCount, this.filteredRows.length);
  }

  get shownRows(): MemberRow[] {
    return this.filteredRows.slice(0, this.visibleCount);
  }

  loadMore(): void {
    this.visibleCount += this.pageSize;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }

  /** Le bouton réglages, à côté de la recherche : repart d'un annuaire non filtré. */
  resetFilters(): void {
    this.searchTerm = '';
    this.activeSubgroup = '';
    this.applyFilter();
  }

  trackBySubgroup(_index: number, group: Subgroup): string {
    return group.name;
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

  private toRow(member: Member, index: number): MemberRow {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Sans nom';

    return {
      member,
      fullName,
      initials:
        `${(member.firstName || '').charAt(0)}${(member.lastName || '').charAt(0)}`.toUpperCase() || '?',
      color: AVATAR_COLORS[index % AVATAR_COLORS.length],
      photo: (member.photo || '').trim(),
      role: (member.profession || '').trim(),
      subgroup: (member.subgroup || '').trim(),
      phone: (member.phoneNumber || '').trim(),
      city: (member.city || '').trim(),
      address: (member.address || '').trim(),
      email: (member.email || '').trim(),
      gender: formatGender(member.gender),
      birthDate: formatBirthDate(member.birthDate),
      customFieldEntries: Object.entries(member.customFields || {}).map(([label, value]) => ({ label, value })),
      search: [
        fullName,
        member.profession,
        member.subgroup,
        member.phoneNumber,
        member.city,
        member.email,
        ...Object.values(member.customFields || {})
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    };
  }
}

/** Reprend telle quelle la valeur importée : « Homme »/« Femme » aussi bien que MALE/FEMALE. */
function formatGender(gender: Member.GenderEnum | string | undefined): string {
  switch (gender) {
    case 'MALE': return 'Homme';
    case 'FEMALE': return 'Femme';
    case 'OTHER': return 'Autre';
    default: return (gender || '').trim();
  }
}

/** `T00:00:00` évite qu'une date sans heure ne recule d'un jour selon le fuseau du navigateur. */
function formatBirthDate(birthDate: string | undefined): string {
  if (!birthDate) return '';
  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Tri d'annuaire : nom de famille, puis prénom, sans tenir compte des accents. */
function byName(a: MemberRow, b: MemberRow): number {
  const key = (row: MemberRow) =>
    `${row.member.lastName || ''} ${row.member.firstName || ''}`.trim() || row.fullName;
  return key(a).localeCompare(key(b), 'fr', { sensitivity: 'base' });
}
