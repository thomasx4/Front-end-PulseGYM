import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserQuickActionsComponent } from './user-quick-actions.component';

describe('UserQuickActionsComponent', () => {
  let component: UserQuickActionsComponent;
  let fixture: ComponentFixture<UserQuickActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserQuickActionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserQuickActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
