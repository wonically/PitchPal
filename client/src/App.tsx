import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

interface PitchAnalysis {
  tone: {
    score: number;
    description: string;
    suggestions: string[];
  };
  clarity: {
    score: number;
    description: string;
    suggestions: string[];
  };
  jargonCount: {
    count: number;
    examples: string[];
    severity: 'low' | 'medium' | 'high';
  };
  improvedVersion: string;
  overallScore: number;
}

interface AnalysisResponse {
  success: boolean;
  data: {
    id: string;
    pitchText: string;
    analysisType: string;
    analysis: PitchAnalysis;
    usingMock: boolean;
    timestamp: string;
  };
}

function App() {
  const [pitchText, setPitchText] = useState<string>('');
  const [analysis, setAnalysis] = useState<PitchAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [usingMock, setUsingMock] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (!pitchText.trim()) {
      setError('Please enter a pitch to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await axios.post<AnalysisResponse>('http://localhost:3001/api/', {
        pitchText: pitchText.trim(),
        analysisType: 'general'
      });

      if (response.data.success) {
        setAnalysis(response.data.data.analysis);
        setUsingMock(response.data.data.usingMock);
      } else {
        setError('Failed to analyze pitch');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to connect to server. Make sure the backend is running on port 3001.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return '#4CAF50'; // Green
    if (score >= 6) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎯 PitchPal</h1>
        <p>AI-Powered Pitch Analysis</p>
        
        <div className="pitch-input-section">
          <h3>Enter Your Pitch</h3>
          <textarea
            className="pitch-textarea"
            placeholder="Enter your business pitch here... (minimum 10 characters)"
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            rows={6}
            maxLength={2000}
          />
          <div className="input-info">
            <span>{pitchText.length}/2000 characters</span>
          </div>
          
          <button 
            className="analyze-button"
            onClick={handleSubmit}
            disabled={loading || pitchText.trim().length < 10}
          >
            {loading ? 'Analyzing...' : 'Analyze Pitch'}
          </button>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        {analysis && (
          <div className="analysis-results">
            <h3>Analysis Results {usingMock && '(Demo Mode)'}</h3>
            
            <div className="score-overview">
              <div className="overall-score">
                <h4>Overall Score</h4>
                <div 
                  className="score-circle"
                  style={{ borderColor: getScoreColor(analysis.overallScore / 10) }}
                >
                  {analysis.overallScore}/100
                </div>
              </div>
            </div>

            <div className="analysis-grid">
              <div className="analysis-card">
                <h4>Tone Analysis</h4>
                <div className="score-bar">
                  <span>Score: </span>
                  <span style={{ color: getScoreColor(analysis.tone.score) }}>
                    {analysis.tone.score}/10
                  </span>
                </div>
                <p className="description">{analysis.tone.description}</p>
                <div className="suggestions">
                  <strong>Suggestions:</strong>
                  <ul>
                    {analysis.tone.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="analysis-card">
                <h4>Clarity Analysis</h4>
                <div className="score-bar">
                  <span>Score: </span>
                  <span style={{ color: getScoreColor(analysis.clarity.score) }}>
                    {analysis.clarity.score}/10
                  </span>
                </div>
                <p className="description">{analysis.clarity.description}</p>
                <div className="suggestions">
                  <strong>Suggestions:</strong>
                  <ul>
                    {analysis.clarity.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="analysis-card">
                <h4>Jargon Analysis</h4>
                <div className="jargon-info">
                  <span>Count: {analysis.jargonCount.count}</span>
                  <span 
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(analysis.jargonCount.severity) }}
                  >
                    {analysis.jargonCount.severity.toUpperCase()}
                  </span>
                </div>
                {analysis.jargonCount.examples.length > 0 && (
                  <div className="jargon-examples">
                    <strong>Examples:</strong>
                    <div className="jargon-tags">
                      {analysis.jargonCount.examples.map((term, index) => (
                        <span key={index} className="jargon-tag">{term}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="analysis-card improved-version">
                <h4>Improved Version</h4>
                <div className="improved-text">
                  {analysis.improvedVersion}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
