import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

interface ApiResponse {
  message: string;
  version?: string;
  status?: string;
  timestamp?: string;
}

function App() {
  const [serverStatus, setServerStatus] = useState<string>('Checking...');
  const [apiData, setApiData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/health');
        setServerStatus('Connected ✅');
        setApiData(response.data);
      } catch (error) {
        setServerStatus('Disconnected ❌');
        console.error('Server connection failed:', error);
      }
    };

    checkServerConnection();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎯 PitchPal</h1>
        <p>Full-Stack React + Express + TypeScript Application</p>
        
        <div className="status-card">
          <h3>Server Status: {serverStatus}</h3>
          {apiData && (
            <div>
              <p><strong>Status:</strong> {apiData.status}</p>
              <p><strong>Timestamp:</strong> {apiData.timestamp}</p>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>🚀 Getting Started</h3>
          <ul>
            <li>Frontend: React with TypeScript</li>
            <li>Backend: Express with TypeScript</li>
            <li>API Communication: Axios</li>
            <li>CORS enabled for development</li>
          </ul>
        </div>

        <div className="next-steps">
          <h3>📋 Next Steps</h3>
          <ol>
            <li>Start the backend server: <code>cd server && npm run dev</code></li>
            <li>Start the frontend: <code>cd client && npm start</code></li>
            <li>Build your features!</li>
          </ol>
        </div>
      </header>
    </div>
  );
}

export default App;
