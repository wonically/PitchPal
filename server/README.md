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
  "transcript": "Thank you for listening to my pitch presentation...",
  "features": {
    "pitch": 185.4,
    "jitter": 0.012,
    "loudness": -18.2,
    "speech_rate": 155.3,
    "pitch_std": 45.2,
    "pitch_range": 120.8,
    "shimmer": 0.08,
    "hnr": 15.6,
    "spectral_centroid": 2847.3,
    "energy_mean": 0.15,
    "voice_quality_score": 82.1
  },
  "analysis": {
    "overall_score": 78.5,
    "pitch_variety": 82.0,
    "voice_quality": 85.2,
    "volume_consistency": 75.0,
    "pace_score": 72.0,
    "recommendations": [
      "Try varying your pitch more to add expressiveness and keep listeners engaged"
    ],
    "strengths": [
      "Clear voice quality",
      "Appropriate speaking pace"
    ]
  },
  "transcript_details": {
    "language": "en",
    "duration": 45.2,
    "word_count": 117,
    "confidence": 0.91,
    "segments": [
      {
        "start": 0.0,
        "end": 3.2,
        "text": "Thank you for listening to my pitch presentation",
        "confidence": 0.94
      }
    ]
  },
  "metadata": {
    "file_name": "audio-1234567890.wav",
    "file_size": 2156784,
    "extraction_method": "opensmile",
    "processing_timestamp": "2024-01-01T00:00:00Z"
  },
  "success": true
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

The enhanced Python script (`analyze_audio.py`) provides:

- **Real Speech-to-Text Transcription:**
  - OpenAI Whisper integration for accurate transcription
  - Language detection and confidence scoring
  - Word-level timestamps and segments
  - Speaking rate calculation

- **Professional Prosodic Features (OpenSMILE):**
  - **Pitch Analysis**: Mean, standard deviation, range, and variability
  - **Voice Quality**: Jitter (pitch stability), HNR (Harmonics-to-Noise Ratio)
  - **Loudness Features**: Mean, standard deviation, range, and variability
  - **Voice Stability**: Shimmer (amplitude stability) and energy features
  - **Spectral Analysis**: Spectral centroid and frequency distribution

- **Advanced Audio Metrics:**
  - Pitch variety and expressiveness scoring
  - Voice quality assessment (0-100 scale)
  - Volume consistency evaluation
  - Speaking pace optimization analysis

- **Comprehensive Analysis Output:**
  - Overall presentation score with detailed breakdowns
  - Personalized recommendations for improvement
  - Identification of vocal strengths
  - Professional-grade feature extraction

## Dependencies

### Node.js
- express: Web framework
- multer: File upload handling
- cors: Cross-origin requests
- dotenv: Environment variables
- TypeScript: Type safety

### Python
- **openai-whisper**: Real speech-to-text transcription
- **opensmile**: Professional prosodic feature extraction
- **librosa**: Audio analysis library (fallback)
- **numpy**: Numerical computing
- **soundfile**: Audio file I/O

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

- Multi-language transcription support with Whisper
- Custom OpenSMILE feature sets for specific use cases  
- Real-time audio analysis with streaming support
- Integration with advanced speech coaching algorithms
- User authentication and session management
- Historical analysis tracking and progress monitoring
- Audio preprocessing and noise reduction
- Machine learning model integration for presentation scoring
- Export capabilities for detailed analysis reports
