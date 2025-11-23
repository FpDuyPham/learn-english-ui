import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ExerciseService } from '../../core/exercise.service';
import { Exercise } from '../../core/db-schema';
import { Observable } from 'rxjs';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { GamificationWidgetComponent } from '../../ui/gamification-widget/gamification-widget.component';

import { MyButtonComponent } from '../../ui/my-button/my-button.component';

@Component({
  standalone: true,
  selector: 'app-exercise-list',
  templateUrl: './exercise-list.component.html',
  styleUrls: ['./exercise-list.component.scss'],
  imports: [ReactiveFormsModule, CommonModule, RouterModule, ButtonModule, TableModule, GamificationWidgetComponent, MyButtonComponent]
})
export class ExerciseListComponent implements OnInit {
  exercises$: Observable<Exercise[]>;
  cols: any[]; // Define the columns for the table

  constructor(
    private exerciseService: ExerciseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.exercises$ = this.exerciseService.getAllExercises();

    // Define the columns for the table
    this.cols = [
      { field: 'id', header: 'ID' },
      { field: 'name', header: 'Name' },
      { field: 'actions', header: 'Actions' }, // Column for buttons
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
        // Refresh the list after deleting
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
}
