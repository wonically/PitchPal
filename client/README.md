# PitchPal Frontend

A modern, responsive React (TypeScript) web client for the PitchPal audio pitch analysis platform.

## Features

- **Conversational UI**: Chat-style interface for submitting text or audio pitches and receiving AI feedback.
- **Audio Upload & Analysis**: Record or upload `.wav`, `.mp3`, or `.webm` files for real-time analysis.
- **Text Pitch Analysis**: Submit text pitches for instant AI-driven feedback.
- **Rich Results Display**: Visualizes analysis results, recommendations, and strengths using Material UI components.
- **Session Persistence**: Chat history is saved in session storage for seamless user experience.
- **Loading & Error Handling**: Elegant overlays and alerts for loading states and error feedback.
- **Mobile Friendly**: Responsive layout and controls for all device sizes.
- **Custom Theming**: Uses Material UI with a custom theme for a clean, professional look.

## Project Structure

```
client/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── App.tsx                # Main app component
│   ├── index.tsx              # Entry point, theme setup
│   ├── components/            # Reusable UI components
│   │   ├── AudioInput.tsx
│   │   ├── TextInput.tsx
│   │   ├── InputTypeSelector.tsx
│   │   ├── LoadingOverlay.tsx
│   │   └── AnalysisResult.tsx
│   ├── utils/                 # Type definitions, helpers
│   ├── App.css
│   └── index.css
├── .env                       # Environment variables
├── package.json
└── tsconfig.json
```

## Environment Variables

Create a `.env` file in the `client` directory:

```
REACT_APP_SERVER_URL=http://localhost:3001
```

- For production, set `REACT_APP_SERVER_URL` to your deployed backend URL (e.g., `https://your-backend.onrender.com`).

## Installation & Development

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Install dependencies

```bash
cd client
npm install
```

### Start the development server

```bash
npm start
```

- Runs on [http://localhost:3000](http://localhost:3000) by default.

### Build for production

```bash
npm run build
```

- Outputs static files to the `build/` directory.

## Usage

1. **Text Pitch**: Type your pitch and submit to receive instant AI feedback.
2. **Audio Pitch**: Record or upload an audio file for analysis. The app will transcribe, extract features, and provide detailed feedback.
3. **View Results**: Analysis results, recommendations, and strengths are displayed in a chat-style interface.

## API Integration

- All API calls use the `REACT_APP_SERVER_URL` environment variable.
- Endpoints:
	- `POST /api/` — Text pitch analysis
	- `POST /analyze` — Audio file upload and analysis

## UI & Theming

- Built with [Material UI (MUI)](https://mui.com/) and a custom theme for a modern look.
- Responsive design for desktop and mobile.
- Custom components for chat bubbles, avatars, loading overlays, and result accordions.

## Error Handling

- Displays user-friendly error messages for network/API issues.
- Shows loading overlays during analysis.
- Handles backend errors gracefully.

## Advanced Features

- **Session Storage**: Chat history is preserved across page reloads.
- **Accessibility**: Uses semantic HTML and accessible MUI components.
- **Type Safety**: Written in TypeScript for robust type checking.

## Scripts

- `npm start` — Start development server
- `npm run build` — Build for production
- `npm test` — Run tests (if implemented)

## Future Enhancements

- User authentication and personalized history
- Real-time streaming audio analysis
- More detailed visualizations and analytics
- Internationalization (i18n) support
- Progressive Web App (PWA) features

## Contributing

Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.
