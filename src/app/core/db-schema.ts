import { DBSchema } from 'idb';

export interface Exercise {
  id?: number;
  name: string;
  description: string;
  sentences: Sentence[];
}

export interface Sentence {
  id?: number;
  exerciseId: number;
  englishText: string;
  vietnameseText: string;
  audioBlob?: Blob;
  selected?: boolean;// ui fields
  repetitionCount?: number;
  silentPauseDuration?: number;
}

export interface AppDBSchema extends DBSchema {
  exercises: {
    value: Exercise;
    key: number;
    indexes: { name: string };
  };
  sentences: {
    value: Sentence;
    key: number;
    indexes: { exerciseId: number };
  };
}

export type StoreName = keyof AppDBSchema;
export type StoreValue<T extends StoreName> = AppDBSchema[T]['value'];
