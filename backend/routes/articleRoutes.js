import express from 'express';
import {
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  getMyArticles
} from '../controllers/articleController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getArticles);
router.get('/my', authMiddleware, getMyArticles);
router.get('/:id', getArticleById);
router.post('/', authMiddleware, createArticle);
router.put('/:id', authMiddleware, updateArticle);
router.delete('/:id', authMiddleware, deleteArticle);

export default router;
