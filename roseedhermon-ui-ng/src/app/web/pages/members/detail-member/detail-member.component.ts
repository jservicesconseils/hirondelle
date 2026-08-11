import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Member } from '../../../../shared/services/api/model/member';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-detail-member',
  standalone: true,
  imports: [CommonModule, CalendarModule, ReactiveFormsModule],
  templateUrl: './detail-member.component.html',
  styleUrl: './detail-member.component.scss'
})
export class DetailMemberComponent {
  @Input() member!: Member;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<void>();
  @Output() save = new EventEmitter<Member>();

  editMode = false;
  memberForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  get initials(): string {
    const first = (this.member?.firstName || '').charAt(0);
    const last = (this.member?.lastName || '').charAt(0);
    return `${first}${last}`.toUpperCase() || '?';
  }

  get birthDateLabel(): string {
    return formatDate(this.member?.birthDate);
  }

  /**
   * Date d'ajout : l'`ObjectId` MongoDB porte l'horodatage de création sur ses
   * 4 premiers octets, comme dans la liste.
   */
  get memberSinceLabel(): string {
    const id = this.member?.id;
    if (!id || !/^[0-9a-f]{24}$/i.test(id)) return '—';
    return formatDate(new Date(parseInt(id.substring(0, 8), 16) * 1000));
  }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.memberForm = this.fb.group({
      lastName: [this.member?.lastName || ''],
      firstName: [this.member?.firstName || ''],
      gender: [this.member?.gender || ''],
      birthDate: [this.member?.birthDate ? new Date(this.member.birthDate) : null],
      phoneNumber: [this.member?.phoneNumber || ''],
      email: [this.member?.email || ''],
      city: [this.member?.city || ''],
      profession: [this.member?.profession || '']
    });
  }

  closePanel() {
    this.close.emit();
  }

  onClose() {
    this.closePanel();
  }

  onEdit() {
    this.editMode = true;
    this.edit.emit();
  }

  onSave() {
    if (this.memberForm.valid) {
      const updatedMember = {
        ...this.member,
        ...this.memberForm.value,
        birthDate: this.memberForm.value.birthDate ? this.memberForm.value.birthDate.toISOString().split('T')[0] : null
      };
      this.save.emit(updatedMember);
      this.editMode = false;
    }
  }

  onCancel() {
    this.editMode = false;
    this.initForm();
  }
}

/** Les dates des membres sont en ISO « AAAA-MM-JJ » : rendu en « JJ/MM/AAAA ». */
function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
