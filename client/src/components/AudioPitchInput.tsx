import React, { useState } from 'react';

type InputMode = 'record' | 'upload';

interface AudioPitchInputProps {
  onAnalyze: (audioData: File | Blob, mode: InputMode) => void;
  loading: boolean;
}

const AudioPitchInput: React.FC<AudioPitchInputProps> = ({ onAnalyze, loading }) => {
  const [inputMode, setInputMode] = useState<InputMode>('record');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);

  // Timer for recording duration
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);

  const handleModeToggle = (mode: InputMode) => {
    setInputMode(mode);
    // Reset state when switching modes
    setRecordedAudio(null);
    setUploadedFile(null);
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
  };

  const handleStartRecording = () => {
    // TODO: Implement actual recording logic
    setIsRecording(true);
    setRecordingDuration(0);
    
    // Start timer for duration display
    const timer = setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
    setRecordingTimer(timer);
    
    console.log('Starting recording...');
  };

  const handleStopRecording = () => {
    // TODO: Implement actual recording stop logic
    setIsRecording(false);
    
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
    
    // Create a mock audio blob for now (will be replaced with actual recording)
    const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
    setRecordedAudio(mockAudioBlob);
    
    console.log('Recording stopped. Duration:', recordingDuration, 'seconds');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/mpeg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select an MP3 or WAV file');
        return;
      }
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }
      
      setUploadedFile(file);
    }
  };

  const handleAnalyze = () => {
    const audioData = inputMode === 'record' ? recordedAudio : uploadedFile;
    if (audioData) {
      onAnalyze(audioData, inputMode);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasAudioData = inputMode === 'record' ? recordedAudio : uploadedFile;

  return (
    <div className="audio-pitch-input">
      <h3>Audio Pitch Analysis</h3>
      
      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-button ${inputMode === 'record' ? 'active' : ''}`}
          onClick={() => handleModeToggle('record')}
          disabled={loading || isRecording}
        >
          🎤 Record Pitch
        </button>
        <button
          className={`mode-button ${inputMode === 'upload' ? 'active' : ''}`}
          onClick={() => handleModeToggle('upload')}
          disabled={loading || isRecording}
        >
          📁 Upload Pitch
        </button>
      </div>

      {/* Recording Mode */}
      {inputMode === 'record' && (
        <div className="record-mode">
          <div className="record-controls">
            {!isRecording && !recordedAudio && (
              <button
                className="record-button start"
                onClick={handleStartRecording}
                disabled={loading}
              >
                🎤 Start Recording
              </button>
            )}
            
            {isRecording && (
              <div className="recording-active">
                <button
                  className="record-button stop"
                  onClick={handleStopRecording}
                >
                  ⏹️ Stop Recording
                </button>
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  Recording: {formatDuration(recordingDuration)}
                </div>
              </div>
            )}
            
            {recordedAudio && !isRecording && (
              <div className="recorded-preview">
                <div className="audio-info">
                  ✅ Recording completed ({formatDuration(recordingDuration)})
                </div>
                <div className="audio-actions">
                  <button
                    className="record-button restart"
                    onClick={() => {
                      setRecordedAudio(null);
                      setRecordingDuration(0);
                    }}
                    disabled={loading}
                  >
                    🔄 Record Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Mode */}
      {inputMode === 'upload' && (
        <div className="upload-mode">
          <div className="file-upload-area">
            <input
              type="file"
              id="audio-upload"
              accept=".mp3,.wav,audio/mp3,audio/wav,audio/mpeg"
              onChange={handleFileUpload}
              disabled={loading}
              className="file-input"
            />
            <label htmlFor="audio-upload" className="file-upload-label">
              {uploadedFile ? (
                <div className="file-selected">
                  <span className="file-icon">🎵</span>
                  <div className="file-details">
                    <div className="file-name">{uploadedFile.name}</div>
                    <div className="file-size">
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              ) : (
                <div className="file-upload-prompt">
                  <span className="upload-icon">📁</span>
                  <div>Click to select audio file</div>
                  <div className="file-formats">MP3 or WAV (max 10MB)</div>
                </div>
              )}
            </label>
            
            {uploadedFile && (
              <button
                className="remove-file-button"
                onClick={() => setUploadedFile(null)}
                disabled={loading}
              >
                ❌ Remove File
              </button>
            )}
          </div>
        </div>
      )}

      {/* Analysis Button */}
      {hasAudioData && (
        <div className="analyze-section">
          <button
            className="analyze-audio-button"
            onClick={handleAnalyze}
            disabled={loading || !hasAudioData}
          >
            {loading ? 'Analyzing Audio...' : 'Analyze Audio Pitch'}
          </button>
          <div className="audio-note">
            Audio analysis includes: vocal tone, clarity, pace, confidence, and overall delivery quality
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPitchInput;
