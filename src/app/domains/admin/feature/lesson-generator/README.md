# Admin Lesson Generator

An advanced tool for admins to automatically generate segmented English learning lessons from audio files and transcripts.

## Features

- **Audio Upload**: Support for various audio formats
- **Automatic Transcription**: Uses Vosk speech recognition
- **Intelligent Alignment**: Fuzzy matching algorithm aligns Vosk timestamps with correct script
- **Visual Editing**: Interactive waveform with draggable regions
- **Manual Adjustments**: Fine-tune segment boundaries and text
- **JSON Export**: Export lesson data for use in exercises

## How to Use

### 1. Access the Lesson Generator

Navigate to `/admin/lesson-generator` in your browser.

### 2. Prepare Your Materials

**Audio File**: Prepare an audio recording (MP3, WAV, etc.) with clear speech.

**Script**: Prepare the correct transcript with proper punctuation. Sentences will be automatically detected based on periods, exclamation marks, and question marks.

Example script:
```
Hello and welcome to this lesson. We are going to learn about English pronunciation. Are you ready? Let's begin!
```

### 3. Generate Segments

1. Click "Choose Audio File" and select your audio file
2. Paste your script into the text area
3. Click "Generate Segments"

The system will:
- Load the Vosk model
- Transcribe the audio
- Align the transcription with your script using fuzzy matching
- Create visual regions on the waveform

### 4. Review & Edit

**Visual Review**:
- Click any region on the waveform to play that segment
- Regions are color-coded for easy identification

**Manual Adjustments**:
- **Text**: Edit the segment text directly in the list
- **Timing**: Adjust start/end times using the number inputs
- **Drag & Resize**: Drag region edges on the waveform for visual adjustment

### 5. Export

Click "Export JSON" to download the lesson data. The JSON includes:
- Metadata (filename, script, timestamp)
- Array of segments with ID, text, start time, and end time

## Algorithm Overview

### Alignment Process

1. **Sentence Splitting**: The script is split into sentences based on punctuation (`.`, `!`, `?`)

2. **Fuzzy Matching**: Each sentence is matched with Vosk transcription:
   - Words are normalized (lowercase, no punctuation)
   - Similarity scores calculated using string-similarity library
   - Threshold: 60% similarity

3. **Timestamp Assignment**:
   - First word match: Sets segment start time
   - Last word match: Sets segment end time
   - Missing words: Estimated based on surrounding timings

4. **Gap Filling**: If alignment fails, timestamps are estimated based on previous segments

### Key Features

- **Tolerant of Errors**: Handles Vosk mishearings (e.g., "hello" → "hallow")
- **Configurable**: Fuzzy match threshold and other parameters can be adjusted
- **Context-Aware**: Searches within a reasonable window for matches

## Technical Details

### Components

**`alignment.util.ts`**: Core alignment logic
- Fuzzy matching algorithm
- Sentence parsing
- Timestamp calculation

**`lesson-generator.component.ts`**: Main UI component
- Wavesurfer.js v7 integration
- Vosk integration
- State management

### Dependencies

- **wavesurfer.js**: Waveform visualization and region editing
- **vosk-browser**: Speech recognition
- **string-similarity**: Fuzzy text matching
- **Angular**: UI framework

## Tips for Best Results

1. **Clear Audio**: Use high-quality audio with minimal background noise
2. **Proper Punctuation**: Use sentence-ending punctuation to define segments
3. **Match Audio**: Ensure the script matches the audio exactly
4. **Review**: Always review and adjust segments after generation
5. **Test Play**: Click each region to verify alignment

## Limitations

- **Mock Vosk Data**: Currently using placeholder transcription data. Full Vosk integration requires event-based collection.
- **English Only**: Vosk model is currently English-only
- **File Processing**: Large audio files may take longer to process

## Future Enhancements

- [ ] Full Vosk file processing (event-based collection)
- [ ] Multi-language support
- [ ] Batch processing for multiple files
- [ ] Auto-save/recovery
- [ ] Advanced editing tools (split, merge segments)
- [ ] Preview mode before export

## Troubleshooting

**No segments generated**:
- Check that both audio and script are provided
- Verify Vosk model loaded successfully
- Check browser console for errors

**Poor alignment**:
- Ensure script matches audio exactly
- Check for proper punctuation
- Consider manually adjusting fuzzy match threshold

**Regions not showing**:
- Wait for waveform to load
- Check that audio file is supported
- Refresh the page and try again

## Support

For issues or questions, please contact the development team or submit an issue in the project repository.
