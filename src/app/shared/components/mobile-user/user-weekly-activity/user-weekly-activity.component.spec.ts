import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserWeeklyActivityComponent } from './user-weekly-activity.component';

describe('UserWeeklyActivityComponent', () => {
  let component: UserWeeklyActivityComponent;
  let fixture: ComponentFixture<UserWeeklyActivityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserWeeklyActivityComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserWeeklyActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
