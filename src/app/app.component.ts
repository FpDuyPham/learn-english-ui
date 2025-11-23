import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from './ui/menu/menu.component';
import { ConfiguratorComponent } from './ui/configurator/configurator.component';
import { UserProfileService } from './core/user-profile.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MenuComponent, ConfiguratorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'learn-english-ui';

  constructor(private userProfileService: UserProfileService) { }

  ngOnInit(): void {
    // Initialize user profile service
    this.userProfileService.profile$.subscribe();
  }
}
