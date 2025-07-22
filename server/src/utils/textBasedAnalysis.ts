import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface TextBasedAnalysis {
  tone: {
    score: number;
    description: string;
    suggestions: string[];
  };
  clarity: {
    score: number;
    description: string;
    suggestions: string[];
  };
  jargonCount: {
    count: number;
    examples: string[];
    severity: 'low' | 'medium' | 'high';
  };
  structure: {
    score: number;
    description: string;
    suggestions: string[];
  };
  persuasiveness: {
    score: number;
    description: string;
    suggestions: string[];
  };
  memorability: {
    score: number;
    description: string;
    suggestions: string[];
  };
  improvedVersion: string;
  overallScore: number;
}

export async function analyzePitchWithTextBasedAnalysis(pitchText: string): Promise<TextBasedAnalysis> {
  try {
    const openai = getOpenAIClient();

    const prompt = `
You are an expert pitch analyst. Analyze the following pitch and respond in **valid JSON** only. Be strict and thorough.

Pitch:
"${pitchText}"

Use this structure:
{
  "tone": {
    "score": 0-100,
    "description": "...",
    "suggestions": ["...", "..."]
  },
  "clarity": {
    "score": 0-100,
    "description": "...",
    "suggestions": ["...", "..."]
  },
  "jargonCount": {
    "count": number,
    "examples": ["...", "..."],
    "severity": "low/medium/high"
  },
  "structure": {
    "score": 0-100,
    "description": "...",
    "suggestions": ["...", "..."]
  },
  "persuasiveness": {
    "score": 0-100,
    "description": "...",
    "suggestions": ["...", "..."]
  },
  "memorability": {
    "score": 0-100,
    "description": "...",
    "suggestions": ["...", "..."]
  },
  "improvedVersion": "...",
  "overallScore": 0-100
}

Criteria:
- Tone: confidence, enthusiasm, professionalism
- Clarity: ease of understanding
- Jargon: complexity, buzzwords
- Structure: logical flow (problem → solution → market → ask)
- Persuasiveness: compelling arguments, credibility, call-to-action
- Memorability: hooks, storytelling, unique elements
- Rewrite: clarity + impact IN THE SAME LANGUAGE as the input pitch
- Overall: holistic score

IMPORTANT: Detect the language of the input pitch and provide the "improvedVersion" in that same language. All other analysis should remain in English.

Respond with JSON only. No extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional pitch analyst. Respond only with valid JSON containing the pitch analysis. IMPORTANT: The improvedVersion field must be in the same language as the input pitch, while all other fields remain in English."
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

    // Parse the JSON response
    const analysis: TextBasedAnalysis = JSON.parse(content);
    
    // Validate the response structure
    if (!analysis.tone || !analysis.clarity || !analysis.jargonCount || !analysis.structure || !analysis.persuasiveness || !analysis.memorability || !analysis.improvedVersion) {
      throw new Error('Invalid response structure from OpenAI');
    }

    return analysis;

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Return a fallback analysis if OpenAI fails
    if (error instanceof Error && error.message.includes('JSON')) {
      throw new Error('Failed to parse OpenAI response. Please try again.');
    }
    
    throw error; // Re-throw to be handled by the controller
  }
}

// Helper function to validate OpenAI API key
export function validateOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
}
