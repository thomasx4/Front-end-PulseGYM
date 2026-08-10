import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterCredentialsComponent } from './filter-credentials.component';

describe('FilterCredentialsComponent', () => {
  let component: FilterCredentialsComponent;
  let fixture: ComponentFixture<FilterCredentialsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FilterCredentialsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterCredentialsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
