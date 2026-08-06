import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() search = new EventEmitter<string>();

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.search.emit(value);
  }
}