import { Request, Response } from 'express';

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

// Add more controllers as needed
export default {
  getHealth,
  getApiInfo
};
