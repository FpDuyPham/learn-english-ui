import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ExerciseService } from '../../core/exercise.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/inputtextarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-exercise-create',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, ButtonModule, InputTextModule, Textarea, ToastModule],
  templateUrl: './exercise-create.component.html',
  styleUrls: ['./exercise-create.component.scss'],
  providers: [MessageService]
})
export class ExerciseCreateComponent {
  exerciseForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private exerciseService: ExerciseService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.exerciseForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  onSubmit() {
    if (this.exerciseForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.exerciseService.addExercise({
        ...this.exerciseForm.value,
        sentences: [], // Initialize with empty sentences array
      }).subscribe({
        next: (newId) => {
          this.router.navigate(['/exercises', newId]);
        },
        error: (err) => {
          console.error('Error creating exercise:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create exercise' });
          this.isSubmitting = false;
        }
      });
    }
  }
}
