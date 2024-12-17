// sentence.service.ts
import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
import { Sentence } from './db-schema';

@Injectable({
  providedIn: 'root',
})
export class SentenceService {
  private readonly storeName = 'sentences';

  constructor(private indexedDbService: IndexedDbService) {}

  async addSentence(sentence: Sentence): Promise<number> {
    return this.indexedDbService.add(this.storeName, sentence);
  }

  async getSentence(id: number): Promise<Sentence> {
    return this.indexedDbService.get(this.storeName, id);
  }

  async getAllSentences(): Promise<Sentence[]> {
    return this.indexedDbService.getAll(this.storeName);
  }

  async updateSentence(id: number, sentence: Sentence): Promise<void> {
    return this.indexedDbService.update(this.storeName, id, sentence);
  }

  async deleteSentence(id: number): Promise<void> {
    return this.indexedDbService.delete(this.storeName, id);
  }
}
