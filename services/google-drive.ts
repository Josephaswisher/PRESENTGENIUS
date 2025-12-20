/**
 * Google Drive Backup Service
 * Auto-backs up presentations and prompts to Google Drive
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_NAME = 'PRESENTGENIUS Backups';

interface GoogleDriveState {
  accessToken: string | null;
  folderId: string | null;
  isInitialized: boolean;
}

const state: GoogleDriveState = {
  accessToken: null,
  folderId: null,
  isInitialized: false,
};

export function isGoogleDriveConfigured(): boolean {
  return !!GOOGLE_CLIENT_ID;
}

export function isGoogleDriveConnected(): boolean {
  return !!state.accessToken;
}

/**
 * Initialize Google OAuth and get access token
 */
export async function connectGoogleDrive(): Promise<boolean> {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('[Google Drive] Client ID not configured');
    return false;
  }

  try {
    // Create OAuth popup
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', window.location.origin);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('prompt', 'consent');

    // Open popup
    const popup = window.open(authUrl.toString(), 'google-auth', 'width=500,height=600');
    
    if (!popup) {
      throw new Error('Popup blocked');
    }

    // Wait for callback
    return new Promise((resolve) => {
      const checkPopup = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(checkPopup);
            resolve(false);
            return;
          }

          const url = popup.location.href;
          if (url.includes('access_token=')) {
            const hash = new URL(url).hash.slice(1);
            const params = new URLSearchParams(hash);
            state.accessToken = params.get('access_token');
            
            popup.close();
            clearInterval(checkPopup);
            
            if (state.accessToken) {
              localStorage.setItem('google_drive_token', state.accessToken);
              initializeFolder().then(() => resolve(true));
            } else {
              resolve(false);
            }
          }
        } catch (e) {
          // Cross-origin, wait for redirect
        }
      }, 500);

      // Timeout after 2 minutes
      setTimeout(() => {
        clearInterval(checkPopup);
        if (!popup.closed) popup.close();
        resolve(false);
      }, 120000);
    });
  } catch (error) {
    console.error('[Google Drive] Auth error:', error);
    return false;
  }
}

/**
 * Try to restore session from localStorage
 */
export function restoreGoogleDriveSession(): boolean {
  const token = localStorage.getItem('google_drive_token');
  if (token) {
    state.accessToken = token;
    initializeFolder();
    return true;
  }
  return false;
}

/**
 * Disconnect and clear session
 */
export function disconnectGoogleDrive(): void {
  state.accessToken = null;
  state.folderId = null;
  state.isInitialized = false;
  localStorage.removeItem('google_drive_token');
}

/**
 * Find or create the backup folder
 */
async function initializeFolder(): Promise<void> {
  if (!state.accessToken) return;

  try {
    // Search for existing folder
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      { headers: { Authorization: `Bearer ${state.accessToken}` } }
    );
    const searchData = await searchRes.json();

    if (searchData.files?.length > 0) {
      state.folderId = searchData.files[0].id;
    } else {
      // Create folder
      const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });
      const createData = await createRes.json();
      state.folderId = createData.id;
    }

    state.isInitialized = true;
    console.log('[Google Drive] Folder ready:', state.folderId);
  } catch (error) {
    console.error('[Google Drive] Folder init error:', error);
  }
}

/**
 * Backup a presentation to Google Drive
 */
export async function backupPresentation(
  name: string,
  html: string,
  prompt?: string
): Promise<string | null> {
  if (!state.accessToken || !state.folderId) {
    console.warn('[Google Drive] Not connected');
    return null;
  }

  try {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const fileName = `${name.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.html`;

    // Create file with multipart upload
    const metadata = {
      name: fileName,
      parents: [state.folderId],
      description: prompt ? `Prompt: ${prompt.slice(0, 200)}...` : 'PresentGenius Backup',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([html], { type: 'text/html' }));

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.accessToken}` },
        body: form,
      }
    );

    const data = await res.json();
    console.log('[Google Drive] Backup saved:', data.webViewLink);
    return data.webViewLink;
  } catch (error) {
    console.error('[Google Drive] Backup error:', error);
    return null;
  }
}

/**
 * Backup prompt history to a single JSON file (appending)
 */
export async function backupPromptHistory(
  prompts: Array<{ prompt: string; name: string; timestamp: string }>
): Promise<boolean> {
  if (!state.accessToken || !state.folderId) return false;

  try {
    const fileName = 'prompt_history.json';
    
    // Check if file exists
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${state.folderId}' in parents and trashed=false`,
      { headers: { Authorization: `Bearer ${state.accessToken}` } }
    );
    const searchData = await searchRes.json();

    let existingPrompts: any[] = [];
    let fileId: string | null = null;

    if (searchData.files?.length > 0) {
      fileId = searchData.files[0].id;
      // Download existing content
      const contentRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${state.accessToken}` } }
      );
      existingPrompts = await contentRes.json();
    }

    // Merge prompts
    const allPrompts = [...existingPrompts, ...prompts];

    const content = JSON.stringify(allPrompts, null, 2);

    if (fileId) {
      // Update existing file
      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: content,
        }
      );
    } else {
      // Create new file
      const metadata = {
        name: fileName,
        parents: [state.folderId],
        mimeType: 'application/json',
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', new Blob([content], { type: 'application/json' }));

      await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${state.accessToken}` },
          body: form,
        }
      );
    }

    console.log('[Google Drive] Prompt history backed up');
    return true;
  } catch (error) {
    console.error('[Google Drive] Prompt history backup error:', error);
    return false;
  }
}
