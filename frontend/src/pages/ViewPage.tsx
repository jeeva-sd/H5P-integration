import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ViewPage() {
  const { id } = useParams<{ id: string }>();
  const playerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/content/${id}`);
        
        if (playerRef.current) {
          // Insert H5P player HTML
          playerRef.current.innerHTML = response.data.h5pPageHtml || 
            '<p>Content loaded but player HTML not available</p>';
          
          // Load H5P integration script
          if (response.data.integration && window.H5PIntegration) {
            Object.assign(window.H5PIntegration, response.data.integration);
          }
        }
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading content:', err);
        setError(err.message || 'Failed to load content');
        setLoading(false);
      }
    };

    if (id) {
      loadContent();
    }
  }, [id]);

  if (loading) {
    return <div className="loading">Loading H5P content...</div>;
  }

  if (error) {
    return (
      <div className="error-state">
        <h2>⚠️ Error Loading Content</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="view-page">
      <button onClick={() => navigate('/')} className="btn-back">
        ← Back to List
      </button>
      <div ref={playerRef} className="h5p-player"></div>
    </div>
  );
}

export default ViewPage;
