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

export interface PitchAnalysis {
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
  improvedVersion: string;
  overallScore: number;
}

export async function analyzePitchWithOpenAI(pitchText: string): Promise<PitchAnalysis> {
  try {
    const openai = getOpenAIClient();

    const prompt = `
You are an expert pitch analyst. Analyze the following pitch and respond in **valid JSON** only.

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
  "improvedVersion": "...",
  "overallScore": 0-100
}

Criteria:
- Tone: confidence, enthusiasm, professionalism
- Clarity: ease of understanding
- Jargon: complexity, buzzwords
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
    const analysis: PitchAnalysis = JSON.parse(content);
    
    // Validate the response structure
    if (!analysis.tone || !analysis.clarity || !analysis.jargonCount || !analysis.improvedVersion) {
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

// Fallback function for when OpenAI is not available
export function getMockPitchAnalysis(pitchText: string): PitchAnalysis {
  // Simple analysis based on text characteristics
  const wordCount = pitchText.split(' ').length;
  const sentences = pitchText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const avgWordsPerSentence = wordCount / sentences;
  
  // Detect common jargon terms
  const jargonTerms = [
    'revolutionary', 'disruptive', 'cutting-edge', 'paradigm shift', 'synergy',
    'leverage', 'optimize', 'unprecedented', 'AI-powered', 'machine learning',
    'blockchain', 'IoT', 'Big Data', 'scalable', 'innovative', 'game-changing'
  ];
  
  const foundJargon = jargonTerms.filter(term => 
    pitchText.toLowerCase().includes(term.toLowerCase())
  );

  // Calculate scores
  const clarityScore = avgWordsPerSentence > 20 ? 5 : avgWordsPerSentence > 15 ? 7 : 9;
  const toneScore = pitchText.includes('!') ? 8 : 6;
  const jargonSeverity = foundJargon.length > 3 ? 'high' : foundJargon.length > 1 ? 'medium' : 'low';
  const overallScore = Math.round((clarityScore + toneScore + (10 - foundJargon.length)) * 3.33);

  return {
    tone: {
      score: toneScore,
      description: toneScore > 7 ? "Enthusiastic and confident" : "Professional but could be more engaging",
      suggestions: [
        "Add more emotional appeal to connect with investors",
        "Use stronger action words to convey confidence"
      ]
    },
    clarity: {
      score: clarityScore,
      description: clarityScore > 7 ? "Clear and easy to understand" : "Could be clearer and more concise",
      suggestions: [
        "Break down complex sentences into simpler ones",
        "Focus on one key benefit per sentence"
      ]
    },
    jargonCount: {
      count: foundJargon.length,
      examples: foundJargon.slice(0, 3),
      severity: jargonSeverity
    },
    improvedVersion: pitchText.replace(/revolutionary|disruptive|cutting-edge/gi, 'innovative')
      .replace(/leverage/gi, 'use')
      .replace(/optimize/gi, 'improve')
      .replace(/unprecedented/gi, 'significant'),
    overallScore: Math.min(overallScore, 100)
  };
}

// Helper function to validate OpenAI API key
export function validateOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
}
