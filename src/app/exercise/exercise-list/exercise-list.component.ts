import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ExerciseService } from '../../core/exercise.service';
import { Exercise } from '../../core/models/exercise.model';
import { CommonModule } from '@angular/common';
import {MyButtonComponent} from '../../ui/my-button/my-button.component';

@Component({
  selector: 'app-exercise-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MyButtonComponent],
  templateUrl: './exercise-list.component.html',
  styleUrls: ['./exercise-list.component.scss'],
})
export class ExerciseListComponent implements OnInit {
  exercises: Exercise[] = [];

  constructor(private exerciseService: ExerciseService, private router: Router) {}

  ngOnInit(): void {
    this.exerciseService.exerciseList$.subscribe((exercises: Exercise[]) => {
      this.exercises = exercises;
    });
  }

  editExercise(exerciseId: number) {
    this.router.navigate(['/exercises', exerciseId, 'edit']);
  }

  deleteExercise(exerciseId: number) {
    if (confirm('Are you sure you want to delete this exercise?')) {
      this.exerciseService.deleteExercise(exerciseId).then(() => {
        // Optional: Display a success message
      });
    }
  }

  goToAudioSplitter(exerciseId: number) {
    this.router.navigate(['/exercises', exerciseId, 'audio-splitter']);
  }

  createExercise() {
    this.router.navigate(['/exercises/create']);
  }
}
