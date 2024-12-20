import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { Exercise } from './models/exercise.model';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  private db: IDBPDatabase;
  private exerciseListSubject = new BehaviorSubject<Exercise[]>([]);
  public exerciseList$ = this.exerciseListSubject.asObservable();

  constructor() {
    this.initDB();
  }

  private async initDB() {
    this.db = await openDB('english-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('exercises', {
          keyPath: 'id',
          autoIncrement: true,
        });
      },
    });
    this.loadExercises();
  }

  private async loadExercises() {
    const exercises = await this.getAllExercises();
    this.exerciseListSubject.next(exercises);
  }

  // Add an exercise
  addExercise(exercise: Exercise): Observable<number> {
    const result = from(this.db.add('exercises', exercise).then(id => {
      this.loadExercises();
      return id as number;
    }));
    return result;
  }

  // Get all exercises
  getAllExercises(): Promise<Exercise[]> {
    return this.db.getAll('exercises');
  }

  // Get an exercise by ID
  getExercise(id: number): Promise<Exercise> {
    return this.db.get('exercises', id);
  }

  // Update an exercise
  updateExercise(exercise: Exercise): Promise<void> {
    return this.db.put('exercises', exercise).then(() => this.loadExercises());
  }

  // Delete an exercise
  deleteExercise(id: number): Promise<void> {
    return this.db.delete('exercises', id).then(() => this.loadExercises());
  }

  // Add other methods as needed (e.g., methods to add, update, or delete sentences within an exercise)
}
