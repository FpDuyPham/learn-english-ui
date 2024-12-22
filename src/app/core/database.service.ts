import Dexie, { Table } from 'dexie';
import { Exercise, Sentence } from './db-schema';

export class AppDB extends Dexie {
  exercises: Table<Exercise, number>;
  sentences: Table<Sentence, number>;

  constructor() {
    super('english-db');
    this.version(1).stores({
      exercises: '++id, name', // Auto-incrementing primary key, index on name
      sentences: '++id, exerciseId, englishText, vietnameseText', // Auto-incrementing primary key, index on exerciseId
    });
  }
}

export const db = new AppDB();
