import React, { useState } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Paper,
  Chip,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar
} from '@mui/material';
import {
  Edit as EditIcon,
  Mic as MicIcon,
  Send as SendIcon,
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
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
  
  // Toast state
  const [toastOpen, setToastOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  // Helper function to show toast
  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  // Helper function to close toast
  const handleToastClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setToastOpen(false);
  };

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
        showToast('Analysis complete!', 'success');
      } else {
        setError('Failed to analyze pitch');
        showToast('Failed to analyze pitch', 'error');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle specific error cases with user-friendly messages
        if (error.response.status === 429) {
          const errorMsg = `${errorData.message}\n\nWe apologize for the inconvenience. You can try again in a few minutes or contact our support team.`;
          setError(errorMsg);
          showToast(errorData.message || 'Rate limit exceeded', 'error');
        } else if (error.response.status === 503) {
          const errorMsg = `${errorData.message}\n\nThis is temporary and should be resolved shortly.`;
          setError(errorMsg);
          showToast(errorData.message || 'Service temporarily unavailable', 'error');
        } else if (error.response.status === 500) {
          const errorMsg = `${errorData.message}\n\nIf this problem persists, please contact our support team.`;
          setError(errorMsg);
          showToast(errorData.message || 'Server error occurred', 'error');
        } else {
          setError(errorData.message || 'An error occurred while analyzing your pitch');
          showToast(errorData.message || 'Something went wrong', 'error');
        }
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        const errorMsg = 'Unable to connect to our analysis service. Please check that the backend server is running on port 3001 and try again.';
        setError(errorMsg);
        showToast('Unable to connect to analysis service', 'error');
      } else {
        setError('An unexpected error occurred. Please try again later.');
        showToast('Something went wrong', 'error');
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
      
      const response = await axios.post('http://localhost:3001/analyze', formData, {
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
        showToast('Audio analysis complete!', 'success');
      } else {
        setError('Failed to analyze audio');
        showToast('Failed to analyze audio', 'error');
      }
      
    } catch (error: any) {
      console.error('Audio analysis error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        setError(errorData.message || 'Failed to analyze audio');
        showToast(errorData.message || 'Failed to analyze audio', 'error');
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        const errorMsg = 'Unable to connect to our analysis service. Please check that the backend server is running and try again.';
        setError(errorMsg);
        showToast('Unable to connect to analysis service', 'error');
      } else {
        setError('Failed to analyze audio. Please try again.');
        showToast('Something went wrong', 'error');
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, backgroundColor: '#1e1e2e', color: 'white', borderRadius: 3 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#61dafb' }}>
            🎯 PitchPal
          </Typography>
          <Typography variant="h5" component="p" sx={{ color: '#b0bec5' }}>
            AI-Powered Pitch Analysis
          </Typography>
        </Box>
        
        <Card sx={{ mb: 4, backgroundColor: '#2a2a3e', boxShadow: 3 }}>
          <CardContent>
            {/* Input Type Toggle */}
            <Box display="flex" justifyContent="center" mb={3}>
              <ToggleButtonGroup
                value={inputType}
                exclusive
                onChange={(_, newInputType) => newInputType && setInputType(newInputType)}
                aria-label="input type"
                disabled={loading}
                sx={{
                  '& .MuiToggleButton-root': {
                    color: '#b0bec5',
                    borderColor: '#61dafb',
                    '&.Mui-selected': {
                      backgroundColor: '#61dafb',
                      color: '#1e1e2e',
                      '&:hover': {
                        backgroundColor: '#4fc3f7',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="text" aria-label="text input">
                  <EditIcon sx={{ mr: 1 }} />
                  Text Input
                </ToggleButton>
                <ToggleButton value="audio" aria-label="audio input">
                  <MicIcon sx={{ mr: 1 }} />
                  Audio Input
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Text Input Section */}
            {inputType === 'text' && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ color: '#61dafb', textAlign: 'center' }}>
                  Enter Your Pitch
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Enter your business pitch here... (minimum 10 characters)"
                  value={pitchText}
                  onChange={(e) => setPitchText(e.target.value)}
                  inputProps={{ maxLength: 2000 }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1e1e2e',
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#61dafb',
                      },
                      '&:hover fieldset': {
                        borderColor: '#4fc3f7',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#61dafb',
                      },
                    },
                    '& .MuiInputBase-input::placeholder': {
                      color: '#b0bec5',
                      opacity: 1,
                    },
                  }}
                />
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="body2" sx={{ color: '#b0bec5' }}>
                    {pitchText.length}/2000 characters
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSubmit}
                    disabled={loading || pitchText.trim().length < 10}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    sx={{
                      backgroundColor: '#61dafb',
                      color: '#1e1e2e',
                      fontWeight: 'bold',
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: '#4fc3f7',
                      },
                      '&:disabled': {
                        backgroundColor: '#555',
                        color: '#999',
                      },
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Pitch'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Audio Input Section */}
            {inputType === 'audio' && (
              <Box>
                <AudioInput
                  onAudioReady={handleAudioReady}
                  disabled={loading}
                />
              </Box>
            )}
          </CardContent>
        </Card>
        
        {/* Loading Overlay */}
        {loading && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(30, 30, 46, 0.95)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              backdropFilter: 'blur(5px)'
            }}
          >
            <CircularProgress
              size={80}
              thickness={4}
              sx={{
                color: '#61dafb',
                mb: 3
              }}
            />
            <Typography
              variant="h5"
              sx={{
                color: '#61dafb',
                fontWeight: 'bold',
                textAlign: 'center',
                mb: 1
              }}
            >
              Analyzing your pitch...
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#b0bec5',
                textAlign: 'center',
                maxWidth: 400
              }}
            >
              Our AI is carefully reviewing your pitch and preparing detailed feedback
            </Typography>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              backgroundColor: '#ffebee',
              color: '#c62828',
              '& .MuiAlert-icon': {
                color: '#c62828',
              },
            }}
          >
            {error}
          </Alert>
        )}

        {analysis && (
          <Card sx={{ backgroundColor: '#2a2a3e', boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h4" component="h3" gutterBottom sx={{ color: '#61dafb', textAlign: 'center' }}>
                <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Analysis Results
              </Typography>
              
              <Box display="flex" justifyContent="center" mb={4}>
                <Paper 
                  elevation={4}
                  sx={{ 
                    p: 3, 
                    textAlign: 'center',
                    backgroundColor: '#1e1e2e',
                    border: `3px solid ${getScoreColor(analysis.overallScore / 10)}`,
                    borderRadius: '50%',
                    width: 120,
                    height: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Typography variant="h6" sx={{ color: '#b0bec5', fontSize: '0.9rem' }}>
                    Overall Score
                  </Typography>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      color: getScoreColor(analysis.overallScore / 10),
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}
                  >
                    {analysis.overallScore}/100
                  </Typography>
                </Paper>
              </Box>

              {/* Analysis Sections as Accordions */}
              <Box sx={{ mt: 2 }}>
                {/* Tone Analysis Accordion */}
                <Accordion 
                  sx={{ 
                    backgroundColor: '#1e1e2e', 
                    color: 'white',
                    mb: 1,
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />}
                    sx={{ 
                      backgroundColor: '#2a2a3e',
                      '&:hover': { backgroundColor: '#3a3a4e' }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Typography variant="h6" sx={{ color: '#61dafb' }}>
                        🎯 Tone Analysis
                      </Typography>
                      <Chip 
                        label={`${analysis.tone.score}/100`}
                        size="small"
                        sx={{ 
                          backgroundColor: getScoreColor(analysis.tone.score / 10),
                          color: 'white',
                          fontWeight: 'bold',
                          mr: 2
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                    <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
                      {analysis.tone.description}
                    </Typography>
                    {(analysis.tone.suggestions || []).length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>
                          💡 Suggestions:
                        </Typography>
                        <List dense>
                          {(analysis.tone.suggestions || []).map((suggestion, index) => (
                            <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                              <ListItemText 
                                primary={`• ${suggestion}`}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { color: '#e0e0e0' }
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Clarity Analysis Accordion */}
                <Accordion 
                  sx={{ 
                    backgroundColor: '#1e1e2e', 
                    color: 'white',
                    mb: 1,
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />}
                    sx={{ 
                      backgroundColor: '#2a2a3e',
                      '&:hover': { backgroundColor: '#3a3a4e' }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Typography variant="h6" sx={{ color: '#61dafb' }}>
                        🔍 Clarity Analysis
                      </Typography>
                      <Chip 
                        label={`${analysis.clarity.score}/100`}
                        size="small"
                        sx={{ 
                          backgroundColor: getScoreColor(analysis.clarity.score / 10),
                          color: 'white',
                          fontWeight: 'bold',
                          mr: 2
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                    <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
                      {analysis.clarity.description}
                    </Typography>
                    {(analysis.clarity.suggestions || []).length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>
                          💡 Suggestions:
                        </Typography>
                        <List dense>
                          {(analysis.clarity.suggestions || []).map((suggestion, index) => (
                            <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                              <ListItemText 
                                primary={`• ${suggestion}`}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { color: '#e0e0e0' }
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Jargon Analysis Accordion */}
                <Accordion 
                  sx={{ 
                    backgroundColor: '#1e1e2e', 
                    color: 'white',
                    mb: 1,
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />}
                    sx={{ 
                      backgroundColor: '#2a2a3e',
                      '&:hover': { backgroundColor: '#3a3a4e' }
                    }}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Typography variant="h6" sx={{ color: '#61dafb' }}>
                        📚 Jargon Analysis
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={`${analysis.jargonCount?.count || 0} terms`}
                          size="small"
                          sx={{ 
                            backgroundColor: '#4a4a5e',
                            color: '#e0e0e0'
                          }}
                        />
                        <Chip 
                          label={(analysis.jargonCount?.severity || 'low').toUpperCase()}
                          size="small"
                          sx={{ 
                            backgroundColor: getSeverityColor(analysis.jargonCount?.severity || 'low'),
                            color: 'white',
                            fontWeight: 'bold',
                            mr: 2
                          }}
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                    <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
                      Technical jargon can make your pitch harder to understand for general audiences.
                    </Typography>
                    {(analysis.jargonCount?.examples?.length || 0) > 0 && (
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>
                          🏷️ Technical Terms Found:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                          {(analysis.jargonCount?.examples || []).map((term, index) => (
                            <Chip 
                              key={index} 
                              label={term}
                              size="small"
                              sx={{ 
                                backgroundColor: '#4a4a5e',
                                color: '#e0e0e0',
                                mb: 0.5
                              }}
                            />
                          ))}
                        </Stack>
                        <Typography variant="body2" sx={{ color: '#b0bec5', mt: 2, fontStyle: 'italic' }}>
                          💡 Try explaining these terms in simpler language or provide brief definitions.
                        </Typography>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>

                {/* Confidence Analysis Accordion */}
                {analysis.confidence && (
                  <Accordion 
                    sx={{ 
                      backgroundColor: '#1e1e2e', 
                      color: 'white',
                      mb: 1,
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />}
                      sx={{ 
                        backgroundColor: '#2a2a3e',
                        '&:hover': { backgroundColor: '#3a3a4e' }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>
                          💪 Confidence Analysis
                        </Typography>
                        <Chip 
                          label={analysis.confidence.level.toUpperCase()}
                          size="small"
                          sx={{ 
                            backgroundColor: analysis.confidence.level === 'High' ? '#4CAF50' : 
                                          analysis.confidence.level === 'Medium' ? '#FF9800' : '#F44336',
                            color: 'white',
                            fontWeight: 'bold',
                            mr: 2
                          }}
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
                        Your confidence level affects how persuasive and trustworthy your pitch sounds.
                      </Typography>
                      {analysis.confidence.evidence && analysis.confidence.evidence.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>
                            📊 Evidence:
                          </Typography>
                          <List dense>
                            {analysis.confidence.evidence.map((evidence, index) => (
                              <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText 
                                  primary={`• ${evidence}`}
                                  primaryTypographyProps={{
                                    variant: 'body2',
                                    sx: { color: '#e0e0e0' }
                                  }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Filler Words Analysis Accordion */}
                {analysis.fillerWords && (
                  <Accordion 
                    sx={{ 
                      backgroundColor: '#1e1e2e', 
                      color: 'white',
                      mb: 1,
                      '&:before': { display: 'none' }
                    }}
                  >
                    <AccordionSummary 
                      expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />}
                      sx={{ 
                        backgroundColor: '#2a2a3e',
                        '&:hover': { backgroundColor: '#3a3a4e' }
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>
                          🗣️ Filler Words
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={`${analysis.fillerWords.count} found`}
                            size="small"
                            sx={{ 
                              backgroundColor: '#4a4a5e',
                              color: '#e0e0e0'
                            }}
                          />
                          <Chip 
                            label={analysis.fillerWords.count > 10 ? 'HIGH' : 
                                   analysis.fillerWords.count > 5 ? 'MEDIUM' : 'LOW'}
                            size="small"
                            sx={{ 
                              backgroundColor: analysis.fillerWords.count > 10 ? '#F44336' : 
                                            analysis.fillerWords.count > 5 ? '#FF9800' : '#4CAF50',
                              color: 'white',
                              fontWeight: 'bold',
                              mr: 2
                            }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>
                        Filler words can make you sound less confident and distract from your message.
                      </Typography>
                      {analysis.fillerWords.examples && analysis.fillerWords.examples.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>
                            🎯 Filler Words Found:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {analysis.fillerWords.examples.map((filler, index) => (
                              <Chip 
                                key={index} 
                                label={filler}
                                size="small"
                                sx={{ 
                                  backgroundColor: '#4a4a5e',
                                  color: '#e0e0e0',
                                  mb: 0.5
                                }}
                              />
                            ))}
                          </Stack>
                          <Typography variant="body2" sx={{ color: '#b0bec5', mt: 2, fontStyle: 'italic' }}>
                            💡 Practice pausing instead of using filler words. Take a breath and gather your thoughts.
                          </Typography>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Improved Version Accordion */}
                <Accordion 
                  sx={{ 
                    backgroundColor: '#1e1e2e', 
                    color: 'white',
                    mb: 1,
                    '&:before': { display: 'none' }
                  }}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />}
                    sx={{ 
                      backgroundColor: '#2a2a3e',
                      '&:hover': { backgroundColor: '#3a3a4e' }
                    }}
                  >
                    <Typography variant="h6" sx={{ color: '#61dafb' }}>
                      ✨ Improved Version
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                    <Paper 
                      elevation={1}
                      sx={{ 
                        p: 3, 
                        backgroundColor: '#2a2a3e',
                        borderLeft: '4px solid #61dafb'
                      }}
                    >
                      <Typography variant="body1" sx={{ color: '#e0e0e0', lineHeight: 1.6 }}>
                        {analysis.improvedVersion}
                      </Typography>
                    </Paper>
                    <Typography variant="body2" sx={{ color: '#b0bec5', mt: 2, fontStyle: 'italic' }}>
                      💡 This version incorporates the suggestions above for a more polished delivery.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Toast Notification */}
        <Snackbar
          open={toastOpen}
          autoHideDuration={5000}
          onClose={handleToastClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleToastClose}
            severity={toastSeverity}
            variant="filled"
            sx={{
              width: '100%',
              color: 'white',
              '& .MuiAlert-icon': {
                color: 'white'
              }
            }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}

export default App;
