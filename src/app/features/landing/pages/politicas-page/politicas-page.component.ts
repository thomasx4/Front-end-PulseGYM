import { Component } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-politicas-page',
  templateUrl: './politicas-page.component.html',
  styleUrls: ['./politicas-page.component.scss']
})
export class PoliticasPageComponent {
  constructor(private location: Location) {}

  volver() {
    this.location.back();
  }
}