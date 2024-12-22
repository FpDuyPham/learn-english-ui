import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Exercise, Sentence } from '../../core/db-schema';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import {ExerciseService} from '../../core/exercise.service';

@Component({
  selector: 'app-exercise-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './exercise-edit.component.html',
  styleUrls: ['./exercise-edit.component.scss'],
})
export class ExerciseEditComponent implements OnInit {
  exerciseForm: FormGroup;
  exerciseId: number;
  exercise: Exercise;

  constructor(
    private fb: FormBuilder,
    private exerciseService: ExerciseService,
    protected router: Router,
    private route: ActivatedRoute
  ) {
    this.exerciseForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      sentences: [[]]
    });
  }

  ngOnInit(): void {
    this.exerciseId = +this.route.snapshot.paramMap.get('id');

    this.exerciseService.getExercise(this.exerciseId).subscribe((exercise) => {
      if (exercise) {
        this.exercise = exercise;
        // Initialize form after getting exercise data
        this.exerciseForm = this.fb.group({
          name: [this.exercise.name || '', Validators.required],
          description: [this.exercise.description || ''],
          sentences: [this.exercise.sentences || []],
        });
      } else {
        console.error('Exercise not found');
        this.router.navigate(['/404']);
      }
    });
  }

  onSubmit() {
    if (this.exerciseForm.valid) {
      const updatedExercise: Exercise = {
        id: this.exerciseId,
        ...this.exerciseForm.value,
      };

      this.exerciseService.updateExercise(updatedExercise).subscribe({
        next: () => {
          this.router.navigate(['/exercises', this.exerciseId]);
        },
        error: (error) => {
          console.error('Error updating exercise:', error);
        },
      });
    }
  }
}
