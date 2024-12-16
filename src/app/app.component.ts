import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {MenuComponent} from './ui/menu/menu.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
