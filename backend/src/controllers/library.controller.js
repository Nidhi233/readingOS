const pool = require('../config/database');

// Get user's library
const getLibrary = async (req, res, next) => {
  try {
    const { status } = req.query; // Filter by status: reading, completed, etc.
    const userId = req.user.userId;

    let query = `
      SELECT ub.*, b.title, b.author, b.page_count, b.cover_url, b.genre
      FROM user_books ub
      JOIN books b ON ub.book_id = b.id
      WHERE ub.user_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ' AND ub.status = $2';
      params.push(status);
    }

    query += ' ORDER BY ub.updated_at DESC';

    const result = await pool.query(query, params);
    res.json({ books: result.rows });
  } catch (error) {
    next(error);
  }
};

// Add book to library
const addBookToLibrary = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { title, author, pageCount, coverUrl, status } = req.body;
    const userId = req.user.userId;

    // First, create or find the book
    let bookResult = await client.query(
      'SELECT id FROM books WHERE title = $1 AND author = $2',
      [title, author]
    );

    let bookId;
    if (bookResult.rows.length > 0) {
      bookId = bookResult.rows[0].id;
    } else {
      const newBook = await client.query(
        'INSERT INTO books (title, author, page_count, cover_url) VALUES ($1, $2, $3, $4) RETURNING id',
        [title, author, pageCount || null, coverUrl || null]
      );
      bookId = newBook.rows[0].id;
    }

    // Add to user's library
    const userBookResult = await client.query(
      `INSERT INTO user_books (user_id, book_id, status, start_date) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, book_id) DO NOTHING
       RETURNING *`,
      [userId, bookId, status || 'want_to_read', status === 'reading' ? new Date() : null]
    );

    if (userBookResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Book already in library' });
    }

    await client.query('COMMIT');

    // Fetch complete book data
    const completeBook = await pool.query(
      `SELECT ub.*, b.title, b.author, b.page_count, b.cover_url, b.genre
       FROM user_books ub
       JOIN books b ON ub.book_id = b.id
       WHERE ub.id = $1`,
      [userBookResult.rows[0].id]
    );

    res.status(201).json({
      message: 'Book added to library',
      book: completeBook.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// Update book progress/status
const updateBookProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentPage, status, rating, review } = req.body;
    const userId = req.user.userId;

    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (currentPage !== undefined) {
      updateFields.push(`current_page = $${paramIndex++}`);
      params.push(currentPage);
    }

    if (status) {
      updateFields.push(`status = $${paramIndex++}`);
      params.push(status);

      // Set dates based on status
      if (status === 'reading') {
        updateFields.push(`start_date = COALESCE(start_date, $${paramIndex++})`);
        params.push(new Date());
      } else if (status === 'completed' || status === 'dnf') {
        updateFields.push(`finish_date = $${paramIndex++}`);
        params.push(new Date());
      }
    }

    if (rating !== undefined) {
      updateFields.push(`rating = $${paramIndex++}`);
      params.push(rating);
    }

    if (review !== undefined) {
      updateFields.push(`review = $${paramIndex++}`);
      params.push(review);
    }

    updateFields.push(`updated_at = $${paramIndex++}`);
    params.push(new Date());

    // Add WHERE clause parameters
    const whereParamIndex = paramIndex;
    params.push(id);
    params.push(userId);

    const result = await pool.query(
      `UPDATE user_books 
       SET ${updateFields.join(', ')}
       WHERE id = $${whereParamIndex} AND user_id = $${whereParamIndex + 1}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found in library' });
    }

    res.json({
      message: 'Book updated successfully',
      book: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get single book details
const getBookDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT ub.*, b.title, b.author, b.page_count, b.cover_url, b.genre, b.description
       FROM user_books ub
       JOIN books b ON ub.book_id = b.id
       WHERE ub.id = $1 AND ub.user_id = $2`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ book: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Delete book from library
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      'DELETE FROM user_books WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({ message: 'Book removed from library' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLibrary,
  addBookToLibrary,
  updateBookProgress,
  getBookDetail,
  deleteBook,
};