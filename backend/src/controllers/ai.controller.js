const pool = require('../config/database');
const { createChatCompletion, buildBookSystemPrompt } = require('../services/ai.service');

// Get all conversations for a user
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT c.*, b.title as book_title, b.author as book_author
       FROM ai_conversations c
       JOIN books b ON c.book_id = b.id
       WHERE c.user_id = $1
       ORDER BY c.last_message_at DESC`,
      [userId]
    );

    res.json({ conversations: result.rows });
  } catch (error) {
    next(error);
  }
};

// Create new conversation
const createConversation = async (req, res, next) => {
  try {
    const { bookId, title } = req.body;
    const userId = req.user.userId;

    // Verify user owns this book
    const bookCheck = await pool.query(
      'SELECT * FROM user_books WHERE user_id = $1 AND book_id = $2',
      [userId, bookId]
    );

    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found in your library' });
    }

    const result = await pool.query(
      `INSERT INTO ai_conversations (user_id, book_id, title)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, bookId, title || 'New Conversation']
    );

    res.status(201).json({
      message: 'Conversation created',
      conversation: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get conversation with messages
const getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const conversation = await pool.query(
      `SELECT c.*, b.title as book_title, b.author as book_author
       FROM ai_conversations c
       JOIN books b ON c.book_id = b.id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (conversation.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await pool.query(
      'SELECT * FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      conversation: conversation.rows[0],
      messages: messages.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Send message in conversation
const sendMessage = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Get conversation and verify ownership
    const conversation = await client.query(
      `SELECT c.*, b.title, b.author, b.genre, b.page_count, b.description,
              ub.current_page, ub.status, ub.rating, ub.review
       FROM ai_conversations c
       JOIN books b ON c.book_id = b.id
       JOIN user_books ub ON ub.book_id = b.id AND ub.user_id = c.user_id
       WHERE c.id = $1 AND c.user_id = $2`,
      [id, userId]
    );

    if (conversation.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const convData = conversation.rows[0];

    // Get conversation history (last 10 messages for context)
    const history = await client.query(
      'SELECT role, content FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 10',
      [id]
    );

    const messages = history.rows.reverse().map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Add user's new message
    messages.push({ role: 'user', content });

    // Build system prompt with book context
    const systemPrompt = buildBookSystemPrompt(
      {
        title: convData.title,
        author: convData.author,
        genre: convData.genre,
        description: convData.description,
        pageCount: convData.page_count,
      },
      {
        currentPage: convData.current_page,
        status: convData.status,
        rating: convData.rating,
        review: convData.review,
      }
    );

    // Get AI response
    const aiResponse = await createChatCompletion(messages, systemPrompt);

    // Save user message
    await client.query(
      'INSERT INTO conversation_messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [id, 'user', content]
    );

    // Save AI response
    await client.query(
      'INSERT INTO conversation_messages (conversation_id, role, content) VALUES ($1, $2, $3)',
      [id, 'assistant', aiResponse]
    );

    // Update conversation last_message_at
    await client.query(
      'UPDATE ai_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Message sent',
      response: aiResponse,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// Delete conversation
const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  createConversation,
  getConversation,
  sendMessage,
  deleteConversation,
};