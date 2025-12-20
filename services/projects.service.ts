/**
 * Projects Service
 *
 * CRUD operations for user projects with dual-mode support:
 * - Cloud mode: Uses Supabase when configured and user is logged in
 * - Local mode: Falls back to localStorage when offline or not logged in
 *
 * This ensures the app works seamlessly with or without cloud features.
 */

import { supabase, isSupabaseConfigured, getCurrentUser } from '../lib/supabase/client';
import type { Project, ProjectUpdate, Version } from '../lib/supabase/types';
import type { Creation } from '../components/CreationHistory';

// Helper to get a typed, non-null Supabase client
function getSupabaseClient() {
  if (!supabase) throw new Error('Supabase not configured');
  return supabase;
}

// Convert between internal Creation type and Supabase Project type
export const creationToProject = (creation: Creation, userId: string) => ({
  user_id: userId,
  title: creation.name,
  html_content: creation.html,
  original_image: creation.originalImage || null,
  activity_type: (creation as any).activityType || null,
  learner_level: (creation as any).learnerLevel || null,
});

export const projectToCreation = (project: Project): Creation => ({
  id: project.id,
  name: project.title,
  html: project.html_content,
  originalImage: project.original_image || undefined,
  timestamp: new Date(project.created_at),
});

// ============ PROJECTS CRUD ============

/**
 * Fetch all projects for the current user
 */
export async function fetchProjects(): Promise<Creation[]> {
  // Try cloud first if configured
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (!error && data) {
          return (data as Project[]).map(projectToCreation);
        }
      }
    } catch (e) {
      console.warn('Cloud fetch failed, using local:', e);
    }
  }

  // Fall back to localStorage
  const saved = localStorage.getItem('gemini_app_history');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (e) {
      console.error('Failed to parse local history:', e);
    }
  }
  return [];
}

/**
 * Save a new project
 */
export async function saveProject(creation: Creation): Promise<Creation | null> {
  // Try cloud first if configured
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const client = getSupabaseClient();
        const projectData = creationToProject(creation, user.id);

        const { data, error } = await client
          .from('projects')
          // @ts-expect-error Supabase generics don't infer correctly with optional client
          .insert(projectData)
          .select()
          .single();

        if (!error && data) {
          const project = data as Project;
          // Also save initial version
          await createVersion(project.id, project.html_content, 'Initial creation');
          return projectToCreation(project);
        }
        console.error('Failed to save to cloud:', error);
      }
    } catch (e) {
      console.warn('Cloud save failed, using local:', e);
    }
  }

  // Fall back to localStorage
  const existing = await fetchProjects();
  const updated = [creation, ...existing.filter(c => c.id !== creation.id)];
  localStorage.setItem('gemini_app_history', JSON.stringify(updated));
  return creation;
}

/**
 * Update an existing project
 */
export async function updateProject(
  id: string,
  updates: Partial<Pick<Creation, 'name' | 'html' | 'originalImage'>>,
  changeSummary?: string
): Promise<Creation | null> {
  // Try cloud first
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const client = getSupabaseClient();
        const projectUpdates: Partial<ProjectUpdate> = {};
        if (updates.name) projectUpdates.title = updates.name;
        if (updates.html) projectUpdates.html_content = updates.html;
        if (updates.originalImage) projectUpdates.original_image = updates.originalImage;
        projectUpdates.updated_at = new Date().toISOString();

        const { data, error } = await client
          .from('projects')
          // @ts-expect-error Supabase generics don't infer correctly with optional client
          .update(projectUpdates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (!error && data) {
          const project = data as Project;
          // Create a new version if HTML changed
          if (updates.html) {
            await createVersion(id, updates.html, changeSummary || 'Update');
          }
          return projectToCreation(project);
        }
        console.error('Failed to update in cloud:', error);
      }
    } catch (e) {
      console.warn('Cloud update failed, using local:', e);
    }
  }

  // Fall back to localStorage
  const existing = await fetchProjects();
  const index = existing.findIndex(c => c.id === id);
  if (index !== -1) {
    existing[index] = { ...existing[index], ...updates };
    localStorage.setItem('gemini_app_history', JSON.stringify(existing));
    return existing[index];
  }
  return null;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<boolean> {
  // Try cloud first
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const client = getSupabaseClient();
        const { error } = await client
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (!error) return true;
        console.error('Failed to delete from cloud:', error);
      }
    } catch (e) {
      console.warn('Cloud delete failed, using local:', e);
    }
  }

  // Fall back to localStorage
  const existing = await fetchProjects();
  const filtered = existing.filter(c => c.id !== id);
  localStorage.setItem('gemini_app_history', JSON.stringify(filtered));
  return true;
}

/**
 * Get a single project by ID
 */
export async function getProject(id: string): Promise<Creation | null> {
  // Try cloud first
  if (isSupabaseConfigured()) {
    try {
      const user = await getCurrentUser();
      if (user) {
        const client = getSupabaseClient();
        const { data, error } = await client
          .from('projects')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          return projectToCreation(data as Project);
        }
      }
    } catch (e) {
      console.warn('Cloud fetch failed, using local:', e);
    }
  }

  // Fall back to localStorage
  const existing = await fetchProjects();
  return existing.find(c => c.id === id) || null;
}

// ============ VERSIONS ============

/**
 * Create a new version snapshot
 */
async function createVersion(projectId: string, htmlContent: string, summary?: string): Promise<Version | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseClient();

    // Get current max version number
    const { data: versions } = await client
      .from('versions')
      .select('version_number')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })
      .limit(1);

    const versionRows = versions as Array<{ version_number: number }> | null;
    const nextVersion = (versionRows?.[0]?.version_number || 0) + 1;

    const versionData = {
      project_id: projectId,
      html_snapshot: htmlContent,
      change_summary: summary || null,
      version_number: nextVersion,
    };

    const { data, error } = await client
      .from('versions')
      // @ts-expect-error Supabase generics don't infer correctly with optional client
      .insert(versionData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create version:', error);
      return null;
    }
    return data as Version;
  } catch (e) {
    console.warn('Version creation failed:', e);
    return null;
  }
}

/**
 * Get version history for a project
 */
export async function getVersions(projectId: string): Promise<Version[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Failed to fetch versions:', error);
      return [];
    }
    return (data as Version[]) || [];
  } catch (e) {
    console.warn('Version fetch failed:', e);
    return [];
  }
}

/**
 * Restore a project to a specific version
 */
export async function restoreVersion(projectId: string, versionId: string): Promise<Creation | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const client = getSupabaseClient();

    // Get the version
    const { data } = await client
      .from('versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (!data) return null;

    const version = data as Version;

    // Update the project with this version's HTML
    return updateProject(projectId, { html: version.html_snapshot }, `Restored to version ${version.version_number}`);
  } catch (e) {
    console.warn('Version restore failed:', e);
    return null;
  }
}

// ============ SHARING ============

/**
 * Generate a shareable link for a project
 */
export async function generateShareLink(projectId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const client = getSupabaseClient();
    const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

    const { error } = await client
      .from('projects')
      // @ts-expect-error Supabase generics don't infer correctly with optional client
      .update({ is_public: true, share_token: shareToken })
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to generate share link:', error);
      return null;
    }

    return `${window.location.origin}/share/${shareToken}`;
  } catch (e) {
    console.warn('Share link generation failed:', e);
    return null;
  }
}

/**
 * Get a public project by share token
 */
export async function getSharedProject(shareToken: string): Promise<Creation | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('share_token', shareToken)
      .eq('is_public', true)
      .single();

    if (error || !data) return null;
    return projectToCreation(data as Project);
  } catch (e) {
    console.warn('Shared project fetch failed:', e);
    return null;
  }
}
