import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-import-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, ProgressBarModule],
  templateUrl: './import-modal.component.html',
  styleUrls: ['./import-modal.component.scss']
})
export class ImportModalComponent {
  @Input() visible: boolean = false;
  @Input() loading: boolean = false;
  @Input() previewData: any[] = [];
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  @Input() showSuccessMessage = false;

 // showSuccessMessage = false; 
  @Input() set progress(value: number) {
    this._progress = value;
  
    // Quand l'import est terminé, affiche le message de succès
    if (value === 100 && this.loading === false) {
      this.showSuccessMessage = true; 
    }
  }
  get progress(): number {
    return this._progress;
  }
  private _progress = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && !changes['visible'].currentValue) {
      this.showSuccessMessage = false; 
  } }

  close() {
    this.visible = false;
    this.showSuccessMessage = false; 
    this.cancel.emit();
  }
}
