import React, { useState, useRef } from 'react';
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);

  const handleModeSwitch = (mode: InputMode) => {
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
    // TODO: Implement actual recording logic
    setRecordingState('recording');
    setRecordingDuration(0);
    
    // Simulate recording duration counter (remove when implementing real recording)
    const interval = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    
    // Store interval reference for cleanup (in real implementation)
    (window as any).recordingInterval = interval;
  };

  const handleStopRecording = async () => {
    // TODO: Implement actual recording stop logic
    setRecordingState('recorded');
    
    // Clear the simulation interval
    if ((window as any).recordingInterval) {
      clearInterval((window as any).recordingInterval);
      delete (window as any).recordingInterval;
    }
    
    // Simulate recorded audio blob (remove when implementing real recording)
    const simulatedBlob = new Blob(['fake audio data'], { type: 'audio/wav' });
    setRecordedAudio(simulatedBlob);
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
      // Convert blob to file
      const file = new File([recordedAudio], `recording_${Date.now()}.wav`, {
        type: 'audio/wav'
      });
      onAudioReady(file, 'record');
    }
  };

  const handleFinishUpload = () => {
    if (uploadedFile) {
      onAudioReady(uploadedFile, 'upload');
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
              </div>
            )}
            
            {recordingState === 'recorded' && (
              <div className="recording-complete">
                <p>Recording complete! Duration: {formatDuration(recordingDuration)}</p>
                <div className="recording-actions">
                  <button
                    className="action-button secondary"
                    onClick={() => setRecordingState('idle')}
                    disabled={disabled}
                  >
                    Record Again
                  </button>
                  <button
                    className="action-button primary"
                    onClick={handleFinishRecording}
                    disabled={disabled}
                  >
                    Use This Recording
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
                  disabled={disabled}
                >
                  Use This File
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
    </div>
  );
};

export default AudioInput;
