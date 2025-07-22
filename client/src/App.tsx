import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import AudioInput from './components/AudioInput';

interface PitchAnalysis {
  tone: {
    score: number;
    description: string;
    suggestions?: string[];
  };
  clarity: {
    score: number;
    description: string;
    suggestions?: string[];
    issues?: string[];
  };
  confidence?: {
    level: string;
    evidence: string[];
  };
  fillerWords?: {
    count: number;
    examples: string[];
  };
  jargon?: {
    count: number;
    examples: string[];
  };
  jargonCount?: {
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
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      const response = await axios.post('/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Transform the backend response to match our frontend interface
        const gptAnalysis = response.data.gptAnalysis;
        const audioAnalysis = response.data.audioAnalysis;
        
        const transformedAnalysis: PitchAnalysis = {
          tone: {
            score: gptAnalysis.tone.score,
            description: gptAnalysis.tone.description,
            suggestions: [`Based on audio analysis: ${audioAnalysis.analysis?.recommendations?.join(', ') || 'Good delivery'}`]
          },
          clarity: {
            score: gptAnalysis.clarity.score,
            description: `Speech clarity analysis complete.`,
            suggestions: gptAnalysis.clarity.issues?.map((issue: string) => `Improve: ${issue}`) || ['Clear speech detected'],
            issues: gptAnalysis.clarity.issues
          },
          confidence: {
            level: gptAnalysis.confidence.level,
            evidence: gptAnalysis.confidence.evidence
          },
          fillerWords: gptAnalysis.fillerWords,
          jargon: gptAnalysis.jargon,
          jargonCount: {
            count: gptAnalysis.jargon?.count || 0,
            examples: gptAnalysis.jargon?.examples || [],
            severity: gptAnalysis.jargon?.count > 5 ? 'high' : gptAnalysis.jargon?.count > 2 ? 'medium' : 'low'
          },
          improvedVersion: gptAnalysis.improvedVersion,
          overallScore: response.data.overallResults?.combinedScore || gptAnalysis.overallScore
        };
        
        setAnalysis(transformedAnalysis);
      } else {
        setError('Failed to analyze audio');
      }
      
    } catch (error: any) {
      console.error('Audio analysis error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        setError(errorData.message || 'Failed to analyze audio');
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        setError('Unable to connect to our analysis service. Please check that the backend server is running and try again.');
      } else {
        setError('Failed to analyze audio. Please try again.');
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
                    {(analysis.tone.suggestions || []).map((suggestion, index) => (
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
                    {(analysis.clarity.suggestions || []).map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="analysis-card">
                <h4>Jargon Analysis</h4>
                <div className="jargon-info">
                  <span>Count: {analysis.jargonCount?.count || 0}</span>
                  <span 
                    className="severity-badge"
                    style={{ backgroundColor: getSeverityColor(analysis.jargonCount?.severity || 'low') }}
                  >
                    {(analysis.jargonCount?.severity || 'low').toUpperCase()}
                  </span>
                </div>
                {(analysis.jargonCount?.examples?.length || 0) > 0 && (
                  <div className="jargon-examples">
                    <strong>Examples:</strong>
                    <div className="jargon-tags">
                      {(analysis.jargonCount?.examples || []).map((term, index) => (
                        <span key={index} className="jargon-tag">{term}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence Analysis - New */}
              {analysis.confidence && (
                <div className="analysis-card">
                  <h4>Confidence Analysis</h4>
                  <div className="confidence-level">
                    <span>Level: </span>
                    <span 
                      className={`confidence-badge ${analysis.confidence.level.toLowerCase()}`}
                      style={{ 
                        backgroundColor: analysis.confidence.level === 'High' ? '#4CAF50' : 
                                       analysis.confidence.level === 'Medium' ? '#FF9800' : '#F44336' 
                      }}
                    >
                      {analysis.confidence.level}
                    </span>
                  </div>
                  {analysis.confidence.evidence && analysis.confidence.evidence.length > 0 && (
                    <div className="evidence">
                      <strong>Evidence:</strong>
                      <ul>
                        {analysis.confidence.evidence.map((evidence, index) => (
                          <li key={index}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Filler Words Analysis - New */}
              {analysis.fillerWords && (
                <div className="analysis-card">
                  <h4>Filler Words</h4>
                  <div className="filler-count">
                    <span>Count: {analysis.fillerWords.count}</span>
                    <span 
                      className="filler-badge"
                      style={{ 
                        backgroundColor: analysis.fillerWords.count > 10 ? '#F44336' : 
                                       analysis.fillerWords.count > 5 ? '#FF9800' : '#4CAF50' 
                      }}
                    >
                      {analysis.fillerWords.count > 10 ? 'HIGH' : 
                       analysis.fillerWords.count > 5 ? 'MEDIUM' : 'LOW'}
                    </span>
                  </div>
                  {analysis.fillerWords.examples && analysis.fillerWords.examples.length > 0 && (
                    <div className="filler-examples">
                      <strong>Examples:</strong>
                      <div className="filler-tags">
                        {analysis.fillerWords.examples.map((filler, index) => (
                          <span key={index} className="filler-tag">{filler}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

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
