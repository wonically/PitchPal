import express from 'express';
import { getHealth, getApiInfo, analyzePitch } from '../controllers';

const router = express.Router();

// Health check route
router.get('/health', getHealth);

// API info route
router.get('/info', getApiInfo);

// Root pitch analysis route
router.post('/', analyzePitch);

// Pitch analysis route (alternative endpoint)
router.post('/analyze', analyzePitch);

// Test OpenAI connection
router.get('/test-openai', async (req, res) => {
  try {
    const { validateOpenAIKey } = require('../utils/openai');
    const isValid = validateOpenAIKey();
    res.json({
      openaiConfigured: isValid,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'Not set'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check OpenAI configuration' });
  }
});

// Add more routes as needed
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/pitches', pitchRoutes);

export default router;
