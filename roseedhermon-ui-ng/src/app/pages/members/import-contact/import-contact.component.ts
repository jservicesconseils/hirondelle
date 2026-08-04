import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

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

  onFileChange(event: any) {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1) return;

    this.loading = true;
    this.loadingMessage = 'Fichier en chargement...';

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      setTimeout(() => {
        this.loadingMessage = 'Fichier en traitement...';

        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const requiredFields = ['firstName', 'lastName', 'gender', 'birthDate', 'profession', 'phoneNumber', 'email', 'city'];
        const validData: any[] = [];
        const invalidData: any[] = [];

        jsonData.forEach((row: any, index: number) => {
          const missing = requiredFields.filter(field => !row[field] || row[field].toString().trim() === '');
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
      }, 500); // petite pause pour simuler chargement
    };

    reader.readAsArrayBuffer(target.files[0]);
    event.target.value = '';
  }
}
