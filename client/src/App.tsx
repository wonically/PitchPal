
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Paper, Box, Typography, Card, CardContent, Button, TextField, Snackbar, Alert, ToggleButton, ToggleButtonGroup, Chip, Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemText, Divider, Stack, CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AudioInput from './components/AudioInput';

// Types for analysis (adjust as needed for new backend)
interface PitchAnalysis {
  tone?: { score: number; description: string; suggestions?: string[] };
  clarity?: { score: number; description: string; suggestions?: string[]; issues?: string[] };
  confidence?: { level: string; evidence: string[] };
  fillerWords?: { count: number; examples: string[] };
  jargon?: { count: number; examples: string[] };
  structure?: { score: number; issues: string[] };
  persuasion?: { score: number; techniques: string[]; weaknesses: string[] };
  engagement?: { score: number; vocal_variety: string; energy_level: string };
  persuasiveness?: { score: number; description: string; suggestions: string[] };
  memorability?: { score: number; description: string; suggestions: string[] };
  improvedVersion?: string;
  overallScore: number;
}

interface StoredAnalysis {
  id: string;
  pitchText: string;
  analysis: PitchAnalysis;
  inputType: 'text' | 'audio';
  timestamp: string;
  displayDate: string;
}

function App() {
  const [pitchText, setPitchText] = useState('');
  const [analysis, setAnalysis] = useState<PitchAnalysis | null>(null);
  const [audioTranscript, setAudioTranscript] = useState<string | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputType, setInputType] = useState<'text' | 'audio'>('text');
  const [currentTab, setCurrentTab] = useState(0);
  const [pitchHistory, setPitchHistory] = useState<StoredAnalysis[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Load history from localStorage
    const stored = localStorage.getItem('pitchHistory');
    if (stored) {
      setPitchHistory(JSON.parse(stored));
    }
  }, []);

  const saveAnalysisToHistory = (analysis: PitchAnalysis, pitchText: string, inputType: 'text' | 'audio') => {
    const newAnalysis: StoredAnalysis = {
      id: Date.now().toString(),
      pitchText,
      analysis,
      inputType,
      timestamp: new Date().toISOString(),
      displayDate: new Date().toLocaleString()
    };
    const updatedHistory = [newAnalysis, ...pitchHistory].slice(0, 3);
    setPitchHistory(updatedHistory);
    localStorage.setItem('pitchHistory', JSON.stringify(updatedHistory));
  };

  const showToast = (message: string, severity: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const handleToastClose = () => setToastOpen(false);


  // Text analysis submit
  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const response = await axios.post('http://localhost:3001/api/', {
        pitchText,
        analysisType: 'general',
      });
      if (response.data.success) {
        setAnalysis(response.data.data.analysis);
        saveAnalysisToHistory(response.data.data.analysis, pitchText, 'text');
        showToast('Analysis complete!', 'success');
      } else {
        setError('Failed to analyze pitch');
        showToast('Failed to analyze pitch', 'error');
      }
    } catch (err: any) {
      setError('Error connecting to backend');
      showToast('Error connecting to backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Audio analysis handler
  const handleAudioReady = async (audioFile: File, mode: 'record' | 'upload') => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    setAudioTranscript(null);
    setAudioFeatures(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      const response = await axios.post('http://localhost:3001/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        // Extract transcript, features, and gptAnalysis
        const gptAnalysis = response.data.gptAnalysis || response.data.data?.gptAnalysis;
        const audioAnalysis = response.data.audioAnalysis || response.data.data?.audioAnalysis;
        setAnalysis(gptAnalysis);
        setAudioTranscript(audioAnalysis?.transcript || null);
        setAudioFeatures(audioAnalysis?.features || null);
        saveAnalysisToHistory(gptAnalysis, audioAnalysis?.transcript || 'Audio analysis', 'audio');
        showToast('Audio analysis complete!', 'success');
      } else {
        setError('Failed to analyze audio');
        showToast('Failed to analyze audio', 'error');
      }
    } catch (err: any) {
      setError('Error connecting to backend');
      showToast('Error connecting to backend', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Color helpers
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    return '#F44336';
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
            <Box display="flex" justifyContent="center" alignItems="center" mb={3} gap={2}>
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
                      '&:hover': { backgroundColor: '#4fc3f7' },
                    },
                  },
                }}
              >
                <ToggleButton value="text" aria-label="text input">
                  <EditIcon sx={{ mr: 1 }} />Text Input
                </ToggleButton>
                <ToggleButton value="audio" aria-label="audio input">
                  <MicIcon sx={{ mr: 1 }} />Audio Input
                </ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant={currentTab === 1 ? 'contained' : 'outlined'}
                onClick={() => setCurrentTab(currentTab === 1 ? 0 : 1)}
                startIcon={<HistoryIcon />}
                disabled={loading}
                sx={{
                  borderColor: '#61dafb',
                  color: currentTab === 1 ? '#1e1e2e' : '#61dafb',
                  backgroundColor: currentTab === 1 ? '#61dafb' : 'transparent',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: currentTab === 1 ? '#4fc3f7' : 'rgba(97, 218, 251, 0.1)',
                    borderColor: '#4fc3f7',
                  },
                  '&:disabled': {
                    borderColor: '#555',
                    color: '#999',
                  },
                }}
              >
                History {pitchHistory.length > 0 ? `(${pitchHistory.length})` : ''}
              </Button>
            </Box>
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
                  onChange={e => setPitchText(e.target.value)}
                  inputProps={{ maxLength: 2000 }}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#1e1e2e',
                      color: 'white',
                      '& fieldset': { borderColor: '#61dafb' },
                      '&:hover fieldset': { borderColor: '#4fc3f7' },
                      '&.Mui-focused fieldset': { borderColor: '#61dafb' },
                    },
                    '& .MuiInputBase-input::placeholder': { color: '#b0bec5', opacity: 1 },
                  }}
                />
                <Box display="flex" justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading || pitchText.trim().length < 10}
                    sx={{ backgroundColor: '#61dafb', color: '#1e1e2e', fontWeight: 'bold', '&:hover': { backgroundColor: '#4fc3f7' } }}
                  >
                    Analyze
                  </Button>
                </Box>
              </Box>
            )}
            {inputType === 'audio' && (
              <Box>
                <AudioInput onAudioReady={handleAudioReady} disabled={loading} />
              </Box>
            )}
          </CardContent>
        </Card>
        {loading && (
          <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(30, 30, 46, 0.95)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(5px)' }}>
            <CircularProgress size={80} thickness={4} sx={{ color: '#61dafb', mb: 3 }} />
            <Typography variant="h5" sx={{ color: '#61dafb', fontWeight: 'bold', textAlign: 'center', mb: 1 }}>
              Analyzing your pitch...
            </Typography>
            <Typography variant="body1" sx={{ color: '#b0bec5', textAlign: 'center', maxWidth: 400 }}>
              Our AI is carefully reviewing your pitch and preparing detailed feedback
            </Typography>
          </Box>
        )}
        {error && (
          <Box sx={{ mb: 4 }}>
            <Alert severity="error" sx={{ backgroundColor: '#ffebee', color: '#c62828', '& .MuiAlert-icon': { color: '#c62828' } }}>
              {error}
            </Alert>
          </Box>
        )}
        {analysis && (
          <Card sx={{ backgroundColor: '#2a2a3e', boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h4" component="h3" gutterBottom sx={{ color: '#61dafb', textAlign: 'center' }}>
                <PsychologyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Analysis Results
              </Typography>
              {/* Show transcript and features for audio input */}
              {inputType === 'audio' && (
                <Box mb={3}>
                  {audioTranscript && (
                    <Paper elevation={2} sx={{ p: 2, backgroundColor: '#1e1e2e', color: '#b0bec5', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ color: '#61dafb', mb: 1 }}>Transcript</Typography>
                      <Typography variant="body2">{audioTranscript}</Typography>
                    </Paper>
                  )}
                  {audioFeatures && (
                    <Paper elevation={2} sx={{ p: 2, backgroundColor: '#1e1e2e', color: '#b0bec5' }}>
                      <Typography variant="subtitle1" sx={{ color: '#61dafb', mb: 1 }}>Audio Features</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {Object.entries(audioFeatures).map(([key, value]) => (
                          <Box key={key} sx={{ mr: 3, mb: 1 }}>
                            <Typography variant="caption" sx={{ color: '#b0bec5' }}>{key}:</Typography>
                            <Typography variant="body2" sx={{ color: '#e0e0e0', fontWeight: 'bold' }}>{typeof value === 'number' ? value.toFixed(2) : String(value)}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Paper>
                  )}
                </Box>
              )}
              <Box display="flex" justifyContent="center" mb={4}>
                <Paper elevation={4} sx={{ p: 3, textAlign: 'center', backgroundColor: '#1e1e2e', border: `3px solid ${getScoreColor((analysis.overallScore || 0) / 10)}`, borderRadius: '50%', width: 120, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#b0bec5', fontSize: '0.9rem' }}>
                    Overall Score
                  </Typography>
                  <Typography variant="h3" sx={{ color: getScoreColor((analysis.overallScore || 0) / 10), fontWeight: 'bold', lineHeight: 1 }}>
                    {analysis.overallScore}/100
                  </Typography>
                </Paper>
              </Box>
              {/* Accordions for analysis sections (text and audio-based) */}
              <Box sx={{ mt: 2 }}>
                {/* Tone Analysis */}
                {analysis.tone && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>🎯 Tone</Typography>
                        <Chip label={`${analysis.tone.score}/100`} size="small" sx={{ backgroundColor: getScoreColor(analysis.tone.score / 10), color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>{analysis.tone.description}</Typography>
                      {(analysis.tone.suggestions || []).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>💡 Suggestions:</Typography>
                          <List dense>
                            {(analysis.tone.suggestions || []).map((suggestion, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${suggestion}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#e0e0e0' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Clarity Analysis */}
                {analysis.clarity && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>🔍 Clarity</Typography>
                        <Chip label={`${analysis.clarity.score}/100`} size="small" sx={{ backgroundColor: getScoreColor(analysis.clarity.score / 10), color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>{analysis.clarity.description}</Typography>
                      {(analysis.clarity.suggestions || []).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>💡 Suggestions:</Typography>
                          <List dense>
                            {(analysis.clarity.suggestions || []).map((suggestion, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${suggestion}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#e0e0e0' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      {(analysis.clarity.issues || []).length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle2" sx={{ color: '#ff9800', mb: 1 }}>Issues:</Typography>
                          <List dense>
                            {(analysis.clarity.issues || []).map((issue, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${issue}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#ff9800' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Confidence Analysis (audio only) */}
                {analysis.confidence && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>💪 Confidence</Typography>
                        <Chip label={analysis.confidence.level.toUpperCase()} size="small" sx={{ backgroundColor: analysis.confidence.level === 'High' ? '#4CAF50' : analysis.confidence.level === 'Medium' ? '#FF9800' : '#F44336', color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>Your confidence level affects how persuasive and trustworthy your pitch sounds.</Typography>
                      {(analysis.confidence.evidence || []).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>🔍 Evidence:</Typography>
                          <List dense>
                            {analysis.confidence.evidence.map((evidence, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${evidence}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#e0e0e0' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Filler Words (audio only) */}
                {analysis.fillerWords && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>🗣️ Filler Words</Typography>
                        <Chip label={`${analysis.fillerWords.count} words`} size="small" sx={{ backgroundColor: analysis.fillerWords.count > 5 ? '#F44336' : analysis.fillerWords.count > 2 ? '#FF9800' : '#4CAF50', color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>Filler words can make you sound less confident and distract from your message.</Typography>
                      {(analysis.fillerWords.examples || []).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>Examples:</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {analysis.fillerWords.examples.map((word, idx) => (
                              <Chip key={idx} label={word} size="small" sx={{ backgroundColor: '#3a3a4e', color: '#e0e0e0', mb: 1 }} />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Jargon Analysis (text and audio) */}
                {(analysis.jargon || (analysis as any).jargonCount) && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>🔤 Jargon</Typography>
                        <Chip label={`${(analysis.jargon?.count || (analysis as any).jargonCount?.count || 0)} terms`} size="small" sx={{ backgroundColor: (analysis as any).jargonCount?.severity === 'high' ? '#F44336' : (analysis as any).jargonCount?.severity === 'medium' ? '#FF9800' : '#4CAF50', color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>Technical jargon can make your pitch harder to understand for general audiences.</Typography>
                      {((analysis.jargon?.examples || (analysis as any).jargonCount?.examples || []).length > 0) && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>📝 Found Terms:</Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {(analysis.jargon?.examples || (analysis as any).jargonCount?.examples || []).map((term: string, idx: number) => (
                              <Chip key={idx} label={term} size="small" sx={{ backgroundColor: '#3a3a4e', color: '#e0e0e0', mb: 1 }} />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Structure (audio only) */}
                {analysis.structure && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>🏗️ Structure</Typography>
                        <Chip label={`${analysis.structure.score}/100`} size="small" sx={{ backgroundColor: getScoreColor(analysis.structure.score / 10), color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>A well-structured pitch follows a logical flow: Problem → Solution → Market → Ask.</Typography>
                      {(analysis.structure.issues || []).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#ff9800', mb: 1 }}>Issues:</Typography>
                          <List dense>
                            {analysis.structure.issues.map((issue, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${issue}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#ff9800' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Persuasion (audio only) */}
                {analysis.persuasion && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>🎯 Persuasion</Typography>
                        <Chip label={`${analysis.persuasion.score}/100`} size="small" sx={{ backgroundColor: getScoreColor(analysis.persuasion.score / 10), color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>Persuasive elements help convince investors and build credibility.</Typography>
                      {(analysis.persuasion.techniques || []).length > 0 && (
                        <Box mb={2}>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>Techniques:</Typography>
                          <List dense>
                            {analysis.persuasion.techniques.map((tech, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${tech}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#e0e0e0' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                      {(analysis.persuasion.weaknesses || []).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#ff9800', mb: 1 }}>Weaknesses:</Typography>
                          <List dense>
                            {analysis.persuasion.weaknesses.map((weak, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${weak}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#ff9800' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Engagement (audio only) */}
                {analysis.engagement && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>🎤 Engagement</Typography>
                        <Chip label={`${analysis.engagement.score}/100`} size="small" sx={{ backgroundColor: getScoreColor(analysis.engagement.score / 10), color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>Vocal variety and energy keep your audience engaged and interested.</Typography>
                      <Box display="flex" gap={2} mb={2}>
                        <Box>
                          <Chip label={analysis.engagement.vocal_variety.toUpperCase()} size="small" sx={{ backgroundColor: analysis.engagement.vocal_variety === 'high' ? '#4CAF50' : analysis.engagement.vocal_variety === 'medium' ? '#FF9800' : '#F44336', color: 'white', fontWeight: 'bold' }} />
                        </Box>
                        <Box>
                          <Chip label={analysis.engagement.energy_level.toUpperCase()} size="small" sx={{ backgroundColor: analysis.engagement.energy_level === 'high' ? '#4CAF50' : analysis.engagement.energy_level === 'medium' ? '#FF9800' : '#F44336', color: 'white', fontWeight: 'bold' }} />
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#b0bec5', fontStyle: 'italic' }}>💡 Vary your pitch, pace, and volume to maintain audience attention. Practice with emotion and enthusiasm.</Typography>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Persuasiveness (text only) */}
                {analysis.persuasiveness && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>💼 Persuasiveness</Typography>
                        <Chip label={`${analysis.persuasiveness.score}/100`} size="small" sx={{ backgroundColor: getScoreColor(analysis.persuasiveness.score / 10), color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>{analysis.persuasiveness.description}</Typography>
                      {(analysis.persuasiveness.suggestions || []).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>💡 Suggestions:</Typography>
                          <List dense>
                            {(analysis.persuasiveness.suggestions || []).map((suggestion, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${suggestion}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#e0e0e0' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Memorability (text only) */}
                {analysis.memorability && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography variant="h6" sx={{ color: '#61dafb' }}>🧠 Memorability</Typography>
                        <Chip label={`${analysis.memorability.score}/100`} size="small" sx={{ backgroundColor: getScoreColor(analysis.memorability.score / 10), color: 'white', fontWeight: 'bold', mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Typography variant="body2" sx={{ color: '#e0e0e0', mb: 2 }}>{analysis.memorability.description}</Typography>
                      {(analysis.memorability.suggestions || []).length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: '#61dafb', mb: 1 }}>💡 Suggestions:</Typography>
                          <List dense>
                            {(analysis.memorability.suggestions || []).map((suggestion, idx) => (
                              <ListItem key={idx} sx={{ py: 0.5, pl: 0 }}>
                                <ListItemText primary={`• ${suggestion}`} primaryTypographyProps={{ variant: 'body2', sx: { color: '#e0e0e0' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Improved Version (always shown if present) */}
                {analysis.improvedVersion && (
                  <Accordion sx={{ backgroundColor: '#1e1e2e', color: 'white', mb: 1, '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#61dafb' }} />} sx={{ backgroundColor: '#2a2a3e', '&:hover': { backgroundColor: '#3a3a4e' } }}>
                      <Typography variant="h6" sx={{ color: '#61dafb' }}>✨ Improved Version</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#1e1e2e' }}>
                      <Paper elevation={1} sx={{ p: 3, backgroundColor: '#2a2a3e', borderLeft: '4px solid #61dafb' }}>
                        <Typography variant="body1" sx={{ color: '#e0e0e0', lineHeight: 1.6 }}>{analysis.improvedVersion}</Typography>
                      </Paper>
                      <Typography variant="body2" sx={{ color: '#b0bec5', mt: 2, fontStyle: 'italic' }}>💡 This version incorporates the suggestions above for a more polished delivery.</Typography>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
        {currentTab === 1 && (
          <Box mt={4}>
            {pitchHistory.length === 0 ? (
              <Card sx={{ backgroundColor: '#2a2a3e', boxShadow: 3 }}>
                <CardContent>
                  <Box textAlign="center" py={6}>
                    <HistoryIcon sx={{ fontSize: 64, color: '#61dafb', mb: 2 }} />
                    <Typography variant="h5" sx={{ color: '#61dafb', mb: 2 }}>
                      No Analysis History
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#b0bec5', mb: 3 }}>
                      Your recent pitch analyses will appear here. Start by analyzing your first pitch!
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setCurrentTab(0)}
                      sx={{ backgroundColor: '#61dafb', color: '#1e1e2e', fontWeight: 'bold', '&:hover': { backgroundColor: '#4fc3f7' } }}
                    >
                      Analyze New Pitch
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Box>
                <Typography variant="h5" sx={{ color: '#61dafb', mb: 3, textAlign: 'center' }}>
                  📈 Recent Analysis History
                </Typography>
                <Typography variant="body2" sx={{ color: '#b0bec5', mb: 3, textAlign: 'center' }}>
                  Your last {pitchHistory.length} pitch analyses (showing most recent first)
                </Typography>
                {/* Map and display history cards here, see previous implementation */}
              </Box>
            )}
          </Box>
        )}
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
            sx={{ width: '100%', color: 'white', '& .MuiAlert-icon': { color: 'white' } }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}

export default App;
