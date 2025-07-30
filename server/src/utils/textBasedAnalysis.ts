import OpenAI from 'openai';
import { TextBasedAnalysis, createDefaultTextBasedAnalysis } from './analysisTypes';

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

export async function analyzePitchWithTextBasedAnalysis(pitchText: string): Promise<TextBasedAnalysis> {
  try {
    const openai = getOpenAIClient();

    const prompt = `You are a harsh expert pitch coach. Analyze this pitch to give structured feedback. Be strict and thorough.

PITCH:
"${pitchText}"

Use this structure:
{
  "tone": { "score": 0-100, "description": "...", "suggestions": ["...", "..."] },
  "clarity": { "score": 0-100, "description": "...", "suggestions": ["...", "..."] },
  "jargon": { "count": 0, "examples": ["...", "..."], "severity": "low/medium/high" },
  "structure": { "score": 0-100, "description": "...", "suggestions": ["...", "..."] },
  "persuasiveness": { "score": 0-100, "description": "...", "suggestions": ["...", "..."], "callToAction": { "present": true/false, "strength": "weak/strong", "feedback": "..." } },
  "memorability": { "score": 0-100, "description": "...", "suggestions": ["...", "..."] },
  "credibility": { "score": 0-100, "evidence": ["...", "..."], "weaknesses": ["...", "..."] },
  "audienceFit": { "score": 0-100, "description": "...", "issues": ["...", "..."], "suggestions": ["...", "..."] },
  "originality": { "score": 0-100, "description": "...", "comparisons": ["...", "..."], "suggestions": ["...", "..."] },
  "emotionalImpact": { "score": 0-100, "triggers": ["...", "..."], "notes": "..." },
  "improvedVersion": "...",
  "overallScore": 0-100
}

Criteria:
- Tone: confidence, enthusiasm, professionalism
- Clarity: ease of understanding, clear messaging
- Jargon: complexity, buzzwords, technical terms that may confuse audience
- Structure: logical flow (problem → solution → market → ask)
- Persuasiveness: compelling arguments, credibility, call-to-action strength
- Memorability: how memorable the pitch is
- Credibility: trustworthiness, evidence provided, expertise demonstrated
- AudienceFit: how well tailored to target audience
- Originality: uniqueness, differentiation from competitors
- EmotionalImpact: emotional resonance, storytelling, connection
- ImprovedVersion: rewrite for clarity + impact
- OverallScore: holistic assessment

Respond with JSON only. No extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional pitch coach. Provide detailed, actionable feedback in the exact JSON format requested. Be thorough but concise in your analysis. Always respond with valid JSON only."
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
    let analysis: TextBasedAnalysis;
    try {
      analysis = JSON.parse(jsonString);
      console.log('Text-based analysis response:', analysis);
    } catch (e) {
      throw new Error('Failed to parse OpenAI response. Please try again.');
    }

    // Validate the response structure (basic check)
    const requiredFields = [
      'tone', 'clarity', 'jargon', 'structure', 'persuasiveness',
      'memorability', 'credibility', 'audienceFit', 'originality',
      'emotionalImpact', 'improvedVersion', 'overallScore'
    ];
    const missingFields = requiredFields.filter(field => !Object.prototype.hasOwnProperty.call(analysis, field));
    if (missingFields.length > 0) {
      console.error('Missing fields in OpenAI response:', missingFields);
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
