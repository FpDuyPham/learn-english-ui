
// indexed-db.service.ts
import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { AppDBSchema, Sentence, Exercise } from './db-schema'; // Import schema and interfaces
import { DBSchema } from 'idb';

// Database schema
interface AppDBSchema extends DBSchema {
  sentences: {
    key: number;
    value: { text: string; audio: AudioBuffer };
  };
  exercises: {
    key: number;
    value: { name: string; sentenceIds: number[] };
  };
}

// Data interfaces
interface Sentence {
  id?: number; // Optional because it will be auto-generated by IndexedDB
  text: string;
  audio: AudioBuffer;
}

interface Exercise {
  id?: number; // Optional
  name: string;
  sentenceIds: number[];
}


@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private db: IDBPDatabase<AppDBSchema> | undefined;
  private readonly dbName = 'audio-app-db';

  constructor() {
    this.initDatabase();
  }

  private async initDatabase() {
    this.db = await openDB<AppDBSchema>(this.dbName, 1, {
      upgrade(db) {
        db.createObjectStore('sentences', {
          autoIncrement: true,
        });
        db.createObjectStore('exercises', {
          autoIncrement: true,
        });
      },
    });
  }

  // Basic CRUD operations (can be made more generic if needed)
  async add(storeName: string, value: any): Promise<number> {
    return (await this.db)?.add(storeName, value);
  }

  async get(storeName: string, key: number): Promise<any> {
    return (await this.db)?.get(storeName, key);
  }

  async getAll(storeName: string): Promise<any[]> {
    return (await this.db)?.getAll(storeName) || [];
  }

  async update(storeName: string, key: number, value: any): Promise<void> {
    await (await this.db)?.put(storeName, value, key);
  }

  async delete(storeName: string, key: number): Promise<void> {
    await (await this.db)?.delete(storeName, key);
  }
}