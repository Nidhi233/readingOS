CREATE TABLE IF NOT EXISTS highlights (
    id SERIAL PRIMARY KEY,
    user_book_id INTEGER NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page_number INTEGER,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_highlights_user_book_id ON highlights(user_book_id);