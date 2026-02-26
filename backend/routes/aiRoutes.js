import express from 'express';
import {
  improve,
  summary,
  tags,
  improveArticleWithAI,
  generateSummaryEndpoint,
  generateSummaryWithAI
} from '../controllers/aiController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected AI features
router.post('/improve', authMiddleware, improve);
router.post('/tags', authMiddleware, tags);
router.post('/improve-article', authMiddleware, improveArticleWithAI);

// Public summary endpoints (no auth required)
router.post('/summary', summary);
router.post('/generate-summary', generateSummaryEndpoint);
router.post('/generate-summary-ai', generateSummaryWithAI);

export default router;
