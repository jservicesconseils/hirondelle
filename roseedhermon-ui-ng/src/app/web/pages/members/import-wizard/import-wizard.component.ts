import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { Member } from '../../../../shared/services/api/model/member';
import { MemberService } from '../../../../shared/services/members/members.service';
import { GroupEntity } from '../../../../shared/services/api/model/groupEntity';
import { GroupService } from '../../../../shared/services/groups/groups.service';
import { AuthService } from '../../../../core/auth/auth.service';

/** Sentinelle : la colonne devient un champ personnalisé, importé tel quel sous son en-tête. */
const CUSTOM_FIELD = '__custom__';

/**
 * Seuls ces champs ont un sens applicatif fixe : nom affiché, tri, bouton Appeler/WhatsApp,
 * onglets de l'annuaire — et Email, qui relie la fiche importée au compte de connexion de la
 * personne (`/api/v1/me` la retrouve par courriel) : sans lui, quelqu'un d'importé qui se
 * connecte plus tard retombe sur un profil vide au lieu de voir ses informations préremplies.
 * Toute autre colonne — Genre, Profession, Ville, ou n'importe quel champ propre à une
 * communauté — est importée telle quelle en champ personnalisé : chaque association a ses
 * propres colonnes, impossible de les prévoir toutes à l'avance.
 */
export const MEMBER_FIELDS: { value: string; label: string }[] = [
  { value: 'firstName', label: 'Prénom' },
  { value: 'lastName', label: 'Nom' },
  { value: 'subgroup', label: 'Groupe' },
  { value: 'phoneNumber', label: 'Téléphone' },
  { value: 'email', label: 'Email' },
  { value: CUSTOM_FIELD, label: 'Champ personnalisé' },
  { value: '', label: 'Ignorer cette colonne' }
];

/** Sans ces champs une ligne ne peut pas être importée. */
const REQUIRED_FIELDS = ['firstName', 'lastName'];

/** En-têtes reconnus automatiquement ; tout le reste devient un champ personnalisé. */
const HEADER_ALIASES: Record<string, string> = {
  prenom: 'firstName', 'prénom': 'firstName', firstname: 'firstName', first_name: 'firstName',
  nom: 'lastName', lastname: 'lastName', last_name: 'lastName', 'nom de famille': 'lastName',
  sousgroupe: 'subgroup', 'sous-groupe': 'subgroup', 'sous groupe': 'subgroup', subgroup: 'subgroup',
  groupe: 'subgroup', group: 'subgroup',
  telephone: 'phoneNumber', 'téléphone': 'phoneNumber', tel: 'phoneNumber', phone: 'phoneNumber',
  phonenumber: 'phoneNumber', phone_number: 'phoneNumber', mobile: 'phoneNumber',
  email: 'email', courriel: 'email', mail: 'email', email_address: 'email', emailaddress: 'email'
};

const BOM = /^\uFEFF/;

interface RejectedRow {
  rowNumber: number;
  reason: string;
  label: string;
}

@Component({
  selector: 'app-import-wizard',
  standalone: true,
  templateUrl: './import-wizard.component.html',
  styleUrls: ['./import-wizard.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class ImportWizardComponent implements OnInit {
  /** Membres déjà enregistrés : sert à repérer les doublons d'email. */
  @Input() existingMembers: Member[] = [];
  @Input() visible = false;
  @Output() closed = new EventEmitter<void>();
  /** Émis dès qu'au moins un membre a été créé, pour rafraîchir la liste. */
  @Output() imported = new EventEmitter<void>();

  readonly memberFields = MEMBER_FIELDS;

  step: 1 | 2 | 3 = 1;
  dragging = false;
  errorMessage = '';
  fileName = '';

  headers: string[] = [];
  rows: any[] = [];
  /** En-tête du fichier -> champ de `Member` (chaîne vide = colonne ignorée). */
  mapping: Record<string, string> = {};

  importing = false;
  progress = 0;
  createdCount = 0;
  duplicateCount = 0;
  rejectedRows: RejectedRow[] = [];

  /**
   * Un administrateur de groupe importe forcément dans le sien, le serveur
   * l'impose déjà (`member.routes.ts`, `scopeGroupId`) sans qu'on ait besoin
   * de le lui demander. Le super administrateur, lui, n'en a aucun par
   * défaut — il doit choisir la destination, sans quoi les fiches importées
   * n'appartiendraient à aucun groupe.
   */
  groups: GroupEntity[] = [];
  selectedGroupId = '';

  constructor(
    private memberService: MemberService,
    private groupService: GroupService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isSuperAdmin()) return;
    this.groupService.getGroups().subscribe({
      next: (groups) => (this.groups = groups),
      error: () => (this.groups = [])
    });
  }

  /** Bloque l'import tant que le super administrateur n'a pas choisi de groupe. */
  get needsGroupChoice(): boolean {
    return this.auth.isSuperAdmin() && !this.selectedGroupId;
  }

  get mappedColumns(): number {
    return Object.values(this.mapping).filter((field) => !!field).length;
  }

  get previewRows(): any[] {
    return this.rows.slice(0, 4);
  }

  get errorCount(): number {
    return this.rejectedRows.length;
  }

  // --- Étape 1 : dépôt du fichier -------------------------------------------

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragging = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Réinitialisé tout de suite : sans ça, re-sélectionner le même fichier ne
    // déclenche pas l'événement `change`.
    input.value = '';
    if (file) this.readFile(file);
  }

  private readFile(file: File) {
    this.errorMessage = '';
    this.fileName = file.name;

    const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';
    const reader = new FileReader();

    reader.onerror = () => (this.errorMessage = 'Le fichier n\'a pas pu être lu.');

    reader.onload = (event) => {
      try {
        const parsed = this.parse(event.target?.result, isCsv);
        if (!parsed.length) {
          this.errorMessage = 'Le fichier ne contient aucune ligne à importer.';
          return;
        }
        this.rows = parsed;
        this.headers = Object.keys(parsed[0]);
        this.mapping = this.autoMap(this.headers);
        this.step = 2;
      } catch (error) {
        console.error('Erreur lors de la lecture du fichier importé', error);
        this.errorMessage = 'Fichier illisible. Formats acceptés : .csv, .xlsx, .xls.';
      }
    };

    // Un CSV est lu en texte : cela préserve les accents (UTF-8) là où la lecture
    // binaire dépendrait de la page de code.
    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  private parse(result: string | ArrayBuffer | null | undefined, isCsv: boolean): any[] {
    if (result === null || result === undefined) {
      throw new Error('Contenu du fichier vide');
    }

    const workbook = isCsv
      // `raw: true` : sans lui, "1990-05-15" devient un numéro de série Excel et
      // "0612345678" perd son zéro initial. Le BOM d'Excel est retiré avant, sinon
      // il colle au premier en-tête.
      ? XLSX.read(String(result).replace(BOM, ''), { type: 'string', raw: true })
      // `cellDates` : les cellules de type date arrivent en `Date`, pas en numéro de série.
      : XLSX.read(new Uint8Array(result as ArrayBuffer), { type: 'array', cellDates: true });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Aucun onglet dans le fichier');
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }) as any[];
    return rows.map((row) => {
      const normalized: any = {};
      Object.keys(row).forEach((key) => {
        normalized[key.replace(BOM, '').trim()] = row[key];
      });
      return normalized;
    });
  }

  /** Reconnaît prénom/nom/téléphone/groupe par leur en-tête ; tout le reste devient un champ personnalisé. */
  private autoMap(headers: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    const taken = new Set<string>();

    headers.forEach((header) => {
      const key = header.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
      const recognized = HEADER_ALIASES[key] || HEADER_ALIASES[key.replace(/\s/g, '')];
      if (recognized && !taken.has(recognized)) {
        mapping[header] = recognized;
        taken.add(recognized);
      } else {
        mapping[header] = CUSTOM_FIELD;
      }
    });

    return mapping;
  }

  // --- Étape 2 : correspondance des colonnes ---------------------------------

  cellValue(row: any, header: string): string {
    return toText(row[header]);
  }

  fieldLabel(field: string): string {
    return MEMBER_FIELDS.find((item) => item.value === field)?.label || '';
  }

  backToUpload() {
    this.step = 1;
    this.errorMessage = '';
  }

  /** Construit les membres, écarte doublons et lignes incomplètes, puis crée le reste. */
  confirmMapping() {
    if (this.needsGroupChoice) return;

    const emails = new Set(
      this.existingMembers.map((member) => (member.email || '').toLowerCase()).filter(Boolean)
    );

    const toCreate: Member[] = [];
    this.rejectedRows = [];
    this.duplicateCount = 0;

    this.rows.forEach((row, index) => {
      const member: any = {};
      const customFields: Record<string, string> = {};

      this.headers.forEach((header) => {
        const field = this.mapping[header];
        if (!field) return; // colonne ignorée

        const value = toText(row[header]);
        if (field === CUSTOM_FIELD) {
          if (value) customFields[header] = value;
          return;
        }
        member[field] = value;
      });

      if (Object.keys(customFields).length) member.customFields = customFields;

      // Un administrateur de groupe n'a rien à préciser : le serveur impose
      // déjà le sien. Le super administrateur choisit sa destination ici.
      if (this.selectedGroupId) member.groupId = this.selectedGroupId;

      const label = `${member.firstName || ''} ${member.lastName || ''}`.trim() || `Ligne ${index + 2}`;
      const missing = REQUIRED_FIELDS.filter((field) => !member[field]);

      if (missing.length) {
        this.rejectedRows.push({
          rowNumber: index + 2,
          label,
          reason: `champs manquants : ${missing.map((field) => this.fieldLabel(field)).join(', ')}`
        });
        return;
      }

      const email = (member.email || '').toLowerCase();
      if (email && emails.has(email)) {
        this.duplicateCount++;
        return;
      }
      if (email) emails.add(email);

      toCreate.push(member as Member);
    });

    this.step = 3;
    this.createdCount = 0;
    this.progress = 0;

    if (!toCreate.length) {
      this.importing = false;
      this.progress = 100;
      return;
    }

    this.importing = true;
    this.createSequentially(toCreate, 0);
  }

  /** Création une par une : l'API ne propose pas d'insertion en lot. */
  private createSequentially(members: Member[], index: number) {
    if (index >= members.length) {
      this.importing = false;
      this.progress = 100;
      if (this.createdCount) this.imported.emit();
      return;
    }

    const advance = () => {
      this.progress = Math.round(((index + 1) / members.length) * 100);
      this.createSequentially(members, index + 1);
    };

    this.memberService.createMember(members[index]).subscribe({
      next: () => {
        this.createdCount++;
        advance();
      },
      error: (err) => {
        console.error(`Erreur d'import à la ligne ${index + 2}`, err);
        this.rejectedRows.push({
          rowNumber: index + 2,
          label: `${members[index].firstName || ''} ${members[index].lastName || ''}`.trim(),
          reason: `refusé par le serveur (${err.status || 'erreur réseau'})`
        });
        advance();
      }
    });
  }

  // --- Fermeture -------------------------------------------------------------

  close() {
    this.closed.emit();
    // Réinitialisation différée : l'assistant repart de l'étape 1 à la réouverture.
    setTimeout(() => this.reset(), 250);
  }

  private reset() {
    this.step = 1;
    this.rows = [];
    this.headers = [];
    this.mapping = {};
    this.fileName = '';
    this.errorMessage = '';
    this.importing = false;
    this.progress = 0;
    this.createdCount = 0;
    this.duplicateCount = 0;
    this.rejectedRows = [];
    // Repartir sans groupe choisi : mieux vaut le redemander qu'importer, par
    // inertie, un second fichier dans un groupe qui n'est plus le bon.
    this.selectedGroupId = '';
  }
}

/** Texte tel qu'il a été saisi : un numéro de téléphone garde son zéro initial. */
function toText(value: any): string {
  if (value === null || value === undefined) return '';
  return value instanceof Date ? toIsoDate(value) : String(value).trim();
}

/**
 * Date au format `YYYY-MM-DD` attendu par l'API, quelle que soit la façon dont la
 * cellule a été lue : `Date` (xlsx avec `cellDates`), numéro de série Excel ou texte.
 */
function toIsoDate(value: any): string {
  if (value === null || value === undefined) return '';

  // SheetJS construit ces dates à minuit heure locale : les getters locaux
  // renvoient donc le jour affiché dans Excel, ce que `toISOString()` ne ferait pas.
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return '';
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }

  // Formatage par xlsx : purement arithmétique, donc insensible au fuseau.
  if (typeof value === 'number') {
    return XLSX.SSF.format('yyyy-mm-dd', value);
  }

  return String(value).trim();
}
