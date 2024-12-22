import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Exercise, Sentence } from '../core/db-schema';
import { Subscription, from, switchMap, forkJoin } from 'rxjs';
import { ExerciseService } from '../core/exercise.service';
import {
  Setting,
  SettingsButtonComponent,
} from '../ui/settings-button/settings-button.component';
import { ActionButtonsComponent } from '../ui/action-buttons/action-buttons.component';
import { FormsModule } from '@angular/forms';
import { TextInputComponent } from '../ui/text-input/text-input.component';
import { AudioPlayerComponent } from '../ui/audio-player/audio-player.component';
import { NavigationBarComponent } from '../ui/navigation-bar/navigation-bar.component';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FeedbackComponent } from '../ui/feedback/feedback.component';
import {SentenceService} from '../core/setence.service';

@Component({
  standalone: true,
  selector: 'app-listen-and-write',
  templateUrl: './listen-and-write.component.html',
  styleUrls: ['./listen-and-write.component.scss'],
  imports: [
    SettingsButtonComponent,
    ActionButtonsComponent,
    FormsModule,
    TextInputComponent,
    AudioPlayerComponent,
    NavigationBarComponent,
    FeedbackComponent,
  ],
})
export class ListenAndWriteComponent implements OnInit, OnDestroy {
  exerciseId: number;
  exercise: Exercise;
  sentences: Sentence[] = [];
  currentSentence: Sentence;
  currentSentenceIndex: number = 0;
  userInput: string = '';
  audioUrl: string = '';
  audioBlob: Blob;

  isCorrect: boolean = false;

  private routeSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private exerciseService: ExerciseService,
    private sentenceService: SentenceService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.params
      .pipe(
        switchMap((params) => {
          this.exerciseId = +params['id'];
          return from(this.exerciseService.getExercise(this.exerciseId));
        }),
        switchMap((exercise: Exercise) => {
          this.exercise = exercise;
          const sentenceObservables = exercise.sentences.map((sentence) =>
            this.sentenceService.getSentence(sentence.id)
          );
          return forkJoin(sentenceObservables);
        })
      )
      .subscribe((sentences: Sentence[]) => {
        this.sentences = sentences.filter((s: Sentence) => s !== undefined);
        this.startExercise();
      });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  async startExercise(): Promise<void> {
    if (this.sentences.length > 0) {
      this.currentSentenceIndex = 0;
      this.currentSentence = this.sentences[this.currentSentenceIndex];
      this.audioUrl = this.createAudioUrl(this.currentSentence.audioBlob);
    }
  }

  createAudioUrl(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    return url;
  }

  onPrevSentence(): void {
    this.updateCurrentSentence(this.currentSentenceIndex - 1);
  }

  onNextSentence(): void {
    this.updateCurrentSentence(this.currentSentenceIndex + 1);
  }

  // Helper function for text normalization
  normalizeText(text: string): string {
    return text.toLowerCase().replace(/[.,!]/g, '').trim();
  }

  private updateCurrentSentence(newIndex: number): void {
    if (newIndex >= 0 && newIndex < this.sentences.length) {
      this.currentSentenceIndex = newIndex;
      this.currentSentence = this.sentences[this.currentSentenceIndex];
      this.userInput = '';
      this.isCorrect = null;
      this.audioUrl = this.createAudioUrl(this.currentSentence.audioBlob);
      this.audioBlob = this.currentSentence.audioBlob;
    }
  }
}
