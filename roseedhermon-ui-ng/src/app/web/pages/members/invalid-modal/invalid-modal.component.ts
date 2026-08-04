import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-invalid-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, TableModule, ButtonModule],
  templateUrl: './invalid-modal.component.html',
  styleUrls: ['./invalid-modal.component.scss']
})
export class InvalidModalComponent {
  @Input() visible: boolean = false;
  @Input() invalidRows: any[] = [];
  @Input() total: number = 0;
  @Output() close = new EventEmitter<void>();
}