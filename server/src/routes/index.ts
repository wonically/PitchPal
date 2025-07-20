import express from 'express';
import { getHealth, getApiInfo } from '../controllers';

const router = express.Router();

// Health check route
router.get('/health', getHealth);

// API info route
router.get('/info', getApiInfo);

// Add more routes as needed
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/pitches', pitchRoutes);

export default router;
