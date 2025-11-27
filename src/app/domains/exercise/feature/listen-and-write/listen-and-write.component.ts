import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { Exercise, Sentence } from '../../../../core/db-schema';
import { Subscription, from, switchMap, forkJoin } from 'rxjs';
import { ExerciseService } from '../../data/exercise.service';
import { SettingsButtonComponent } from '../../../../shared/settings-button/settings-button.component';
import { FormsModule } from '@angular/forms';
import { TextInputComponent } from '../../../../shared/text-input/text-input.component';
import { AudioPlayerComponent } from '../../ui/audio-player/audio-player.component';
import { NavigationBarComponent } from '../../../../shared/navigation-bar/navigation-bar.component';
import { DomSanitizer } from '@angular/platform-browser';
import { SentenceService } from '../../../../core/setence.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-listen-and-write',
  templateUrl: './listen-and-write.component.html',
  styleUrls: ['./listen-and-write.component.scss'],
  imports: [
    CommonModule,
    SettingsButtonComponent,
    FormsModule,
    TextInputComponent,
    AudioPlayerComponent,
    NavigationBarComponent,
    CardModule,
    ButtonModule,
    ProgressBarModule
  ],
  animations: [
    trigger('feedbackAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
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

  isCorrect: boolean | null = null;
  showFullAnswer: boolean = false;
  maskedText: string = '';

  private routeSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private exerciseService: ExerciseService,
    private sentenceService: SentenceService,
    private sanitizer: DomSanitizer
  ) { }

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
      this.updateCurrentSentence(0);
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

  onMoveSentence(moveIndex: number): void {
    this.updateCurrentSentence(moveIndex);
  }

  checkAnswer(): void {
    const normalizedUserInput = this.normalizeText(this.userInput);
    const normalizedSentenceText = this.normalizeText(this.currentSentence.englishText);

    this.isCorrect = normalizedUserInput === normalizedSentenceText;

    if (this.isCorrect) {
      this.showFullAnswer = true;
      this.maskedText = this.currentSentence.englishText;
    } else {
      this.updateMaskedText();
    }
  }

  skipSentence(): void {
    this.showFullAnswer = true;
    this.isCorrect = false; // Mark as incorrect if skipped
    this.maskedText = this.currentSentence.englishText;
  }

  updateMaskedText(): void {
    const normalizedUserInput = this.normalizeText(this.userInput);
    const normalizedEnglishText = this.normalizeText(this.currentSentence.englishText);

    const userInputWords = normalizedUserInput.split(' ');
    const englishWords = normalizedEnglishText.split(' ');
    const result = [];

    for (let i = 0; i < englishWords.length; i++) {
      if (userInputWords[i] !== englishWords[i]) {
        result.push(englishWords[i]);
        break;
      }
      result.push(englishWords[i]);
    }

    for (let i = result.length; i < englishWords.length; i++) {
      result[i] = '*'.repeat(englishWords[i].length);
    }

    this.maskedText = result.join(' ');
  }

  // Helper function for text normalization
  normalizeText(text: string): string {
    return text?.toLowerCase().replace(/[.,!]/g, '').trim() || '';
  }

  private updateCurrentSentence(newIndex: number): void {
    if (newIndex >= 0 && newIndex < this.sentences.length) {
      this.currentSentenceIndex = newIndex;
      this.currentSentence = this.sentences[this.currentSentenceIndex];
      this.userInput = '';
      this.isCorrect = null;
      this.showFullAnswer = false;
      this.maskedText = '';
      this.audioUrl = this.createAudioUrl(this.currentSentence.audioBlob);
      this.audioBlob = this.currentSentence.audioBlob;
    }
  }
}
