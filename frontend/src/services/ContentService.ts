/**
 * Content Service - Matches Official H5P REST API
 * Handles all content-related API calls
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_BASE = '/api/content';

export interface IContentListEntry {
  contentId: string;
  mainLibrary?: string;
  title: string;
}

export interface IEditorModel {
  integration: any;
  scripts: string[];
  styles: string[];
  library?: string;
  metadata?: any;
  params?: any;
}

export interface IPlayerModel {
  integration: any;
  scripts: string[];
  styles: string[];
}

export interface IContentMetadata {
  title: string;
  license: string;
  authors: any[];
  changes: any[];
  mainLibrary?: string;
  embedTypes?: string[];
  language?: string;
  [key: string]: any;
}

export class ContentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL + API_BASE;
  }

  /**
   * List all content
   */
  async list(): Promise<IContentListEntry[]> {
    console.log('ContentService: Listing content...');
    const response = await fetch(this.baseUrl);
    
    if (!response.ok) {
      throw new Error(
        `Failed to list content: ${response.status} ${response.statusText}`
      );
    }
    
    // API returns array directly, not wrapped in { content: [] }
    return response.json();
  }

  /**
   * Get content for editing
   */
  async getEdit(contentId: string): Promise<IEditorModel> {
    console.log(`ContentService: Getting editor for ${contentId}...`);
    
    // Handle new content
    const id = (!contentId || contentId === 'new' || contentId === 'undefined') 
      ? 'new' 
      : contentId;
    
    const response = await fetch(`${this.baseUrl}/${id}/edit`);
    
    if (!response.ok) {
      throw new Error(
        `Failed to get editor: ${response.status} ${response.statusText}`
      );
    }
    
    return response.json();
  }

  /**
   * Get content for playing
   */
  async getPlay(contentId: string): Promise<IPlayerModel> {
    console.log(`ContentService: Getting player for ${contentId}...`);
    
    const response = await fetch(`${this.baseUrl}/${contentId}/play`);
    
    if (!response.ok) {
      throw new Error(
        `Failed to get player: ${response.status} ${response.statusText}`
      );
    }
    
    return response.json();
  }

  /**
   * Save content (create or update)
   * @param contentId - null for new content, string for update
   * @param requestBody - { library: string, params: { params: any, metadata: any } }
   */
  async save(
    contentId: string | null,
    requestBody: { library: string; params: any }
  ): Promise<{ contentId: string; metadata: IContentMetadata }> {
    console.log(
      contentId 
        ? `ContentService: Updating content ${contentId}...` 
        : 'ContentService: Creating new content...'
    );

    const url = contentId ? `${this.baseUrl}/${contentId}` : this.baseUrl;
    const method = contentId ? 'PATCH' : 'POST'; // Use PATCH for updates (official API)

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to save content: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // API returns { contentId, metadata } directly (not wrapped in { success: true })
    return response.json();
  }

  /**
   * Delete content
   */
  async delete(contentId: string): Promise<void> {
    console.log(`ContentService: Deleting ${contentId}...`);
    
    const response = await fetch(`${this.baseUrl}/${contentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(
        `Failed to delete content: ${response.status} ${response.statusText}`
      );
    }
  }
}

// Export singleton instance
export const contentService = new ContentService();
