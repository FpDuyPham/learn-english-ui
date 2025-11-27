import { Injectable } from '@angular/core';
import { IDBPDatabase, openDB } from 'idb';
import { BehaviorSubject, Observable, Subject, catchError, throwError } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface SegmentData {
  id?: number;
  text: string;
  audio: ArrayBuffer;
}

@Injectable({
  providedIn: 'root',
})
export class NewAudioService {
  private db: IDBPDatabase;
  private audioBufferSubject = new Subject<AudioBuffer>();
  private jsonDataSubject = new BehaviorSubject<any[]>(null);

  audioBuffer$ = this.audioBufferSubject.asObservable();
  jsonData$ = this.jsonDataSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initIndexedDB();
  }

  async initIndexedDB() {
    this.db = await openDB('audio-splitter-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('segments')) {
          db.createObjectStore('segments', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      },
    });
  }

  setAudioFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const audioContext = new AudioContext();
      audioContext.decodeAudioData(
        arrayBuffer.slice(0),
        (buffer) => {
          this.audioBufferSubject.next(buffer);
        },
        (error) => {
          console.error('Error decoding audio data', error);
        },
      );
    };
    reader.onerror = (error) => {
      console.error('Error reading file', error);
    };
    reader.readAsArrayBuffer(file);
  }

  setJsonData(jsonData: any[]) {
    this.jsonDataSubject.next(jsonData);
  }

  async getSegments(): Promise<SegmentData[]> {
    if (!this.db) {
      await this.initIndexedDB();
    }
    const tx = this.db.transaction('segments', 'readonly');
    const store = tx.objectStore('segments');
    return await store.getAll();
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error.error);
    return throwError(
      () => new Error('Something bad happened; please try again later.'),
    );
  }
}
