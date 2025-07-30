
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Container, Paper, Box, Typography, Stack, Alert, Avatar, AppBar, Toolbar } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AudioInput from './components/AudioInput';
import TextInput from './components/TextInput';
import InputTypeSelector from './components/InputTypeSelector';
import LoadingOverlay from './components/LoadingOverlay';
import AnalysisResult from './components/AnalysisResult';
import { AudioBasedAnalysis, TextBasedAnalysis } from '../../server/src/utils/analysisTypes';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  inputType?: 'text' | 'audio';
  analysis?: AudioBasedAnalysis | TextBasedAnalysis;
  audioTranscript?: string | null;
  audioFeatures?: any | null;
  timestamp: string;
}

function App() {
  const theme = useTheme();
  const [pitchText, setPitchText] = useState('');
  const [inputType, setInputType] = useState<'text' | 'audio'>('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>(() => {
    const stored = sessionStorage.getItem('pitchChat');
    return stored ? JSON.parse(stored) : [];
  });
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    sessionStorage.setItem('pitchChat', JSON.stringify(chat));
  }, [chat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, loading]);




  // Text analysis submit
  const handleSubmit = async () => {
    if (!pitchText.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now() + '-user',
      type: 'user',
      content: pitchText,
      inputType: 'text',
      timestamp: new Date().toISOString(),
    };
    setChat((prev) => [...prev, userMsg]);
    setLoading(true);
    setError('');
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await axios.post(`${backendUrl}/api/`, {
        pitchText,
        analysisType: 'general',
      });
      if (response.data.success) {
        const botMsg: ChatMessage = {
          id: Date.now() + '-bot',
          type: 'bot',
          content: '',
          inputType: 'text',
          analysis: response.data.data.analysis,
          timestamp: new Date().toISOString(),
        };
        setChat((prev) => [...prev, botMsg]);
      } else {
        setError('Failed to analyze pitch');
      }
    } catch (err: any) {
      setError('Error connecting to backend');
    } finally {
      setLoading(false);
      setPitchText('');
    }
  };

  // Audio analysis handler
  const handleAudioReady = async (audioFile: File) => {
    const userMsg: ChatMessage = {
      id: Date.now() + '-user-audio',
      type: 'user',
      content: 'Sent an audio pitch',
      inputType: 'audio',
      timestamp: new Date().toISOString(),
    };
    setChat((prev) => [...prev, userMsg]);
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('audio', audioFile);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const response = await axios.post(`${backendUrl}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        const gptAnalysis = response.data.gptAnalysis || response.data.data?.gptAnalysis;
        const audioAnalysis = response.data.audioAnalysis || response.data.data?.audioAnalysis;
        const botMsg: ChatMessage = {
          id: Date.now() + '-bot-audio',
          type: 'bot',
          content: '',
          inputType: 'audio',
          analysis: gptAnalysis,
          audioTranscript: audioAnalysis?.transcript || null,
          audioFeatures: audioAnalysis?.features || null,
          timestamp: new Date().toISOString(),
        };
        setChat((prev) => [...prev, botMsg]);
      } else {
        setError('Failed to analyze audio');
      }
    } catch (err: any) {
      setError('Error connecting to backend');
    } finally {
      setLoading(false);
    }
  };

  // Conversation style layout
  return (
    <>
      <Box sx={{ minHeight: '100vh', backgroundColor: (theme) => theme.palette.background.paper, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <AppBar
          position="fixed"
          color="default"
          elevation={2}
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: alpha(theme.palette.background.paper, 0.75),
            borderRadius: 0,
            boxShadow: theme.shadows[2],
            backdropFilter: 'blur(6px)',
          }}
        >
          <Toolbar sx={{ flexDirection: 'column', alignItems: 'center', py: 0, minHeight: { xs: 44, sm: 56 }, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.5rem' }, letterSpacing: 0.5, lineHeight: 1, m: 0 }}>
              PitchPal
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar sx={{ minHeight: { xs: 44, sm: 56 }, py: 0 }} /> {/* Spacer for fixed header */}
        <Container maxWidth={false} disableGutters sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0, width: '100%' }}>
          <Box sx={{ p: { xs: 1, sm: 3 }, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 600, width: '100%', maxWidth: 900 }}>
            <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, px: 1 }}>
              <Stack spacing={3}>
                {chat.length === 0 && (
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    Start the conversation by entering your pitch or uploading audio below!
                  </Typography>
                )}
                {chat.map((msg) => (
                  <Box key={msg.id} sx={{ display: 'flex', flexDirection: msg.type === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                    <Avatar sx={{ bgcolor: msg.type === 'user' ? 'primary.main' : 'secondary.main', ml: msg.type === 'user' ? 2 : 0, mr: msg.type === 'bot' ? 2 : 0 }}>
                      {msg.type === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                    </Avatar>
                    <Box sx={{ maxWidth: 900, width: '80%', display: 'flex', flexDirection: 'column', alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                      {msg.type === 'user' ? (
                        <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'primary.main', color: 'primary.contrastText', boxShadow: 2 }}>
                          <Typography variant="body1">{msg.inputType === 'audio' ? '🎤 [Audio Pitch]' : msg.content}</Typography>
                        </Box>
                      ) : (
                        <Box sx={{ p: 2, borderRadius: 4, bgcolor: 'background.paper', color: 'text.primary', boxShadow: 2 }}>
                          {msg.analysis ? (
                            <AnalysisResult
                              analysis={msg.analysis}
                              mode={msg.inputType || 'text'}
                              audioTranscript={msg.audioTranscript}
                              originalText={msg.inputType === 'text' ? msg.content : undefined}
                              audioFeatures={msg.audioFeatures}
                            />
                          ) : (
                            <Typography variant="body1">Analyzing...</Typography>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                ))}
                <div ref={chatEndRef} />
              </Stack>
            </Box>
            <Box sx={{ mt: 'auto', pt: 2 }}>
              <InputTypeSelector
                inputType={inputType}
                onInputTypeChange={setInputType}
                disabled={loading}
              />
              <Paper
                elevation={2}
                sx={theme => ({
                  borderRadius: Number(theme.shape.borderRadius) * 1.5,
                  boxShadow: theme.shadows[2],
                  p: { xs: 2, sm: 3 },
                  mt: 2,
                  background: 'transparent',
                  mx: 'auto',
                  justifyContent: 'center',
                })}
              >
              {inputType === 'text' ? (
                <TextInput
                  pitchText={pitchText}
                  onTextChange={setPitchText}
                  onSubmit={handleSubmit}
                  disabled={loading}
                />
              ) : (
                  <AudioInput onAudioReady={handleAudioReady} disabled={loading} />
                )}              
                </Paper>
            </Box>
            <LoadingOverlay show={loading} />
            {error && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="error">{error}</Alert>
              </Box>
            )}

          </Box>
        </Container>
      </Box>
      <Box
        component="footer"
        sx={{
          width: '100%',
          minHeight: 32,
          py: 0.5,
          px: { xs: 1, sm: 3 },
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.background.default,
          color: (theme) => theme.palette.text.secondary,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) => theme.shadows[1],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: { xs: 12, sm: 13 },
        }}
      >
        <span>PitchPal &copy; {new Date().getFullYear()}</span>
        <span style={{ fontWeight: 500 }}>
          Made by <a href="https://www.linkedin.com/in/wonically" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Wony</a>.
        </span>
      </Box>
    </>
  );
}

export default App;
