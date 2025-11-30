import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import { booksService } from '../services/books.service';
import { aiService } from '../services/ai.service';

export default function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const [editMode, setEditMode] = useState({
    progress: false,
    rating: false,
    review: false,
  });

  const [formData, setFormData] = useState({
    currentPage: 0,
    status: '',
    rating: null,
    review: '',
  });

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      const data = await booksService.getBookDetail(id);
      setBook(data);
      setFormData({
        currentPage: data.current_page || 0,
        status: data.status,
        rating: data.rating,
        review: data.review || '',
      });
    } catch (error) {
      console.error('Failed to load book:', error);
      alert('Book not found');
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (field) => {
    setUpdating(true);
    try {
      const updates = {};
      if (field === 'progress') updates.currentPage = parseInt(formData.currentPage);
      if (field === 'status') updates.status = formData.status;
      if (field === 'rating') updates.rating = formData.rating;
      if (field === 'review') updates.review = formData.review;

      await booksService.updateBook(id, updates);
      await loadBook();
      setEditMode({ ...editMode, [field]: false });
    } catch (error) {
      alert('Failed to update book');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartChat = async () => {
    try {
      const conversation = await aiService.createConversation(
        book.book_id,
        `Discussion: ${book.title}`
      );
      navigate(`/chat/${conversation.id}`);
    } catch (error) {
      alert('Failed to start conversation');
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const progressPercent = book.page_count
    ? Math.min((formData.currentPage / book.page_count) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/library')}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Library
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
            <p className="text-xl text-gray-600">by {book.author}</p>
            {book.genre && (
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {book.genre}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="mb-6 pb-6 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reading Status
            </label>
            {editMode.status ? (
              <div className="flex space-x-2">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="want_to_read">Want to Read</option>
                  <option value="reading">Currently Reading</option>
                  <option value="completed">Completed</option>
                  <option value="dnf">Did Not Finish</option>
                </select>
                <Button onClick={() => handleUpdate('status')} disabled={updating}>
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setEditMode({ ...editMode, status: false })}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-lg capitalize">{book.status.replace('_', ' ')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode({ ...editMode, status: true })}
                >
                  Change
                </Button>
              </div>
            )}
          </div>

          {/* Progress */}
          {book.page_count && (
            <div className="mb-6 pb-6 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reading Progress
              </label>
              {editMode.progress ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={formData.currentPage}
                      onChange={(e) =>
                        setFormData({ ...formData, currentPage: e.target.value })
                      }
                      max={book.page_count}
                      min={0}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="text-gray-600">/ {book.page_count} pages</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleUpdate('progress')} disabled={updating}>
                      Update
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditMode({ ...editMode, progress: false })}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">
                      {formData.currentPage} / {book.page_count} pages
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditMode({ ...editMode, progress: true })}
                    >
                      Update
                    </Button>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{progressPercent.toFixed(0)}% complete</p>
                </div>
              )}
            </div>
          )}

          {/* Rating */}
          <div className="mb-6 pb-6 border-b">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            {editMode.rating ? (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="text-3xl"
                    >
                      {star <= formData.rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => handleUpdate('rating')} disabled={updating}>
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditMode({ ...editMode, rating: false })}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-2xl">
                  {formData.rating ? '⭐'.repeat(formData.rating) : 'Not rated yet'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode({ ...editMode, rating: true })}
                >
                  {formData.rating ? 'Change' : 'Add Rating'}
                </Button>
              </div>
            )}
          </div>

          {/* Review/Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Notes
            </label>
            {editMode.review ? (
              <div className="space-y-2">
                <textarea
                  value={formData.review}
                  onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="What are your thoughts on this book?"
                />
                <div className="flex space-x-2">
                  <Button onClick={() => handleUpdate('review')} disabled={updating}>
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setEditMode({ ...editMode, review: false })}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 whitespace-pre-wrap mb-2">
                  {formData.review || 'No notes yet'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode({ ...editMode, review: true })}
                >
                  {formData.review ? 'Edit' : 'Add Notes'}
                </Button>
              </div>
            )}
          </div>

          {/* AI Chat CTA */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              💬 Discuss this book with AI
            </h3>
            <p className="text-gray-700 mb-4">
              Start a conversation to explore themes, characters, and your thoughts on this book.
            </p>
            <Button onClick={handleStartChat}>Start Discussion</Button>
          </div>
        </div>
      </div>
    </div>
  );
}