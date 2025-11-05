import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { H5PPlayerUI } from '@lumieducation/h5p-react';

const API_URL = 'http://localhost:4000';

export default function PlayerPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef<H5PPlayerUI>(null);
  const [initialized, setInitialized] = useState(false);

  const handleInitialized = () => {
    console.log('Player initialized');
    setInitialized(true);
  };

  const handlexAPIStatement = (statement: any, context: any, event: any) => {
    console.log('xAPI Statement:', { statement, context, event });
  };

  const loadContentForPlay = async (contentId: string) => {
    const response = await fetch(`${API_URL}/api/content/${contentId}/play`);
    return response.json();
  };

  return (
    <div className="player-container">
      <div className="player-header">
        <h2>▶️ Play H5P Content</h2>
        <div className="header-actions">
          <button 
            className="btn btn-edit" 
            onClick={() => navigate(`/edit/${contentId}`)}
          >
            ✏️ Edit
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Back to List
          </button>
        </div>
      </div>

      {!initialized && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading H5P content...</p>
        </div>
      )}

      <div className="h5p-player-wrapper">
        <H5PPlayerUI
          ref={playerRef}
          contentId={contentId!}
          loadContentCallback={loadContentForPlay}
          onInitialized={handleInitialized}
          onxAPIStatement={handlexAPIStatement}
        />
      </div>

      <div className="player-footer">
        <div className="info-box">
          <h4>📊 Content Information</h4>
          <p>Content ID: <code>{contentId}</code></p>
          <p>
            This content is being tracked with xAPI statements. 
            All interactions are logged to the browser console.
          </p>
        </div>
      </div>
    </div>
  );
}
