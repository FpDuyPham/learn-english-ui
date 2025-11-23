import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ExerciseService } from '../../core/exercise.service';
import { Exercise } from '../../core/db-schema';
import { Observable } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { GamificationWidgetComponent } from '../../ui/gamification-widget/gamification-widget.component';
import { GamificationCompactComponent } from '../../ui/gamification-compact/gamification-compact.component';
import { UserProfileService } from '../../core/user-profile.service';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  standalone: true,
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.component.html',
  styleUrls: ['./exercise-list.component.scss'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule, ButtonModule, TableModule, GamificationWidgetComponent, GamificationCompactComponent, AvatarModule, BadgeModule, OverlayPanelModule]
})
export class ExerciseListComponent implements OnInit {
  exercises$: Observable<Exercise[]>;
  cols: any[];
  profile$;
  @ViewChild('op') op!: OverlayPanel;

  constructor(
    private exerciseService: ExerciseService,
    private router: Router,
    private userProfileService: UserProfileService
  ) {
    this.profile$ = this.userProfileService.profile$;
  }

  ngOnInit(): void {
    this.exercises$ = this.exerciseService.getAllExercises();

    this.cols = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Name' },
      { field: 'actions', header: 'Actions' },
    ];
  }

  createExercise(): void {
    this.router.navigate(['/exercises/create']);
  }

  editExercise(exerciseId: number): void {
    this.router.navigate(['/exercises', exerciseId, 'edit']);
  }

  deleteExercise(exerciseId: number): void {
    this.exerciseService.deleteExercise(exerciseId).subscribe({
      next: () => {
        this.exercises$ = this.exerciseService.getAllExercises();
      },
      error: (error) => {
        console.error('Error deleting exercise:', error);
      },
    });
  }

  goToAudioSplitter(exerciseId: number): void {
    this.router.navigate(['/exercises', exerciseId, 'audio-splitter']);
  }

  goToListenAndWrite(id: number) {
    this.router.navigate(['/exercises', id, 'listen-write']);
  }

  gotoLearnPassive(exerciseId: number): void {
    this.router.navigate(['/exercises', exerciseId, 'passive-listen']);
  }

  logout(): void {
    this.userProfileService.logout();
    this.router.navigate(['/login']);
  }

  getAvatarColor(name: string): string {
    return this.userProfileService.getAvatarColor(name);
  }
}
