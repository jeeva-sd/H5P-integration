import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { H5PEditorUI } from '@lumieducation/h5p-react';
import { contentService } from '../services/ContentService';

export default function EditorPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef<H5PEditorUI>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNewContent = !contentId || contentId === 'new';

  const loadContentForEdit = async (id: string) => {
    try {
      return await contentService.getEdit(id);
    } catch (err: any) {
      console.error('Error loading content for edit:', err);
      setError(err.message || 'Failed to load content');
      throw err;
    }
  };

  const saveContent = async (id: string | null, data: any) => {
    try {
      // API expects: { library: string, params: { params: any, metadata: any } }
      const result = await contentService.save(id, data);
      
      // API returns: { contentId: string, metadata: IContentMetadata }
      console.log('Content saved successfully:', result);
      return result;
    } catch (err: any) {
      console.error('Error saving content:', err);
      throw err;
    }
  };

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
          <button className="btn btn-secondary" onClick={() => setError(null)}>
            ✕ Dismiss
          </button>
        </div>
      )}

      <div className="h5p-editor-wrapper">
        <H5PEditorUI
          ref={editorRef}
          contentId={isNewContent ? 'new' : contentId!}
          loadContentCallback={loadContentForEdit}
          saveContentCallback={saveContent}
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
