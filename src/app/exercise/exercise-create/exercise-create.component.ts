import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ExerciseService } from '../../core/exercise.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/inputtextarea';

@Component({
  selector: 'app-exercise-create',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, ButtonModule, InputTextModule, Textarea],
  templateUrl: './exercise-create.component.html',
  styleUrls: ['./exercise-create.component.scss'],
})
export class ExerciseCreateComponent {
  exerciseForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private exerciseService: ExerciseService,
    private router: Router
  ) {
    this.exerciseForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  onSubmit() {
    if (this.exerciseForm.valid) {
      this.exerciseService.addExercise({
        ...this.exerciseForm.value,
        sentences: [], // Initialize with empty sentences array
      }).subscribe(newId => {
        this.router.navigate(['/exercises', newId]);
      });
    }
  }
}
