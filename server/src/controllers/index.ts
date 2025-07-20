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
      console.warn('OpenAI API key not configured, using mock analysis');
    }

    let analysis;
    let usingMock = false;

    try {
      // Try OpenAI first
      analysis = await analyzePitchWithOpenAI(pitchText);
    } catch (error) {
      console.warn('OpenAI analysis failed, falling back to mock analysis:', error);
      analysis = getMockPitchAnalysis(pitchText);
      usingMock = true;
    }

    res.json({
      success: true,
      data: {
        id: `analysis_${Date.now()}`,
        pitchText,
        analysisType: analysisType || 'general',
        analysis,
        usingMock,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error analyzing pitch:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'OpenAI API key is invalid or expired'
        });
      }
      
      if (error.message.includes('quota')) {
        return res.status(429).json({
          error: 'API quota exceeded',
          message: 'OpenAI API quota has been exceeded'
        });
      }
      
      if (error.message.includes('parse')) {
        return res.status(500).json({
          error: 'Analysis parsing error',
          message: 'Failed to parse analysis results. Please try again.'
        });
      }
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to analyze pitch'
    });
  }
};

// Add more controllers as needed
export default {
  getHealth,
  getApiInfo,
  analyzePitch
};
