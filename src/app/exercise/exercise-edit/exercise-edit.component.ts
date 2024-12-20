import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ExerciseService } from '../../core/exercise.service';
import { Exercise } from '../../core/models/exercise.model';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Textarea } from 'primeng/inputtextarea';

@Component({
  selector: 'app-exercise-edit',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterModule, ButtonModule, InputTextModule, Textarea],
  templateUrl: './exercise-edit.component.html',
  styleUrls: ['./exercise-edit.component.scss'],
})
export class ExerciseEditComponent implements OnInit {
  exerciseForm: FormGroup;
  exerciseId: number;

  constructor(
    private fb: FormBuilder,
    private exerciseService: ExerciseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.exerciseForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.exerciseId = +this.route.snapshot.paramMap.get('id');
    this.exerciseService.getExercise(this.exerciseId).then(exercise => {
      this.exerciseForm.patchValue(exercise);
    });
  }

  onSubmit() {
    if (this.exerciseForm.valid) {
      const updatedExercise: Exercise = {
        id: this.exerciseId,
        ...this.exerciseForm.value,
        sentences: []
      };

      this.exerciseService.updateExercise(updatedExercise).then(() => {
        this.router.navigate(['/exercises', this.exerciseId]);
      });
    }
  }
}
