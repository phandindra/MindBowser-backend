import { query } from '../models/db.js';
import { generateSummary } from '../services/aiService.js';

export const createArticle = async (req, res) => {
  const { title, content, summary, category, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }

  try {
    // Auto-generate summary if not provided
    let finalSummary = summary || '';
    if (!finalSummary) {
      try {
        finalSummary = await generateSummary(content);
      } catch (err) {
        console.error('Auto-summary generation failed, proceeding without it:', err);
      }
    }

    const [result] = await query(
      'INSERT INTO articles (title, content, summary, category, tags, author_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, finalSummary || '', category || '', tags || '', req.user.id]
    );

    return res.status(201).json({
      id: result.insertId,
      title,
      content,
      summary: finalSummary || '',
      category: category || '',
      tags: tags || '',
      author_id: req.user.id
    });
  } catch (error) {
    console.error('Create article error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getArticles = async (req, res) => {
  const { search, category } = req.query;

  try {
    let sql =
      'SELECT a.*, u.username AS author_name FROM articles a JOIN users u ON a.author_id = u.id WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (a.title LIKE ? OR a.content LIKE ? OR a.summary LIKE ?)';
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    if (category) {
      sql += ' AND a.category = ?';
      params.push(category);
    }

    sql += ' ORDER BY a.created_at DESC';

    const [rows] = await query(sql, params);
    return res.json(rows);
  } catch (error) {
    console.error('Get articles error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getArticleById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await query(
      'SELECT a.*, u.username AS author_name FROM articles a JOIN users u ON a.author_id = u.id WHERE a.id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Get article by id error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateArticle = async (req, res) => {
  const { id } = req.params;
  const { title, content, summary, category, tags } = req.body;

  try {
    const [rows] = await query('SELECT * FROM articles WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const article = rows[0];
    if (article.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this article' });
    }

    const updatedTitle = title ?? article.title;
    const updatedContent = content ?? article.content;
    let updatedSummary = summary ?? article.summary;

    // If content changed and no explicit summary provided, regenerate summary
    if (!summary && content && content !== article.content) {
      try {
        updatedSummary = await generateSummary(content);
      } catch (err) {
        console.error('Auto-summary regeneration failed, keeping old summary:', err);
      }
    }

    const updatedCategory = category ?? article.category;
    const updatedTags = tags ?? article.tags;

    await query(
      'UPDATE articles SET title = ?, content = ?, summary = ?, category = ?, tags = ? WHERE id = ?',
      [updatedTitle, updatedContent, updatedSummary, updatedCategory, updatedTags, id]
    );

    return res.json({
      id: Number(id),
      title: updatedTitle,
      content: updatedContent,
      summary: updatedSummary,
      category: updatedCategory,
      tags: updatedTags,
      author_id: req.user.id
    });
  } catch (error) {
    console.error('Update article error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteArticle = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await query('SELECT * FROM articles WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const article = rows[0];
    if (article.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this article' });
    }

    await query('DELETE FROM articles WHERE id = ?', [id]);

    return res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyArticles = async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT a.*, u.username AS author_name FROM articles a JOIN users u ON a.author_id = u.id WHERE a.author_id = ? ORDER BY a.created_at DESC',
      [req.user.id]
    );
    return res.json(rows);
  } catch (error) {
    console.error('Get my articles error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
