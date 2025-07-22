import OpenAI from 'openai';

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

interface AudioBasedAnalysisResult {
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
  structure: {
    score: number;
    issues: string[];
  };
  persuasion: {
    score: number;
    techniques: string[];
    weaknesses: string[];
  };
  engagement: {
    score: number;
    vocal_variety: string;
    energy_level: string;
  };
  improvedVersion: string;
  overallScore: number;
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
): Promise<AudioBasedAnalysisResult> {
  try {
    // Get OpenAI client (lazy initialization)
    const client = getOpenAIClient();
    
    const prompt = `You are a speech and communication coach. Analyze this transcript and audio data to give structured feedback. Be strict and thorough.

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
6. STRUCTURE — Pitch flow and organization
7. PERSUASIVENESS — Convincing techniques and power
8. ENGAGEMENT — Vocal variety and energy
9. IMPROVE — Rewrite for better flow and clarity IN THE SAME LANGUAGE as the input transcript

IMPORTANT: Detect the language of the input transcript and provide the "improvedVersion" in that same language. All other analysis should remain in English.

Respond only with valid JSON:
{
  "tone": {
    "score": 0–100,
    "description": "..."
  },
  "confidence": {
    "level": "low/medium/high",
    "evidence": ["...", "..."]
  },
  "clarity": {
    "score": 0–100,
    "issues": ["...", "..."]
  },
  "fillerWords": {
    "count": number,
    "examples": ["...", "..."]
  },
  "jargon": {
    "count": number,
    "examples": ["...", "..."]
  },
  "structure": {
    "score": 0–100,
    "issues": ["...", "..."]
  },
  "persuasiveness": {
    "score": 0–100,
    "techniques": ["...", "..."],
    "weaknesses": ["...", "..."]
  },
  "engagement": {
    "score": 0–100,
    "vocal_variety": "low/medium/high",
    "energy_level": "low/medium/high"
  },
  "improvedVersion": "...",
  "overallScore": 0–100
}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert speech coach and communication analyst. Provide detailed, actionable feedback in the exact JSON format requested. Be thorough but concise in your analysis. Always respond with valid JSON only. IMPORTANT: The improvedVersion field must be in the same language as the input transcript, while all other fields remain in English."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent analysis
      max_tokens: 2000
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new Error('No response received from GPT-4');
    }

    // Extract JSON from the response (in case GPT returns extra text)
    let jsonString = responseContent;
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    // Parse the JSON response
    const analysis: AudioBasedAnalysisResult = JSON.parse(jsonString);

    // Validate required fields and provide defaults if missing
    const validatedAnalysis: AudioBasedAnalysisResult = {
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
      structure: {
        score: analysis.structure?.score || 0,
        issues: analysis.structure?.issues || []
      },
      persuasion: {
        score: analysis.persuasion?.score || 0,
        techniques: analysis.persuasion?.techniques || [],
        weaknesses: analysis.persuasion?.weaknesses || []
      },
      engagement: {
        score: analysis.engagement?.score || 0,
        vocal_variety: analysis.engagement?.vocal_variety || "medium",
        energy_level: analysis.engagement?.energy_level || "medium"
      },
      improvedVersion: analysis.improvedVersion || transcript,
      overallScore: analysis.overallScore || 0
    };

    return validatedAnalysis;

  } catch (error) {
    console.error('Audio-based Analysis error:', error);
    
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
      structure: {
        score: 0,
        issues: ["Unable to analyze structure due to processing error"]
      },
      persuasion: {
        score: 0,
        techniques: [],
        weaknesses: ["Unable to analyze persuasion due to processing error"]
      },
      engagement: {
        score: 0,
        vocal_variety: "medium",
        energy_level: "medium"
      },
      improvedVersion: transcript,
      overallScore: 0
    };
  }
}
