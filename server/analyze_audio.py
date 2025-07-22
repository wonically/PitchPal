#!/usr/bin/env python3
"""
Audio Analysis Script for PitchPal
Analyzes uploaded audio files and returns transcript + audio features as JSON
"""

import sys
import json
import os
import wave
import librosa
import numpy as np
from typing import Dict, Any, List

def analyze_audio_features(file_path: str) -> Dict[str, Any]:
    """
    Analyze audio features from the uploaded file
    """
    try:
        # Load audio file with librosa
        y, sr = librosa.load(file_path, sr=None)
        
        # Calculate duration
        duration = librosa.get_duration(y=y, sr=sr)
        
        # Extract basic audio features
        # Pitch/Fundamental frequency
        pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
        pitch_values = []
        for t in range(pitches.shape[1]):
            index = magnitudes[:, t].argmax()
            pitch = pitches[index, t]
            if pitch > 0:
                pitch_values.append(pitch)
        
        avg_pitch = np.mean(pitch_values) if pitch_values else 0
        pitch_range = np.max(pitch_values) - np.min(pitch_values) if pitch_values else 0
        
        # Volume/Energy features
        rms = librosa.feature.rms(y=y)[0]
        avg_volume = np.mean(rms)
        volume_variance = np.var(rms)
        
        # Tempo
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        # Spectral features
        spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        avg_spectral_centroid = np.mean(spectral_centroids)
        
        # Zero crossing rate (indicates speech clarity)
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        avg_zcr = np.mean(zcr)
        
        return {
            "duration": float(duration),
            "sample_rate": int(sr),
            "avg_pitch": float(avg_pitch),
            "pitch_range": float(pitch_range),
            "avg_volume": float(avg_volume),
            "volume_variance": float(volume_variance),
            "tempo": float(tempo),
            "avg_spectral_centroid": float(avg_spectral_centroid),
            "avg_zero_crossing_rate": float(avg_zcr),
            "pitch_stability": float(1 / (1 + volume_variance)) if volume_variance > 0 else 1.0,
            "clarity_score": float(1 - avg_zcr) if avg_zcr < 1 else 0.0
        }
        
    except Exception as e:
        return {
            "error": f"Audio feature extraction failed: {str(e)}",
            "duration": 0,
            "sample_rate": 0,
            "avg_pitch": 0,
            "pitch_range": 0,
            "avg_volume": 0,
            "volume_variance": 0,
            "tempo": 0,
            "avg_spectral_centroid": 0,
            "avg_zero_crossing_rate": 0,
            "pitch_stability": 0,
            "clarity_score": 0
        }

def generate_mock_transcript(duration: float) -> Dict[str, Any]:
    """
    Generate a mock transcript for demonstration
    In a real implementation, this would use speech-to-text API
    """
    return {
        "transcript": "This is a mock transcript of the uploaded audio. In a real implementation, this would use a speech-to-text service like OpenAI Whisper, Google Speech-to-Text, or Azure Cognitive Services to transcribe the actual audio content.",
        "confidence": 0.85,
        "word_count": 28,
        "speaking_rate": 28 / (duration / 60) if duration > 0 else 0,  # words per minute
        "segments": [
            {
                "start": 0.0,
                "end": min(3.0, duration),
                "text": "This is a mock transcript of the uploaded audio.",
                "confidence": 0.9
            },
            {
                "start": 3.0,
                "end": min(8.0, duration),
                "text": "In a real implementation, this would use a speech-to-text service",
                "confidence": 0.8
            }
        ]
    }

def calculate_pitch_analysis_score(audio_features: Dict[str, Any], transcript: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate overall pitch analysis scores and recommendations
    """
    try:
        # Pitch variety score (0-100)
        pitch_variety = min(100, (audio_features.get("pitch_range", 0) / 100) * 100)
        
        # Volume consistency score (0-100)
        volume_consistency = max(0, 100 - (audio_features.get("volume_variance", 0) * 1000))
        
        # Clarity score (0-100)
        clarity = audio_features.get("clarity_score", 0) * 100
        
        # Speaking pace score (0-100) - optimal around 150-160 WPM
        speaking_rate = transcript.get("speaking_rate", 0)
        if 120 <= speaking_rate <= 180:
            pace_score = 100 - abs(speaking_rate - 150) * 2
        else:
            pace_score = max(0, 100 - abs(speaking_rate - 150) * 3)
        
        # Overall score
        overall_score = (pitch_variety + volume_consistency + clarity + pace_score) / 4
        
        # Generate recommendations
        recommendations = []
        if pitch_variety < 50:
            recommendations.append("Try varying your pitch more to keep listeners engaged")
        if volume_consistency < 70:
            recommendations.append("Work on maintaining consistent volume throughout your pitch")
        if clarity < 60:
            recommendations.append("Focus on clear pronunciation and articulation")
        if speaking_rate < 120:
            recommendations.append("Consider speaking a bit faster to maintain energy")
        elif speaking_rate > 180:
            recommendations.append("Try slowing down slightly for better comprehension")
        
        if not recommendations:
            recommendations.append("Great job! Your pitch demonstrates good vocal variety and clarity")
        
        return {
            "overall_score": round(overall_score, 1),
            "pitch_variety": round(pitch_variety, 1),
            "volume_consistency": round(volume_consistency, 1),
            "clarity": round(clarity, 1),
            "pace_score": round(pace_score, 1),
            "recommendations": recommendations,
            "strengths": [
                "Good audio quality" if audio_features.get("avg_volume", 0) > 0.01 else "Clear recording",
                "Appropriate duration" if audio_features.get("duration", 0) > 10 else "Concise delivery"
            ]
        }
        
    except Exception as e:
        return {
            "overall_score": 0,
            "pitch_variety": 0,
            "volume_consistency": 0,
            "clarity": 0,
            "pace_score": 0,
            "recommendations": [f"Analysis error: {str(e)}"],
            "strengths": []
        }

def main():
    """
    Main function to analyze audio file and output JSON
    """
    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Usage: python analyze_audio.py <audio_file_path>",
            "success": False
        }))
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(file_path):
        print(json.dumps({
            "error": f"Audio file not found: {file_path}",
            "success": False
        }))
        sys.exit(1)
    
    try:
        # Get file info
        file_size = os.path.getsize(file_path)
        file_name = os.path.basename(file_path)
        
        # Analyze audio features
        audio_features = analyze_audio_features(file_path)
        
        # Generate transcript (mock for now)
        transcript = generate_mock_transcript(audio_features.get("duration", 0))
        
        # Calculate analysis scores
        analysis_scores = calculate_pitch_analysis_score(audio_features, transcript)
        
        # Prepare result
        result = {
            "success": True,
            "file_info": {
                "name": file_name,
                "size": file_size,
                "path": file_path
            },
            "audio_features": audio_features,
            "transcript": transcript,
            "analysis": analysis_scores,
            "timestamp": "2024-01-01T00:00:00Z"  # In real implementation, use actual timestamp
        }
        
        # Output JSON to stdout
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Analysis failed: {str(e)}",
            "file_info": {
                "name": os.path.basename(file_path) if os.path.exists(file_path) else "unknown",
                "size": 0,
                "path": file_path
            }
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
