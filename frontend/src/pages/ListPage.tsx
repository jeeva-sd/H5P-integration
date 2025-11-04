import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Content {
  id: string;
  title: string;
  mainLibrary: string;
}

function ListPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/content');
      setContents(response.data);
    } catch (error) {
      console.error('Error fetching content:', error);
      alert('Failed to load content list');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      await axios.delete(`http://localhost:3001/api/content/${id}`);
      alert('Content deleted successfully!');
      fetchContents();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  if (loading) {
    return <div className="loading">Loading content...</div>;
  }

  return (
    <div className="list-page">
      <h2>📚 H5P Content Library</h2>
      
      {contents.length === 0 ? (
        <div className="empty-state">
          <p>No content yet. Create your first H5P content!</p>
          <button onClick={() => navigate('/create')} className="btn-primary">
            Create Content
          </button>
        </div>
      ) : (
        <div className="content-grid">
          {contents.map((content) => (
            <div key={content.id} className="content-card">
              <h3>{content.title}</h3>
              <p className="library-name">{content.mainLibrary}</p>
              <div className="card-actions">
                <button 
                  onClick={() => navigate(`/view/${content.id}`)}
                  className="btn-view"
                >
                  👁️ View
                </button>
                <button 
                  onClick={() => handleDelete(content.id)}
                  className="btn-delete"
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

export default ListPage;
