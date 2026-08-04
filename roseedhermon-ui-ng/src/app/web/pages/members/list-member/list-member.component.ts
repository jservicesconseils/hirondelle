import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AgGridModule } from 'ag-grid-angular';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ClientSideRowModelModule, ColDef, ModuleRegistry, GridOptions, DomLayoutType, PaginationModule } from 'ag-grid-community';
import { Member } from '../../../../shared/services/api/model/member';
import { MemberService } from '../../../../shared/services/members/members.service';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { ImportContactComponent } from '../import-contact/import-contact.component';
import { ImportModalComponent } from '../import-modal/import-modal.component';
import { InvalidModalComponent } from '../invalid-modal/invalid-modal.component';
import { DetailMemberComponent } from '../detail-member/detail-member.component';
import { CalendarModule } from 'primeng/calendar';

ModuleRegistry.registerModules([ClientSideRowModelModule, PaginationModule]);

@Component({
  selector: 'app-list-member',
  standalone: true,
  templateUrl: './list-member.component.html',
  styleUrls: ['./list-member.component.scss'],
  imports: [
    CommonModule,
    HttpClientModule,
    AgGridModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    AutoCompleteModule,
    ReactiveFormsModule,
    FormsModule,
    ImportContactComponent,
    ImportModalComponent,
    InvalidModalComponent,
    DetailMemberComponent,
    CalendarModule,
    ToastModule
  ],
  providers: [MessageService]
})
export class ListMemberComponent implements OnInit, OnDestroy {
  memberList: Member[] = [];
  previewData: Member[] = [];
  invalidRows: any[] = [];
  paginationPageSize = 15;

  showSuccessMessage = false;
  selectedMember: Member | null = null;
  showDetailPanel = false;

  // Modal d'ajout de membre
  addMemberDialogVisible = false;
  addMemberForm: FormGroup;

  // Modal d'édition de membre
  editMemberDialogVisible = false;
  editMemberForm: FormGroup;
  memberBeingEdited: Member | null = null;

  // Filtres autocomplete avec debounce
  firstNameFilter: string = '';
  lastNameFilter: string = '';
  phoneFilter: string = '';
  firstNameSuggestions: string[] = [];
  lastNameSuggestions: string[] = [];
  phoneSuggestions: string[] = [];
  filteredMemberList: Member[] = [];

  // Subject pour le debounce
  private filterSubject = new Subject<void>();
  private destroy$ = new Subject<void>();

  columnDefs: ColDef<Member>[] = [
    { 
      headerName: 'Numéro',
      width: 80,
      cellRenderer: (params: any) => {
        const page = params.api.paginationGetCurrentPage?.() || 0;
        const pageSize = params.api.paginationGetPageSize?.() || 15;
        const displayNumber = (page * pageSize) + (params.node.rowIndex ?? 0) + 1;
        return `
          <span class="icon-cell">
            <i class="pi pi-hashtag" style="color:#6c757d; margin-right:6px;"></i>${displayNumber}
          </span>
        `;
      }
    },
    { 
      field: 'id', 
      headerName: 'ID',
      width: 120,
      hide: true,
      cellRenderer: (params: any) => `
        <span class="icon-cell">
          <i class="pi pi-key" style="color:#2e31a4; margin-right:6px;"></i>${params.value || 'N/A'}
        </span>
      `
    },
    { 
      field: 'firstName', 
      headerName: 'Prénom',
      cellRenderer: (params: any) => `
        <span class="icon-cell">
          <i class="pi pi-user" style="color:#2e31a4; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'lastName', 
      headerName: 'Nom',
      cellRenderer: (params: any) => `
        <span class="icon-cell">
          <i class="pi pi-id-card" style="color:#3f51b5; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'gender', 
      headerName: 'Genre',
      cellRenderer: (params: any) => `
        <span class="icon-cell">
          <i class="pi pi-venus-mars" style="color:#4caf50; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'birthDate', 
      headerName: 'Date de naissance',
      cellRenderer: (params: any) => {
        const date = new Date(params.value);
        return `
          <span class="icon-cell">
            <i class="pi pi-calendar" style="color:#ff9800; margin-right:6px;"></i>${date.toLocaleDateString('fr-FR')}
          </span>
        `;
      }
    },
    { 
      field: 'profession', 
      headerName: 'Profession',
      cellRenderer: (params: any) => `
        <span class="icon-cell">
          <i class="pi pi-briefcase" style="color:#9c27b0; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'phoneNumber', 
      headerName: 'Téléphone',
      cellRenderer: (params: any) => `
        <span class="icon-cell">
          <i class="pi pi-phone" style="color:#2196f3; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'email', 
      headerName: 'Email',
      cellRenderer: (params: any) => `
        <span class="icon-cell">
          <i class="pi pi-envelope" style="color:#f44336; margin-right:6px;"></i>${params.value}
        </span>
      `
    },
    { 
      field: 'city', 
      headerName: 'Ville',
      cellRenderer: (params: any) => `
        <span class="icon-cell">
          <i class="pi pi-map-marker" style="color:#607d8b; margin-right:6px;"></i>${params.value}
        </span>
      `
    }
  ];
  defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  gridOptions: GridOptions<Member> = {
    suppressColumnVirtualisation: true,
    suppressRowVirtualisation: false,
    suppressHorizontalScroll: true,
    domLayout: 'normal' as DomLayoutType,
    pagination: true,
    paginationPageSize: 15,
    paginationAutoPageSize: false,
    paginationPageSizeSelector: false
  };

  importModalVisible = false;
  invalidModalVisible = false;
  progress = 0;
  loading = false;

  constructor(
    private memberService: MemberService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {
    this.addMemberForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      birthDate: ['', Validators.required],
      profession: [''],
      phoneNumber: [''],
      email: [''],
      city: ['']
    });

    this.editMemberForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      birthDate: ['', Validators.required],
      profession: [''],
      phoneNumber: [''],
      email: [''],
      city: ['']
    });

    // Configuration du debounce pour le filtrage en temps réel
    this.filterSubject.pipe(
      debounceTime(300), // 300ms de délai
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  ngOnInit(): void {
    this.loadMembers();
  }

  onGridReady(params: any) {
    // Force la configuration de pagination après l'initialisation du grid
    setTimeout(() => {
      params.api.paginationSetPageSize(15);
      params.api.paginationGoToPage(0);
    }, 100);
  }

  loadMembers() {
    this.memberService.getMembers().subscribe({
      next: (data) => {
        this.memberList = data;
        this.filteredMemberList = [...data];
        this.updateSuggestions();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des membres', err);
        console.error('Détails de l\'erreur:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
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

  onRowClicked(event: any) {
    this.selectedMember = event.data;
    this.showDetailPanel = true;
  }

  closeDetailPanel() {
    this.showDetailPanel = false;
    this.selectedMember = null;
  }

  editMember() {
    if (this.selectedMember) {
      console.log('Membre sélectionné pour modification:', this.selectedMember);
      console.log('ID du membre:', this.selectedMember.id);
      this.editMemberForm.patchValue({
        firstName: this.selectedMember.firstName || '',
        lastName: this.selectedMember.lastName || '',
        gender: this.selectedMember.gender || '',
        birthDate: this.selectedMember.birthDate ? new Date(this.selectedMember.birthDate) : null,
        profession: this.selectedMember.profession || '',
        phoneNumber: this.selectedMember.phoneNumber || '',
        email: this.selectedMember.email || '',
        city: this.selectedMember.city || ''
      });
      this.cdr.detectChanges();
      console.log('editMemberForm status:', this.editMemberForm.status, this.editMemberForm.value);
      this.editMemberDialogVisible = true;
      this.memberBeingEdited = this.selectedMember;
    } else {
      console.error('Aucun membre sélectionné pour la modification');
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
    console.log('Bouton Enregistrer cliqué');
    console.log('Appel de onEditMemberSubmit depuis le bouton...');
    this.onEditMemberSubmit();
  }

  onEditMemberSubmit() {
    console.log('=== DÉBUT onEditMemberSubmit ===');
    console.log('memberBeingEdited:', this.memberBeingEdited);
    console.log('editMemberForm.value:', this.editMemberForm.value);
    console.log('editMemberForm.status:', this.editMemberForm.status);
    console.log('editMemberForm.valid:', this.editMemberForm.valid);
    console.log('editMemberForm.errors:', this.editMemberForm.errors);
    this.editMemberForm.updateValueAndValidity();
    this.cdr.detectChanges();
    console.log('SUBMIT: editMemberForm status:', this.editMemberForm.status, 'ID:', this.memberBeingEdited?.id, 'Form values:', this.editMemberForm.value);
    if (this.editMemberForm.valid) {
      if (!this.memberBeingEdited || !this.memberBeingEdited.id) {
        console.error('Aucun membre sélectionné ou ID manquant pour la modification');
        console.error('memberBeingEdited:', this.memberBeingEdited);
        if (this.memberBeingEdited) {
          console.error('ID du membre:', this.memberBeingEdited.id);
        }
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
      console.log('Formulaire valide, mise à jour du membre...');
      console.log('ID du membre à modifier:', this.memberBeingEdited.id);
      const updatedMember: Member = {
        ...this.memberBeingEdited,
        ...this.editMemberForm.value,
        birthDate: this.editMemberForm.value.birthDate ? this.editMemberForm.value.birthDate.toISOString().split('T')[0] : null
      };
      console.log('Membre mis à jour avec ID:', updatedMember.id);
      console.log('updatedMember:', updatedMember);
      this.memberService.updateMember(updatedMember).subscribe({
        next: () => {
          console.log('Mise à jour réussie');
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
          console.error(err);
        }
      });
    } else {
      console.warn('Formulaire invalide à la soumission', this.editMemberForm.errors, this.editMemberForm.value);
    }
    console.log('=== FIN onEditMemberSubmit ===');
  }

  // Modal d'ajout de membre
  showAddMemberDialog() {
    this.addMemberDialogVisible = true;
    this.addMemberForm.reset();
  }

  onCancelAddMember() {
    this.addMemberDialogVisible = false;
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

  handleValidRows(validRows: Member[]) {
    this.previewData = validRows;
    this.importModalVisible = true;
  }

  handleInvalidRows(invalidRows: any[]) {
    this.invalidRows = invalidRows;
    this.invalidModalVisible = true;
  }

  startImport() {
    this.loading = true;
    this.progress = 0;
    this.showSuccessMessage = false;

    const total = this.previewData.length;
    let completed = 0;

    const importNext = () => {
      if (completed >= total) {
        this.loading = false;
        this.progress = 100;
        this.showSuccessMessage = true;
        this.loadMembers();
        return;
      }
      this.memberService.createMember(this.previewData[completed]).subscribe({
        next: () => {
          completed++;
          this.progress = Math.round((completed / total) * 100);
          importNext();
        },
        error: (err) => {
          console.error(`Erreur d'import à la ligne ${completed + 1}`, err);
          completed++;
          this.progress = Math.round((completed / total) * 100);
          importNext();
        }
      });
    };
    importNext();
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

  // Méthodes de filtrage autocomplete avec debounce
  updateSuggestions() {
    const uniqueFirstNames = [...new Set(this.memberList.map(m => m.firstName).filter((name): name is string => Boolean(name)))];
    const uniqueLastNames = [...new Set(this.memberList.map(m => m.lastName).filter((name): name is string => Boolean(name)))];
    const uniquePhones = [...new Set(this.memberList.map(m => m.phoneNumber).filter((phone): phone is string => Boolean(phone)))];
    
    this.firstNameSuggestions = uniqueFirstNames;
    this.lastNameSuggestions = uniqueLastNames;
    this.phoneSuggestions = uniquePhones;
  }

  // Méthodes pour le filtrage en temps réel avec debounce
  onFirstNameChange() {
    this.filterSubject.next();
  }

  onLastNameChange() {
    this.filterSubject.next();
  }

  onPhoneChange() {
    this.filterSubject.next();
  }

  // Méthodes pour les suggestions autocomplete (gardées pour compatibilité)
  filterFirstName(event: any) {
    const query = event.query.toLowerCase();
    this.firstNameSuggestions = this.memberList
      .map(m => m.firstName)
      .filter((name): name is string => Boolean(name))
      .filter(name => name.toLowerCase().includes(query));
  }

  filterLastName(event: any) {
    const query = event.query.toLowerCase();
    this.lastNameSuggestions = this.memberList
      .map(m => m.lastName)
      .filter((name): name is string => Boolean(name))
      .filter(name => name.toLowerCase().includes(query));
  }

  filterPhone(event: any) {
    const query = event.query.toLowerCase();
    this.phoneSuggestions = this.memberList
      .map(m => m.phoneNumber)
      .filter((phone): phone is string => Boolean(phone))
      .filter(phone => phone.toLowerCase().includes(query));
  }

  onFirstNameSelect(event: any) {
    this.firstNameFilter = event.value || event;
    this.applyFilters();
  }

  onLastNameSelect(event: any) {
    this.lastNameFilter = event.value || event;
    this.applyFilters();
  }

  onPhoneSelect(event: any) {
    this.phoneFilter = event.value || event;
    this.applyFilters();
  }

  onFirstNameClear() {
    this.firstNameFilter = '';
    this.applyFilters();
  }

  onLastNameClear() {
    this.lastNameFilter = '';
    this.applyFilters();
  }

  onPhoneClear() {
    this.phoneFilter = '';
    this.applyFilters();
  }

  applyFilters() {
    this.filteredMemberList = this.memberList.filter(member => {
      const firstNameMatch = !this.firstNameFilter || 
        (member.firstName && member.firstName.toLowerCase().includes(this.firstNameFilter.toLowerCase()));
      const lastNameMatch = !this.lastNameFilter || 
        (member.lastName && member.lastName.toLowerCase().includes(this.lastNameFilter.toLowerCase()));
      const phoneMatch = !this.phoneFilter || 
        (member.phoneNumber && member.phoneNumber.toLowerCase().includes(this.phoneFilter.toLowerCase()));
      
      return firstNameMatch && lastNameMatch && phoneMatch;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
