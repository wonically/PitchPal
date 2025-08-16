
# PitchPal

PitchPal is a full-stack AI-powered pitch analysis platform. It features a modern React (TypeScript) frontend and a robust Express (TypeScript) backend, with advanced audio and text analysis powered by Python and OpenAI.

---

## 🛠️ Tech Stack

### Frontend (Client)

- **React** (TypeScript, Create React App)
- **Material UI (MUI)** for modern, responsive UI
- **Axios** for API communication
- **Session Storage** for chat persistence

### Backend (Server)

- **Express.js** (TypeScript)
- **Node.js** runtime
- **CORS** for secure cross-origin requests
- **dotenv** for environment variables
- **Multer** for file uploads
- **Python Integration** for audio analysis
- **OpenAI** for advanced text and audio analysis

### Audio Analysis (Python)

- **OpenAI Whisper** for speech-to-text
- **OpenSMILE** for prosodic features
- **librosa, numpy, soundfile** for audio processing

---

## 📁 Project Structure

```
PitchPal/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components (AudioInput, TextInput, etc.)
│   │   ├── utils/          # Type definitions, helpers
│   │   └── App.tsx         # Main app logic
│   ├── public/
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Analysis helpers, OpenAI integration
│   │   └── server.ts       # Main server entry
│   ├── analyze_audio.py    # Python audio analysis script
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/            # Uploaded audio files
│   └── package.json
├── .gitignore
└── package.json            # Root scripts for dev/build
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- Python 3.x
- npm or yarn

### Installation

1. **Install all dependencies:**

   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   - Backend: `cd server && cp .env.example .env` (edit as needed)
   - Frontend: `cd client && cp .env.example .env` (edit as needed)
3. **Install Python dependencies:**

   ```bash
   cd server
   pip3 install -r requirements.txt
   ```

### Running Locally

- **Dev mode (concurrently):**

  ```bash
  npm run dev
  ```

- **Or run separately:**

  ```bash
  npm run server   # Backend (default: http://localhost:3001)
  npm run client   # Frontend (default: http://localhost:3000)
  ```

---

## � Environment Variables

### Backend (`server/.env`)

```env
PORT=3001
NODE_ENV=development
REACT_APP_CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_here
```

### Frontend (`client/.env`)

```env
REACT_APP_SERVER_URL=http://localhost:3001
```

---

## 🖥️ Frontend Features

- Chat-style UI for text and audio pitch submission
- Audio recording/upload with real-time feedback
- Analysis results with recommendations and strengths
- Responsive, mobile-friendly Material UI design
- Session storage for chat history
- Loading overlays and error alerts

---

## 🧠 Backend & Audio Analysis Features

- REST API for text and audio pitch analysis
- Audio file upload (up to 10MB, .wav/.mp3/.webm)
- Python subprocess for advanced audio feature extraction
- OpenAI Whisper for transcription, language detection, and word-level timing
- OpenSMILE for pitch, jitter, loudness, shimmer, HNR, spectral centroid, energy, and more
- AI-driven scoring: pitch variety, voice quality, volume consistency, pace, expressiveness
- Detailed JSON output with transcript, features, analysis, recommendations, strengths, and metadata

---

## 🌐 API Endpoints (Backend)

**Base URL:** `http://localhost:3001`

- `POST /api/` — Analyze text pitch
- `POST /analyze` — Upload and analyze audio file
- `GET /health` — Health check
- `GET /api/info` — API information
- `GET /api/test-openai` — Check OpenAI API key status

---

## 📝 Development Notes

- **TypeScript**: Both client and server use TypeScript for type safety
- **CORS**: Configured for secure cross-origin requests
- **Session Storage**: Chat history is preserved in the browser
- **Python Integration**: Audio analysis is performed by a Python script called from the backend
- **Error Handling**: User-friendly error messages for all major failure modes

---

## 🚀 Deployment

### Backend

```bash
cd server
npm run build
npm start
```

### Frontend

```bash
cd client
npm run build
# Deploy the build/ folder to your preferred static host
```

---

## 🧩 Advanced & Future Features

- User authentication and personalized history
- Real-time streaming audio analysis
- More detailed visualizations and analytics
- Internationalization (i18n) support
- Progressive Web App (PWA) features
- Multi-language transcription
- Custom OpenSMILE feature sets
- Audio preprocessing and noise reduction
- Machine learning model integration for scoring
- Export and reporting capabilities

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

---

## 📄 License

This project is licensed under the ISC License.
