import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

function CreatePage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically open the H5P editor in a new window/tab
    const editorUrl = 'http://localhost:3001/edit/new';
    window.open(editorUrl, '_blank');
    
    // Optionally redirect back to list after a short delay
    const timer = setTimeout(() => {
      navigate('/');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="create-page">
      <div className="create-header">
        <h2>Create New H5P Content</h2>
        <button onClick={() => navigate('/')} className="btn-secondary">
          ← Back to List
        </button>
      </div>
      
      <div className="info-box" style={{ marginTop: '2rem' }}>
        <h3>📝 H5P Editor Opened</h3>
        <p>The H5P editor has been opened in a new tab.</p>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Select a content type from the available options</li>
          <li>Create your content</li>
          <li>Click "Save" or "Create" when finished</li>
          <li>Return here to view your content in the list</li>
        </ol>
        
        <div style={{ marginTop: '1.5rem' }}>
          <a 
            href="http://localhost:3001/edit/new" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ marginRight: '1rem' }}
          >
            🔗 Open Editor Again
          </a>
          <button onClick={() => navigate('/')} className="btn-secondary">
            ← Back to List
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePage;
