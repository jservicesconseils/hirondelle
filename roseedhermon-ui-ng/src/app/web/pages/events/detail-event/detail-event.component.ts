import { Component, Input, Output, EventEmitter } from '@angular/core';
import { EventDTO } from '../../../../shared/services/api/model/eventDTO';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { OverlayPanelModule } from 'primeng/overlaypanel';

@Component({
  selector: 'app-detail-event',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, OverlayPanelModule],
  templateUrl: './detail-event.component.html',
  styleUrl: './detail-event.component.scss'
})
export class DetailEventComponent {
  @Input() event!: EventDTO;
  @Output() close = new EventEmitter<void>();
  @Output() editEvent = new EventEmitter<EventDTO>();

  selectedPresenter: any = null;

  closePanel() {
    this.close.emit();
  }

  onClose() {
    this.closePanel();
  }

  onEdit() {
    this.editEvent.emit(this.event);
  }
} 