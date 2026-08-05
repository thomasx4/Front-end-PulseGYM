import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPromoCardComponent } from './user-promo-card.component';

describe('UserPromoCardComponent', () => {
  let component: UserPromoCardComponent;
  let fixture: ComponentFixture<UserPromoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserPromoCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserPromoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
