// src/types/pcm-util.d.ts
declare module 'pcm-util' {
  export type Format = {
    sampleRate: number;
    channels: number;
    interleaved: boolean;
    float: boolean;
    bitDepth: number;
    signed: boolean;
    byteOrder: 'BE' | 'LE';
  };

  export function format(audioBuffer: AudioBuffer): Format;
  export function toArrayBuffer(audioBuffer: AudioBuffer | any): ArrayBuffer;
  export function toAudioBuffer(
    audioData: ArrayBuffer,
    format: Format,
  ): AudioBuffer;
  export function toBuffer(
    audioData: ArrayBuffer,
    format: Format,
  ): AudioBuffer;
  export function isPCM(data: any): boolean;
  export function isAudioBuffer(data: any): boolean;
  export function isBuffer(data: any): boolean;
}
