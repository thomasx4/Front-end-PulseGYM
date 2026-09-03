import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MedicalProfileDetailComponent } from './medical-profile-detail.component';

describe('MedicalProfileDetailComponent', () => {
  let component: MedicalProfileDetailComponent;
  let fixture: ComponentFixture<MedicalProfileDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MedicalProfileDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MedicalProfileDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
