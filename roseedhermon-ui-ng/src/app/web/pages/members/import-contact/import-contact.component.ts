import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

const REQUIRED_FIELDS = ['firstName', 'lastName', 'gender', 'birthDate', 'profession', 'phoneNumber', 'email', 'city'];
const BOM = /^\uFEFF/;

@Component({
  selector: 'app-import-contact',
  standalone: true,
  templateUrl: './import-contact.component.html',
  styleUrls: ['./import-contact.component.scss'],
  imports: [CommonModule]
})
export class ImportContactComponent {
  @Output() validRows = new EventEmitter<any[]>();
  @Output() invalidRows = new EventEmitter<any[]>();
  loading = false;
  loadingMessage = '';
  errorMessage = '';

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Réinitialisé tout de suite : sans ça, re-sélectionner le même fichier ne
    // déclenche pas l'événement `change`.
    input.value = '';
    if (!file) return;

    this.errorMessage = '';
    this.loading = true;
    this.loadingMessage = 'Fichier en chargement...';

    const isCsv = /\.csv$/i.test(file.name) || file.type === 'text/csv';
    const reader = new FileReader();

    reader.onerror = () => this.fail('Le fichier n\'a pas pu être lu.');

    reader.onload = (e) => {
      setTimeout(() => {
        this.loadingMessage = 'Fichier en traitement...';
        try {
          this.processRows(this.readRows(e.target?.result, isCsv));
        } catch (error) {
          console.error('Erreur lors de la lecture du fichier importé', error);
          this.fail('Fichier illisible. Formats acceptés : .xlsx, .xls, .csv.');
        }
      }, 500); // petite pause pour simuler chargement
    };

    // Un CSV est lu en texte : cela préserve les accents (UTF-8) là où la lecture
    // binaire dépendrait de la page de code.
    if (isCsv) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  /** Lignes du premier onglet, avec les en-têtes débarrassés des espaces et du BOM. */
  private readRows(result: string | ArrayBuffer | null | undefined, isCsv: boolean): any[] {
    if (result === null || result === undefined) {
      throw new Error('Contenu du fichier vide');
    }

    const workbook = isCsv
      // Le BOM des CSV exportés depuis Excel collerait au premier en-tête, qui ne
      // serait alors plus reconnu comme `firstName`.
      // `raw: true` : sans lui, "1990-05-15" devient un numéro de série Excel et
      // "0612345678" perd son zéro initial.
      ? XLSX.read(String(result).replace(BOM, ''), { type: 'string', raw: true })
      // `cellDates` : les cellules de type date arrivent en `Date`, pas en numéro
      // de série.
      : XLSX.read(new Uint8Array(result as ArrayBuffer), { type: 'array', cellDates: true });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Aucun onglet dans le fichier');
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }) as any[];
    return rows.map((row) => {
      const normalized: any = {};
      Object.keys(row).forEach((key) => {
        const field = key.replace(BOM, '').trim();
        normalized[field] = field === 'birthDate' ? toIsoDate(row[key]) : toText(row[key]);
      });
      return normalized;
    });
  }

  /** Sépare les lignes complètes de celles auxquelles il manque des champs obligatoires. */
  private processRows(rows: any[]) {
    if (!rows.length) {
      this.fail('Le fichier ne contient aucune ligne à importer.');
      return;
    }

    const validData: any[] = [];
    const invalidData: any[] = [];

    rows.forEach((row: any, index: number) => {
      const missing = REQUIRED_FIELDS.filter((field) => !row[field] || row[field].toString().trim() === '');
      if (missing.length) {
        invalidData.push({
          rowNumber: index + 2,
          missingFields: missing,
          row
        });
      } else {
        validData.push(row);
      }
    });

    this.loading = false;
    if (invalidData.length) {
      this.invalidRows.emit(invalidData);
    } else {
      this.validRows.emit(validData);
    }
  }

  private fail(message: string) {
    this.loading = false;
    this.errorMessage = message;
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
  // renvoient donc bien le jour affiché dans Excel, ce que `toISOString()` ne
  // ferait pas (décalage UTC).
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
