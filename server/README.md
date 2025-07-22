# PitchPal Server

Backend API for PitchPal audio pitch analysis application.

## Features

- **Audio File Upload**: Accepts .wav, .mp3, and .webm files up to 10MB
- **Audio Analysis**: Uses Python script with librosa for audio feature extraction
- **Real-time Processing**: Analyzes uploaded audio and returns JSON results
- **CORS Enabled**: Ready for frontend integration

## Setup

### Prerequisites

- Node.js (v16 or higher)
- Python 3.x
- npm

### Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   pip3 install -r requirements.txt
   ```

3. **Environment Setup:**
   - Copy `.env.example` to `.env`
   - Configure environment variables as needed

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### POST /analyze

Upload and analyze an audio file.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `audio`
- Supported formats: `.wav`, `.mp3`, `.webm`
- Max file size: 10MB

**Response:**
```json
{
  "success": true,
  "fileInfo": {
    "path": "/path/to/uploaded/file",
    "filename": "generated-filename.wav",
    "originalName": "original-filename.wav",
    "size": 1234567,
    "mimeType": "audio/wav"
  },
  "analysis": {
    "audio_features": {
      "duration": 30.5,
      "avg_pitch": 220.5,
      "pitch_range": 45.2,
      "avg_volume": 0.15,
      "clarity_score": 85.3
    },
    "transcript": {
      "transcript": "Transcribed text...",
      "confidence": 0.85,
      "word_count": 25,
      "speaking_rate": 150
    },
    "analysis": {
      "overall_score": 78.5,
      "pitch_variety": 82.0,
      "volume_consistency": 75.0,
      "clarity": 85.0,
      "pace_score": 72.0,
      "recommendations": [
        "Try varying your pitch more to keep listeners engaged"
      ]
    }
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "PitchPal API"
}
```

## Project Structure

```
server/
├── src/
│   ├── server.ts           # Main Express server
│   ├── controllers/
│   │   └── index.ts        # Request handlers
│   ├── routes/
│   │   └── index.ts        # Route definitions
│   └── utils/
│       └── openai.ts       # AI utilities
├── analyze_audio.py        # Python audio analysis script
├── requirements.txt        # Python dependencies
├── uploads/               # Uploaded files storage
└── dist/                  # Compiled JavaScript (after build)
```

## Audio Analysis Features

The Python script (`analyze_audio.py`) provides:

- **Audio Features:**
  - Duration, sample rate
  - Average pitch and pitch range
  - Volume analysis and consistency
  - Tempo detection
  - Spectral analysis
  - Speech clarity metrics

- **Transcript Analysis (Mock):**
  - Speech-to-text transcription (placeholder)
  - Speaking rate calculation
  - Confidence scoring

- **Pitch Analysis Scoring:**
  - Overall presentation score (0-100)
  - Pitch variety assessment
  - Volume consistency rating
  - Clarity and pace evaluation
  - Personalized recommendations

## Dependencies

### Node.js
- express: Web framework
- multer: File upload handling
- cors: Cross-origin requests
- dotenv: Environment variables
- TypeScript: Type safety

### Python
- librosa: Audio analysis library
- numpy: Numerical computing
- soundfile: Audio file I/O

## Development

- The server uses nodemon for auto-reloading during development
- TypeScript provides type safety and better development experience
- Files are uploaded to the `uploads/` directory
- Python script is executed as a subprocess for audio analysis

## Error Handling

The API provides detailed error responses for:
- Missing or invalid audio files
- Unsupported file formats
- File size limit exceeded
- Python script execution failures
- Audio analysis errors

## Future Enhancements

- Real speech-to-text integration (OpenAI Whisper, Google Speech-to-Text)
- Advanced pitch analysis algorithms
- User authentication and session management
- Audio preprocessing and noise reduction
- Machine learning model integration for presentation scoring
