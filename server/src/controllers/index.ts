import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { analyzePitchWithOpenAI, getMockPitchAnalysis, validateOpenAIKey } from '../utils/openai';
import { analyzeWithGPT } from '../utils/gptAnalysis';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${extension}`);
  }
});

// File filter to accept only .wav, .mp3, and .webm files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/webm'];
  const allowedExtensions = ['.wav', '.mp3', '.webm'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only .wav, .mp3, and .webm files are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Export the upload middleware
export const uploadAudio = upload.single('audio');

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

// Controller for audio file upload and analysis
export const analyzeAudio = async (req: Request, res: Response) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided',
        message: 'Please upload an audio file (.wav, .mp3, or .webm)'
      });
    }

    // Get the uploaded file path
    const savedPath = req.file.path;
    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;

    console.log(`Audio file uploaded: ${originalName} (${fileName}) - ${fileSize} bytes`);

    // Run Python script to analyze the audio
    try {
      const pythonScriptPath = path.join(__dirname, '../../analyze_audio.py');
      
      // Check if Python script exists
      if (!fs.existsSync(pythonScriptPath)) {
        return res.status(500).json({
          error: 'Analysis script not found',
          message: 'Audio analysis script is not available'
        });
      }

      console.log(`Running Python analysis on: ${savedPath}`);
      
      // Spawn Python process
      const pythonProcess = spawn('python3', [pythonScriptPath, savedPath]);
      
      let stdout = '';
      let stderr = '';
      
      // Capture stdout
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      // Capture stderr
      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      // Handle process completion
      pythonProcess.on('close', async (code) => {
        // Helper function to clean up uploaded file
        const cleanupFile = () => {
          fs.unlink(savedPath, (unlinkError) => {
            if (unlinkError) {
              console.error(`Failed to delete uploaded file ${savedPath}:`, unlinkError);
            } else {
              console.log(`Successfully deleted uploaded file: ${savedPath}`);
            }
          });
        };

        if (code !== 0) {
          console.error(`Python script failed with code ${code}`);
          console.error(`stderr: ${stderr}`);
          cleanupFile(); // Clean up file on Python script failure
          return res.status(500).json({
            error: 'Analysis failed',
            message: 'Failed to analyze audio file',
            details: stderr || 'Python script execution failed'
          });
        }
        
        try {
          // Parse the JSON output from Python script
          const analysisResult = JSON.parse(stdout.trim());
          
          if (!analysisResult.success) {
            cleanupFile(); // Clean up file on analysis failure
            return res.status(500).json({
              error: 'Audio analysis failed',
              message: 'Python analysis script returned an error',
              details: analysisResult.error || 'Unknown analysis error'
            });
          }
          
          console.log('Python analysis completed successfully');
          
          // Extract transcript and features for GPT analysis
          const transcript = analysisResult.transcript || '';
          const features = analysisResult.features || {};
          
          let gptAnalysis;
          try {
            // Run GPT analysis on transcript and features
            console.log('Starting GPT analysis...');
            gptAnalysis = await analyzeWithGPT(transcript, features);
            console.log('GPT analysis completed successfully');
          } catch (gptError) {
            console.error('GPT analysis failed:', gptError);
            // Continue with audio analysis results even if GPT fails
            gptAnalysis = {
              tone: { score: 0, description: "GPT analysis unavailable" },
              confidence: { level: "Medium", evidence: ["GPT analysis failed"] },
              clarity: { score: 0, issues: ["GPT analysis unavailable"] },
              fillerWords: { count: 0, examples: [] },
              jargon: { count: 0, examples: [] },
              improvedVersion: transcript,
              overallScore: 0
            };
          }
          
          // Clean up the uploaded file after successful analysis
          cleanupFile();
          
          // Return combined results
          res.json({
            success: true,
            fileInfo: {
              path: savedPath,
              filename: fileName,
              originalName: originalName,
              size: fileSize,
              mimeType: req.file?.mimetype
            },
            audioAnalysis: {
              transcript: analysisResult.transcript,
              features: analysisResult.features,
              analysis: analysisResult.analysis,
              transcript_details: analysisResult.transcript_details,
              metadata: analysisResult.metadata
            },
            gptAnalysis: gptAnalysis,
            overallResults: {
              audioScore: analysisResult.analysis?.overall_score || 0,
              gptScore: gptAnalysis.overallScore || 0,
              combinedScore: Math.round(((analysisResult.analysis?.overall_score || 0) + (gptAnalysis.overallScore || 0)) / 2),
              processingTimestamp: new Date().toISOString()
            }
          });
          
        } catch (parseError) {
          console.error('Failed to parse Python script output:', parseError);
          console.error('stdout:', stdout);
          cleanupFile(); // Clean up file on parsing error
          return res.status(500).json({
            error: 'Analysis parsing failed',
            message: 'Failed to parse analysis results',
            details: 'Invalid JSON output from analysis script'
          });
        }
      });
      
      // Handle process errors
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        // Clean up file on process error
        fs.unlink(savedPath, (unlinkError) => {
          if (unlinkError) {
            console.error(`Failed to delete uploaded file ${savedPath}:`, unlinkError);
          } else {
            console.log(`Successfully deleted uploaded file: ${savedPath}`);
          }
        });
        return res.status(500).json({
          error: 'Analysis process failed',
          message: 'Failed to start audio analysis',
          details: error.message
        });
      });
      
    } catch (scriptError: any) {
      console.error('Error running Python script:', scriptError);
      return res.status(500).json({
        error: 'Script execution failed',
        message: 'Failed to execute audio analysis script',
        details: scriptError.message
      });
    }

  } catch (error: any) {
    console.error('Error processing audio upload:', error);
    
    // Handle multer errors
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: 'Please upload a file smaller than 10MB'
        });
      }
      return res.status(400).json({
        error: 'Upload error',
        message: error.message
      });
    }

    // Handle file filter errors
    if (error.message === 'Only .wav, .mp3, and .webm files are allowed') {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only .wav, .mp3, and .webm files are allowed'
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process audio file'
    });
  }
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
