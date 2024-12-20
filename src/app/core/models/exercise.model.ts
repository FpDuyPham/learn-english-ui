export interface Sentence {
  text: string;
  audioBlob?: Blob;
}

export interface Exercise {
  id?: number;
  name: string;
  description?: string;
  sentences: Sentence[];
}
