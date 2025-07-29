import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  Paper
} from '@mui/material';
import {
  Mic as MicIcon,
  Stop as StopIcon,
  CloudUpload as UploadIcon,
  Replay as ReplayIcon,
  VolumeUp as VolumeIcon
} from '@mui/icons-material';

interface AudioInputProps {
  onAudioReady: (audioFile: File, mode: 'record' | 'upload') => void;
  disabled?: boolean;
}

type InputMode = 'record' | 'upload';
type RecordingState = 'idle' | 'recording' | 'recorded';

const AudioInput: React.FC<AudioInputProps> = ({ onAudioReady, disabled = false }) => {
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  
  // Helper function to display countdown and then 'Recording' with opacity flicker (no timer)
  const getRecordingStatus = (seconds: number): string | null => {
    if (seconds === 0 || seconds === 1) return "Ready...";
    if (seconds === 2) return "Go!";
    return "Recording";
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clean up on component unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if ((window as any).recordingInterval) {
        clearInterval((window as any).recordingInterval);
        delete (window as any).recordingInterval;
      }
      stopVolumeMonitoring();
    };
  }, []);

  const startVolumeMonitoring = (stream: MediaStream) => {
    try {
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzer = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;
      microphone.connect(analyzer);
      
      audioContextRef.current = audioContext;
      analyzerRef.current = analyzer;
      
      // Start monitoring volume levels
      const monitorVolume = () => {
        if (analyzerRef.current) {
          const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
          analyzerRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
          const normalizedVolume = Math.min(average / 128, 1); // Normalize to 0-1
          
          setVolumeLevel(normalizedVolume);
        }
        
        animationFrameRef.current = requestAnimationFrame(monitorVolume);
      };
      
      monitorVolume();
    } catch (error) {
      console.error('Error setting up volume monitoring:', error);
    }
  };

  const stopVolumeMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyzerRef.current = null;
    setVolumeLevel(0);
  };

  const handleModeSwitch = (mode: InputMode) => {
    // Clean up any ongoing recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if ((window as any).recordingInterval) {
      clearInterval((window as any).recordingInterval);
      delete (window as any).recordingInterval;
    }
    stopVolumeMonitoring();
    
    setInputMode(mode);
    // Reset states when switching modes
    setRecordingState('idle');
    setUploadedFile(null);
    setRecordedAudio(null);
    setRecordingDuration(0);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];
      
      // Start volume monitoring
      startVolumeMonitoring(stream);
      
      // Create MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      // Handle data availability
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        setRecordedAudio(audioBlob);
        
        // Clean up stream
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingState('recording');
      setRecordingDuration(0);
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      (window as any).recordingInterval = interval;
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  const handleStopRecording = async () => {
    // Stop the MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop volume monitoring
    stopVolumeMonitoring();
    
    setRecordingState('recorded');
    
    // Clear the timer interval
    if ((window as any).recordingInterval) {
      clearInterval((window as any).recordingInterval);
      delete (window as any).recordingInterval;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Debug: log file type and name
      console.log('Selected file:', file);
      console.log('File type:', file.type, 'File name:', file.name);
      // Validate file type
      const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav'];
      // Accept 'audio/x-wav' as well (common for .wav files)
      const extendedAllowedTypes = [...allowedTypes, 'audio/x-wav'];
      if (!extendedAllowedTypes.includes(file.type)) {
        alert('Please select an MP3 or WAV file.');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB.');
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const handleFinishRecording = () => {
    if (recordedAudio) {
      // Convert blob to file - use webm format since that's what MediaRecorder produces
      const file = new File([recordedAudio], `recording_${Date.now()}.webm`, {
        type: 'audio/webm;codecs=opus'
      });
      onAudioReady(file, 'record');
    }
  };

  const handleFinishUpload = () => {
    if (uploadedFile) {
      onAudioReady(uploadedFile, 'upload');
    }
  };

  const getAudioPreviewUrl = (): string | null => {
    if (inputMode === 'upload' && uploadedFile) {
      return URL.createObjectURL(uploadedFile);
    }
    if (inputMode === 'record' && recordedAudio) {
      return URL.createObjectURL(recordedAudio);
    }
    return null;
  };

  return (
    <Card sx={{ backgroundColor: (theme) => theme.palette.background.paper, color: (theme) => theme.palette.text.primary, boxShadow: 'none' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: (theme) => theme.palette.primary.main, textAlign: 'center' }}>
          Audio Pitch Input
        </Typography>
        
        {/* Mode Toggle */}
        <Box display="flex" justifyContent="center" mb={3}>
          <ToggleButtonGroup
            value={inputMode}
            exclusive
            onChange={(_, newMode) => newMode && handleModeSwitch(newMode)}
            aria-label="input mode"
            disabled={disabled}
          >
            <ToggleButton value="record" aria-label="record">
              <MicIcon sx={{ mr: 1 }} />
              Record Pitch
            </ToggleButton>
            <ToggleButton value="upload" aria-label="upload">
              <UploadIcon sx={{ mr: 1 }} />
              Upload Pitch
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Recording Mode */}
        {inputMode === 'record' && (
          <Box>
            {recordingState === 'idle' && (
              <Box display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartRecording}
                  disabled={disabled}
                  startIcon={<MicIcon />}
                  sx={(theme) => ({
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.background.paper,
                    fontWeight: 'bold',
                    px: 4,
                    py: 1.5,
                    borderRadius: Number(theme.shape.borderRadius) * 2,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light,
                    },
                    '&:disabled': {
                      backgroundColor: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                    },
                  })}
                >
                  Start Recording
                </Button>
              </Box>
            )}
            
            {recordingState === 'recording' && (
              <Box textAlign="center">
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStopRecording}
                  disabled={disabled}
                  startIcon={<StopIcon />}
                  color="error"
                  sx={{ mb: 2, borderRadius: 50, px: 4, py: 1.5 }}
                >
                  Stop Recording
                </Button>
                <Box mb={2}>
                  {(() => {
                    const status = getRecordingStatus(recordingDuration);
                    if (!status) return null;
                    // For 'Recording', flicker opacity between 1 and 0.3 every second
                    const isFlicker = status === 'Recording';
                    const opacity = isFlicker ? (recordingDuration % 2 === 0 ? 1 : 0.3) : 1;
                    return (
                      <Typography
                        variant="h6"
                        sx={{
                          color: (theme) => theme.palette.error.main,
                          fontWeight: 'bold',
                          transition: 'opacity 0.2s',
                          opacity
                        }}
                      >
                        {status}
                      </Typography>
                    );
                  })()}
                </Box>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} justifyContent="center">
                    <VolumeIcon sx={{ color: (theme) => theme.palette.primary.main }} />
                    <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>Volume:</Typography>
                    <Box display="flex" gap={0.5}>
                      {Array.from({ length: 20 }, (_, i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 4,
                            height: 20,
                            backgroundColor: (theme) =>
                              i < volumeLevel * 20
                                ? (i > 16
                                    ? theme.palette.error.main
                                    : i > 10
                                      ? theme.palette.warning.main
                                      : theme.palette.success.main)
                                : theme.palette.action.disabledBackground,
                            borderRadius: 0.5
                          }}
                        />
                      ))}
                    </Box>
                  </Stack>
                </Box>
              </Box>
            )}
            
            {recordingState === 'recorded' && (
              <Box textAlign="center">
                <Typography variant="body1" sx={{ color: (theme) => theme.palette.text.primary, mb: 2 }}>
                  Recording complete!
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setRecordingState('idle');
                      setRecordedAudio(null);
                      setRecordingDuration(0);
                    }}
                    disabled={disabled}
                    startIcon={<ReplayIcon />}
                    sx={(theme) => ({
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      borderRadius: theme.shape.borderRadius,
                      '&:hover': {
                        borderColor: theme.palette.primary.light,
                        backgroundColor: theme.palette.action.hover,
                      },
                    })}
                  >
                    Record Again
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleFinishRecording}
                    disabled={disabled}
                    sx={(theme) => ({
                      backgroundColor: theme.palette.success.main,
                      color: theme.palette.getContrastText(theme.palette.success.main),
                      borderRadius: theme.shape.borderRadius,
                      '&:hover': {
                        backgroundColor: theme.palette.success.dark,
                      },
                    })}
                  >
                    Use This Recording
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        )}

        {/* Upload Mode */}
        {inputMode === 'upload' && (
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,audio/mp3,audio/mpeg,audio/wav"
              onChange={handleFileUpload}
              disabled={disabled}
              style={{ display: 'none' }}
              id="audio-file-input"
            />
            <label htmlFor="audio-file-input">
              <Paper
                elevation={2}
                sx={(theme) => ({
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: theme.palette.background.default,
                  border: `2px dashed ${theme.palette.primary.main}`,
                  borderRadius: Number(theme.shape.borderRadius) * 1.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                    borderColor: theme.palette.primary.light,
                  },
                })}
                component="div"
              >
                <UploadIcon sx={{ fontSize: 48, color: (theme) => theme.palette.primary.main, mb: 2 }} />
                {uploadedFile ? (
                  <Box>
                    <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary, fontWeight: 'bold' }}>
                      {uploadedFile.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="h6" sx={{ color: (theme) => theme.palette.text.primary }}>
                      Click to select an audio file
                    </Typography>
                    <Typography variant="body2" sx={{ color: (theme) => theme.palette.text.secondary }}>
                      Supports MP3 and WAV files (max 10MB)
                    </Typography>
                  </Box>
                )}
              </Paper>
            </label>
            
            {uploadedFile && (
              <Box mt={3}>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setUploadedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    disabled={disabled}
                    startIcon={<ReplayIcon />}
                    sx={(theme) => ({
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      borderRadius: theme.shape.borderRadius,
                      '&:hover': {
                        borderColor: theme.palette.primary.light,
                        backgroundColor: theme.palette.action.hover,
                      },
                    })}
                  >
                    Choose Different File
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleFinishUpload}
                    disabled={disabled}
                    sx={(theme) => ({
                      backgroundColor: theme.palette.success.main,
                      color: theme.palette.getContrastText(theme.palette.success.main),
                      borderRadius: theme.shape.borderRadius,
                      '&:hover': {
                        backgroundColor: theme.palette.success.dark,
                      },
                    })}
                  >
                    Use This File
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>
        )}

      {/* Audio Preview */}
        {/* Audio Preview */}
        {getAudioPreviewUrl() && (
          <Box mt={3} textAlign="center">
            <Typography variant="h6" gutterBottom sx={{ color: (theme) => theme.palette.primary.main }}>
              Audio Preview
            </Typography>
            <audio
              ref={audioPreviewRef}
              controls
              src={getAudioPreviewUrl()!}
              style={{ width: '100%', maxWidth: 400 }}
            >
              Your browser does not support the audio element.
            </audio>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AudioInput;
