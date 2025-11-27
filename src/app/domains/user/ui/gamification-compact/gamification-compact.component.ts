import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileService } from '../../data/user-profile.service';

@Component({
  selector: 'app-gamification-compact',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gamification-compact.component.html',
  styleUrl: './gamification-compact.component.scss'
})
export class GamificationCompactComponent {
  profile$;

  constructor(private userProfileService: UserProfileService) {
    this.profile$ = this.userProfileService.profile$;
  }
}
