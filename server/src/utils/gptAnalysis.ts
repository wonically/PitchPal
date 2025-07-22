import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

interface GPTAnalysisResult {
  tone: {
    score: number;
    description: string;
  };
  confidence: {
    level: string;
    evidence: string[];
  };
  clarity: {
    score: number;
    issues: string[];
  };
  fillerWords: {
    count: number;
    examples: string[];
  };
  jargon: {
    count: number;
    examples: string[];
  };
  improvedVersion: string;
  overallScore: number;
}

/**
 * Analyze transcript and audio features using GPT-4
 * @param transcript - The transcribed text from audio
 * @param features - Audio prosodic features extracted from analysis
 * @returns Promise<GPTAnalysisResult> - Structured analysis from GPT-4
 */
export async function analyzeWithGPT(
  transcript: string,
  features: AudioFeatures
): Promise<GPTAnalysisResult> {
  try {
    const prompt = `You are a speech and communication coach. Analyze this transcript and audio data to give structured feedback.

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

ANALYZE:
1. TONE — Style and emotional tone  
2. CONFIDENCE — Based on voice and content  
3. CLARITY — From both audio and wording  
4. FILLERS — Count and list filler words  
5. JARGON — List technical or complex terms  
6. IMPROVE — Rewrite for better flow and clarity

Respond only with valid JSON:
{
  "tone": {
    "score": <0–100>,
    "description": "<tone summary>"
  },
  "confidence": {
    "level": "<Low/Medium/High>",
    "evidence": ["<example 1>", "<example 2>"]
  },
  "clarity": {
    "score": <0–100>,
    "issues": ["<issue 1>", "<issue 2>"]
  },
  "fillerWords": {
    "count": <number>,
    "examples": ["<example 1>", "<example 2>"]
  },
  "jargon": {
    "count": <number>,
    "examples": ["<term 1>", "<term 2>"]
  },
  "improvedVersion": "<rewritten transcript>",
  "overallScore": <0–100>
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert speech coach and communication analyst. Provide detailed, actionable feedback in the exact JSON format requested. Be thorough but concise in your analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response received from GPT-4');
    }

    // Parse the JSON response
    const analysis: GPTAnalysisResult = JSON.parse(responseContent);

    // Validate required fields and provide defaults if missing
    const validatedAnalysis: GPTAnalysisResult = {
      tone: {
        score: analysis.tone?.score || 0,
        description: analysis.tone?.description || "Analysis unavailable"
      },
      confidence: {
        level: analysis.confidence?.level || "Medium",
        evidence: analysis.confidence?.evidence || []
      },
      clarity: {
        score: analysis.clarity?.score || 0,
        issues: analysis.clarity?.issues || []
      },
      fillerWords: {
        count: analysis.fillerWords?.count || 0,
        examples: analysis.fillerWords?.examples || []
      },
      jargon: {
        count: analysis.jargon?.count || 0,
        examples: analysis.jargon?.examples || []
      },
      improvedVersion: analysis.improvedVersion || transcript,
      overallScore: analysis.overallScore || 0
    };

    return validatedAnalysis;

  } catch (error) {
    console.error('GPT Analysis error:', error);
    
    // Return default analysis structure on error
    return {
      tone: {
        score: 0,
        description: "Analysis failed - unable to assess tone"
      },
      confidence: {
        level: "Medium",
        evidence: ["Analysis error occurred"]
      },
      clarity: {
        score: 0,
        issues: ["Unable to analyze clarity due to processing error"]
      },
      fillerWords: {
        count: 0,
        examples: []
      },
      jargon: {
        count: 0,
        examples: []
      },
      improvedVersion: transcript,
      overallScore: 0
    };
  }
}
