// exercise.service.ts
import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Exercise, Sentence } from './db-schema';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private readonly storeName = 'exercises';

  constructor(private indexedDbService: DatabaseService) {}

  async addExercise(exercise: Exercise): Promise<number> {
    return this.indexedDbService.add(this.storeName, exercise);
  }

  async getExercise(id: number): Promise<Exercise> {
    return this.indexedDbService.get(this.storeName, id);
  }

  async getAllExercises(): Promise<Exercise[]> {
    return this.indexedDbService.getAll(this.storeName);
  }

  async updateExercise(id: number, exercise: Exercise): Promise<void> {
    return this.indexedDbService.update(this.storeName, id, exercise);
  }

  async deleteExercise(id: number): Promise<void> {
    return this.indexedDbService.delete(this.storeName, id);
  }

  // Example of a more complex operation: getting an exercise with its sentences
  async getExerciseWithSentences(id: number): Promise<{ exercise: Exercise; sentences: Sentence[] }> {
    const exercise = await this.getExercise(id);
    const sentences: Sentence[] = [];
    for (const sentenceId of exercise.sentenceIds) {
      const sentence = await this.indexedDbService.get('sentences', sentenceId);
      if (sentence) {
        sentences.push(sentence);
      }
    }
    return { exercise, sentences };
  }
}
