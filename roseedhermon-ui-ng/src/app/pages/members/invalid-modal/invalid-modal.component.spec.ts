import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvalidModalComponent } from './invalid-modal.component';

describe('InvalidModalComponent', () => {
  let component: InvalidModalComponent;
  let fixture: ComponentFixture<InvalidModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvalidModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvalidModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
