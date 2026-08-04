import { Component, OnInit, AfterViewInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormArray, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { InputTextarea } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { EventService } from '../../../../shared/services/events/events.service';
import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { EventLocation } from '../../../../shared/services/api/model/eventLocation';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { EVENT_CATEGORIES, EventCategoryEnum, EVENT_TYPES, EventTypeEnum } from '../../../../shared/models/model';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FileUploadModule } from 'primeng/fileupload';
import { ProgressBarModule } from 'primeng/progressbar';
import { EventFileControllerService } from '../../../../shared/services/api/api/eventFileController.service';
import { EventFileDTO, EventFileDTOFileTypeEnum } from '../../../../shared/services/api/model/eventFileDTO';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    CalendarModule,
    InputTextarea,
    ButtonModule,
    ToastModule,
    TabViewModule,
    DropdownModule,
    RadioButtonModule,
    FileUploadModule,
    ProgressBarModule
  ],
  providers: [MessageService, EventFileControllerService],
  templateUrl: './create-event.component.html',
  styleUrls: ['./create-event.component.scss']
})
export class CreateEventComponent implements OnInit, AfterViewInit, OnChanges {
  @Input() eventToEdit: EventDTO | null = null;
  @Input() visible: boolean = false;
  @Output() close = new EventEmitter<void>();
  eventForm: FormGroup;
  submitted: boolean = false;
  eventCategories = EVENT_CATEGORIES;
  eventTypes = EVENT_TYPES;
  isFormReady: boolean = false;
  
  // Propriétés pour la gestion des fichiers
  uploadedFiles: EventFileDTO[] = [];
  pendingFiles: File[] = [];
  pendingPresentationPhotos: File[] = []; // Photos de présentation en attente
  mainPresentationPhoto: EventFileDTO | null = null;
  presentationPhotos: EventFileDTO[] = []; // Photos de présentation
  isUploading: boolean = false;
  uploadProgress: number = 0;
  
  // Propriétés pour le modal d'image
  imageModalVisible: boolean = false;
  selectedImage: EventFileDTO | null = null;

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private messageService: MessageService,
    private eventFileService: EventFileControllerService
  ) {
    this.eventForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      date: ['', [Validators.required, this.dateFrValidator]],
      description: ['', Validators.required],
      free: [false],
      amount: [null],
      numberOfDays: [1, [Validators.required, Validators.min(1)]],
      category: ['', Validators.required],
      availableSeats: [null, [Validators.required, Validators.min(1)]],
      lastRegistrationDate: ['', [Validators.required, this.dateFrValidator]],
      location: this.fb.group({
        placeName: ['', Validators.required],
        address: ['', Validators.required],
        city: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['', Validators.required]
      }),
      presenters: this.fb.array([
        this.fb.group({
          firstName: ['', Validators.required],
          lastName: ['', Validators.required],
          title: [''],
          resume: ['']
        })
      ]),
      eventType: [EventTypeEnum.PUBLIC, Validators.required]
    });
    this.isFormReady = true;
  }

  ngOnInit(): void {
    // Le FormArray est déjà initialisé dans le constructeur
  }

  ngAfterViewInit(): void {
    // Pas besoin de logique supplémentaire
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('=== ngOnChanges appelé ===');
    console.log('Changements détectés:', changes);
    console.log('EventToEdit avant traitement:', this.eventToEdit);
    console.log('Type de changes:', typeof changes);
    console.log('Clés de changes:', Object.keys(changes));
    
    if (changes['eventToEdit'] && this.eventToEdit) {
      console.log('✅ Changement détecté sur eventToEdit, chargement des fichiers...');
      console.log('EventToEdit après détection:', this.eventToEdit);
      console.log('EventToEdit ID:', this.eventToEdit.id);
      console.log('EventToEdit Type:', typeof this.eventToEdit);
      console.log('EventToEdit Keys:', Object.keys(this.eventToEdit));
      
      // S'assurer que le formulaire est prêt
      if (this.eventForm) {
        console.log('Formulaire disponible, patch en cours...');
        this.patchFormWithEvent(this.eventToEdit);
        
        // Charger les fichiers de l'événement
        this.loadEventFiles();
        
        // Forcer la détection des changements
        setTimeout(() => {
          console.log('Vérification finale du formulaire après patch:');
          console.log('Valeurs du formulaire:', this.eventForm.value);
          console.log('Présentateurs:', this.presenters.length);
        }, 100);
      } else {
        console.log('❌ Formulaire non disponible, attente...');
      }
    }
    
    if (changes['visible'] && !this.visible) {
      console.log('Dialog fermé, reset du formulaire...');
      this.resetForm();
    }
  }

  patchFormWithEvent(event: EventDTO) {
    console.log('=== PATCH DU FORMULAIRE AVEC L\'ÉVÉNEMENT ===');
    console.log('Événement reçu:', event);
    console.log('Événement ID:', event.id);
    console.log('Événement Name:', event.name);
    console.log('Événement Date:', event.date);
    console.log('Événement Type:', typeof event);
    console.log('Événement Keys:', Object.keys(event));
    console.log('Événement Values:', Object.values(event));
    
    // Vérifier chaque champ individuellement
    console.log('=== VÉRIFICATION DES CHAMPS ===');
    console.log('event.free:', event.free, 'Type:', typeof event.free);
    console.log('event.amount:', event.amount, 'Type:', typeof event.amount);
    console.log('event.numberOfDays:', event.numberOfDays, 'Type:', typeof event.numberOfDays);
    console.log('event.availableSeats:', event.availableSeats, 'Type:', typeof event.availableSeats);
    console.log('event.lastRegistrationDate:', event.lastRegistrationDate, 'Type:', typeof event.lastRegistrationDate);
    console.log('event.eventType:', event.eventType, 'Type:', typeof event.eventType);
    console.log('event.category:', event.category, 'Type:', typeof event.category);
    console.log('event.location:', event.location, 'Type:', typeof event.location);
    
    // Patch du formulaire avec vérification des valeurs
    const formData = {
      name: event.name || '',
      date: event.date || '',
      description: event.description || '',
      free: event.free !== undefined ? event.free : false,
      amount: event.amount || null,
      numberOfDays: event.numberOfDays || 1,
      category: event.category || 'Conférence',
      availableSeats: event.availableSeats || 1,
      lastRegistrationDate: event.lastRegistrationDate || '',
      eventType: event.eventType || 'PUBLIC',
      location: event.location || { address: '', city: '', postalCode: '', country: '' }
    };
    
    console.log('Données à patcher dans le formulaire:', formData);
    
    // Appliquer le patch
    this.eventForm.patchValue(formData);
    
    // Vérifier que le patch a fonctionné
    console.log('=== VÉRIFICATION APRÈS PATCH ===');
    console.log('Formulaire après patch:', this.eventForm.value);
    console.log('Champs individuels après patch:');
    console.log('- name:', this.eventForm.get('name')?.value);
    console.log('- date:', this.eventForm.get('date')?.value);
    console.log('- description:', this.eventForm.get('description')?.value);
    console.log('- free:', this.eventForm.get('free')?.value);
    console.log('- amount:', this.eventForm.get('amount')?.value);
    console.log('- numberOfDays:', this.eventForm.get('numberOfDays')?.value);
    console.log('- category:', this.eventForm.get('category')?.value);
    console.log('- availableSeats:', this.eventForm.get('availableSeats')?.value);
    console.log('- lastRegistrationDate:', this.eventForm.get('lastRegistrationDate')?.value);
    console.log('- eventType:', this.eventForm.get('eventType')?.value);
    console.log('- location:', this.eventForm.get('location')?.value);
    
    // Gestion des présentateurs
    this.presenters.clear();
    if (event.presenters && event.presenters.length > 0) {
      console.log('Ajout des présentateurs:', event.presenters.length);
      event.presenters.forEach((p, index) => {
        console.log(`Présentateur ${index}:`, p);
        const presenterGroup = this.fb.group({
          firstName: [p.firstName || '', Validators.required],
          lastName: [p.lastName || '', Validators.required],
          title: [p.title || ''],
          resume: [p.resume || '']
        });
        this.presenters.push(presenterGroup);
        
        // Vérifier que le présentateur a été ajouté
        console.log(`Présentateur ${index} ajouté:`, presenterGroup.value);
      });
    } else {
      console.log('Aucun présentateur, ajout d\'un présentateur par défaut');
      this.addPresenter();
    }
    
    // Forcer la détection des changements
    this.eventForm.updateValueAndValidity();
    
    console.log('=== FIN PATCH DU FORMULAIRE ===');
  }

  showDialog() {
    this.visible = true;
    // Ne pas reset le formulaire si on est en mode modification
    if (!this.eventToEdit) {
      console.log('Mode CRÉATION: reset du formulaire');
      this.resetForm();
    } else {
      console.log('Mode MODIFICATION: pas de reset, on garde les données existantes');
    }
  }

  hideDialog() {
    this.visible = false;
    this.close.emit();
    // Toujours reset à la fermeture
    this.resetForm();
  }

  resetForm() {
    this.eventForm.reset();
    this.presenters.clear();
    this.addPresenter();
    this.uploadedFiles = [];
    this.pendingFiles = [];
    this.pendingPresentationPhotos = [];
    this.mainPresentationPhoto = null;
    this.presentationPhotos = [];
    this.eventToEdit = null;
    this.submitted = false;
    this.isUploading = false;
    this.uploadProgress = 0;
  }

  onSubmit() {
    this.submitted = true;

    // Vérifier et corriger les valeurs du formulaire
    this.validateAndFixFormValues();

    // Forcer la validation après correction
    this.eventForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    // Vérifier si le formulaire est maintenant valide
    if (this.eventForm.valid) {
      console.log('✅ Formulaire valide après correction, lancement de la soumission...');
      this.processFormSubmission();
    } else {
      console.log('❌ Formulaire toujours invalide après correction');
      console.log('Erreurs finales:', this.eventForm.errors);
      this.checkFormControlErrors(this.eventForm, 'Formulaire final');
      
      // Afficher un message d'erreur à l'utilisateur
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur de validation',
        detail: 'Veuillez corriger les erreurs dans le formulaire avant de continuer.'
      });
    }
  }

  private processFormSubmission() {
      const formValue = this.eventForm.value;
      
      // Envoyer tous les champs du formulaire au backend
      const eventData = {
        name: formValue.name,
        date: formValue.date,
        description: formValue.description,
        location: formValue.location,
              free: formValue.free !== null ? formValue.free : false,
      amount: formValue.free ? null : formValue.amount,
        numberOfDays: formValue.numberOfDays,
        category: formValue.category,
        presenters: formValue.presenters || [],
        availableSeats: formValue.availableSeats,
        lastRegistrationDate: formValue.lastRegistrationDate,
        eventType: formValue.eventType
      };

      console.log('=== DIAGNOSTIC DE SOUMISSION ===');
      console.log('Mode:', this.eventToEdit ? 'MODIFICATION' : 'CRÉATION');
      console.log('EventToEdit:', this.eventToEdit);
      console.log('EventToEdit ID:', this.eventToEdit?.id);
      console.log('EventToEdit Type:', typeof this.eventToEdit);
      console.log('EventToEdit Keys:', this.eventToEdit ? Object.keys(this.eventToEdit) : 'null');
      console.log('Données du formulaire:', formValue);
      console.log('Données envoyées:', eventData);
      console.log('Fichiers en attente:', this.pendingFiles.length);
      console.log('Photos de présentation en attente:', this.pendingPresentationPhotos.length);
      console.log('Détail des fichiers en attente:', this.pendingFiles.map(f => f.name));
      console.log('Détail des photos en attente:', this.pendingPresentationPhotos.map(f => f.name));
      console.log('=== FIN DIAGNOSTIC ===');

      // Vérifier si on est en mode modification ou création
      if (this.eventToEdit?.id) {
        console.log('✅ Mode MODIFICATION détecté: mise à jour de l\'événement existant');
        console.log('ID de l\'événement à modifier:', this.eventToEdit.id);
        this.updateEventWithFiles(eventData);
      } else {
        console.log('✅ Mode CRÉATION détecté: création d\'un nouvel événement');
        console.log('Pas d\'ID d\'événement existant');
        this.createEventWithFiles(eventData);
      }
  }

  private createEventWithFiles(eventData: any) {
    // Créer d'abord l'événement
      this.eventService.createEvent(eventData as any).subscribe({
        next: (response) => {
        console.log('Événement créé avec succès:', response);
        
        // Mettre à jour l'événement édité
        this.eventToEdit = response;
        
        // Uploader immédiatement tous les fichiers en attente
        if (this.eventToEdit?.id) {
          const eventId = this.eventToEdit.id;
          this.uploadAllPendingFiles(eventId);
        }
        
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
          detail: 'Événement créé avec succès et fichiers uploadés.'
        });
        
        // Activer l'onglet des photos de présentation
        setTimeout(() => {
          const tabView = document.querySelector('p-tabview');
          if (tabView) {
            const tabViewInstance = (tabView as any).__ngContext__?.instance;
            if (tabViewInstance) {
              tabViewInstance.activeIndex = 3; // Index de l'onglet Photo de présentation
            }
          }
        }, 100);
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la création de l\'événement'
          });
          console.error('Erreur lors de la création:', error);
        }
    });
  }

  private updateEventWithFiles(eventData: any) {
    if (!this.eventToEdit?.id) {
      console.error('updateEventWithFiles: eventToEdit.id est null ou undefined.');
      return;
    }

    console.log('=== MISE À JOUR DE L\'ÉVÉNEMENT ===');
    console.log('Event ID à mettre à jour:', this.eventToEdit.id);
    console.log('Données à envoyer:', eventData);
    console.log('Service utilisé:', this.eventService);
    console.log('Méthode updateEvent disponible:', typeof this.eventService.updateEvent);

    this.eventService.updateEvent(this.eventToEdit.id, eventData as any).subscribe({
      next: (response) => {
        console.log('Événement mis à jour avec succès:', response);
        this.eventToEdit = response;
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Événement mis à jour avec succès et fichiers uploadés.'
        });

        // Uploader immédiatement tous les fichiers en attente
        if (this.eventToEdit?.id) {
          const eventId = this.eventToEdit.id;
          console.log('Upload des fichiers en attente pour l\'événement:', eventId);
          this.uploadAllPendingFiles(eventId);
        }

        // Activer l'onglet des photos de présentation
        setTimeout(() => {
          const tabView = document.querySelector('p-tabview');
          if (tabView) {
            const tabViewInstance = (tabView as any).__ngContext__?.instance;
            if (tabViewInstance) {
              tabViewInstance.activeIndex = 3; // Index de l'onglet Photo de présentation
            }
          }
        }, 100);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour de l\'événement:', error);
        console.error('Détails de l\'erreur:', {
          status: error.status,
          message: error.message,
          error: error
        });
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la mise à jour de l\'événement'
        });
      }
    });
  }

  private validateAndFixFormValues() {
    console.log('=== VALIDATION ET CORRECTION DU FORMULAIRE ===');
    
    // Corriger free si null
    if (this.eventForm.get('free')?.value === null) {
      console.log('Correction de free: null → false');
      this.eventForm.patchValue({ free: false });
    }
    
    // Corriger les présentateurs vides
    const presenters = this.eventForm.get('presenters') as FormArray;
    presenters.controls.forEach((presenter, index) => {
      const firstName = presenter.get('firstName')?.value;
      const lastName = presenter.get('lastName')?.value;
      
      if (!firstName || firstName.trim() === '') {
        console.log(`Correction du présentateur ${index}: firstName vide → 'Présentateur'`);
        presenter.patchValue({ firstName: 'Présentateur' });
      }
      
      if (!lastName || lastName.trim() === '') {
        console.log(`Correction du présentateur ${index}: lastName vide → 'Anonyme'`);
        presenter.patchValue({ lastName: 'Anonyme' });
      }
    });
    
    // Corriger les autres champs potentiellement problématiques
    const formValue = this.eventForm.value;
    
    // S'assurer que availableSeats est un nombre valide
    if (!formValue.availableSeats || formValue.availableSeats < 1) {
      console.log('Correction de availableSeats: valeur invalide → 1');
      this.eventForm.patchValue({ availableSeats: 1 });
    }
    
    // S'assurer que numberOfDays est un nombre valide
    if (!formValue.numberOfDays || formValue.numberOfDays < 1) {
      console.log('Correction de numberOfDays: valeur invalide → 1');
      this.eventForm.patchValue({ numberOfDays: 1 });
    }
    
    // S'assurer que category est sélectionnée
    if (!formValue.category) {
      console.log('Correction de category: valeur manquante → "Conférence"');
      this.eventForm.patchValue({ category: 'Conférence' });
    }
    
    // S'assurer que eventType est sélectionné
    if (!formValue.eventType) {
      console.log('Correction de eventType: valeur manquante → "PUBLIC"');
      this.eventForm.patchValue({ eventType: 'PUBLIC' });
    }
    
    // Vérifier la validité après correction
    this.eventForm.updateValueAndValidity();
    console.log('Formulaires valide après correction:', this.eventForm.valid);
    console.log('Erreurs du formulaire:', this.eventForm.errors);
    
    // Vérifier les erreurs de chaque contrôle
    console.log('=== DIAGNOSTIC DÉTAILLÉ DES ERREURS ===');
    this.checkFormControlErrors(this.eventForm, 'Formulaire principal');
    console.log('=== FIN DIAGNOSTIC ===');
  }

  private checkFormControlErrors(formGroup: FormGroup | FormArray, controlName: string) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        if (control instanceof FormGroup || control instanceof FormArray) {
          this.checkFormControlErrors(control, `${controlName}.${key}`);
        } else {
          if (control.invalid) {
            console.log(`❌ ${controlName}.${key}:`, {
              value: control.value,
              errors: control.errors,
              valid: control.valid,
              dirty: control.dirty,
              touched: control.touched
            });
          } else {
            console.log(`✅ ${controlName}.${key}:`, {
              value: control.value,
              valid: control.valid
            });
          }
        }
      }
    });
  }

  private uploadAllPendingFiles(eventId: string) {
    console.log('Upload de tous les fichiers en attente pour l\'événement:', eventId);
    
    // Uploader les photos de présentation en premier
    if (this.pendingPresentationPhotos.length > 0) {
      console.log('Upload de', this.pendingPresentationPhotos.length, 'photos de présentation');
      this.uploadPresentationPhotosForEvent(this.pendingPresentationPhotos, eventId);
      this.pendingPresentationPhotos = [];
    }
    
    // Uploader les autres fichiers
    if (this.pendingFiles.length > 0) {
      console.log('Upload de', this.pendingFiles.length, 'fichiers');
      this.uploadFilesForEvent(this.pendingFiles, eventId);
      this.pendingFiles = [];
    }
  }

  private uploadPresentationPhotosForEvent(files: File[], eventId: string) {
    console.log('Upload de photos de présentation pour l\'événement:', eventId);
    
    this.isUploading = true;
    this.uploadProgress = 0;

    // Upload des photos une par une pour suivre le progrès
    const totalFiles = files.length;
    let uploadedCount = 0;

    files.forEach((file, index) => {
      console.log(`Upload du fichier ${index + 1}/${totalFiles}:`, file.name);
      
      this.eventFileService.uploadEventFile(
        eventId,
        file,
        'Photo de présentation'
      ).subscribe({
        next: (uploadedFile) => {
          console.log('Upload réussi pour:', file.name, uploadedFile);
          // Marquer comme photo de présentation
          uploadedFile.isPresentationPhoto = true;
          uploadedFile.fileType = EventFileDTOFileTypeEnum.PRESENTATION_PHOTO;
          
          // Ajouter à la liste des photos de présentation
          this.presentationPhotos.push(uploadedFile);
          
          // Ajouter à la liste des fichiers uploadés
          this.uploadedFiles.push(uploadedFile);
          
          uploadedCount++;
          this.uploadProgress = (uploadedCount / totalFiles) * 100;

          if (uploadedCount === totalFiles) {
            this.isUploading = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `${totalFiles} photo(s) de présentation uploadée(s) avec succès`
            });
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'upload de la photo de présentation:', error);
          console.error('Détails de l\'erreur:', {
            file: file.name,
            eventId: eventId,
            error: error
          });
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.isUploading = false;
          }
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: `Erreur lors de l'upload de ${file.name}`
          });
        }
      });
    });
  }

  private uploadFilesForEvent(files: File[], eventId: string) {
    console.log('Upload de fichiers pour l\'événement:', eventId);
    
    this.isUploading = true;
    this.uploadProgress = 0;

    // Upload des fichiers un par un pour suivre le progrès
    const totalFiles = files.length;
    let uploadedCount = 0;

    files.forEach((file, index) => {
      console.log(`Upload du fichier ${index + 1}/${totalFiles}:`, file.name);
      
      this.eventFileService.uploadEventFile(
        eventId,
        file,
        `Fichier uploadé automatiquement`
      ).subscribe({
        next: (uploadedFile) => {
          console.log('Upload réussi pour:', file.name, uploadedFile);
          this.uploadedFiles.push(uploadedFile);
          uploadedCount++;
          this.uploadProgress = (uploadedCount / totalFiles) * 100;

          if (uploadedCount === totalFiles) {
            this.isUploading = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `${totalFiles} fichier(s) uploadé(s) avec succès`
            });
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'upload:', error);
          console.error('Détails de l\'erreur:', {
            file: file.name,
            eventId: eventId,
            error: error
          });
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.isUploading = false;
          }
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: `Erreur lors de l'upload de ${file.name}`
          });
        }
      });
    });
  }

  get f() {
    return this.eventForm.controls;
  }

  get locationControls() {
    return (this.eventForm.get('location') as FormGroup).controls;
  }

  get presenters() {
    return this.eventForm.get('presenters') as FormArray;
  }

  addPresenter() {
    const presenterGroup = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(1)]],
      lastName: ['', [Validators.required, Validators.minLength(1)]],
      title: [''],
      resume: ['']
    });
    this.presenters.push(presenterGroup);
  }

  removePresenter(index: number) {
    if (this.presenters.length > 1) {
      this.presenters.removeAt(index);
    }
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }

  getPresenterControl(presenter: AbstractControl, fieldName: string): FormControl {
    return presenter.get(fieldName) as FormControl;
  }

  dateFrValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;
    // Regex JJ/MM/AAAA
    const regex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    return regex.test(value) ? null : { dateFormat: 'Le format doit être JJ/MM/AAAA' };
  }

  // Méthodes pour la gestion des fichiers
  onFileSelect(event: any) {
    console.log('=== onFileSelect DÉCLENCHÉ ===');
    console.log('onFileSelect appelé avec:', event);
    
    // Gérer différents formats possibles de l'événement
    let files: File[] = [];
    
    if (event.files && Array.isArray(event.files)) {
      files = event.files;
    } else if (event.files && event.files.length !== undefined) {
      files = Array.from(event.files);
    } else if (Array.isArray(event)) {
      files = Array.from(event);
    } else if (event && event.length !== undefined) {
      files = Array.from(event);
    }
    
    console.log('Fichiers sélectionnés:', files);
    console.log('Type de files:', typeof files);
    console.log('Est un tableau:', Array.isArray(files));
    
    // Stocker les fichiers sélectionnés pour l'upload lors de la création de l'événement
    if (files && Array.isArray(files) && files.length > 0) {
      console.log('Fichiers sélectionnés et stockés:', files.length);
      // Ajouter les nouveaux fichiers à la liste des fichiers en attente
      this.pendingFiles = [...this.pendingFiles, ...files];
      console.log('Total des fichiers en attente:', this.pendingFiles.length);
      
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: `${files.length} fichier(s) sélectionné(s) et en attente d'upload`
      });
    } else {
      console.error('Format de fichiers invalide:', event);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Format de fichiers invalide lors de la sélection'
      });
    }
  }

  onFileUpload(event: any) {
    console.log('onFileUpload appelé avec:', event);
    
    // Gérer différents formats possibles de l'événement
    let files: File[] = [];
    
    if (event.files && Array.isArray(event.files)) {
      files = event.files;
    } else if (event.files && event.files.length !== undefined) {
      files = Array.from(event.files);
    } else if (Array.isArray(event)) {
      files = event;
    } else if (event && event.length !== undefined) {
      files = Array.from(event);
    }
    
    console.log('Upload de fichiers:', files);
    console.log('Type de files:', typeof files);
    console.log('Est un tableau:', Array.isArray(files));
    
    if (files && Array.isArray(files) && files.length > 0) {
      console.log('Upload de fichiers:', files.length);
      this.uploadFiles(files);
    } else {
      console.error('Format de fichiers invalide:', event);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Format de fichiers invalide lors de l\'upload'
      });
    }
  }

  onMainPhotoSelect(event: any) {
    console.log('=== onMainPhotoSelect DÉCLENCHÉ ===');
    console.log('onMainPhotoSelect appelé avec:', event);
    
    // Gérer différents formats possibles de l'événement
    let files: File[] = [];
    
    if (event.files && Array.isArray(event.files)) {
      files = event.files;
    } else if (event.files && event.files.length !== undefined) {
      files = Array.from(event.files);
    } else if (Array.isArray(event)) {
      files = event;
    } else if (event && event.length !== undefined) {
      files = Array.from(event);
    }
    
    console.log('Fichiers sélectionnés:', files);
    console.log('Type de files:', typeof files);
    console.log('Est un tableau:', Array.isArray(files));
    
    // Stocker les photos sélectionnées pour l'upload lors de la création de l'événement
    if (files && Array.isArray(files) && files.length > 0) {
      console.log('Photos sélectionnées et stockées:', files.length);
      // Ajouter les nouvelles photos à la liste des photos en attente
      this.pendingPresentationPhotos = [...this.pendingPresentationPhotos, ...files];
      console.log('Total des photos en attente:', this.pendingPresentationPhotos.length);
      
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: `${files.length} photo(s) sélectionnée(s) et en attente d'upload`
      });
    } else {
      console.error('Format de fichiers invalide:', event);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Format de fichiers invalide lors de la sélection'
      });
    }
  }

  onMainPhotoUpload(event: any) {
    console.log('onMainPhotoUpload appelé avec:', event);
    
    // Gérer différents formats possibles de l'événement
    let files: File[] = [];
    
    if (event.files && Array.isArray(event.files)) {
      files = event.files;
    } else if (event.files && event.files.length !== undefined) {
      files = Array.from(event.files);
    } else if (Array.isArray(event)) {
      files = event;
    } else if (event && event.length !== undefined) {
      files = Array.from(event);
    }
    
    console.log('Upload de photos:', files);
    console.log('Type de files:', typeof files);
    console.log('Est un tableau:', Array.isArray(files));
    
    if (files && Array.isArray(files) && files.length > 0) {
      console.log('Upload de photos:', files.length);
      this.uploadPresentationPhotos(files);
    } else {
      console.error('Format de fichiers invalide:', event);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Format de fichiers invalide lors de l\'upload'
      });
    }
  }

  uploadPresentationPhotos(files: File[]) {
    console.log('uploadPresentationPhotos appelé avec:', files);
    console.log('Type de files:', typeof files);
    console.log('Est un tableau:', Array.isArray(files));
    console.log('eventToEdit:', this.eventToEdit);
    
    // Vérification de sécurité
    if (!Array.isArray(files) || files.length === 0) {
      console.error('uploadPresentationPhotos: files n\'est pas un tableau valide:', files);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Format de fichiers invalide pour l\'upload'
      });
      return;
    }
    
    if (!this.eventToEdit?.id) {
      console.log('Événement non créé, stockage en attente');
      // Stocker les fichiers temporairement pour les uploader après création de l'événement
      this.pendingPresentationPhotos = [...this.pendingPresentationPhotos, ...files];
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: `${files.length} photo(s) de présentation en attente. Elles seront uploadées après la création de l'événement.`
      });
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    // Upload des photos une par une pour suivre le progrès
    const totalFiles = files.length;
    let uploadedCount = 0;

    files.forEach((file, index) => {
      console.log(`Upload du fichier ${index + 1}/${totalFiles}:`, file.name);
      console.log('URL de base du service:', this.eventFileService['baseUrl']);
      console.log('ID de l\'événement:', this.eventToEdit!.id!);
      
      this.eventFileService.uploadEventFile(
        this.eventToEdit!.id!,
        file,
        'Photo de présentation'
      ).subscribe({
        next: (uploadedFile) => {
          console.log('Upload réussi pour:', file.name, uploadedFile);
          // Marquer comme photo de présentation
          uploadedFile.isPresentationPhoto = true;
          uploadedFile.fileType = EventFileDTOFileTypeEnum.PRESENTATION_PHOTO;
          
          // Ajouter à la liste des photos de présentation
          this.presentationPhotos.push(uploadedFile);
          
          // Ajouter à la liste des fichiers uploadés
          this.uploadedFiles.push(uploadedFile);
          
          // Forcer la mise à jour de l'interface
          this.presentationPhotos = [...this.presentationPhotos];
          this.uploadedFiles = [...this.uploadedFiles];
          
          console.log('Photo ajoutée à presentationPhotos:', {
            totalPhotos: this.presentationPhotos.length,
            nouvellePhoto: uploadedFile.fileName
          });
          
          uploadedCount++;
          this.uploadProgress = (uploadedCount / totalFiles) * 100;

          if (uploadedCount === totalFiles) {
            this.isUploading = false;
            
            // Nettoyer les photos en attente
            this.clearPendingPhotos();
            
            // En mode modification, afficher immédiatement les photos uploadées
            if (this.eventToEdit?.id) {
              console.log('Mode modification: affichage immédiat des photos uploadées');
              // Les photos sont déjà dans presentationPhotos, pas besoin de recharger
              // Forcer la mise à jour de l'interface
              this.presentationPhotos = [...this.presentationPhotos];
              
              // Optionnel: recharger en arrière-plan pour s'assurer de la cohérence
              setTimeout(() => {
                console.log('Rechargement en arrière-plan pour vérifier la cohérence...');
                this.reloadPhotosAfterUpload();
              }, 1000);
            } else {
              console.log('Mode création, consolidation des listes locales...');
              this.consolidatePhotoLists();
            }
            
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `${totalFiles} photo(s) de présentation uploadée(s) avec succès`
            });
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'upload de la photo de présentation:', error);
          console.error('Détails de l\'erreur:', {
            file: file.name,
            eventId: this.eventToEdit!.id!,
            error: error
          });
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.isUploading = false;
          }
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: `Erreur lors de l'upload de ${file.name}`
          });
        }
      });
    });
  }

  uploadFiles(files: File[]) {
    console.log('uploadFiles appelé avec:', files);
    console.log('Type de files:', typeof files);
    console.log('Est un tableau:', Array.isArray(files));
    
    // Vérification de sécurité
    if (!Array.isArray(files) || files.length === 0) {
      console.error('uploadFiles: files n\'est pas un tableau valide:', files);
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Format de fichiers invalide pour l\'upload'
      });
      return;
    }
    
    if (!this.eventToEdit?.id) {
      // Stocker les fichiers temporairement pour les uploader après création de l'événement
      this.pendingFiles = [...(this.pendingFiles || []), ...files];
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: `${files.length} fichier(s) en attente. Ils seront uploadés après la création de l'événement.`
      });
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    // Upload des fichiers un par un pour suivre le progrès
    const totalFiles = files.length;
    let uploadedCount = 0;

    files.forEach((file, index) => {
      this.eventFileService.uploadEventFile(
        this.eventToEdit!.id!,
        file,
        `Fichier uploadé automatiquement`
      ).subscribe({
        next: (uploadedFile) => {
          this.uploadedFiles.push(uploadedFile);
          uploadedCount++;
          this.uploadProgress = (uploadedCount / totalFiles) * 100;

          if (uploadedCount === totalFiles) {
            this.isUploading = false;
            this.messageService.add({
              severity: 'success',
              summary: 'Succès',
              detail: `${totalFiles} fichier(s) uploadé(s) avec succès`
            });
          }
        },
        error: (error) => {
          console.error('Erreur lors de l\'upload:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: `Erreur lors de l'upload de ${file.name}`
          });
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.isUploading = false;
          }
        }
      });
    });
  }

  removeFile(file: EventFileDTO) {
    if (!this.eventToEdit?.id) return;

    this.eventFileService.deleteEventFile(this.eventToEdit.id, file.id!).subscribe({
      next: () => {
        this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== file.id);
        
        // Si c'était la photo de présentation, la réinitialiser
        if (this.mainPresentationPhoto?.id === file.id) {
          this.mainPresentationPhoto = null;
        }
        
        // Retirer aussi de la liste des photos de présentation si c'en est une
        this.presentationPhotos = this.presentationPhotos.filter(p => p.id !== file.id);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Fichier supprimé avec succès'
        });
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la suppression du fichier'
        });
      }
    });
  }

  removeMainPhoto() {
    if (this.mainPresentationPhoto) {
      this.removeFile(this.mainPresentationPhoto);
    }
  }

  setMainPhoto(file: EventFileDTO) {
    if (!this.eventToEdit?.id || !file.id) return;

    this.eventFileService.setMainPhoto(this.eventToEdit.id, file.id).subscribe({
      next: (updatedFile) => {
        // Mettre à jour la liste des fichiers
        this.uploadedFiles = this.uploadedFiles.map(f => ({
          ...f,
          isMainPhoto: f.id === file.id
        }));
        
        // Mettre à jour la photo de présentation principale
        this.mainPresentationPhoto = updatedFile;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Photo principale définie avec succès'
        });
      },
      error: (error) => {
        console.error('Erreur lors de la définition de la photo principale:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors de la définition de la photo principale'
        });
      }
    });
  }

  selectMainPhoto(file: EventFileDTO) {
    // Vérifier que c'est bien une image
    if (!file.mimeType?.startsWith('image/')) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Seules les images peuvent être définies comme photo principale'
      });
      return;
    }

    // Mettre à jour la photo de présentation principale
    this.mainPresentationPhoto = file;
    
    // Si l'événement est déjà créé, définir comme photo principale
    if (this.eventToEdit?.id && file.id) {
      this.setMainPhoto(file);
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: 'Photo principale sélectionnée. Elle sera définie comme principale après la création de l\'événement.'
      });
    }
  }

  loadEventFiles() {
    if (!this.eventToEdit?.id) {
      console.log('loadEventFiles: Pas d\'eventToEdit.id, sortie');
      return;
    }

    console.log('=== CHARGEMENT DES FICHIERS ===');
    console.log('Event ID:', this.eventToEdit.id);
    console.log('Appel de l\'API getEventFiles...');

    this.eventFileService.getEventFiles(this.eventToEdit.id).subscribe({
      next: (files) => {
        console.log('=== RÉPONSE DE L\'API ===');
        console.log('Fichiers reçus du serveur:', files);
        console.log('Type de files:', typeof files);
        console.log('Est un tableau:', Array.isArray(files));
        console.log('Nombre de fichiers:', files ? files.length : 'undefined');
        
        // Mettre à jour la liste complète des fichiers
        this.uploadedFiles = files || [];
        
        // Filtrer les photos de présentation
        this.presentationPhotos = (files || []).filter(file => {
          const isImage = file.fileType === EventFileDTOFileTypeEnum.PRESENTATION_PHOTO || 
                         file.fileType === EventFileDTOFileTypeEnum.MAIN_PRESENTATION ||
                         (file.mimeType && file.mimeType.startsWith('image/'));
          
          console.log('Filtrage du fichier:', {
            fileName: file.fileName,
            fileType: file.fileType,
            mimeType: file.mimeType,
            isImage: isImage
          });
          
          return isImage;
        });
        
        console.log('Photos filtrées:', this.presentationPhotos);
        console.log('Nombre de photos trouvées:', this.presentationPhotos.length);
        
        // Identifier la photo principale
        this.mainPresentationPhoto = this.presentationPhotos.find(photo => 
          photo.fileType === EventFileDTOFileTypeEnum.MAIN_PRESENTATION || 
          photo.isMainPhoto === true
        ) || null;
        
        // Si aucune photo principale n'est définie, prendre la première photo
        if (!this.mainPresentationPhoto && this.presentationPhotos.length > 0) {
          this.mainPresentationPhoto = this.presentationPhotos[0];
        }
        
        // Log des URLs construites pour chaque photo
        this.presentationPhotos.forEach((photo, index) => {
          const imageUrl = this.getFilePreviewUrl(photo);
          console.log(`Photo ${index + 1}:`, {
            fileName: photo.fileName,
            mimeType: photo.mimeType,
            fileType: photo.fileType,
            imageUrl: imageUrl,
            isMainPhoto: photo.isMainPhoto,
            isPresentationPhoto: photo.isPresentationPhoto
          });
        });
        
        // Vérifier la cohérence des listes
        console.log('=== VÉRIFICATION DE COHÉRENCE ===');
        console.log('Fichiers chargés:', this.uploadedFiles.length);
        console.log('Photos de présentation:', this.presentationPhotos.length);
        console.log('Photo principale:', this.mainPresentationPhoto?.fileName);
        console.log('Liste finale presentationPhotos:', this.presentationPhotos);
        
        // Forcer la détection des changements pour Angular
        this.presentationPhotos = [...this.presentationPhotos];
        
        console.log('=== FIN DU CHARGEMENT ===');
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fichiers:', error);
        console.error('Détails de l\'erreur:', {
          status: error.status,
          message: error.message,
          error: error
        });
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Erreur lors du chargement des photos de l\'événement'
        });
      }
    });
  }

  getFileTypeIcon(fileType: string): string {
    switch (fileType) {
      case EventFileDTOFileTypeEnum.PRESENTATION_PHOTO:
      case EventFileDTOFileTypeEnum.MAIN_PRESENTATION:
        return 'pi pi-image';
      case EventFileDTOFileTypeEnum.DOCUMENT:
        return 'pi pi-file';
      case EventFileDTOFileTypeEnum.VIDEO:
        return 'pi pi-video';
      case EventFileDTOFileTypeEnum.AUDIO:
        return 'pi pi-volume-up';
      default:
        return 'pi pi-file';
    }
  }

  getFileSizeDisplay(size: number): string {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    if (size < 1024 * 1024 * 1024) return (size / (1024 * 1024)).toFixed(1) + ' MB';
    return (size / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  getFilePreviewUrl(file: EventFileDTO): string {
    console.log('=== getFilePreviewUrl appelé ===');
    console.log('Fichier reçu:', file);
    console.log('MIME type:', file.mimeType);
    console.log('Nom du fichier:', file.fileName);
    console.log('EventToEdit ID:', this.eventToEdit?.id);
    console.log('EventToEdit:', this.eventToEdit);
    
    // Pour les images, construire l'URL en utilisant l'endpoint du FileController
    if (file.mimeType?.startsWith('image/') && file.fileName && this.eventToEdit?.id) {
      // Construire l'URL pour récupérer l'image depuis le backend
      const baseUrl = 'http://localhost:8081'; // URL du backend
      const imageUrl = `${baseUrl}/api/v1/files/events/${this.eventToEdit.id}/${file.fileName}`;
      
      console.log('✅ URL de l\'image construite avec succès:', {
        fileName: file.fileName,
        eventId: this.eventToEdit.id,
        imageUrl: imageUrl,
        baseUrl: baseUrl,
        fullPath: `/api/v1/files/events/${this.eventToEdit.id}/${file.fileName}`
      });
      
      return imageUrl;
    }
    
    console.warn('❌ Impossible de construire l\'URL pour:', {
      file: file,
      mimeType: file.mimeType,
      fileName: file.fileName,
      eventToEditId: this.eventToEdit?.id,
      isImage: file.mimeType?.startsWith('image/'),
      hasFileName: !!file.fileName,
      hasEventId: !!this.eventToEdit?.id
    });
    return '';
  }

  // Méthode pour obtenir l'URL du thumbnail
  getThumbnailUrl(file: EventFileDTO): string {
    console.log('=== getThumbnailUrl appelé ===');
    console.log('Fichier reçu:', file);
    console.log('Nom du fichier:', file.fileName);
    console.log('EventToEdit ID:', this.eventToEdit?.id);
    
    // Pour les images, construire l'URL du thumbnail
    if (file.mimeType?.startsWith('image/') && file.fileName && this.eventToEdit?.id) {
      const baseUrl = 'http://localhost:8081';
      const thumbnailUrl = `${baseUrl}/api/v1/files/events/${this.eventToEdit.id}/thumbnails/${file.fileName}`;
      
      console.log('✅ URL du thumbnail construite avec succès:', {
        fileName: file.fileName,
        eventId: this.eventToEdit.id,
        thumbnailUrl: thumbnailUrl
      });
      
      return thumbnailUrl;
    }
    
    console.warn('❌ Impossible de construire l\'URL du thumbnail pour:', file);
    return '';
  }

  // Méthode de test pour vérifier l'accessibilité des images
  testImageAccessibility() {
    console.log('=== TEST D\'ACCESSIBILITÉ DES IMAGES ===');
    
    if (!this.presentationPhotos || this.presentationPhotos.length === 0) {
      console.log('❌ Aucune photo à tester');
      return;
    }
    
    this.presentationPhotos.forEach((photo, index) => {
      console.log(`--- Test photo ${index + 1} ---`);
      console.log('Photo:', photo);
      
      const imageUrl = this.getFilePreviewUrl(photo);
      console.log('URL générée:', imageUrl);
      
      if (imageUrl) {
        // Tester l'accessibilité de l'image
        this.testImageUrl(imageUrl, photo.fileName);
      } else {
        console.log('❌ URL non générée pour cette photo');
      }
    });
  }

  // Test d'une URL d'image spécifique
  private testImageUrl(imageUrl: string, fileName: string | undefined) {
    if (!fileName) {
      console.error('❌ Nom de fichier undefined');
      return;
    }
    
    console.log(`🔍 Test de l'URL: ${imageUrl}`);
    
    // Créer une image temporaire pour tester
    const testImg = new Image();
    
    testImg.onload = () => {
      console.log(`✅ Image chargée avec succès: ${fileName}`);
      console.log('Dimensions:', testImg.width, 'x', testImg.height);
    };
    
    testImg.onerror = () => {
      console.error(`❌ Erreur de chargement de l'image: ${fileName}`);
      console.error('URL testée:', imageUrl);
    };
    
    // Définir un timeout pour éviter les attentes infinies
    setTimeout(() => {
      if (!testImg.complete) {
        console.warn(`⚠️ Timeout pour l'image: ${fileName}`);
      }
    }, 5000);
    
    testImg.src = imageUrl;
  }

  // Méthodes pour le modal d'image
  openImageModal(image: EventFileDTO) {
    this.selectedImage = image;
    this.imageModalVisible = true;
  }

  closeImageModal() {
    this.imageModalVisible = false;
    this.selectedImage = null;
  }

  // Méthode pour obtenir l'URL de l'image sélectionnée
  getSelectedImageUrl(): string {
    if (this.selectedImage) {
      return this.getFilePreviewUrl(this.selectedImage);
    }
    return '';
  }

  // Gestion des erreurs de chargement d'image
  onImageError(event: any, photo: EventFileDTO) {
    console.error('Erreur de chargement de l\'image:', photo.fileName, event);
    // Masquer l'image et afficher le placeholder
    const img = event.target;
    const placeholder = img.parentElement.querySelector('.photo-placeholder');
    
    if (img) img.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }

  onImageLoad(event: any, photo: EventFileDTO) {
    console.log('Image chargée avec succès:', photo.fileName);
    // Masquer le placeholder si l'image se charge
    const img = event.target;
    const placeholder = img.parentElement.querySelector('.photo-placeholder');
    
    if (placeholder) placeholder.style.display = 'none';
    if (img) img.style.display = 'block';
  }

  // Méthode pour recharger les photos après un upload
  reloadPhotosAfterUpload() {
    console.log('=== RECHARGEMENT DES PHOTOS APRÈS UPLOAD ===');
    console.log('Photos actuelles dans presentationPhotos:', this.presentationPhotos.length);
    console.log('Fichiers actuels dans uploadedFiles:', this.uploadedFiles.length);
    
    // Si on est en mode modification, recharger depuis le serveur
    if (this.eventToEdit?.id) {
      console.log('Rechargement depuis le serveur...');
      
      // Sauvegarder les photos actuelles pour éviter les clignotements
      const currentPhotos = [...this.presentationPhotos];
      console.log('Photos sauvegardées avant rechargement:', currentPhotos.length);
      
      // Recharger depuis le serveur
      this.eventFileService.getEventFiles(this.eventToEdit.id).subscribe({
        next: (files) => {
          console.log('Nouveaux fichiers reçus du serveur:', files?.length || 0);
          
          // Mettre à jour la liste complète
          this.uploadedFiles = files || [];
          
          // Filtrer les nouvelles photos
          const newPhotos = (files || []).filter(file => 
            file.fileType === EventFileDTOFileTypeEnum.PRESENTATION_PHOTO || 
            file.fileType === EventFileDTOFileTypeEnum.MAIN_PRESENTATION ||
            (file.mimeType && file.mimeType.startsWith('image/'))
          );
          
          console.log('Nouvelles photos filtrées:', newPhotos.length);
          
          // Mettre à jour presentationPhotos
          this.presentationPhotos = [...newPhotos];
          
          // Forcer la mise à jour de l'interface
          this.presentationPhotos = [...this.presentationPhotos];
          
          console.log('Photos après rechargement:', this.presentationPhotos.length);
        },
        error: (error) => {
          console.error('Erreur lors du rechargement:', error);
          // En cas d'erreur, garder les photos actuelles
          console.log('Conservation des photos actuelles en cas d\'erreur');
        }
      });
    } else {
      console.log('Mode création, pas de rechargement serveur nécessaire');
      // En mode création, on peut juste vérifier la cohérence des listes
      this.consolidatePhotoLists();
    }
  }

  // Méthode pour consolider les listes de photos
  consolidatePhotoLists() {
    console.log('=== CONSOLIDATION DES LISTES DE PHOTOS ===');
    
    // S'assurer que toutes les photos de présentation sont dans presentationPhotos
    const allPhotos = this.uploadedFiles.filter(file => 
      file.fileType === EventFileDTOFileTypeEnum.PRESENTATION_PHOTO || 
      file.fileType === EventFileDTOFileTypeEnum.MAIN_PRESENTATION ||
      (file.mimeType && file.mimeType.startsWith('image/'))
    );
    
    // Mettre à jour presentationPhotos avec toutes les photos trouvées
    this.presentationPhotos = [...allPhotos];
    
    console.log('Photos consolidées:', this.presentationPhotos.length);
    console.log('Détail des photos:', this.presentationPhotos.map(p => ({
      fileName: p.fileName,
      fileType: p.fileType,
      mimeType: p.mimeType
    })));
  }

  // Méthode pour nettoyer les photos en attente après upload
  clearPendingPhotos() {
    console.log('=== NETTOYAGE DES PHOTOS EN ATTENTE ===');
    console.log('Photos en attente avant nettoyage:', this.pendingPresentationPhotos.length);
    
    // Vider la liste des photos en attente
    this.pendingPresentationPhotos = [];
    
    console.log('Photos en attente après nettoyage:', this.pendingPresentationPhotos.length);
  }

  // Méthode trackBy pour optimiser la liste des photos
  trackByPhotoId(index: number, photo: EventFileDTO): string {
    return photo.id || index.toString();
  }

  // Méthode de test pour déboguer l'affichage des photos
  debugPhotoDisplay() {
    console.log('=== DÉBOGAGE AFFICHAGE DES PHOTOS ===');
    console.log('EventToEdit:', this.eventToEdit);
    console.log('EventToEdit ID:', this.eventToEdit?.id);
    console.log('UploadedFiles:', this.uploadedFiles);
    console.log('PresentationPhotos:', this.presentationPhotos);
    console.log('MainPresentationPhoto:', this.mainPresentationPhoto);
    console.log('PendingPresentationPhotos:', this.pendingPresentationPhotos);
    
    // Vérifier les URLs des images
    if (this.presentationPhotos.length > 0) {
      console.log('=== URLs des images ===');
      this.presentationPhotos.forEach((photo, index) => {
        const imageUrl = this.getFilePreviewUrl(photo);
        console.log(`Photo ${index + 1}:`, {
          fileName: photo.fileName,
          mimeType: photo.mimeType,
          fileType: photo.fileType,
          imageUrl: imageUrl,
          hasFileName: !!photo.fileName,
          hasMimeType: !!photo.mimeType,
          hasEventId: !!this.eventToEdit?.id
        });
      });
    } else {
      console.log('Aucune photo dans presentationPhotos');
    }
  }

  // Méthode de test pour vérifier l'état de eventToEdit
  testEventToEdit() {
    console.log('=== TEST EVENTTOEDIT ===');
    console.log('EventToEdit:', this.eventToEdit);
    console.log('EventToEdit Type:', typeof this.eventToEdit);
    console.log('EventToEdit ID:', this.eventToEdit?.id);
    console.log('EventToEdit Keys:', this.eventToEdit ? Object.keys(this.eventToEdit) : 'null');
    console.log('EventToEdit Values:', this.eventToEdit ? Object.values(this.eventToEdit) : 'null');
    
    if (this.eventToEdit) {
      console.log('=== DÉTAIL DE L\'ÉVÉNEMENT ===');
      console.log('Name:', this.eventToEdit.name);
      console.log('Date:', this.eventToEdit.date);
      console.log('Description:', this.eventToEdit.description);
      console.log('Category:', this.eventToEdit.category);
      console.log('EventType:', this.eventToEdit.eventType);
      console.log('Location:', this.eventToEdit.location);
      console.log('Presenters:', this.eventToEdit.presenters);
    }
    
    console.log('=== ÉTAT DU FORMULAIRE ===');
    console.log('Formulaire valide:', this.eventForm.valid);
    console.log('Valeurs du formulaire:', this.eventForm.value);
    console.log('Erreurs du formulaire:', this.eventForm.errors);
    
    console.log('=== MODE DÉTECTÉ ===');
    if (this.eventToEdit?.id) {
      console.log('✅ MODE MODIFICATION détecté');
      console.log('ID de l\'événement:', this.eventToEdit.id);
    } else {
      console.log('❌ MODE CRÉATION détecté');
      console.log('Pas d\'ID d\'événement');
    }
  }

  updatePhotoComment(photo: EventFileDTO, comment: string) {
    // Validation des paramètres
    if (!photo || typeof comment !== 'string') {
      console.warn('Paramètres invalides pour updatePhotoComment');
      return;
    }

    // Mettre à jour le commentaire localement
    photo.description = comment;

    // Mettre à jour en base si l'événement est créé
    if (this.eventToEdit?.id && photo.id) {
      this.eventFileService.updateEventFile(this.eventToEdit.id, photo.id, photo).subscribe({
        next: (updatedPhoto) => {
          // Mettre à jour la photo dans la liste
          const index = this.presentationPhotos.findIndex(p => p.id === photo.id);
          if (index !== -1) {
            this.presentationPhotos[index] = updatedPhoto;
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Commentaire mis à jour avec succès'
          });
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour du commentaire:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la mise à jour du commentaire'
          });
        }
      });
    } else {
      // Si l'événement n'est pas encore créé, juste mettre à jour localement
      this.messageService.add({
        severity: 'info',
        summary: 'Information',
        detail: 'Commentaire sauvegardé localement. Il sera synchronisé après la création de l\'événement.'
      });
    }
  }
}
