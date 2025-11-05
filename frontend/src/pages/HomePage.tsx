import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentService, type IContentListEntry } from '../services/ContentService';

export default function HomePage() {
  const [content, setContent] = useState<IContentListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    setError(null);
    try {
      // API now returns array directly, not wrapped in { content: [] }
      const data = await contentService.list();
      setContent(data);
    } catch (err: any) {
      console.error('Error loading content:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      await contentService.delete(contentId);
      alert('Content deleted successfully!');
      loadContent();
    } catch (err: any) {
      console.error('Error deleting content:', err);
      alert(`Failed to delete content: ${err.message}`);
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

      {error && (
        <div className="error-message">
          <strong>❌ Error:</strong> {error}
          <button className="btn btn-secondary" onClick={loadContent}>
            🔄 Retry
          </button>
        </div>
      )}

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
                <span className="library-badge">{item.mainLibrary || 'Unknown'}</span>
              </div>
              <div className="content-meta">
                <small>ID: {item.contentId}</small>
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
