import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Member } from '../../../../shared/services/api/model/member';
import { MemberService } from '../../../../shared/services/members/members.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { ImportWizardComponent } from '../import-wizard/import-wizard.component';
import { DetailMemberComponent } from '../detail-member/detail-member.component';
import { CalendarModule } from 'primeng/calendar';
import { AuthService } from '../../../../core/auth/auth.service';
import { fieldIconKind, FieldIconKind, primeIconFor } from '../../../../shared/utils/field-icons';

/** Ces concepts ont déjà leur propre colonne fixe : jamais de doublon en colonne dynamique. */
const MERGED_KINDS: FieldIconKind[] = ['city', 'address', 'gender', 'phone'];

/** Colonnes de la maquette qui n'existent pas telles quelles dans `Member`, précalculées. */
interface MemberRow {
  member: Member;
  initials: string;
  fullName: string;
  email: string;
  cityLabel: string;
  role: string;
  /** Date d'ajout : l'`ObjectId` MongoDB porte l'horodatage de création sur ses 4 premiers octets. */
  addedAt: Date | null;
  active: boolean;
}

type SortKey = 'firstName' | 'lastName' | 'city' | 'addedAt';
const PAGE_SIZE = 6;

@Component({
  selector: 'app-list-member',
  standalone: true,
  templateUrl: './list-member.component.html',
  styleUrls: ['./list-member.component.scss'],
  imports: [
    CommonModule,
    HttpClientModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    FormsModule,
    ImportWizardComponent,
    DetailMemberComponent,
    CalendarModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class ListMemberComponent implements OnInit, OnDestroy {
  memberList: Member[] = [];
  rows: MemberRow[] = [];
  filteredRows: MemberRow[] = [];

  /**
   * En-têtes des champs personnalisés réellement présents sur les fiches chargées,
   * dans leur ordre de première apparition — chaque communauté a les siens, ce
   * n'est jamais une liste fixée à l'avance (voir l'assistant d'import).
   */
  customFieldColumns: string[] = [];

  selectedMember: Member | null = null;
  showDetailPanel = false;

  // Barre d'outils
  globalSearch = '';
  sortKey: SortKey = 'firstName';
  sortDescending = false;
  viewMode: 'grid' | 'table' = 'table';

  // Pagination du tableau (et des cartes, qui affichent la même page)
  readonly pageSize = PAGE_SIZE;
  currentPage = 0;

  // Modales
  addMemberDialogVisible = false;
  addMemberForm: FormGroup;
  editMemberDialogVisible = false;
  editMemberForm: FormGroup;
  memberBeingEdited: Member | null = null;
  importWizardVisible = false;

  /** Aperçu de la photo choisie, en data URL : c'est aussi ce qui part à l'API. */
  photoPreview: string | null = null;
  photoError = '';
  editPhotoPreview: string | null = null;
  editPhotoError = '';

  private filterSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  constructor(
    private memberService: MemberService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    protected auth: AuthService
  ) {
    this.addMemberForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      birthDate: ['', Validators.required],
      profession: [''],
      subgroup: [''],
      phoneNumber: [''],
      email: [''],
      city: [''],
      photo: ['']
    });

    this.editMemberForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      birthDate: ['', Validators.required],
      profession: [''],
      subgroup: [''],
      phoneNumber: [''],
      email: [''],
      city: [''],
      photo: ['']
    });

    this.filterSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(() => this.applyFilters());
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  // --- Statistiques de l'entête -------------------------------------------------

  get totalMembers(): number {
    return this.rows.length;
  }

  /** Villes distinctes réellement renseignées sur les fiches. */
  get citiesCount(): number {
    return this.cityCounts().size;
  }

  /** Ville la plus représentée, avec son effectif. */
  get topCity(): string {
    const counts = [...this.cityCounts().entries()].sort((a, b) => b[1] - a[1]);
    return counts.length ? `${counts[0][0]} (${counts[0][1]})` : '—';
  }

  private cityCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    this.rows.forEach((row) => {
      const city = (row.member.city || '').trim();
      if (city) counts.set(city, (counts.get(city) || 0) + 1);
    });
    return counts;
  }

  get newMembers(): number {
    const now = new Date();
    return this.rows.filter((row) =>
      row.addedAt &&
      row.addedAt.getFullYear() === now.getFullYear() &&
      row.addedAt.getMonth() === now.getMonth()
    ).length;
  }

  get currentMonthLabel(): string {
    return new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  // --- Chargement ---------------------------------------------------------------

  loadMembers() {
    this.memberService.getMembers().subscribe({
      next: (data) => {
        this.memberList = data;
        this.rows = data.map((member) => this.toRow(member));
        this.customFieldColumns = this.collectCustomFieldColumns(data);
        this.applyFilters();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des membres', err);
        this.messageService.add({
          severity: 'error',
          summary: '❌ Erreur de connexion',
          detail: `Impossible de charger les membres: ${err.status} ${err.statusText}`,
          life: 5000,
          closable: true,
          key: 'memberLoadErrorToast'
        });
      }
    });
  }

  /**
   * En-têtes distincts, dans l'ordre où ils apparaissent la première fois — sauf ceux qui
   * désignent Ville, Adresse, Genre ou Téléphone : ces concepts ont déjà leur colonne fixe,
   * et un fichier qui les a nommés « Ville » ou « Numéro de téléphone » plutôt que l'en-tête
   * exact attendu par l'assistant d'import ne doit pas dupliquer la colonne.
   */
  private collectCustomFieldColumns(members: Member[]): string[] {
    const columns: string[] = [];
    members.forEach((member) => {
      Object.keys(member.customFields || {}).forEach((key) => {
        if (MERGED_KINDS.includes(fieldIconKind(key))) return;
        if (!columns.includes(key)) columns.push(key);
      });
    });
    return columns;
  }

  /** Icône PrimeIcons adaptée au sens du champ (Ville, Adresse, Genre...), pas à sa provenance. */
  columnIcon(label: string): string {
    return primeIconFor(fieldIconKind(label));
  }

  /**
   * Valeur du champ réel si elle existe ; sinon reprend le premier champ personnalisé qui
   * désigne le même concept (ex. un fichier importé avant que Ville/Adresse/Genre ne
   * deviennent des champs personnalisés par défaut, ou dont l'en-tête diffère du nom attendu).
   */
  mergedFieldValue(member: Member, structured: string | undefined, kind: FieldIconKind): string {
    if (structured) return structured;
    const entry = Object.entries(member.customFields || {}).find(([key]) => fieldIconKind(key) === kind);
    return entry ? entry[1] : '—';
  }

  private toRow(member: Member): MemberRow {
    const first = (member.firstName || '').trim();
    const last = (member.lastName || '').trim();
    const roles = (member as any).roles as string[] | undefined;

    return {
      member,
      initials: `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?',
      fullName: `${first} ${last}`.trim() || 'Sans nom',
      email: member.email || '—',
      cityLabel: member.city ? `${member.city}, France` : '—',
      role: roles?.length ? this.humanizeRole(roles[0]) : (member.profession || 'Membre'),
      addedAt: this.creationDate(member.id),
      active: true
    };
  }

  private humanizeRole(role: string): string {
    const label = role.toLowerCase().replace(/_/g, ' ');
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  /** Les 8 premiers caractères d'un `ObjectId` sont l'horodatage de création, en secondes. */
  private creationDate(id?: string): Date | null {
    if (!id || !/^[0-9a-f]{24}$/i.test(id)) return null;
    return new Date(parseInt(id.substring(0, 8), 16) * 1000);
  }

  // --- Recherche, tri, pagination -----------------------------------------------

  onGlobalSearchChange() {
    this.filterSubject.next();
  }

  setSortKey(key: SortKey) {
    if (this.sortKey === key) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortKey = key;
      this.sortDescending = key === 'addedAt';
    }
    this.applyFilters();
  }

  setViewMode(mode: 'grid' | 'table') {
    this.viewMode = mode;
  }

  applyFilters() {
    const query = this.globalSearch?.toLowerCase().trim() || '';

    const filtered = this.rows.filter((row) => {
      if (!query) return true;
      const haystack = [
        row.fullName,
        row.member.email,
        row.member.city,
        row.member.phoneNumber,
        row.member.profession
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    this.filteredRows = filtered.sort((a, b) => this.compareRows(a, b));
    this.currentPage = Math.min(this.currentPage, Math.max(0, this.totalPages - 1));
  }

  private compareRows(a: MemberRow, b: MemberRow): number {
    const direction = this.sortDescending ? -1 : 1;

    if (this.sortKey === 'addedAt') {
      return direction * ((a.addedAt?.getTime() ?? 0) - (b.addedAt?.getTime() ?? 0));
    }

    const value = (row: MemberRow) =>
      (this.sortKey === 'firstName' ? row.member.firstName
        : this.sortKey === 'lastName' ? row.member.lastName
        : row.member.city) || '';

    return direction * value(a).localeCompare(value(b), 'fr', { sensitivity: 'base' });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRows.length / this.pageSize));
  }

  get pagedRows(): MemberRow[] {
    const start = this.currentPage * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  /** Fenêtre de 5 numéros de page, comme sur la maquette. */
  get pageNumbers(): number[] {
    const total = this.totalPages;
    const start = Math.max(0, Math.min(this.currentPage - 2, total - 5));
    return Array.from({ length: Math.min(5, total) }, (_, index) => start + index);
  }

  get rangeStart(): number {
    return this.filteredRows.length === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.filteredRows.length);
  }

  goToPage(page: number) {
    this.currentPage = Math.max(0, Math.min(page, this.totalPages - 1));
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  // --- Actions de la maquette ----------------------------------------------------

  openMember(row: MemberRow) {
    this.selectedMember = row.member;
    this.showDetailPanel = true;
  }

  sendMessage(row: MemberRow) {
    if (row.member.email) {
      window.location.href = `mailto:${row.member.email}`;
    }
  }

  /** Super admin ou admin du groupe : le backend borne déjà l'admin de groupe à sa propre communauté. */
  get canDeleteMembers(): boolean {
    return this.auth.isSuperAdmin() || this.auth.isGroupAdmin();
  }

  deleteMemberRow(row: MemberRow, event: Event) {
    event.stopPropagation();
    if (!row.member.id) return;

    const confirmed = window.confirm(`Supprimer la fiche de ${row.fullName} ? Cette action est irréversible.`);
    if (!confirmed) return;

    this.memberService.deleteMember(row.member.id).subscribe({
      next: () => {
        this.loadMembers();
        this.messageService.add({
          severity: 'success',
          summary: 'Membre supprimé',
          detail: `${row.fullName} a été retiré de l'annuaire.`,
          life: 5000
        });
      },
      error: (err) => {
        alert('Erreur lors de la suppression du membre');
        console.error(err);
      }
    });
  }

  exportCsv() {
    const header = ['Prénom', 'Nom', 'Genre', 'Date de naissance', 'Profession', 'Téléphone', 'Email', 'Ville'];
    const lines = this.filteredRows.map((row) => [
      row.member.firstName,
      row.member.lastName,
      row.member.gender,
      row.member.birthDate,
      row.member.profession,
      row.member.phoneNumber,
      row.member.email,
      row.member.city
    ]);

    // Le point-virgule et le BOM sont ce qu'Excel en français attend.
    const csv = [header, ...lines]
      .map((cells) => cells.map((cell) => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');

    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'membres.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  closeDetailPanel() {
    this.showDetailPanel = false;
    this.selectedMember = null;
  }

  editMember() {
    if (this.selectedMember) {
      this.editMemberForm.patchValue({
        firstName: this.selectedMember.firstName || '',
        lastName: this.selectedMember.lastName || '',
        gender: this.selectedMember.gender || '',
        birthDate: this.selectedMember.birthDate ? new Date(this.selectedMember.birthDate) : null,
        profession: this.selectedMember.profession || '',
        subgroup: this.selectedMember.subgroup || '',
        phoneNumber: this.selectedMember.phoneNumber || '',
        email: this.selectedMember.email || '',
        city: this.selectedMember.city || '',
        photo: this.selectedMember.photo || ''
      });
      this.editPhotoPreview = this.selectedMember.photo || null;
      this.editPhotoError = '';
      this.cdr.detectChanges();
      this.editMemberDialogVisible = true;
      this.memberBeingEdited = this.selectedMember;
    } else {
      this.messageService.add({
        severity: 'error',
        summary: '❌ Erreur',
        detail: 'Aucun membre sélectionné pour la modification',
        life: 5000,
        closable: true,
        key: 'memberEditErrorToast'
      });
    }
    this.closeDetailPanel();
  }

  onCancelEditMember() {
    this.editMemberDialogVisible = false;
    this.memberBeingEdited = null;
  }

  onEditButtonClick() {
    this.onEditMemberSubmit();
  }

  onEditMemberSubmit() {
    this.editMemberForm.updateValueAndValidity();
    this.cdr.detectChanges();

    if (!this.editMemberForm.valid) {
      console.warn('Formulaire invalide à la soumission', this.editMemberForm.errors, this.editMemberForm.value);
      return;
    }

    if (!this.memberBeingEdited || !this.memberBeingEdited.id) {
      this.messageService.add({
        severity: 'error',
        summary: '❌ Erreur',
        detail: 'Impossible de modifier : aucun membre sélectionné',
        life: 5000,
        closable: true,
        key: 'memberEditErrorToast'
      });
      return;
    }

    const updatedMember: Member = {
      ...this.memberBeingEdited,
      ...this.editMemberForm.value,
      birthDate: this.editMemberForm.value.birthDate
        ? this.editMemberForm.value.birthDate.toISOString().split('T')[0]
        : null
    };

    this.memberService.updateMember(updatedMember).subscribe({
      next: () => {
        this.editMemberDialogVisible = false;
        this.memberBeingEdited = null;
        this.loadMembers();
        this.messageService.add({
          severity: 'success',
          summary: '✅ Modification réussie',
          detail: `Le membre ${updatedMember.firstName} ${updatedMember.lastName} a été modifié avec succès`,
          life: 5000,
          closable: true,
          key: 'memberEditToast'
        });
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        this.messageService.add({
          severity: 'error',
          summary: '❌ Erreur',
          detail: 'Erreur lors de la modification du membre',
          life: 5000,
          closable: true,
          key: 'memberEditErrorToast'
        });
      }
    });
  }

  showAddMemberDialog() {
    this.addMemberDialogVisible = true;
    this.addMemberForm.reset();
    this.photoPreview = null;
    this.photoError = '';
  }

  onCancelAddMember() {
    this.addMemberDialogVisible = false;
  }

  onPhotoSelected(event: Event) {
    this.photoError = '';
    this.readPhoto(
      event,
      (dataUrl) => {
        this.photoPreview = dataUrl;
        this.addMemberForm.patchValue({ photo: dataUrl });
      },
      (message) => (this.photoError = message)
    );
  }

  onEditPhotoSelected(event: Event) {
    this.editPhotoError = '';
    this.readPhoto(
      event,
      (dataUrl) => {
        this.editPhotoPreview = dataUrl;
        this.editMemberForm.patchValue({ photo: dataUrl });
      },
      (message) => (this.editPhotoError = message)
    );
  }

  /** La photo est conservée en data URL : le champ `photo` de l'API est une chaîne. */
  private readPhoto(event: Event, apply: (dataUrl: string) => void, fail: (message: string) => void) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      fail('Formats acceptés : JPG ou PNG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      fail('Image trop lourde : 2 Mo maximum.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => fail('La photo n\'a pas pu être lue.');
    reader.onload = () => {
      apply(String(reader.result));
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  // --- Vider l'annuaire : modal avec confirmation par mot de passe ---------------

  clearAllDialogVisible = false;
  clearAllPassword = '';
  clearAllError = '';
  clearAllBusy = false;

  openClearAllDialog() {
    if (!this.auth.isSuperAdmin()) return;
    this.clearAllPassword = '';
    this.clearAllError = '';
    this.clearAllBusy = false;
    this.clearAllDialogVisible = true;
  }

  closeClearAllDialog() {
    if (this.clearAllBusy) return;
    this.clearAllDialogVisible = false;
  }

  /** Revalide le mot de passe auprès de Cognito avant d'exécuter l'action irréversible. */
  confirmClearAll() {
    const email = this.auth.user().email;
    if (!this.clearAllPassword || !email) {
      this.clearAllError = 'Saisissez votre mot de passe.';
      return;
    }

    this.clearAllBusy = true;
    this.clearAllError = '';

    this.auth
      .signIn(email, this.clearAllPassword)
      .then(() =>
        this.memberService.deleteAllMembers().subscribe({
          next: (res) => {
            this.clearAllDialogVisible = false;
            this.clearAllBusy = false;
            this.loadMembers();
            this.messageService.add({
              severity: 'success',
              summary: 'Annuaire vidé',
              detail: `${res.deleted} fiche(s) supprimée(s).`,
              life: 5000
            });
          },
          error: (err) => {
            this.clearAllBusy = false;
            this.clearAllError = 'Erreur lors de la suppression des membres.';
            console.error(err);
          }
        })
      )
      .catch(() => {
        this.clearAllBusy = false;
        this.clearAllError = 'Mot de passe incorrect.';
      });
  }

  onAddMemberSubmit() {
    if (this.addMemberForm.valid) {
      const newMember: Member = this.addMemberForm.value;
      this.memberService.createMember(newMember).subscribe({
        next: () => {
          this.addMemberDialogVisible = false;
          this.loadMembers();
          this.messageService.add({
            severity: 'success',
            summary: '✅ Ajout réussi',
            detail: `Le membre ${newMember.firstName} ${newMember.lastName} a été ajouté avec succès`,
            life: 5000,
            closable: true,
            key: 'memberAddToast'
          });
        },
        error: (err) => {
          alert('Erreur lors de l\'ajout du membre');
          console.error(err);
        }
      });
    }
  }

  onSaveMember(updatedMember: Member) {
    this.memberService.updateMember(updatedMember).subscribe({
      next: () => {
        this.loadMembers();
        this.closeDetailPanel();
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Membre modifié avec succès'
        });
      },
      error: (err) => {
        alert('Erreur lors de la modification du membre');
        console.error(err);
      }
    });
  }

  trackByRow = (_: number, row: MemberRow) => row.member.id ?? row.fullName;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
