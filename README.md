# 🎯 PitchPal

A full-stack application built with React (TypeScript) frontend and Express (TypeScript) backend.

## 🛠 Tech Stack

### Frontend (Client)
- **React** with TypeScript
- **Axios** for API communication
- **React Router** for navigation
- **Create React App** for setup

### Backend (Server)
- **Express.js** with TypeScript
- **Node.js** runtime
- **CORS** enabled for cross-origin requests
- **dotenv** for environment variables
- **OpenAI** integration ready

## 📁 Project Structure

```
PitchPal/
├── client/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.ts
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
├── .gitignore
└── package.json           # Root package.json for running both services
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

2. **Set up environment variables:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run the development servers:**
   ```bash
   # From root directory - runs both client and server
   npm run dev
   
   # Or run separately:
   npm run server  # Backend on http://localhost:5000
   npm run client  # Frontend on http://localhost:3000
   ```

## 🔧 Available Scripts

### Root Level
- `npm run dev` - Run both client and server concurrently
- `npm run server` - Run only the backend server
- `npm run client` - Run only the frontend client
- `npm run build` - Build both client and server for production
- `npm run install-all` - Install dependencies for both client and server

### Server (cd server)
- `npm run dev` - Run server in development mode with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production server

### Client (cd client)
- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 🌐 API Endpoints

### Base URL: `http://localhost:5000`

- `GET /` - Server status
- `GET /health` - Health check
- `GET /api/health` - API health check
- `GET /api/info` - API information

## 🔐 Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_api_key_here
```

## 📝 Development Notes

### Adding New API Routes
1. Create controller functions in `server/src/controllers/`
2. Add routes in `server/src/routes/`
3. Import and use in the main router

### Frontend API Integration
- Use axios for API calls
- Server runs on port 5000, client on port 3000
- CORS is configured for cross-origin requests

### TypeScript Configuration
- Both client and server use TypeScript
- Server has custom tsconfig.json for Node.js
- Client uses Create React App's TypeScript template

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
# Serve the build folder with your preferred static file server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
