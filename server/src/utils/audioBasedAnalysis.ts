import OpenAI from 'openai';
import { AudioBasedAnalysis, createDefaultAudioBasedAnalysis } from './analysisTypes';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
};

interface AudioFeatures {
  pitch?: number;
  jitter?: number;
  loudness?: number;
  speech_rate?: number;
  pitch_std?: number;
  pitch_range?: number;
  shimmer?: number;
  hnr?: number;
  spectral_centroid?: number;
  energy_mean?: number;
  voice_quality_score?: number;
}



/**
 * Analyze transcript and audio features using GPT-4
 * @param transcript - The transcribed text from audio
 * @param features - Audio prosodic features extracted from analysis
 * @returns Promise<AudioBasedAnalysisResult> - Structured analysis from GPT-4
 */
export async function analyzeWithAudioBasedAnalysis(
  transcript: string,
  features: AudioFeatures
): Promise<AudioBasedAnalysis> {
  try {
    // Get OpenAI client (lazy initialization)
    const client = getOpenAIClient();
    
    const prompt = `You are a harsh speech and communication coach. Analyze this transcript and audio data to give structured feedback. Be strict and thorough.

TRANSCRIPT:
"${transcript}"

AUDIO FEATURES:
- Mean pitch: ${features.pitch || 0} Hz
- Pitch std: ${features.pitch_std || 0}
- Pitch range: ${features.pitch_range || 0} Hz
- Speech rate: ${features.speech_rate || 0} wpm
- HNR (voice quality): ${features.hnr || 0} dB
- Jitter: ${features.jitter || 0}
- Shimmer: ${features.shimmer || 0}
- Loudness: ${features.loudness || 0} dB
- Energy: ${features.energy_mean || 0}
- Voice score: ${features.voice_quality_score || 0}/100

Use this structure:
{
  "tone": { "score": 0-100, "description": "...", "suggestions": ["...", "..."] },
  "confidence": { "level": "low/medium/high", "evidence": ["...", "..."] },
  "clarity": { "score": 0-100, "description": "...", "suggestions": ["...", "..."] },
  "fillerWords": { "count": 0, "examples": ["...", "..."] },
  "jargon": { "count": 0, "examples": ["...", "..."], "severity": "low/medium/high" },
  "structure": { "score": 0-100, "description": "...", "suggestions": ["...", "..."] },
  "persuasiveness": { "score": 0-100, "description": "...", "suggestions": ["...", "..."], "callToAction": { "present": true/false, "strength": "weak/strong", "feedback": "..." } },
  "engagement": { "score": 0-100, "vocal_variety": "low/medium/high", "energy_level": "low/medium/high" },
  "credibility": { "score": 0-100, "evidence": ["...", "..."], "weaknesses": ["...", "..."] },
  "audienceFit": { "score": 0-100, "description": "...", "issues": ["...", "..."], "suggestions": ["...", "..."] },
  "originality": { "score": 0-100, "description": "...", "comparisons": ["...", "..."], "suggestions": ["...", "..."] },
  "emotionalImpact": { "score": 0-100, "triggers": ["...", "..."], "notes": "..." },
  "improvedVersion": "...",
  "overallScore": 0-100
}

Criteria:
- Tone: confidence, enthusiasm, professionalism
- Confidence: assertiveness, certainty in statements, conviction
- Clarity: ease of understanding, clear messaging
- FillerWords: count and identify filler words/phrases (um, uh, like, you know, etc.)
- Jargon: complexity, buzzwords, technical terms that may confuse audience
- Structure: logical flow (problem → solution → market → ask)
- Persuasiveness: compelling arguments, credibility, call-to-action strength
- Engagement: how captivating and dynamic the pitch is (consider vocal variety and energy from audio)
- Credibility: trustworthiness, evidence provided, expertise demonstrated
- AudienceFit: how well tailored to target audience
- Originality: uniqueness, differentiation from competitors
- EmotionalImpact: emotional resonance, storytelling, connection
- ImprovedVersion: rewrite for clarity + impact
- OverallScore: holistic assessment

Respond with JSON only. No extra text.`;

    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert speech coach and communication analyst. Provide detailed, actionable feedback in the exact JSON format requested. Be thorough but concise in your analysis. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3, // Lower temperature for more consistent analysis
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response received from OpenAI');
    }


    // Extract JSON from the response (in case GPT returns extra text)
    let jsonString = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }


    // Parse the JSON response
    let analysis: AudioBasedAnalysis;
    try {
      analysis = JSON.parse(jsonString);
      console.log('Audio-based analysis response:', analysis);
    } catch (e) {
      return createDefaultAudioBasedAnalysis(transcript, 'Failed to parse OpenAI response. Please try again.');
    }

    // Validate the response structure (basic check)
    const requiredFields = [
      'tone', 'confidence', 'clarity', 'fillerWords', 'jargon', 'structure',
      'persuasiveness', 'engagement', 'credibility', 'audienceFit',
      'originality', 'emotionalImpact', 'improvedVersion', 'overallScore'
    ];
    const missingFields = requiredFields.filter(field => !Object.prototype.hasOwnProperty.call(analysis, field));
    if (missingFields.length > 0) {
      console.error('Missing required fields in OpenAI response:', missingFields);
      return createDefaultAudioBasedAnalysis(transcript, 'Invalid response structure from OpenAI. Missing: ' + missingFields.join(', '));
    }

    return analysis;

  } catch (error) {
    console.error('Audio-based Analysis error:', error);
    
    // Return default analysis structure on error
    return createDefaultAudioBasedAnalysis(transcript, 'Audio-based analysis failed');
  }
}
