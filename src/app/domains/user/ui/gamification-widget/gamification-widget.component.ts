import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';
import { UserProfileService } from '../../data/user-profile.service';

@Component({
  selector: 'app-gamification-widget',
  standalone: true,
  imports: [CommonModule, CardModule, ProgressBarModule],
  templateUrl: './gamification-widget.component.html',
  styleUrl: './gamification-widget.component.scss'
})
export class GamificationWidgetComponent {
  profile$;

  constructor(private userProfileService: UserProfileService) {
    this.profile$ = this.userProfileService.profile$;
  }

  getXPToNextLevel(currentXp: number, currentLevel: number): number {
    const currentLevelXP = Math.floor((currentLevel - 1.0) / 0.5) * 1000;
    const nextLevelXP = currentLevelXP + 1000;
    return nextLevelXP - currentXp;
  }

  getXPProgress(currentXp: number, currentLevel: number): number {
    const currentLevelXP = Math.floor((currentLevel - 1.0) / 0.5) * 1000;
    const xpInCurrentLevel = currentXp - currentLevelXP;
    return Math.min((xpInCurrentLevel / 1000) * 100, 100);
  }

  getCompletedMissionsCount(missions: any[]): number {
    return missions?.filter(m => m.completed).length || 0;
  }

  getMissionProgress(mission: any): number {
    if (!mission || !mission.target) return 0;
    return Math.min((mission.current / mission.target) * 100, 100);
  }
}
