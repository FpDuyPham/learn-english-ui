import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Exercise } from '../../../../core/db-schema';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ExerciseService } from '../../data/exercise.service';
import { AudioSplitterComponent } from '../audio-splitter/audio-splitter.component';

@Component({
  selector: 'app-exercise-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterModule,
    ButtonModule,
    InputTextModule,
    InputTextarea,
    CardModule,
    FloatLabelModule,
    TagModule,
    ProgressSpinnerModule,
    AudioSplitterComponent
  ],
  templateUrl: './exercise-edit.component.html',
  styleUrls: ['./exercise-edit.component.scss'],
})
export class ExerciseEditComponent implements OnInit {
  exerciseForm: FormGroup;
  exerciseId: number;
  exercise: Exercise;
  isSubmitting = false;

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
    this.exerciseId = +this.route.snapshot.paramMap.get('id')!;

    this.exerciseService.getExercise(this.exerciseId).subscribe((exercise) => {
      if (exercise) {
        this.exercise = exercise;
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

  onSegmentsChange(segments: any[]) {
    const sentences = segments.map((s) => ({
      englishText: s.englishText,
      vietnameseText: s.vietnameseText,
      audioBlob: s.audioBlob,
      id: s.id,
    }));

    this.exerciseForm.patchValue({ sentences: sentences });
    this.exerciseForm.markAsDirty();
  }

  onSubmit() {
    if (this.exerciseForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const updatedExercise: Exercise = {
        id: this.exerciseId,
        ...this.exerciseForm.value,
      };

      this.exerciseService.updateExercise(updatedExercise).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/exercises', this.exerciseId]);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error updating exercise:', error);
        },
      });
    }
  }
}
