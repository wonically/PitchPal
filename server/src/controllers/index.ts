import { Request, Response } from 'express';
import { analyzePitchWithOpenAI, getMockPitchAnalysis, validateOpenAIKey } from '../utils/openai';

// Example controller for health checks
export const getHealth = (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'PitchPal API'
  });
};

// Example controller for API info
export const getApiInfo = (req: Request, res: Response) => {
  res.json({
    name: 'PitchPal API',
    version: '1.0.0',
    description: 'Backend API for PitchPal application'
  });
};

// Controller for pitch analysis
export const analyzePitch = async (req: Request, res: Response) => {
  try {
    const { pitchText, analysisType } = req.body;
    
    // Validate required fields
    if (!pitchText) {
      return res.status(400).json({
        error: 'Pitch text is required',
        message: 'Please provide pitch text to analyze'
      });
    }

    // Validate pitch text length
    if (pitchText.length < 10) {
      return res.status(400).json({
        error: 'Pitch text too short',
        message: 'Please provide at least 10 characters of pitch text'
      });
    }

    if (pitchText.length > 2000) {
      return res.status(400).json({
        error: 'Pitch text too long',
        message: 'Please limit pitch text to 2000 characters or less'
      });
    }

    // Validate OpenAI API key
    if (!validateOpenAIKey()) {
      return res.status(500).json({
        error: 'Service temporarily unavailable',
        message: 'AI analysis service is not properly configured. Please contact support.',
        details: 'OpenAI API key not configured'
      });
    }

    try {
      // Try OpenAI analysis
      const analysis = await analyzePitchWithOpenAI(pitchText);
      
      res.json({
        success: true,
        data: {
          id: `analysis_${Date.now()}`,
          pitchText,
          analysisType: analysisType || 'general',
          analysis,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error: any) {
      console.error('OpenAI analysis failed:', error);
      
      // Handle specific OpenAI errors with appropriate messages
      if (error.status === 429 || error.message?.includes('quota')) {
        return res.status(429).json({
          error: 'Service temporarily unavailable',
          message: 'We are currently experiencing high demand. Our AI analysis service has reached its usage limit. Please try again later or contact support for assistance.',
          details: 'OpenAI API quota exceeded'
        });
      }
      
      if (error.status === 401 || error.message?.includes('API key')) {
        return res.status(500).json({
          error: 'Service configuration error',
          message: 'There is an issue with our AI service configuration. Please contact support.',
          details: 'Invalid or expired OpenAI API key'
        });
      }
      
      if (error.status === 404 || error.message?.includes('model')) {
        return res.status(500).json({
          error: 'Service temporarily unavailable',
          message: 'The AI model we use is currently unavailable. Please try again later or contact support.',
          details: 'OpenAI model not accessible'
        });
      }
      
      // Generic OpenAI service error
      return res.status(503).json({
        error: 'AI service unavailable',
        message: 'Our AI analysis service is temporarily unavailable. Please try again in a few minutes.',
        details: 'OpenAI service error'
      });
    }
  } catch (error) {
    // Fallback for any unexpected errors
    console.error('Unexpected error in analyzePitch:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
};

// Add more controllers as needed
export default {
  getHealth,
  getApiInfo,
  analyzePitch
};
