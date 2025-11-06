import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { H5PPlayerUI } from '@lumieducation/h5p-react';
import { contentService } from '../services/ContentService';

export default function PlayerPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef<H5PPlayerUI>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInitialized = () => {
    console.log('✅ H5P Player initialized successfully');
    setInitialized(true);
  };

  const handlexAPIStatement = (statement: any, context: any, event: any) => {
    console.log('📊 xAPI Statement:', { statement, context, event });
  };

  const loadContentForPlay = async (id: string) => {
    try {
      console.log(`🔄 Loading content ${id} for playback...`);
      const data = await contentService.getPlay(id);
      console.log('✅ Content loaded successfully:', {
        scriptsCount: data.scripts?.length,
        stylesCount: data.styles?.length,
        hasIntegration: !!data.integration
      });
      return data;
    } catch (err: any) {
      console.error('❌ Error loading content for play:', err);
      setError(err.message || 'Failed to load content');
      throw err;
    }
  };

  if (!contentId) {
    return (
      <div className="player-container">
        <div className="error-message">
          <strong>❌ Error:</strong> No content ID provided
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

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

      {error && (
        <div className="error-message">
          <strong>❌ Error:</strong> {error}
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Go Back
          </button>
        </div>
      )}

      {!initialized && !error && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading H5P content...</p>
        </div>
      )}

      <div className="h5p-player-wrapper" style={{ display: initialized || error ? 'block' : 'none' }}>
        <H5PPlayerUI
          ref={playerRef}
          contentId={contentId}
          loadContentCallback={loadContentForPlay}
          onInitialized={handleInitialized}
          onxAPIStatement={handlexAPIStatement}
        />
      </div>

      {initialized && (
        <div className="player-footer">
          <div className="info-box">
            <h4>📊 Content Information</h4>
            <p>Content ID: <code>{contentId}</code></p>
            <p>
              This content is being tracked with xAPI statements. 
              All interactions are logged to the browser console.
            </p>
            {playerRef.current?.hasCopyrightInformation() && (
              <button 
                className="btn btn-secondary"
                onClick={() => playerRef.current?.showCopyright()}
              >
                © Show Copyright Information
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
