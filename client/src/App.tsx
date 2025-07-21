import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import AudioInput from './components/AudioInput';

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
    timestamp: string;
  };
}

function App() {
  const [pitchText, setPitchText] = useState<string>('');
  const [analysis, setAnalysis] = useState<PitchAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [inputType, setInputType] = useState<'text' | 'audio'>('text');

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
      } else {
        setError('Failed to analyze pitch');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle specific error cases with user-friendly messages
        if (error.response.status === 429) {
          setError(`${errorData.message}\n\nWe apologize for the inconvenience. You can try again in a few minutes or contact our support team.`);
        } else if (error.response.status === 503) {
          setError(`${errorData.message}\n\nThis is temporary and should be resolved shortly.`);
        } else if (error.response.status === 500) {
          setError(`${errorData.message}\n\nIf this problem persists, please contact our support team.`);
        } else {
          setError(errorData.message || 'An error occurred while analyzing your pitch');
        }
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setError('Unable to connect to our analysis service. Please check that the backend server is running on port 3001 and try again.');
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAudioReady = async (audioFile: File, mode: 'record' | 'upload') => {
    console.log('Audio ready for analysis:', { filename: audioFile.name, size: audioFile.size, mode });
    
    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      // TODO: Implement audio analysis API call
      // const formData = new FormData();
      // formData.append('audio', audioFile);
      // formData.append('analysisType', 'general');
      
      // const response = await axios.post<AnalysisResponse>('http://localhost:3001/api/analyze', 
      //   formData, 
      //   {
      //     headers: {
      //       'Content-Type': 'multipart/form-data'
      //     }
      //   }
      // );
      
      // For now, simulate the process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setError('Audio analysis is not yet implemented. Please use text input for now.');
      
    } catch (error: any) {
      console.error('Audio analysis error:', error);
      setError('Failed to analyze audio. Please try again.');
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
          {/* Input Type Toggle inside the pitch box */}
          <div className="input-type-toggle">
            <button
              className={`input-type-button ${inputType === 'text' ? 'active' : ''}`}
              onClick={() => setInputType('text')}
              disabled={loading}
            >
              📝 Text Input
            </button>
            <button
              className={`input-type-button ${inputType === 'audio' ? 'active' : ''}`}
              onClick={() => setInputType('audio')}
              disabled={loading}
            >
              🎤 Audio Input
            </button>
          </div>

          {/* Text Input Section */}
          {inputType === 'text' && (
            <div className="text-input-content">
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
            </div>
          )}

          {/* Audio Input Section */}
          {inputType === 'audio' && (
            <div className="audio-input-content">
              <AudioInput
                onAudioReady={handleAudioReady}
                disabled={loading}
              />
            </div>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {analysis && (
          <div className="analysis-results">
            <h3>Analysis Results</h3>
            
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
