import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const model = genAI
  ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
  : null;

const stripHelperNotes = (text) =>
  text
    .replace(/\[Professional Note:[^\]]*]/gi, '')
    .replace(/\[AI Suggestion:[^\]]*]/gi, '')
    .trim();

export const improveContent = (content) => {
  if (!content) return '';
  let cleaned = stripHelperNotes(content);
  cleaned = cleaned
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  return cleaned;
};

// Circuit breaker — skip Gemini calls for COOLDOWN_MS after a 429
const COOLDOWN_MS = 60 * 1000; // 60 seconds
let geminiCoolingUntil = 0;

export const generateSummary = async (content) => {
  if (!content) return '';

  const plain = content.replace(/<[^>]+>/g, '').trim();
  if (!plain) return '';

  const now = Date.now();
  if (model && now > geminiCoolingUntil) {
    try {
      const prompt = `Generate a short professional summary (2–3 sentences) for this technical article:\n\n${plain}`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (error) {
      if (error?.status === 429) {
        // Quota exceeded — cool down and fall through to heuristic silently
        geminiCoolingUntil = Date.now() + COOLDOWN_MS;
        console.warn('[AI] Gemini quota exceeded. Using heuristic fallback for 60s.');
      } else {
        console.error('Gemini summary error:', error);
      }
    }
  } else if (model && now <= geminiCoolingUntil) {
    // Still in cooldown — skip silently
  }

  // Fallback: simple heuristic summary (first 3 sentences)
  const normalized = plain.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean);
  const selected = sentences.slice(0, 3);
  const summary = selected.join(' ');
  return summary || normalized.slice(0, 150) + '...';
};

export const generateTags = (content) => {
  if (!content) return ['knowledge', 'learning', 'article'];
  const lower = content.toLowerCase();
  const tags = new Set();

  if (lower.includes('javascript') || lower.includes('react')) tags.add('javascript');
  if (lower.includes('node') || lower.includes('express')) tags.add('node');
  if (lower.includes('mysql') || lower.includes('database')) tags.add('database');
  if (lower.includes('ai') || lower.includes('machine learning')) tags.add('ai');

  if (tags.size === 0) {
    tags.add('general');
  }

  return Array.from(tags);
};

// Future-ready article improvement function.
// This is a MOCK implementation that can be swapped with a real
// OpenAI (or other LLM) integration later without changing callers.
export const improveArticle = async (title, content) => {
  const safeTitle = (title || '').trim();
  const safeContent = stripHelperNotes((content || '').trim());

  // Basic whitespace and formatting cleanup
  const normalizedContent = safeContent
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  // For now, keep the body as a cleaned-up version without helper labels
  const improvedBody = normalizedContent || safeContent;

  let improvedTitle;
  if (safeTitle) {
    // Simple clarity prefix to indicate improvement.
    improvedTitle = safeTitle.startsWith('Improved:')
      ? safeTitle
      : `Improved: ${safeTitle}`;
  } else if (normalizedContent) {
    const plain = normalizedContent.replace(/<[^>]+>/g, '');
    const snippet = plain.split('\n')[0].slice(0, 60).trim();
    improvedTitle = `Improved: ${snippet || 'Refined Knowledge Article'}`;
  } else {
    improvedTitle = 'Improved: Refined Knowledge Article';
  }

  return {
    improvedTitle,
    improvedContent: improvedBody
  };
};
