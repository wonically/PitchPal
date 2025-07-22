#!/usr/bin/env python3
"""
Audio Analysis Script for PitchPal
Uses OpenAI Whisper for transcription and pyOpenSMILE for prosodic feature extraction
"""

import sys
import json
import os
import tempfile
import subprocess
import warnings
from pathlib import Path
from typing import Dict, Any, List, Optional

# Suppress warnings to keep stdout clean for JSON output
warnings.filterwarnings("ignore")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'  # Suppress TensorFlow warnings

# Import required libraries
try:
    import whisper
    import opensmile
    import numpy as np
    import librosa
    import soundfile as sf
except ImportError as e:
    print(json.dumps({
        "error": f"Required library not installed: {str(e)}",
        "message": "Please install missing dependencies: pip install openai-whisper opensmile librosa soundfile",
        "success": False
    }))
    sys.exit(1)

def convert_webm_to_wav(input_path: str) -> str:
    """
    Convert WebM file to WAV using subprocess and FFmpeg if available,
    or try to load directly with librosa
    """
    import tempfile
    
    # Try to convert using FFmpeg first
    try:
        # Create temporary WAV file
        temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
        temp_wav.close()
        
        # Try FFmpeg conversion
        result = subprocess.run([
            'ffmpeg', '-i', input_path, '-acodec', 'pcm_s16le', 
            '-ar', '16000', '-ac', '1', '-y', temp_wav.name
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            return temp_wav.name
        else:
            os.unlink(temp_wav.name)
            raise Exception(f"FFmpeg conversion failed: {result.stderr}")
            
    except Exception as e:
        # Fallback: try to load with librosa and save as WAV
        try:
            y, sr = librosa.load(input_path, sr=16000)
            temp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            temp_wav.close()
            sf.write(temp_wav.name, y, sr)
            return temp_wav.name
        except Exception as fallback_error:
            raise Exception(f"Both FFmpeg and librosa conversion failed: {str(e)}, {str(fallback_error)}")

def transcribe_audio_with_whisper(file_path: str) -> Dict[str, Any]:
    """
    Transcribe audio using OpenAI Whisper
    """
    converted_file = None
    try:
        # Convert WebM to WAV if needed
        if file_path.lower().endswith('.webm'):
            try:
                converted_file = convert_webm_to_wav(file_path)
                file_to_process = converted_file
            except Exception as convert_error:
                # Try to process the original file directly
                file_to_process = file_path
                print(f"Warning: WebM conversion failed, trying direct processing: {convert_error}", file=sys.stderr)
        else:
            file_to_process = file_path
        
        # Load Whisper model (base model for balance of speed and accuracy)
        # Suppress all Whisper output by redirecting both stdout and stderr
        import contextlib
        import io
        
        # Capture both stdout and stderr to suppress all Whisper output
        stdout_f = io.StringIO()
        stderr_f = io.StringIO()
        with contextlib.redirect_stdout(stdout_f), contextlib.redirect_stderr(stderr_f):
            model = whisper.load_model("base")
            
            # Transcribe the audio with all output suppressed
            result = model.transcribe(file_to_process, verbose=False)
        
        # Calculate speaking rate
        duration = result.get("duration", 0)
        word_count = len(result["text"].split()) if result["text"] else 0
        speaking_rate = (word_count / duration) * 60 if duration > 0 else 0  # words per minute
        
        # Extract segments with timing
        segments = []
        if "segments" in result:
            for segment in result["segments"]:
                segments.append({
                    "start": round(segment.get("start", 0), 2),
                    "end": round(segment.get("end", 0), 2),
                    "text": segment.get("text", "").strip(),
                    "confidence": round(segment.get("avg_logprob", 0), 3) if "avg_logprob" in segment else None
                })
        
        return {
            "transcript": result["text"].strip(),
            "language": result.get("language", "unknown"),
            "duration": round(duration, 2),
            "word_count": word_count,
            "speaking_rate": round(speaking_rate, 1),
            "segments": segments,
            "confidence": round(np.mean([s.get("avg_logprob", 0) for s in result.get("segments", [])]), 3) if result.get("segments") else None
        }
        
    except Exception as e:
        return {
            "transcript": "",
            "language": "unknown",
            "duration": 0,
            "word_count": 0,
            "speaking_rate": 0,
            "segments": [],
            "confidence": None,
            "error": f"Whisper transcription failed: {str(e)}"
        }
    finally:
        # Clean up converted file if it was created
        if converted_file and os.path.exists(converted_file):
            try:
                os.unlink(converted_file)
            except:
                pass

def extract_prosodic_features_with_opensmile(file_path: str) -> Dict[str, Any]:
    """
    Extract prosodic features using pyOpenSMILE
    """
    converted_file = None
    try:
        # Convert WebM to WAV if needed for OpenSMILE
        if file_path.lower().endswith('.webm'):
            try:
                converted_file = convert_webm_to_wav(file_path)
                file_to_process = converted_file
            except Exception as convert_error:
                # Try to process the original file directly
                file_to_process = file_path
                print(f"Warning: WebM conversion failed for OpenSMILE, trying direct processing: {convert_error}", file=sys.stderr)
        else:
            file_to_process = file_path
        
        # Initialize openSMILE with ComParE feature set (suppress output)
        import contextlib
        import io
        
        f = io.StringIO()
        with contextlib.redirect_stderr(f):
            smile = opensmile.Smile(
                feature_set=opensmile.FeatureSet.ComParE_2016,
                feature_level=opensmile.FeatureLevel.Functionals,
            )
            
            # Extract features
            features = smile.process_file(file_to_process)
        
        # Convert to dict for easier handling
        feature_dict = features.to_dict('records')[0] if not features.empty else {}
        
        # Extract key prosodic features (using correct ComParE_2016 feature names)
        prosodic_features = {
            # Pitch features
            "pitch_mean": feature_dict.get("F0final_sma_amean", 0),
            "pitch_std": feature_dict.get("F0final_sma_stddev", 0),
            "pitch_range": feature_dict.get("F0final_sma_range", 0),
            
            # Jitter (pitch stability)
            "jitter_local": feature_dict.get("jitterLocal_sma_amean", 0),
            "jitter_ddp": feature_dict.get("jitterDDP_sma_amean", 0),
            
            # Loudness features (using RMS energy as proxy since ComParE doesn't have direct loudness)
            "loudness_mean": feature_dict.get("pcm_RMSenergy_sma_amean", 0),
            "loudness_std": feature_dict.get("pcm_RMSenergy_sma_stddev", 0),
            "loudness_range": feature_dict.get("pcm_RMSenergy_sma_range", 0),
            
            # Shimmer (amplitude stability)
            "shimmer_local": feature_dict.get("shimmerLocal_sma_amean", 0),
            
            # Voice quality
            "hnr_mean": feature_dict.get("logHNR_sma_amean", 0),  # Harmonics-to-Noise Ratio
            "spectral_centroid": feature_dict.get("pcm_fftMag_spectralCentroid_sma_amean", 0),
            
            # Temporal features
            "voiced_segments_count": feature_dict.get("voicedSegmentsPerSec", 0),
            
            # Energy features
            "energy_mean": feature_dict.get("pcm_RMSenergy_sma_amean", 0),
            "energy_std": feature_dict.get("pcm_RMSenergy_sma_stddev", 0),
        }
        
        # Calculate derived metrics
        prosodic_features["pitch_variability"] = prosodic_features["pitch_std"] / max(prosodic_features["pitch_mean"], 1)
        prosodic_features["loudness_variability"] = prosodic_features["loudness_std"] / max(abs(prosodic_features["loudness_mean"]), 1)
        # Adjust voice quality score calculation - HNR typically ranges from -20 to +20 dB
        # Map -20 to 0 and +20 to 100, with 0 dB being 50
        prosodic_features["voice_quality_score"] = max(0, min(100, (prosodic_features["hnr_mean"] + 20) * 2.5))
        
        return {
            **prosodic_features,
            "extraction_success": True
        }
        
    except Exception as e:
        # Fallback to basic librosa analysis if openSMILE fails
        try:
            # Use converted file if available, otherwise original
            fallback_file = converted_file if converted_file else file_path
            y, sr = librosa.load(fallback_file, sr=None)
            duration = librosa.get_duration(y=y, sr=sr)
            
            # Basic pitch extraction
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = []
            for t in range(pitches.shape[1]):
                index = magnitudes[:, t].argmax()
                pitch = pitches[index, t]
                if pitch > 0:
                    pitch_values.append(pitch)
            
            # Basic features
            rms = librosa.feature.rms(y=y)[0]
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            
            return {
                "pitch_mean": float(np.mean(pitch_values)) if pitch_values else 0,
                "pitch_std": float(np.std(pitch_values)) if pitch_values else 0,
                "pitch_range": float(np.max(pitch_values) - np.min(pitch_values)) if pitch_values else 0,
                "loudness_mean": float(np.mean(rms)),
                "loudness_std": float(np.std(rms)),
                "energy_mean": float(np.mean(rms)),
                "energy_std": float(np.std(rms)),
                "jitter_local": 0,  # Not available with librosa
                "shimmer_local": 0,  # Not available with librosa
                "hnr_mean": 0,  # Not available with librosa
                "spectral_centroid": float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))),
                "pitch_variability": 0,
                "loudness_variability": float(np.std(rms) / max(np.mean(rms), 0.001)),
                "voice_quality_score": 50,  # Default neutral score
                "extraction_success": False,
                "fallback_method": "librosa",
                "error": f"OpenSMILE extraction failed, used librosa fallback: {str(e)}"
            }
            
        except Exception as fallback_error:
            return {
                "pitch_mean": 0,
                "pitch_std": 0,
                "pitch_range": 0,
                "loudness_mean": 0,
                "loudness_std": 0,
                "energy_mean": 0,
                "energy_std": 0,
                "jitter_local": 0,
                "shimmer_local": 0,
                "hnr_mean": 0,
                "spectral_centroid": 0,
                "pitch_variability": 0,
                "loudness_variability": 0,
                "voice_quality_score": 0,
                "extraction_success": False,
                "error": f"Both OpenSMILE and librosa failed: {str(e)}, {str(fallback_error)}"
            }
    finally:
        # Clean up converted file if it was created
        if converted_file and os.path.exists(converted_file):
            try:
                os.unlink(converted_file)
            except:
                pass

def calculate_speech_rate_from_transcript(transcript_data: Dict[str, Any]) -> float:
    """
    Calculate speech rate from transcript timing data
    """
    try:
        segments = transcript_data.get("segments", [])
        if not segments:
            return transcript_data.get("speaking_rate", 0)
        
        total_speech_time = 0
        total_words = 0
        
        for segment in segments:
            duration = segment.get("end", 0) - segment.get("start", 0)
            words = len(segment.get("text", "").split())
            total_speech_time += duration
            total_words += words
        
        return (total_words / total_speech_time) * 60 if total_speech_time > 0 else 0
        
    except Exception:
        return transcript_data.get("speaking_rate", 0)

def calculate_analysis_scores(features: Dict[str, Any], transcript: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculate overall analysis scores and recommendations based on features and transcript
    """
    try:
        # Pitch variety score (0-100)
        pitch_range = features.get("pitch_range", 0)
        pitch_variability = features.get("pitch_variability", 0)
        pitch_variety = min(100, (pitch_range / 200) * 50 + pitch_variability * 50)
        
        # Voice quality score based on HNR and jitter
        voice_quality = features.get("voice_quality_score", 50)
        jitter = features.get("jitter_local", 0)
        voice_stability = max(0, 100 - (jitter * 1000))  # Lower jitter = better stability
        
        # Volume/loudness consistency
        loudness_variability = features.get("loudness_variability", 0)
        volume_consistency = max(0, 100 - (loudness_variability * 50))
        
        # Speaking rate score
        speaking_rate = transcript.get("speaking_rate", 0)
        if 120 <= speaking_rate <= 180:
            pace_score = 100 - abs(speaking_rate - 150) * 2
        else:
            pace_score = max(0, 100 - abs(speaking_rate - 150) * 3)
        
        # Overall score
        overall_score = (pitch_variety + voice_quality + volume_consistency + pace_score) / 4
        
        # Generate recommendations
        recommendations = []
        if pitch_variety < 60:
            recommendations.append("Try varying your pitch more to add expressiveness and keep listeners engaged")
        if voice_quality < 60:
            recommendations.append("Focus on clear vocal production and minimize voice strain")
        if volume_consistency < 70:
            recommendations.append("Work on maintaining consistent volume throughout your presentation")
        if speaking_rate < 120:
            recommendations.append("Consider speaking a bit faster to maintain energy and engagement")
        elif speaking_rate > 180:
            recommendations.append("Try slowing down slightly for better comprehension and clarity")
        
        if not recommendations:
            recommendations.append("Excellent delivery! Your vocal patterns demonstrate good variety and clarity")
        
        # Identify strengths
        strengths = []
        if pitch_variety > 70:
            strengths.append("Good pitch variation")
        if voice_quality > 70:
            strengths.append("Clear voice quality")
        if volume_consistency > 80:
            strengths.append("Consistent volume control")
        if 130 <= speaking_rate <= 170:
            strengths.append("Appropriate speaking pace")
        
        return {
            "overall_score": round(overall_score, 1),
            "pitch_variety": round(pitch_variety, 1),
            "voice_quality": round(voice_quality, 1),
            "volume_consistency": round(volume_consistency, 1),
            "pace_score": round(pace_score, 1),
            "recommendations": recommendations,
            "strengths": strengths
        }
        
    except Exception as e:
        return {
            "overall_score": 0,
            "pitch_variety": 0,
            "voice_quality": 0,
            "volume_consistency": 0,
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
        
        # Transcribe audio with Whisper
        transcript_data = transcribe_audio_with_whisper(file_path)
        
        # Extract prosodic features with OpenSMILE
        prosodic_features = extract_prosodic_features_with_opensmile(file_path)
        
        # Calculate refined speech rate
        refined_speech_rate = calculate_speech_rate_from_transcript(transcript_data)
        if refined_speech_rate > 0:
            prosodic_features["speech_rate"] = refined_speech_rate
        else:
            prosodic_features["speech_rate"] = transcript_data.get("speaking_rate", 0)
        
        # Calculate analysis scores
        analysis_scores = calculate_analysis_scores(prosodic_features, transcript_data)
        
        # Prepare result in the requested format
        result = {
            "transcript": transcript_data.get("transcript", ""),
            "features": {
                "pitch": prosodic_features.get("pitch_mean", 0),
                "jitter": prosodic_features.get("jitter_local", 0),
                "loudness": prosodic_features.get("loudness_mean", 0),
                "speech_rate": prosodic_features.get("speech_rate", 0),
                # Additional detailed features
                "pitch_std": prosodic_features.get("pitch_std", 0),
                "pitch_range": prosodic_features.get("pitch_range", 0),
                "shimmer": prosodic_features.get("shimmer_local", 0),
                "hnr": prosodic_features.get("hnr_mean", 0),
                "spectral_centroid": prosodic_features.get("spectral_centroid", 0),
                "energy_mean": prosodic_features.get("energy_mean", 0),
                "voice_quality_score": prosodic_features.get("voice_quality_score", 0)
            },
            "analysis": analysis_scores,
            "transcript_details": {
                "language": transcript_data.get("language", "unknown"),
                "duration": transcript_data.get("duration", 0),
                "word_count": transcript_data.get("word_count", 0),
                "confidence": transcript_data.get("confidence", None),
                "segments": transcript_data.get("segments", [])
            },
            "metadata": {
                "file_name": file_name,
                "file_size": file_size,
                "extraction_method": "opensmile" if prosodic_features.get("extraction_success", False) else "librosa_fallback",
                "processing_timestamp": "2024-01-01T00:00:00Z"  # In real implementation, use actual timestamp
            },
            "success": True
        }
        
        # Output JSON to stdout
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "transcript": "",
            "features": {
                "pitch": 0,
                "jitter": 0,
                "loudness": 0,
                "speech_rate": 0
            },
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
