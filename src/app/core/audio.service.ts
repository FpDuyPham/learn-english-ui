import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private audioFileSubject = new BehaviorSubject<File | null>(null);
  audioFile$ = this.audioFileSubject.asObservable();

  private jsonDataSubject = new BehaviorSubject<any>(null); // Use a more specific interface if you have one
  jsonData$ = this.jsonDataSubject.asObservable();

  constructor() {}

  setAudioFile(file: File) {
    this.audioFileSubject.next(file);
  }

  setJsonData(data: any) {
    this.jsonDataSubject.next(data);
  }
}
