import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:4000';

interface ContentItem {
  contentId: string;
  title: string;
  mainLibrary: string;
  createdAt: string;
}

export default function HomePage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/content`);
      const data = await response.json();
      setContent(data.content || []);
    } catch (error) {
      console.error('Error loading content:', error);
      alert('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      await fetch(`${API_URL}/api/content/${contentId}`, {
        method: 'DELETE',
      });
      alert('Content deleted successfully!');
      loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  return (
    <div className="content-list">
      <div className="header">
        <h2>📚 My H5P Content</h2>
        <button className="btn btn-primary" onClick={() => navigate('/create')}>
          ➕ Create New Content
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading content...</p>
        </div>
      ) : content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No Content Yet</h3>
          <p>Create your first interactive H5P content to get started!</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/create')}>
            ➕ Create Your First Content
          </button>
        </div>
      ) : (
        <div className="content-grid">
          {content.map((item) => (
            <div key={item.contentId} className="content-card">
              <div className="content-header">
                <h3>{item.title}</h3>
                <span className="library-badge">{item.mainLibrary}</span>
              </div>
              <div className="content-meta">
                <small>📅 {new Date(item.createdAt).toLocaleDateString()}</small>
              </div>
              <div className="content-actions">
                <button
                  className="btn btn-play"
                  onClick={() => navigate(`/play/${item.contentId}`)}
                  title="Play this content"
                >
                  ▶️ Play
                </button>
                <button
                  className="btn btn-edit"
                  onClick={() => navigate(`/edit/${item.contentId}`)}
                  title="Edit this content"
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-delete"
                  onClick={() => handleDelete(item.contentId, item.title)}
                  title="Delete this content"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
