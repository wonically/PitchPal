import OpenAI from 'openai';
import { TextBasedAnalysis, createDefaultTextBasedAnalysis } from './analysisTypes';

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

export async function analyzePitchWithTextBasedAnalysis(pitchText: string): Promise<TextBasedAnalysis> {
  try {
    const openai = getOpenAIClient();

    const prompt = `You are a harsh expert pitch analyst. Analyze the following pitch and respond in **valid JSON** only. Be strict and thorough.

Pitch:
"${pitchText}"

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
- Engagement: how captivating and dynamic the pitch is
- Credibility: trustworthiness, evidence provided, expertise demonstrated
- AudienceFit: how well tailored to target audience
- Originality: uniqueness, differentiation from competitors
- EmotionalImpact: emotional resonance, storytelling, connection
- ImprovedVersion: rewrite for clarity + impact IN THE SAME LANGUAGE as the input pitch
- OverallScore: holistic assessment

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
    let analysis: TextBasedAnalysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      throw new Error('Failed to parse OpenAI response. Please try again.');
    }

    // Validate the response structure (basic check)
    if (!analysis.tone || !analysis.confidence || !analysis.clarity || !analysis.fillerWords || !analysis.jargon || !analysis.structure || !analysis.persuasiveness || !analysis.engagement || !analysis.credibility || !analysis.audienceFit || !analysis.originality || !analysis.emotionalImpact || !analysis.improvedVersion) {
      return createDefaultTextBasedAnalysis(pitchText, 'Invalid response structure from OpenAI');
    }

    return analysis;

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    // Return a fallback analysis if OpenAI fails
    return createDefaultTextBasedAnalysis(pitchText, 'Text-based analysis failed');
  }
}

// Helper function to validate OpenAI API key
export function validateOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-');
}
