import React, { useState, useRef, useEffect } from 'react';
import './AudioInput.css';

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  
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
    setAnalysisResult(null);
    setSubmissionError(null);
    
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
      // Validate file type
      const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav'];
      if (!allowedTypes.includes(file.type)) {
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
      handleSubmit(file);
    }
  };

  const handleFinishUpload = () => {
    if (uploadedFile) {
      onAudioReady(uploadedFile, 'upload');
      handleSubmit(uploadedFile);
    }
  };

  const handleSubmit = async (audioFile: File) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setAnalysisResult(null);

    try {
      // Create FormData and append the audio file
      const formData = new FormData();
      formData.append('audio', audioFile);

      // Send to /analyze endpoint
      const response = await fetch('/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Parse JSON response
      const result = await response.json();
      setAnalysisResult(result);

    } catch (error) {
      console.error('Error submitting audio:', error);
      setSubmissionError(error instanceof Error ? error.message : 'Failed to analyze audio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    <div className="audio-input-content">
      <h3>Audio Pitch Input</h3>
      
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-button ${inputMode === 'record' ? 'active' : ''}`}
          onClick={() => handleModeSwitch('record')}
          disabled={disabled}
        >
          🎤 Record Pitch
        </button>
        <button
          className={`mode-button ${inputMode === 'upload' ? 'active' : ''}`}
          onClick={() => handleModeSwitch('upload')}
          disabled={disabled}
        >
          📁 Upload Pitch
        </button>
      </div>

      {/* Recording Mode */}
      {inputMode === 'record' && (
        <div className="recording-section">
          <div className="recording-controls">
            {recordingState === 'idle' && (
              <button
                className="record-button start"
                onClick={handleStartRecording}
                disabled={disabled}
              >
                <span className="record-icon">🎤</span>
                Start Recording
              </button>
            )}
            
            {recordingState === 'recording' && (
              <div className="recording-active">
                <button
                  className="record-button stop"
                  onClick={handleStopRecording}
                  disabled={disabled}
                >
                  <span className="record-icon recording">⏹️</span>
                  Stop Recording
                </button>
                <div className="recording-timer">
                  <span className="recording-indicator">🔴</span>
                  {formatDuration(recordingDuration)}
                </div>
                <div className="volume-meter">
                  <div className="volume-label">🔊 Volume:</div>
                  <div className="volume-bars">
                    {Array.from({ length: 20 }, (_, i) => (
                      <div 
                        key={i}
                        className={`volume-bar ${i < volumeLevel * 20 ? 'active' : ''}`}
                        style={{
                          backgroundColor: i < volumeLevel * 20 
                            ? (i > 16 ? '#ff4444' : i > 10 ? '#ffaa00' : '#44ff44')
                            : 'rgba(255, 255, 255, 0.1)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {recordingState === 'recorded' && (
              <div className="recording-complete">
                <p>Recording complete! Duration: {formatDuration(recordingDuration)}</p>
                <div className="recording-actions">
                  <button
                    className="action-button secondary"
                    onClick={() => {
                      setRecordingState('idle');
                      setRecordedAudio(null);
                      setRecordingDuration(0);
                      setAnalysisResult(null);
                      setSubmissionError(null);
                    }}
                    disabled={disabled}
                  >
                    Record Again
                  </button>
                  <button
                    className="action-button primary"
                    onClick={handleFinishRecording}
                    disabled={disabled || isSubmitting}
                  >
                    {isSubmitting ? '🔄 Analyzing...' : 'Use This Recording'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Mode */}
      {inputMode === 'upload' && (
        <div className="upload-section">
          <div className="file-upload-area">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,audio/mp3,audio/mpeg,audio/wav"
              onChange={handleFileUpload}
              disabled={disabled}
              className="file-input"
              id="audio-file-input"
            />
            <label htmlFor="audio-file-input" className="file-upload-label">
              <div className="upload-icon">📁</div>
              <div className="upload-text">
                {uploadedFile ? (
                  <div>
                    <strong>{uploadedFile.name}</strong>
                    <br />
                    <small>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</small>
                  </div>
                ) : (
                  <div>
                    Click to select an audio file
                    <br />
                    <small>Supports MP3 and WAV files (max 10MB)</small>
                  </div>
                )}
              </div>
            </label>
          </div>
          
          {uploadedFile && (
            <div className="upload-complete">
              <div className="upload-actions">
                <button
                  className="action-button secondary"
                  onClick={() => {
                    setUploadedFile(null);
                    setAnalysisResult(null);
                    setSubmissionError(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={disabled}
                >
                  Choose Different File
                </button>
                <button
                  className="action-button primary"
                  onClick={handleFinishUpload}
                  disabled={disabled || isSubmitting}
                >
                  {isSubmitting ? '🔄 Analyzing...' : 'Use This File'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audio Preview */}
      {getAudioPreviewUrl() && (
        <div className="audio-preview">
          <h4>Audio Preview</h4>
          <audio
            ref={audioPreviewRef}
            controls
            src={getAudioPreviewUrl()!}
            className="audio-player"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {/* Submission Status */}
      {isSubmitting && (
        <div className="submission-status">
          <p>🔄 Analyzing your pitch...</p>
        </div>
      )}

      {submissionError && (
        <div className="submission-error">
          <p>❌ Error: {submissionError}</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="analysis-results">
          <h4>✅ Analysis Complete</h4>
          <pre className="analysis-json">
            {JSON.stringify(analysisResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AudioInput;
