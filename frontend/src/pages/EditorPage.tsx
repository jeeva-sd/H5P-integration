import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { H5PEditorUI } from '@lumieducation/h5p-react';

const API_URL = 'http://localhost:4000';

const api = {
  async getContentForEdit(contentId: string) {
    // Handle new content creation (contentId will be 'new' or undefined)
    const id = (!contentId || contentId === 'new' || contentId === 'undefined') ? 'new' : contentId;
    const response = await fetch(`${API_URL}/api/content/${id}/edit`);
    return response.json();
  },

  async saveContent(contentId: string | null, data: any) {
    const url = contentId 
      ? `${API_URL}/api/content/${contentId}`
      : `${API_URL}/api/content`;
    
    const response = await fetch(url, {
      method: contentId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
};

export default function EditorPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<H5PEditorUI>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editorRef.current) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const result = await editorRef.current.save();
      console.log('Content saved:', result);
      setSaved(true);
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save content');
      setSaving(false);
    }
  };

  const handleSaved = (event: any) => {
    console.log('Content saved event:', event);
    setSaving(false);
    setSaved(true);
  };

  const handleSaveError = (event: any) => {
    console.error('Save error event:', event);
    setError(event.detail?.message || 'Failed to save content');
    setSaving(false);
  };

  const isNewContent = !contentId || contentId === 'new';

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="header-left">
          <h2>{isNewContent ? '➕ Create New Content' : '✏️ Edit Content'}</h2>
          {contentId && contentId !== 'new' && (
            <span className="content-id">ID: {contentId}</span>
          )}
        </div>
        <div className="header-actions">
          <button 
            className={`btn btn-success ${saving ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="spinner-small"></div>
                Saving...
              </>
            ) : saved ? (
              <>✅ Saved!</>
            ) : (
              <>💾 Save Content</>
            )}
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ← Back
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      <div className="h5p-editor-wrapper">
        <H5PEditorUI
          ref={editorRef}
          contentId={isNewContent ? 'new' : contentId!}
          loadContentCallback={api.getContentForEdit}
          saveContentCallback={api.saveContent}
          onSaved={handleSaved}
          onSaveError={handleSaveError}
        />
      </div>

      <div className="editor-footer">
        <div className="help-text">
          <h4>💡 How to use the H5P Editor:</h4>
          <ul>
            <li>Select a content type from the dropdown</li>
            <li>Fill in the content details in the form</li>
            <li>Upload images, videos, or other media as needed</li>
            <li>Click "Save Content" when you're done</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
