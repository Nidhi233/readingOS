import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { booksService } from '../services/books.service';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    reading: 0,
    completed: 0,
    wantToRead: 0,
    total: 0,
  });
  const [recentBooks, setRecentBooks] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const allBooks = await booksService.getLibrary();
      
      setStats({
        reading: allBooks.filter(b => b.status === 'reading').length,
        completed: allBooks.filter(b => b.status === 'completed').length,
        wantToRead: allBooks.filter(b => b.status === 'want_to_read').length,
        total: allBooks.length,
      });

      setRecentBooks(allBooks.slice(0, 4));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Reader'}! 📚
          </h1>
          <p className="mt-2 text-gray-600">Here's your reading journey at a glance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Currently Reading"
            value={stats.reading}
            icon="📖"
            color="blue"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon="✅"
            color="green"
          />
          <StatCard
            title="Want to Read"
            value={stats.wantToRead}
            icon="📚"
            color="gray"
          />
          <StatCard
            title="Total Books"
            value={stats.total}
            icon="📊"
            color="purple"
          />
        </div>

        {/* Recent Books */}
        {recentBooks.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Recent Books</h2>
              <Link to="/library" className="text-sm text-blue-600 hover:text-blue-800">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentBooks.map((book) => (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600">{book.author}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/library"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
            >
              <span className="text-2xl mr-3">➕</span>
              <span className="font-medium">Add New Book</span>
            </Link>
            <Link
              to="/library?status=reading"
              className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
            >
              <span className="text-2xl mr-3">📖</span>
              <span className="font-medium">Continue Reading</span>
            </Link>
            <div className="flex items-center p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
              <span className="text-2xl mr-3">💡</span>
              <span className="font-medium">View Insights (Coming Soon)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    gray: 'bg-gray-50 text-gray-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`text-4xl ${colors[color]} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}