import { improveContent, generateSummary, generateTags, improveArticle } from '../services/aiService.js';

export const improve = (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }
  const improved = improveContent(content);
  return res.json({ improvedContent: improved });
};

export const summary = async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }
  try {
    const summaryText = await generateSummary(content);
    return res.json({ summary: summaryText });
  } catch (error) {
    console.error('Summary AI error:', error);
    return res.status(500).json({ message: 'Failed to generate summary' });
  }
};

export const tags = (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }
  const tagsList = generateTags(content);
  return res.json({ tags: tagsList });
};

export const improveArticleWithAI = async (req, res) => {
  const { title, content } = req.body || {};

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const result = await improveArticle(title, content);
    return res.json(result);
  } catch (error) {
    console.error('Improve article AI error:', error);
    return res.status(500).json({ message: 'Failed to improve article with AI' });
  }
};

// Duplicate endpoint name for clarity: /api/ai/generate-summary
export const generateSummaryEndpoint = async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const summaryText = await generateSummary(content);
    return res.json({ summary: summaryText });
  } catch (error) {
    console.error('Generate-summary AI error:', error);
    return res.status(500).json({ message: 'Failed to generate summary' });
  }
};

export const generateSummaryWithAI = generateSummaryEndpoint;
