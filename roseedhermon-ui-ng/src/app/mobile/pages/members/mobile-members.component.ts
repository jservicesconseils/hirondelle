import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MemberService } from '../../../shared/services/members/members.service';
import { Member } from '../../../shared/services/api/model/member';
import { AuthService } from '../../../core/auth/auth.service';
import { canonicalLabel, fieldIconKind, FieldIconKind, mergedFieldValue, MERGED_KINDS } from '../../../shared/utils/field-icons';

/** Tracé SVG (`viewBox="0 0 24 24"`) adapté au sens du champ, pas à sa provenance. */
const FIELD_ICON_PATHS: Record<FieldIconKind, string> = {
  city: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z',
  address: 'M12 3 4 9v12h5v-7h6v7h5V9z',
  gender: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  email: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z',
  birthdate: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z',
  group: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  generic: 'M17.63 5.84C17.27 5.33 16.67 5 16 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h11c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z'
};

/** Une fiche de l'annuaire, préparée pour l'affichage. */
interface MemberRow {
  member: Member;
  fullName: string;
  initials: string;
  color: string;
  photo: string;
  role: string;
  subgroup: string;
  /** `subgroup` n'est un second badge que s'il dit vraiment autre chose que `role`. */
  showSubgroupBadge: boolean;
  phone: string;
  city: string;
  address: string;
  email: string;
  gender: string;
  birthDate: string;
  /** Colonnes importées sans équivalent connu : en-tête exact du fichier -> valeur. */
  customFieldEntries: { label: string; value: string; icon: string }[];
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

  /** Fiche dont le bouton Ville a été touché : ouvre le détail par-dessus la grille. */
  selectedRow: MemberRow | null = null;

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

  /**
   * Prénom de la personne connectée, s'il est connu.
   *
   * Rien n'est inventé : sans session (ou sans fiche liée), l'annuaire ne
   * salue simplement personne plutôt que d'afficher un prénom d'emprunt.
   */
  get greeting(): string {
    const firstName = this.auth.user().member?.firstName?.trim();
    return firstName ? `Bonjour, ${firstName}` : '';
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

  /** Ouvre l'application de messagerie du téléphone (SMS), pas WhatsApp — bouton « Message ». */
  openSms(row: MemberRow): void {
    if (!row.phone) return;
    const message = `Bonjour ${row.member.firstName || ''}, je vous contacte depuis l'application ${this.groupName}.`;
    window.location.href = `sms:${row.phone.replace(/\s/g, '')}?body=${encodeURIComponent(message)}`;
  }

  openEmail(row: MemberRow): void {
    if (!row.email) return;
    const subject = `Message depuis ${this.groupName}`;
    window.location.href = `mailto:${row.email}?subject=${encodeURIComponent(subject)}`;
  }

  /** Le bouton Ville ouvre le détail : adresse, courriel, genre et colonnes propres à la communauté. */
  openDetails(row: MemberRow): void {
    this.selectedRow = row;
  }

  closeDetails(): void {
    this.selectedRow = null;
  }

  // --- Construction ------------------------------------------------------------------

  private toRow(member: Member, index: number): MemberRow {
    const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Sans nom';

    const role = (member.profession || '').trim();
    const subgroup = (member.subgroup || '').trim();

    /**
     * Un fichier qui a nommé sa colonne autrement que l'en-tête reconnu par
     * l'assistant d'import (ou importé avant que Ville/Adresse/Genre/Téléphone
     * ne deviennent des champs structurés) laisse la valeur dans customFields
     * plutôt que sur le champ structuré — Appeler/WhatsApp restaient alors
     * invisibles bien que la fiche ait un numéro, et Ville/Adresse/Genre
     * disparaissaient complètement de la ligne du haut une fois leur doublon
     * retiré de « Ma communauté ». On les retrouve tous ici, comme sur la
     * fiche d'édition du site.
     */
    const customFields = member.customFields || {};
    const phone = mergedFieldValue(customFields, member.phoneNumber, 'phone');

    return {
      member,
      fullName,
      initials:
        `${(member.firstName || '').charAt(0)}${(member.lastName || '').charAt(0)}`.toUpperCase() || '?',
      color: AVATAR_COLORS[index % AVATAR_COLORS.length],
      photo: (member.photo || '').trim(),
      role,
      subgroup,
      showSubgroupBadge: !!subgroup && subgroup.toLowerCase() !== role.toLowerCase(),
      phone,
      city: mergedFieldValue(customFields, member.city, 'city'),
      address: mergedFieldValue(customFields, member.address, 'address'),
      email: (member.email || '').trim(),
      gender: formatGender(mergedFieldValue(customFields, member.gender, 'gender')),
      birthDate: formatBirthDate(member.birthDate),
      // Ville, Adresse, Genre et Téléphone ont déjà leur ligne structurée
      // ci-dessus (au besoin reprise ici même depuis customFields, comme le
      // numéro) : les repasser en plus dans « Ma communauté » les dupliquerait
      // à l'écran, sous le nom exact de la colonne importée cette fois.
      customFieldEntries: Object.entries(customFields)
        .filter(([label]) => !MERGED_KINDS.includes(fieldIconKind(label)))
        .map(([label, value]) => {
          const kind = fieldIconKind(label);
          return { label: canonicalLabel(kind) ?? label, value, icon: FIELD_ICON_PATHS[kind] };
        }),
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
