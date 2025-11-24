import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfiguratorComponent } from './ui/configurator/configurator.component';
import { HeaderComponent } from './shared/header/header.component';
import { UserProfileService } from './core/user-profile.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfiguratorComponent, HeaderComponent],
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
