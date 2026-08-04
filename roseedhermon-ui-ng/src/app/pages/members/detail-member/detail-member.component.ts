import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Member } from '../../../api/model/member';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-detail-member',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, CalendarModule, ReactiveFormsModule],
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
