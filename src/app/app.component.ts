import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {ButtonModule} from 'primeng/button';
import {MenuComponent} from './ui/menu/menu.component';
import {DatabaseService} from './core/database.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, MenuComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [DatabaseService]
})
export class AppComponent {
  constructor(private databaseService: DatabaseService) {
    // Initialize the database when the app starts
    this.databaseService.initDB().then(() => {
      console.log('Database initialized from AppModule');
    });
  }
}
