import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserStatCardComponent } from './user-stat-card.component';

describe('UserStatCardComponent', () => {
  let component: UserStatCardComponent;
  let fixture: ComponentFixture<UserStatCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserStatCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserStatCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
