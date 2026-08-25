import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { GroupEntity } from '../../../shared/services/api/model/groupEntity';
import { Member } from '../../../shared/services/api/model/member';
import { GroupService, GroupStats, GroupWithCount, GroupsOverview } from '../../../shared/services/groups/groups.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Feature, FEATURES } from '../../../core/auth/auth.model';

/** Un module, tel qu'il est présenté dans l'écran. */
interface FeatureChoice {
  key: Feature;
  label: string;
  description: string;
  icon: string;
}

/**
 * Dégradés des vignettes, repris des couleurs de catégorie des pages publiques.
 * Décoratifs : voir `gradientOf`.
 */
const CARD_GRADIENTS = [
  'linear-gradient(135deg, #f4551d 0%, #ff8748 100%)',
  'linear-gradient(135deg, #2b5fb8 0%, #3d78d6 100%)',
  'linear-gradient(135deg, #1f9d76 0%, #4fc79f 100%)',
  'linear-gradient(135deg, #6d40e8 0%, #a07bff 100%)',
  'linear-gradient(135deg, #e0387f 0%, #ff6fae 100%)',
  'linear-gradient(135deg, #f5a623 0%, #ffca6b 100%)'
];

/** Même liste que le formulaire de demande côté membre (`/web/creer-un-groupe`). */
const TYPE_CHOICES = ['Association', 'Club', 'Famille', 'Communauté religieuse', 'École', 'Entreprise', 'Autre'];

const FEATURE_CHOICES: FeatureChoice[] = [
  {
    key: FEATURES.EVENTS,
    label: 'Événements',
    description: 'Agenda du groupe, événements réservés, inscriptions et billets.',
    icon: 'pi-calendar'
  },
  {
    key: FEATURES.MEMBERS,
    label: 'Membres',
    description: 'Annuaire du groupe, fiches, invitations et import.',
    icon: 'pi-users'
  }
];

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {
  readonly typeChoices = TYPE_CHOICES;

  overview: GroupsOverview | null = null;
  groups: GroupWithCount[] = [];

  loading = true;
  loadError = '';

  search = '';

  /** Onglet courant : tous les groupes, ou ceux qui portent tel module. */
  tab: 'all' | Feature = 'all';

  /** Groupe dont on consulte l'annuaire, dans le panneau de droite. */
  selectedGroup: GroupWithCount | null = null;
  groupMembers: Member[] = [];
  membersLoading = false;
  groupStats: GroupStats | null = null;
  statsLoading = false;

  // --- Demandes de création en attente ------------------------------------------------
  pendingRequests: GroupEntity[] = [];
  requestsLoading = false;
  decidingId: string | null = null;
  decideError = '';

  /** Id de la demande dont on saisit le motif de refus, ou `null`. */
  rejectingId: string | null = null;
  rejectReason = '';

  // Formulaire de création
  formVisible = false;
  saving = false;
  saveError = '';
  form: GroupEntity = {};

  constructor(
    private groupService: GroupService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
    if (this.auth.isSuperAdmin()) this.loadRequests();
  }

  get filteredGroups(): GroupWithCount[] {
    const term = this.search.trim().toLowerCase();

    return this.groups.filter((group) => {
      if (this.tab !== 'all' && !this.hasFeature(group, this.tab)) return false;
      if (!term) return true;
      return [group.name, group.city, group.type, group.email].some((value) =>
        (value || '').toLowerCase().includes(term)
      );
    });
  }

  /** Effectif d'un onglet, affiché dans sa pastille. */
  countWith(feature: Feature): number {
    return this.groups.filter((group) => this.hasFeature(group, feature)).length;
  }

  show(tab: 'all' | Feature): void {
    this.tab = tab;
  }

  /**
   * Teinte de la vignette d'un groupe.
   *
   * Purement décoratif : la couleur ne code aucune information, elle donne
   * seulement du rythme à la grille. Elle est tirée de l'identifiant pour rester
   * la même d'un chargement à l'autre — une couleur qui saute à chaque visite
   * laisserait croire qu'elle veut dire quelque chose.
   */
  gradientOf(group: GroupWithCount): string {
    const key = group.id || group.name || '';
    let hash = 0;
    for (let index = 0; index < key.length; index++) hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
    return CARD_GRADIENTS[hash % CARD_GRADIENTS.length];
  }

  get totalMembers(): number {
    return this.overview?.totalMembers ?? this.groups.reduce((sum, group) => sum + group.memberCount, 0);
  }

  get largestGroup(): GroupWithCount | null {
    return this.groups.reduce<GroupWithCount | null>(
      (best, group) => (!best || group.memberCount > best.memberCount ? group : best),
      null
    );
  }

  load(): void {
    this.loading = true;
    this.loadError = '';

    // La vue d'ensemble n'est ouverte qu'au super administrateur ; un administrateur
    // de groupe se rabat sur la liste, qui ne contient de toute façon que le sien.
    if (this.auth.isSuperAdmin() || !this.auth.configured) {
      this.groupService.getOverview().subscribe({
        next: (overview) => {
          this.overview = overview;
          this.groups = overview.groups;
          this.loading = false;
        },
        error: (error) => this.fallbackToList(error)
      });
      return;
    }

    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups.map((group) => ({ ...group, memberCount: 0 }));
        this.loading = false;
      },
      error: (error) => {
        this.loadError = `Impossible de charger les groupes (${error?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  private fallbackToList(error: unknown): void {
    console.warn("Vue d'ensemble indisponible, repli sur la liste", error);
    this.groupService.getGroups().subscribe({
      next: (groups) => {
        this.groups = groups.map((group) => ({ ...group, memberCount: 0 }));
        this.loading = false;
      },
      error: (listError: any) => {
        this.loadError = `Impossible de charger les groupes (${listError?.status || 'réseau'}).`;
        this.loading = false;
      }
    });
  }

  // --- Annuaire d'un groupe --------------------------------------------------------

  openGroup(group: GroupWithCount): void {
    this.selectedGroup = group;
    this.groupMembers = [];
    this.groupStats = null;
    if (!group.id) return;

    this.membersLoading = true;
    this.groupService.getGroupMembers(group.id).subscribe({
      next: (members) => {
        this.groupMembers = members;
        this.membersLoading = false;
      },
      error: () => {
        this.groupMembers = [];
        this.membersLoading = false;
      }
    });

    // Réservé au super administrateur : un administrateur de groupe n'a pas
    // besoin qu'on le lui rappelle, il n'a que le sien.
    if (!this.auth.isSuperAdmin()) return;
    this.statsLoading = true;
    this.groupService.getGroupStats(group.id).subscribe({
      next: (stats) => {
        this.groupStats = stats;
        this.statsLoading = false;
      },
      error: () => {
        this.groupStats = null;
        this.statsLoading = false;
      }
    });
  }

  closeGroup(): void {
    this.selectedGroup = null;
    this.groupMembers = [];
    this.groupStats = null;
  }

  // --- Demandes de création en attente ------------------------------------------------

  loadRequests(): void {
    this.requestsLoading = true;
    this.groupService.getPendingRequests().subscribe({
      next: (requests) => {
        this.pendingRequests = requests;
        this.requestsLoading = false;
      },
      error: () => {
        this.requestsLoading = false;
      }
    });
  }

  approve(request: GroupEntity): void {
    if (!request.id || this.decidingId) return;
    this.decidingId = request.id;
    this.decideError = '';

    this.groupService.approveGroup(request.id).subscribe({
      next: () => {
        this.decidingId = null;
        this.pendingRequests = this.pendingRequests.filter((entry) => entry.id !== request.id);
        this.load();
      },
      error: (error) => {
        this.decidingId = null;
        this.decideError = `L'approbation a échoué (${error?.status || 'réseau'}).`;
      }
    });
  }

  startReject(request: GroupEntity): void {
    this.rejectingId = request.id ?? null;
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.rejectingId = null;
    this.rejectReason = '';
  }

  confirmReject(request: GroupEntity): void {
    if (!request.id || this.decidingId) return;
    this.decidingId = request.id;
    this.decideError = '';

    this.groupService.rejectGroup(request.id, this.rejectReason.trim() || undefined).subscribe({
      next: () => {
        this.decidingId = null;
        this.rejectingId = null;
        this.pendingRequests = this.pendingRequests.filter((entry) => entry.id !== request.id);
      },
      error: (error) => {
        this.decidingId = null;
        this.decideError = `Le refus a échoué (${error?.status || 'réseau'}).`;
      }
    });
  }

  trackByRequest(_index: number, request: GroupEntity): string {
    return request.id || String(_index);
  }

  // --- Création --------------------------------------------------------------------

  openForm(): void {
    // Un groupe créé sans précision fait tout : c'est le cas le plus courant, et
    // retirer un module est plus facile à comprendre que d'en chercher un absent.
    this.form = {
      type: 'Association',
      country: 'Canada',
      features: [FEATURES.EVENTS, FEATURES.MEMBERS],
      showPublicCatalog: true
    };
    this.saveError = '';
    this.formVisible = true;
  }

  // --- Modules d'un groupe -----------------------------------------------------------

  readonly featureChoices = FEATURE_CHOICES;

  /** Modules en cours d'enregistrement, par identifiant de groupe. */
  featureSaving = new Set<string>();
  featureError = '';

  hasFeature(group: GroupEntity, feature: Feature): boolean {
    // Un groupe antérieur à cette notion n'a pas le champ : il fait tout.
    return group.features ? group.features.includes(feature) : true;
  }

  formHasFeature(feature: Feature): boolean {
    return (this.form.features ?? []).includes(feature);
  }

  toggleFormFeature(feature: Feature): void {
    const current = this.form.features ?? [];
    this.form.features = current.includes(feature)
      ? current.filter((entry) => entry !== feature)
      : [...current, feature];
  }

  /**
   * Attribue ou retire un module à un groupe existant.
   *
   * L'affichage est mis à jour avant la réponse pour que la case suive le clic,
   * puis remis en place si le serveur refuse : sur une liste, attendre l'aller-retour
   * donne l'impression que le clic n'a pas porté.
   */
  toggleGroupFeature(group: GroupWithCount, feature: Feature): void {
    if (!group.id || this.featureSaving.has(group.id)) return;

    const before = group.features ? [...group.features] : [FEATURES.EVENTS, FEATURES.MEMBERS];
    const after = before.includes(feature)
      ? before.filter((entry) => entry !== feature)
      : [...before, feature];

    group.features = after;
    this.featureSaving.add(group.id);
    this.featureError = '';

    const { memberCount, ...payload } = group;
    this.groupService.updateGroup(group.id, { ...payload, features: after }).subscribe({
      next: (saved) => {
        group.features = saved.features ?? after;
        this.featureSaving.delete(group.id!);
      },
      error: (error) => {
        group.features = before;
        this.featureSaving.delete(group.id!);
        this.featureError =
          error?.status === 403
            ? 'Seul un super administrateur peut modifier les modules d’un groupe.'
            : `La modification a échoué (${error?.status || 'réseau'}).`;
      }
    });
  }

  isFeatureSaving(group: GroupEntity): boolean {
    return !!group.id && this.featureSaving.has(group.id);
  }

  closeForm(): void {
    this.formVisible = false;
  }

  get canSave(): boolean {
    return !!(this.form.name || '').trim();
  }

  save(): void {
    if (!this.canSave) return;
    this.saving = true;
    this.saveError = '';

    this.groupService.createGroup(this.form).subscribe({
      next: () => {
        this.saving = false;
        this.formVisible = false;
        this.load();
      },
      error: (error) => {
        this.saving = false;
        this.saveError =
          error?.status === 403
            ? "Seul un super administrateur peut créer un groupe."
            : `L'enregistrement a échoué (${error?.status || 'réseau'}).`;
      }
    });
  }

  initialsOf(value?: string): string {
    const parts = (value || '?').trim().split(/\s+/);
    return ((parts[0]?.charAt(0) ?? '') + (parts[1]?.charAt(0) ?? '')).toUpperCase() || '?';
  }

  memberInitials(member: Member): string {
    return `${(member.firstName || '').charAt(0)}${(member.lastName || '').charAt(0)}`.toUpperCase() || '?';
  }

  trackByGroup(_index: number, group: GroupWithCount): string {
    return group.id || group.name || String(_index);
  }
}
