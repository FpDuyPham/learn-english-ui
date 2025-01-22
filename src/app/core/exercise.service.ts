import { Injectable } from '@angular/core';
import { Exercise, Sentence } from './db-schema';
import { Observable, from, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { db } from './database.service';

@Injectable({
  providedIn: 'root',
})
export class ExerciseService {
  constructor() {}

  getExercise(id: number): Observable<Exercise | undefined> {
    return from(db.exercises.get(id)).pipe(
      catchError((error) => {
        console.error('Error fetching exercise:', error);
        return of(undefined);
      }),
      switchMap((exercise) => {
        if (!exercise) return of(undefined);
        return from(
          db.sentences.where('exerciseId').equals(id).toArray()
        ).pipe(
          map((sentences) => ({ ...exercise, sentences })),
          catchError((error) => {
            console.error('Error fetching sentences for exercise:', error);
            return of(exercise);
          })
        );
      })
    );
  }

  addExercise(exercise: Exercise): Observable<number> {
    return from(
      db.transaction('rw', db.exercises, db.sentences, async () => {
        const exerciseId = await db.exercises.add({
          ...exercise,
          sentences: [], // Add exercise without sentences initially
        });

        // Add sentences with the correct exerciseId
        const sentenceIds = await db.sentences.bulkAdd(
          exercise.sentences.map((sentence) => ({
            ...sentence,
            exerciseId,
          }))
        );

        return exerciseId;
      })
    ).pipe(
      catchError((error) => {
        console.error('Error adding exercise:', error);
        return throwError(() => error);
      })
    );
  }

  getAllExercises(): Observable<Exercise[]> {
    return from(db.exercises.toArray()).pipe(
      switchMap((exercises: Exercise[]) => {
        if (exercises.length === 0) return of([]);
        const exercises$ = exercises.map((exercise: Exercise) =>
          from(
            db.sentences.where('exerciseId').equals(exercise.id!).toArray()
          ).pipe(
            map((sentences) => ({ ...exercise, sentences })),
            catchError((error) => {
              console.error(
                'Error fetching sentences for exercise:',
                error
              );
              return of({ ...exercise, sentences: [] });
            })
          )
        );
        return forkJoin(exercises$);
      }),
      catchError((error) => {
        console.error('Error getting all exercises:', error);
        return of([]);
      })
    );
  }

  updateExercise(exercise: Exercise): Observable<void> {
    return from(
      db.transaction('rw', db.exercises, db.sentences, async () => {
        // Update the exercise
        await db.exercises.update(exercise.id!, {
          name: exercise.name//,
          // description: 'exercise.description',
        });

        // Get the current sentences associated with the exercise
        const currentSentences = await db.sentences
          .where('exerciseId')
          .equals(exercise.id!)
          .toArray();

        // Identify sentences to add, update, and delete
        const sentencesToAdd = exercise.sentences.filter(
          (s) => !s.id
        );
        const sentencesToUpdate = exercise.sentences.filter((s) =>
          currentSentences.some((cs: Sentence) => cs.id === s.id)
        );
        const sentencesToDelete = currentSentences.filter(
          (cs: Sentence) => !exercise.sentences.some((s) => s.id === cs.id)
        );

        // Add new sentences
        await db.sentences.bulkAdd(
          sentencesToAdd.map((sentence) => ({
            ...sentence,
            exerciseId: exercise.id!,
          }))
        );

        // Update existing sentences
        await Promise.all(
          sentencesToUpdate.map((sentence) =>
            db.sentences.update(sentence.id!, sentence)
          )
        );

        // Delete removed sentences
        await db.sentences.bulkDelete(
          sentencesToDelete.map((sentence: Sentence) => sentence.id!)
        );
      })
    ).pipe(
      map(() => {
        return;
      }),
      catchError((error) => {
        console.error('Error updating exercise:', error);
        return throwError(() => error);
      })
    );
  }

  deleteExercise(id: number): Observable<void> {
    return from(
      db.transaction('rw', db.exercises, db.sentences, async () => {
        // Delete the exercise
        await db.exercises.delete(id);

        // Delete associated sentences
        await db.sentences.where('exerciseId').equals(id).delete();
      })
    ).pipe(
      map(() => {
        return;
      }),
      catchError((error) => {
        console.error('Error deleting exercise:', error);
        return throwError(() => error);
      })
    );
  }
}
