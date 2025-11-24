import { pipeline, env } from '@huggingface/transformers';

// Configure environment - use remote HuggingFace CDN
env.allowLocalModels = false;
env.allowRemoteModels = true;
env.useBrowserCache = false; // Disable to avoid Blob errors

// Define the interface for the output
interface WhisperOutput {
    text: string;
    chunks: { text: string; timestamp: [number, number] }[];
}

class WhisperWorker {
    static instance: any = null;
    // Using Xenova/whisper-base (smaller, faster, good for Vietnamese)
    static modelId = 'Xenova/whisper-base';

    static async getInstance(progress_callback: any = null) {
        if (this.instance === null) {
            this.instance = await pipeline('automatic-speech-recognition', this.modelId, {
                progress_callback,
            });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;

    if (type === 'load') {
        self.postMessage({ status: 'loading', progress: 0 });
        try {
            await WhisperWorker.getInstance((data: any) => {
                self.postMessage({
                    status: 'progress',
                    progress: data.progress || 0,
                    file: data.file
                });
            });
            self.postMessage({ status: 'ready' });
        } catch (err) {
            console.error('Error loading Whisper model:', err);
            self.postMessage({ status: 'error', error: err });
        }
    } else if (type === 'transcribe') {
        try {
            // 1. Load the model (or get cached instance)
            const transcriber = await WhisperWorker.getInstance();

            // 2. Run transcription
            const output = await transcriber(audio, {
                chunk_length_s: 30,
                return_timestamps: 'word',
            });

            // 3. Send result back
            self.postMessage({ type: 'complete', data: output as WhisperOutput });

        } catch (error) {
            self.postMessage({ type: 'error', data: error });
        }
    }
});
