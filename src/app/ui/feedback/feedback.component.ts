import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import {MyButtonComponent} from '../my-button/my-button.component';
import {TextInputComponent} from '../text-input/text-input.component';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, MyButtonComponent,TextInputComponent],
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.scss'],
})
export class FeedbackComponent implements OnInit {
  @Input() vietnameseText: string = '';
  @Input() englishText: string = '';

  userInput: string = '';
  showFullAnswer: boolean = false;
  maskedText: string = '';
  isCorrect: boolean | null = null;

  constructor() {}

  ngOnInit(): void {
  }

  toggleShowAnswer(): void {
    this.showFullAnswer = !this.showFullAnswer;
    if (this.showFullAnswer) {
      this.maskedText = this.englishText;
    } else {
      this.updateMaskedText();
    }
  }

  updateMaskedText(): void {
    if (this.isCorrect === false) {
      const normalizedUserInput = this.normalizeText(this.userInput);
      const normalizedEnglishText = this.normalizeText(this.englishText);

      const userInputWords = normalizedUserInput.split(' ');
      const englishWords = normalizedEnglishText.split(' ');
      const result = [];

      for (let i = 0; i < englishWords.length; i++) {
        if (userInputWords[i] !== englishWords[i]){
          result.push(englishWords[i]);
          break;
        }
        result.push(englishWords[i]);
      }

      for (let i = result.length; i < englishWords.length; i++) {
        result[i] = '*'.repeat(englishWords.length)
      }

      this.maskedText = result.join(' ');
    } else if (this.isCorrect === true) {
      this.maskedText = this.englishText;
    }
  }

  // Helper function for text normalization
  normalizeText(text: string): string {
    return text.toLowerCase().replace(/[.,!]/g, '').trim();
  }

  isNullUndefinedOrWhitespace(str: string | null | undefined): boolean {
    return str?.trim() === "" || str === null || str === undefined;
  }

  onCheckAnswer(): void {
    const normalizedUserInput = this.normalizeText(this.userInput);
    const normalizedSentenceText = this.normalizeText(
      this.englishText
    );

    this.isCorrect = normalizedUserInput === normalizedSentenceText;

    if (this.isCorrect === true) {
      this.showFullAnswer = true;
      this.maskedText = this.englishText;
    } else if (this.isCorrect === false) {
      this.updateMaskedText();
    }
  }
}
