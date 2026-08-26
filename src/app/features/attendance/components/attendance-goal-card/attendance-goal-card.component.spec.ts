import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceGoalCardComponent } from './attendance-goal-card.component';

describe('AttendanceGoalCardComponent', () => {
  let component: AttendanceGoalCardComponent;
  let fixture: ComponentFixture<AttendanceGoalCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AttendanceGoalCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AttendanceGoalCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
