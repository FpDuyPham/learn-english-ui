import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase, IDBValidKey } from 'idb';
import { AppDBSchema, Sentence, Exercise } from './db-schema'; // Import from the new file

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private _db: IDBPDatabase<AppDBSchema>; // Use AppDBSchema for type safety

  get db(): IDBPDatabase<AppDBSchema> {
    if (!this._db) {
      console.warn('Database not initialized. Call initDB() first.');
    }
    return this._db;
  }

  public async initDB() {
    if (this._db) {
      return; // Already initialized
    }

    this._db = await openDB<AppDBSchema>('english-db', 1, { // Use AppDBSchema here
      upgrade(db) {
        // Create object stores here if they don't exist
        if (!db.objectStoreNames.contains('exercises')) {
          db.createObjectStore('exercises', {
            keyPath: 'id',
            autoIncrement: true,
          });
          console.log('Exercises store created');
        }
        if (!db.objectStoreNames.contains('sentences')) {
          db.createObjectStore('sentences', {
            keyPath: 'id',
            autoIncrement: true,
          });
          console.log('Sentences store created');
        }
        // ... create other object stores as needed ...
      },
    });
    console.log('Database initialized');
  }

  // Typed CRUD operations
  async add(
    storeName: keyof AppDBSchema,
    value: AppDBSchema[keyof AppDBSchema]['value']
  ): Promise<IDBValidKey> { // Return IDBValidKey
    return (await this.db).add(storeName, value);
  }

  async get<T extends keyof AppDBSchema>(
    storeName: T,
    key: IDBValidKey
  ): Promise<AppDBSchema[T]['value'] | undefined> { // Return specific type or undefined
    return (await this.db).get(storeName, key);
  }

  async getAll<T extends keyof AppDBSchema>(
    storeName: T
  ): Promise<AppDBSchema[T]['value'][]> {
    return (await this.db).getAll(storeName) || [];
  }

  async update<T extends keyof AppDBSchema>(
    storeName: T,
    value: AppDBSchema[T]['value']
  ): Promise<IDBValidKey> {
    return (await this.db).put(storeName, value);
  }

  async delete(
    storeName: keyof AppDBSchema,
    key: IDBValidKey
  ): Promise<void> {
    return (await this.db).delete(storeName, key);
  }
}
