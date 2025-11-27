import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { UserProfileService } from '../../../user/user.api';
import { GamificationWidgetComponent } from '../../../user/ui/gamification-widget/gamification-widget.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ButtonModule, AvatarModule, GamificationWidgetComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  profile$;

  constructor(
    private userProfileService: UserProfileService,
    private router: Router
  ) {
    this.profile$ = this.userProfileService.profile$;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  getAvatarColor(name: string): string {
    return this.userProfileService.getAvatarColor(name);
  }
}
