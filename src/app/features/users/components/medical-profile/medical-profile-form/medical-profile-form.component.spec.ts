import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalProfileFormComponent } from './medical-profile-form.component';

describe('MedicalProfileFormComponent', () => {
  let component: MedicalProfileFormComponent;
  let fixture: ComponentFixture<MedicalProfileFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MedicalProfileFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MedicalProfileFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
