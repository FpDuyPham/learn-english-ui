import { Injectable } from '@angular/core';
import { Sentence } from './db-schema';
import {Observable, from, throwError, of} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { db } from './database.service'; // Assuming you have a db instance from Dexie

@Injectable({
  providedIn: 'root',
})
export class SentenceService {
  constructor() {}

  addSentence(sentence: Sentence): Observable<number> {
    return from(db.sentences.add(sentence)).pipe(
      catchError((error) => {
        console.error('Error adding sentence:', error);
        return throwError(() => error);
      })
    );
  }

  getSentence(id: number): Observable<Sentence | undefined> {
    return from(db.sentences.get(id)).pipe(
      catchError((error) => {
        console.error('Error fetching sentence:', error);
        return of(undefined); // or throwError if you want to propagate the error
      })
    );
  }

  getAllSentences(): Observable<Sentence[]> {
    return from(db.sentences.toArray()).pipe(
      catchError((error) => {
        console.error('Error fetching all sentences:', error);
        return of([]); // Return an empty array on error
      })
    );
  }

  updateSentence(sentence: Sentence): Observable<void> {
    return from(db.sentences.update(sentence.id!, sentence)).pipe(
      map(() => {
        return;
      }), // Update operation doesn't return a value in Dexie
      catchError((error) => {
        console.error('Error updating sentence:', error);
        return throwError(() => error);
      })
    );
  }

  deleteSentence(id: number): Observable<void> {
    return from(db.sentences.delete(id)).pipe(
      map(() => {
        return;
      }), // Delete operation doesn't return a value in Dexie
      catchError((error) => {
        console.error('Error deleting sentence:', error);
        return throwError(() => error);
      })
    );
  }

  getSentencesByIds(ids: number[]): Observable<Sentence[]> {
    return from(
      db.sentences
        .where('id')
        .anyOf(ids)
        .toArray()
    ).pipe(
      catchError(error => {
        console.error('Error getting sentences by ids:', error);
        return of([]);
      })
    );
  }
}
