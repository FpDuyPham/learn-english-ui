import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IpaDataService, IpaSound, IpaWord } from '../../../core/ipa-data.service';
import { SmartIpaTrainerComponent } from '../../smart-ipa-trainer/smart-ipa-trainer.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
    selector: 'app-ipa-trainer',
    standalone: true,
    imports: [CommonModule, RouterModule, SmartIpaTrainerComponent, ButtonModule, CardModule, ProgressBarModule],
    templateUrl: './ipa-trainer.component.html',
    styleUrls: ['./ipa-trainer.component.scss']
})
export class IpaTrainerComponent implements OnInit, OnDestroy {
    ipaSound?: IpaSound;
    currentWordIndex = 0;
    canMoveNext = false;
    sessionComplete = false;
    feedback: { correct: boolean, message: string } | null = null;

    sessionResults = {
        attempted: 0,
        correct: 0,
        accuracy: 0
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private ipaService: IpaDataService
    ) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const symbol = params.get('symbol');
            const level = parseInt(params.get('level') || '1');

            if (symbol) {
                this.ipaSound = this.ipaService.getIPASound(symbol, level);
            }
        });
    }

    ngOnDestroy() {
        // Cleanup
    }

    get currentWord(): IpaWord {
        if (!this.ipaSound || !this.ipaSound.words[this.currentWordIndex]) {
            return { word: '', ipa: '', confusions: [] };
        }
        return this.ipaSound.words[this.currentWordIndex];
    }

    get progressPercent(): number {
        return ((this.currentWordIndex + 1) / 30) * 100;
    }

    handleRecordingResult(correct: boolean, detected: string) {
        this.feedback = {
            correct,
            message: correct
                ? 'Perfect! You sounded like a native speaker.'
                : this.getErrorMessage(detected)
        };

        // Record attempt
        if (this.ipaSound) {
            this.ipaService.recordWordAttempt(this.ipaSound.symbol, this.ipaSound.level, correct);
        }

        this.sessionResults.attempted++;
        if (correct) this.sessionResults.correct++;
        this.sessionResults.accuracy = Math.round((this.sessionResults.correct / this.sessionResults.attempted) * 100);

        this.canMoveNext = true;
    }

    getErrorMessage(detected: string): string {
        const confusion = this.currentWord.confusions.find(c => c.word.toLowerCase() === detected.toLowerCase());
        return confusion ? confusion.explanation : `Detected: "${detected}". Try again!`;
    }

    skipWord() {
        // Track as skipped (not failed, not successful)
        this.sessionResults.attempted++;  // Count as attempted but not correct
        this.canMoveNext = true;
        this.feedback = {
            correct: false,
            message: 'Skipped - try this word again later!'
        };
    }

    nextWord() {
        if (!this.canMoveNext) return;

        this.currentWordIndex++;
        this.canMoveNext = false;
        this.feedback = null;

        if (this.currentWordIndex >= 30) {
            this.completeSession();
        }
    }

    previousWord() {
        if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            this.canMoveNext = false;
            this.feedback = null;
        }
    }

    completeSession() {
        this.sessionComplete = true;
    }

    restartSession() {
        this.currentWordIndex = 0;
        this.canMoveNext = false;
        this.sessionComplete = false;
        this.feedback = null;
        this.sessionResults = {
            attempted: 0,
            correct: 0,
            accuracy: 0
        };
    }

    goBack() {
        this.router.navigate(['/ipa/levels']);
    }
}
