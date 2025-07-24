/**
 * Shared types for both text-based and audio-based pitch analysis
 */

export interface Tone {
  score: number; // 0-100
  description: string;
  suggestions: string[];
}

export interface Confidence {
  level: 'low' | 'medium' | 'high';
  evidence: string[];
}

export interface Clarity {
  score: number; // 0-100
  description: string;
  suggestions: string[];
}

export interface FillerWords {
  count: number;
  examples: string[];
}

export interface Jargon {
  count: number;
  examples: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface Structure {
  score: number; // 0-100
  description: string;
  suggestions: string[];
}

export interface CallToAction {
  present: boolean;
  strength: 'weak' | 'strong';
  feedback: string;
}

export interface Persuasiveness {
  score: number; // 0-100
  description: string;
  suggestions: string[];
  callToAction: CallToAction;
}

export interface Engagement {
  score: number; // 0-100
  vocal_variety: 'low' | 'medium' | 'high';
  energy_level: 'low' | 'medium' | 'high';
}

export interface Credibility {
  score: number; // 0-100
  evidence: string[];
  weaknesses: string[];
}

export interface AudienceFit {
  score: number; // 0-100
  description: string;
  issues: string[];
  suggestions: string[];
}

export interface Originality {
  score: number; // 0-100
  description: string;
  comparisons: string[];
  suggestions: string[];
}

export interface EmotionalImpact {
  score: number; // 0-100
  triggers: string[];
  notes: string;
}

export interface AudioBasedAnalysis {
  "tone": Tone;
  "confidence": Confidence;
  "clarity": Clarity;
  "fillerWords": FillerWords;
  "jargon": Jargon;
  "structure": Structure;
  "persuasiveness": Persuasiveness;
  "engagement": Engagement;
  "credibility": Credibility;
  "audienceFit": AudienceFit;
  "originality": Originality;
  "emotionalImpact": EmotionalImpact;
  "improvedVersion": string;
  "overallScore": number;
}

export interface TextBasedAnalysis {
    tone: Tone;
    confidence: Confidence;
    clarity: Clarity;
    fillerWords: FillerWords;
    jargon: Jargon;
    structure: Structure;
    persuasiveness: Persuasiveness;
    engagement: Engagement;
    credibility: Credibility;
    audienceFit: AudienceFit;
    originality: Originality;
    emotionalImpact: EmotionalImpact;
    improvedVersion: string;
    overallScore: number;
}

/**
 * Create a default PitchAnalysis object with optional audio features
 * Useful for error handling and fallback scenarios
 */
/**
 * Create a default analysis object for either 'audio' or 'text' mode
 * @param mode 'audio' | 'text'
 * @param inputText The original input text or transcript
 * @param errorMessage The error message to use in the default object
 */

export function createDefaultAudioBasedAnalysis(
  inputText: string = '',
  errorMessage: string = 'Analysis unavailable'
): AudioBasedAnalysis {
  return {
    tone: {
      score: 0,
      description: errorMessage,
      suggestions: []
    },
    confidence: {
      level: 'medium',
      evidence: [errorMessage]
    },
    clarity: {
      score: 0,
      description: errorMessage,
      suggestions: []
    },
    fillerWords: {
      count: 0,
      examples: []
    },
    jargon: {
      count: 0,
      examples: [],
      severity: 'low'
    },
    structure: {
      score: 0,
      description: errorMessage,
      suggestions: []
    },
    persuasiveness: {
      score: 0,
      description: errorMessage,
      suggestions: [],
      callToAction: {
        present: false,
        strength: 'weak',
        feedback: errorMessage
      }
    },
    engagement: {
      score: 0,
      vocal_variety: 'medium',
      energy_level: 'medium'
    },
    credibility: {
      score: 0,
      evidence: [],
      weaknesses: [errorMessage]
    },
    audienceFit: {
      score: 0,
      description: errorMessage,
      issues: [],
      suggestions: []
    },
    originality: {
      score: 0,
      description: errorMessage,
      comparisons: [],
      suggestions: []
    },
    emotionalImpact: {
      score: 0,
      triggers: [],
      notes: errorMessage
    },
    improvedVersion: inputText,
    overallScore: 0
  };
}

export function createDefaultTextBasedAnalysis(
  inputText: string = '',
  errorMessage: string = 'Analysis unavailable'
): TextBasedAnalysis {
  return {
    tone: {
      score: 0,
      description: errorMessage,
      suggestions: []
    },
    confidence: {
      level: 'medium',
      evidence: [errorMessage]
    },
    clarity: {
      score: 0,
      description: errorMessage,
      suggestions: []
    },
    fillerWords: {
      count: 0,
      examples: []
    },
    jargon: {
      count: 0,
      examples: [],
      severity: 'low'
    },
    structure: {
      score: 0,
      description: errorMessage,
      suggestions: []
    },
    persuasiveness: {
      score: 0,
      description: errorMessage,
      suggestions: [],
      callToAction: {
        present: false,
        strength: 'weak',
        feedback: errorMessage
      }
    },
    engagement: {
      score: 0,
      vocal_variety: 'medium',
      energy_level: 'medium'
    },
    credibility: {
      score: 0,
      evidence: [],
      weaknesses: [errorMessage]
    },
    audienceFit: {
      score: 0,
      description: errorMessage,
      issues: [],
      suggestions: []
    },
    originality: {
      score: 0,
      description: errorMessage,
      comparisons: [],
      suggestions: []
    },
    emotionalImpact: {
      score: 0,
      triggers: [],
      notes: errorMessage
    },
    improvedVersion: inputText,
    overallScore: 0
  };
}
