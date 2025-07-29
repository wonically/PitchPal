
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container, Paper, Box, Typography, Card, CardContent, Button, Snackbar, Alert
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import AudioInput from './components/AudioInput';
import TextInput from './components/TextInput';
import InputTypeSelector from './components/InputTypeSelector';
import LoadingOverlay from './components/LoadingOverlay';
import AnalysisResult from './components/AnalysisResult';

import { AudioBasedAnalysis, TextBasedAnalysis } from '../../server/src/utils/analysisTypes';

interface StoredAnalysis {
  id: string;
  pitchText: string;
  analysis: AudioBasedAnalysis | TextBasedAnalysis;
  inputType: 'text' | 'audio';
  timestamp: string;
  displayDate: string;
}

function App() {
  const [pitchText, setPitchText] = useState('');
  const [analysis, setAnalysis] = useState<AudioBasedAnalysis | TextBasedAnalysis | null>(null);
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

  const saveAnalysisToHistory = (analysis: AudioBasedAnalysis | TextBasedAnalysis, pitchText: string, inputType: 'text' | 'audio') => {
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
  const handleAudioReady = async (audioFile: File) => {
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h2" component="h1" gutterBottom>
            🎯 PitchPal
          </Typography>
          <Typography variant="h5" component="p">
            AI-Powered Pitch Analysis
          </Typography>
        </Box>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <InputTypeSelector
              inputType={inputType}
              onInputTypeChange={setInputType}
              currentTab={currentTab}
              onTabChange={setCurrentTab}
              historyCount={pitchHistory.length}
              disabled={loading}
            />
            {inputType === 'text' && (
              <TextInput
                pitchText={pitchText}
                onTextChange={setPitchText}
                onSubmit={handleSubmit}
                disabled={loading}
              />
            )}
            {inputType === 'audio' && (
              <Box>
                <AudioInput onAudioReady={handleAudioReady} disabled={loading} />
              </Box>
            )}
          </CardContent>
        </Card>
        <LoadingOverlay show={loading} />
        {error && (
          <Box sx={{ mb: 4 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        {analysis && (
          <AnalysisResult
            analysis={analysis}
            mode={inputType}
            audioTranscript={audioTranscript}
            originalText={inputType === 'text' ? pitchText : undefined}
            audioFeatures={audioFeatures}
          />
        )}
        {currentTab === 1 && (
          <Box mt={4}>
            {pitchHistory.length === 0 ? (
              <Card>
                <CardContent>
                  <Box textAlign="center" py={6}>
                    <HistoryIcon sx={{ fontSize: 64, mb: 2 }} />
                    <Typography variant="h5" sx={{ mb: 2 }}>
                      No Analysis History
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                      Your recent pitch analyses will appear here. Start by analyzing your first pitch!
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => setCurrentTab(0)}
                    >
                      Analyze New Pitch
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Box>
                <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
                  📈 Recent Analysis History
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
                  Your last {pitchHistory.length} pitch analyses (showing most recent first)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {pitchHistory.map((item) => (
                    <AnalysisResult
                      key={item.id}
                      analysis={item.analysis}
                      mode={item.inputType}
                      audioTranscript={item.inputType === 'audio' ? item.pitchText : undefined}
                      originalText={item.inputType === 'text' ? item.pitchText : undefined}
                      historyMeta={{
                        displayDate: item.displayDate,
                        inputType: item.inputType,
                        pitchText: item.pitchText,
                        score: item.analysis.overallScore ?? 0,
                      }}
                    />
                  ))}
                </Box>
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
            sx={{ width: '100%' }}
          >
            {toastMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}

export default App;
