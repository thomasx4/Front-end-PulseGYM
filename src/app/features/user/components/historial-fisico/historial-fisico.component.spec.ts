import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorialFisicoComponent } from './historial-fisico.component';

describe('HistorialFisicoComponent', () => {
  let component: HistorialFisicoComponent;
  let fixture: ComponentFixture<HistorialFisicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistorialFisicoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistorialFisicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
