import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IpaDataService, IpaSymbol, WordPractice } from '../../../core/ipa-data.service';
import { SmartIpaTrainerComponent } from '../../smart-ipa-trainer/smart-ipa-trainer.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
    selector: 'app-ipa-practice',
    standalone: true,
    imports: [CommonModule, RouterModule, SmartIpaTrainerComponent, ButtonModule, CardModule, ProgressBarModule],
    template: `
    <div class="min-h-screen surface-ground p-4">
      <!-- Session Header -->
      <div class="max-w-4xl mx-auto mb-4">
        <button pButton icon="pi pi-arrow-left" label="Back" 
                class="p-button-text mb-3" (click)="goBack()"></button>
        
        <div *ngIf="symbolData" class="flex align-items-center justify-content-between mb-4">
          <div class="flex align-items-center gap-3">
            <div class="w-4rem h-4rem bg-primary-50 border-circle flex align-items-center justify-content-center">
              <span class="text-3xl font-bold text-primary font-serif">{{ symbolData.symbol }}</span>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-900 m-0">{{ symbolData.name }}</h2>
              <span class="text-600">Level {{ currentLevel }}</span>
            </div>
          </div>
          
          <!-- Session Progress -->
          <div *ngIf="!sessionComplete" class="text-right">
            <div class="text-sm text-600 mb-1">Session Progress</div>
            <div class="text-lg font-bold text-900">{{ currentWordIndex + 1 }} / {{ practiceWords.length }}</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <p-progressBar 
          *ngIf="!sessionComplete && practiceWords.length > 0" 
          [value]="sessionProgress"
          [showValue]="false"
          styleClass="mb-3">
        </p-progressBar>
      </div>

      <!-- Practice Session -->
      <div *ngIf="!sessionComplete && practiceWords.length > 0" class="max-w-4xl mx-auto">
        <p-card styleClass="shadow-4 border-round-2xl">
          <div class="text-center mb-4">
            <div class="text-sm text-600 uppercase font-semibold mb-2">Practice this word</div>
            <div class="text-5xl font-bold text-900 mb-2">{{ currentWord.targetWord }}</div>
            <div class="text-2xl text-500 font-serif">{{ currentWord.targetIpa }}</div>
          </div>

          <!-- Embedded Trainer  -->
          <app-smart-ipa-trainer 
            [practiceWords]="[currentWord]"
            [currentWordIndex]="0"
            (wordComplete)="handleWordComplete($event)">
          </app-smart-ipa-trainer>
        </p-card>
      </div>

      <!-- Session Complete -->
      <div *ngIf="sessionComplete" class="max-w-3xl mx-auto text-center">
        <p-card styleClass="shadow-4 border-round-2xl">
          <div class="py-6">
            <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
            <h2 class="text-3xl font-bold text-900 mb-3">🎉 Session Complete!</h2>
            
            <div class="grid grid-cols-3 gap-4 max-w-md mx-auto mb-5">
              <div class="text-center">
                <div class="text-3xl font-bold text-primary">{{ sessionResults.correct }}</div>
                <div class="text-sm text-600">Correct</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-900">{{ sessionResults.total }}</div>
                <div class="text-sm text-600">Total Words</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-bold text-green-600">{{ sessionResults.accuracy }}%</div>
                <div class="text-sm text-600">Accuracy</div>
              </div>
            </div>

            <!-- XP Earned -->
            <div class="mb-5">
              <div class="text-lg text-600 mb-2">XP Earned</div>
              <div class="text-4xl font-bold text-primary">+{{ xpEarned }}</div>
            </div>

            <!-- Plant Growth -->
            <div *ngIf="plantGrowthMessage" class="mb-5 p-3 bg-green-100 border-round">
              <i class="pi pi-sparkles text-green-600 mr-2"></i>
              <span class="text-green-800 font-semibold">{{ plantGrowthMessage }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 justify-content-center">
              <button pButton label="Practice Again" icon="pi pi-refresh" 
                      class="p-button-outlined" (click)="restartSession()"></button>
              <button pButton label="Back to Garden" icon="pi pi-home" 
                      (click)="goToChart()"></button>
            </div>
          </div>
        </p-card>
      </div>

      <!-- Empty State -->
      <div *ngIf="practiceWords.length === 0" class="max-w-3xl mx-auto text-center">
        <p-card styleClass="shadow-4 border-round-2xl">
          <div class="py-6">
            <i class="pi pi-lock text-6xl text-400 mb-4"></i>
            <h2 class="text-2xl font-bold text-900 mb-3">No Practice Words Available</h2>
            <p class="text-600 mb-4">This level doesn't have practice words yet. Try a different level or symbol.</p>
            <button pButton label="Back to Symbol" icon="pi pi-arrow-left" (click)="goBack()"></button>
          </div>
        </p-card>
      </div>
    </div>
  `,
    styles: [`
    .grid { display: grid; }
    .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .gap-4 { gap: 1.5rem; }
    .font-serif { font-family: 'Times New Roman', serif; }
  `]
})
export class IpaPracticeComponent implements OnInit, OnDestroy {
    symbolData: IpaSymbol | undefined;
    currentLevel: 1 | 2 | 3 = 1;
    practiceWords: WordPractice[] = [];
    currentWordIndex = 0;
    sessionComplete = false;

    sessionResults = {
        correct: 0,
        total: 0,
        accuracy: 0
    };

    xpEarned = 0;
    plantGrowthMessage = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ipaService: IpaDataService
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const symbolChar = params.get('symbol');
            const levelStr = params.get('level');

            if (symbolChar && levelStr) {
                this.symbolData = this.ipaService.getSymbol(symbolChar);
                this.currentLevel = parseInt(levelStr) as 1 | 2 | 3;
                this.practiceWords = this.ipaService.getWordsForPractice(symbolChar, this.currentLevel);
                this.sessionResults.total = this.practiceWords.length;
            }
        });
    }

    ngOnDestroy() {
        // Cleanup if needed
    }

    get currentWord(): WordPractice {
        return this.practiceWords[this.currentWordIndex] || { targetWord: '', targetIpa: '', confusions: [] };
    }

    get sessionProgress(): number {
        if (this.practiceWords.length === 0) return 0;
        return ((this.currentWordIndex + 1) / this.practiceWords.length) * 100;
    }

    handleWordComplete(event: { correct: boolean, word: string }) {
        if (event.correct) {
            this.sessionResults.correct++;
        }

        // Move to next word or complete session
        if (this.currentWordIndex < this.practiceWords.length - 1) {
            setTimeout(() => {
                this.currentWordIndex++;
            }, 1500); // Brief pause before next word
        } else {
            setTimeout(() => {
                this.completeSession();
            }, 1500);
        }
    }

    completeSession() {
        this.sessionComplete = true;

        // Calculate accuracy
        this.sessionResults.accuracy = Math.round(
            (this.sessionResults.correct / this.sessionResults.total) * 100
        );

        // Calculate XP (20 XP per correct word, bonus for high accuracy)
        this.xpEarned = this.sessionResults.correct * 20;
        if (this.sessionResults.accuracy >= 100) {
            this.xpEarned += 50; // Perfect bonus
        } else if (this.sessionResults.accuracy >= 80) {
            this.xpEarned += 20; // Good bonus
        }

        // Get current progress
        const currentProgress = this.ipaService.getProgress(this.symbolData!.symbol);
        const oldStage = currentProgress.plantStage;
        const oldXP = currentProgress.xp;

        // Update progress
        this.ipaService.updateProgress(this.symbolData!.symbol, {
            xp: currentProgress.xp + this.xpEarned,
            accuracy: this.sessionResults.accuracy,
            status: this.sessionResults.accuracy >= 80 ? 'learning' : 'new'
        });

        // Check for plant growth
        const newProgress = this.ipaService.getProgress(this.symbolData!.symbol);
        if (newProgress.plantStage > oldStage) {
            const stages = ['🌱 Seed', '🌿 Sprout', '🪴 Plant', '🌳 Tree'];
            this.plantGrowthMessage = `Your ${this.symbolData!.name} grew to ${stages[newProgress.plantStage]}!`;
        }
    }

    restartSession() {
        this.currentWordIndex = 0;
        this.sessionComplete = false;
        this.sessionResults = {
            correct: 0,
            total: this.practiceWords.length,
            accuracy: 0
        };
        this.xpEarned = 0;
        this.plantGrowthMessage = '';
    }

    goBack() {
        this.router.navigate(['/ipa/detail', this.symbolData?.symbol]);
    }

    goToChart() {
        this.router.navigate(['/ipa/chart']);
    }
}
