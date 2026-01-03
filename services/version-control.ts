import { supabase } from './supabase';

export interface PresentationVersion {
  id: string;
  presentation_id: string;
  version_number: number;
  snapshot: any;
  description?: string;
  created_at: string;
}

export interface VersionDiff {
  added: any[];
  modified: any[];
  removed: any[];
}

class VersionControlService {
  private autoCheckpointInterval: number = 5 * 60 * 1000; // 5 minutes
  private checkpointTimers: Map<string, NodeJS.Timeout> = new Map();
  private lastSnapshots: Map<string, string> = new Map();

  /**
   * Start auto-checkpoint for a presentation
   */
  startAutoCheckpoint(presentationId: string, getSnapshot: () => any): void {
    // Clear existing timer if any
    this.stopAutoCheckpoint(presentationId);

    // Set up new timer
    const timer = setInterval(async () => {
      const snapshot = getSnapshot();
      const snapshotHash = JSON.stringify(snapshot);

      // Only save if content has changed
      if (this.lastSnapshots.get(presentationId) !== snapshotHash) {
        await this.createVersion(presentationId, snapshot, '[Auto-save]');
        this.lastSnapshots.set(presentationId, snapshotHash);
      }
    }, this.autoCheckpointInterval);

    this.checkpointTimers.set(presentationId, timer);
  }

  /**
   * Stop auto-checkpoint for a presentation
   */
  stopAutoCheckpoint(presentationId: string): void {
    const timer = this.checkpointTimers.get(presentationId);
    if (timer) {
      clearInterval(timer);
      this.checkpointTimers.delete(presentationId);
    }
    this.lastSnapshots.delete(presentationId);
  }

  /**
   * Create a new version manually
   */
  async createVersion(
    presentationId: string,
    snapshot: any,
    description?: string
  ): Promise<PresentationVersion | null> {
    try {
      // Get next version number
      const { data: versionData, error: versionError } = await supabase
        .rpc('get_next_version_number', { p_presentation_id: presentationId });

      if (versionError) throw versionError;

      const versionNumber = versionData as number;

      // Insert new version
      const { data, error } = await supabase
        .from('presentation_versions')
        .insert({
          presentation_id: presentationId,
          version_number: versionNumber,
          snapshot,
          description,
        })
        .select()
        .single();

      if (error) throw error;

      // Clean up old versions (keep last 10)
      await supabase.rpc('cleanup_old_versions', {
        p_presentation_id: presentationId,
      });

      return data as PresentationVersion;
    } catch (error) {
      console.error('Error creating version:', error);
      return null;
    }
  }

  /**
   * Get all versions for a presentation
   */
  async getVersions(presentationId: string): Promise<PresentationVersion[]> {
    try {
      const { data, error } = await supabase
        .from('presentation_versions')
        .select('*')
        .eq('presentation_id', presentationId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      return (data as PresentationVersion[]) || [];
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  }

  /**
   * Get a specific version
   */
  async getVersion(
    presentationId: string,
    versionNumber: number
  ): Promise<PresentationVersion | null> {
    try {
      const { data, error } = await supabase
        .from('presentation_versions')
        .select('*')
        .eq('presentation_id', presentationId)
        .eq('version_number', versionNumber)
        .single();

      if (error) throw error;

      return data as PresentationVersion;
    } catch (error) {
      console.error('Error fetching version:', error);
      return null;
    }
  }

  /**
   * Compare two versions and generate a diff
   */
  compareVersions(
    oldVersion: PresentationVersion,
    newVersion: PresentationVersion
  ): VersionDiff {
    const oldSnapshot = oldVersion.snapshot;
    const newSnapshot = newVersion.snapshot;

    const diff: VersionDiff = {
      added: [],
      modified: [],
      removed: [],
    };

    // Compare slides
    const oldSlides = oldSnapshot.slides || [];
    const newSlides = newSnapshot.slides || [];

    // Find added slides
    newSlides.forEach((newSlide: any, index: number) => {
      const oldSlide = oldSlides[index];
      if (!oldSlide) {
        diff.added.push({
          type: 'slide',
          index,
          content: newSlide,
        });
      } else if (JSON.stringify(oldSlide) !== JSON.stringify(newSlide)) {
        diff.modified.push({
          type: 'slide',
          index,
          old: oldSlide,
          new: newSlide,
        });
      }
    });

    // Find removed slides
    if (oldSlides.length > newSlides.length) {
      for (let i = newSlides.length; i < oldSlides.length; i++) {
        diff.removed.push({
          type: 'slide',
          index: i,
          content: oldSlides[i],
        });
      }
    }

    // Compare metadata
    const oldMeta = oldSnapshot.metadata || {};
    const newMeta = newSnapshot.metadata || {};

    Object.keys(newMeta).forEach((key) => {
      if (!(key in oldMeta)) {
        diff.added.push({
          type: 'metadata',
          key,
          value: newMeta[key],
        });
      } else if (JSON.stringify(oldMeta[key]) !== JSON.stringify(newMeta[key])) {
        diff.modified.push({
          type: 'metadata',
          key,
          old: oldMeta[key],
          new: newMeta[key],
        });
      }
    });

    Object.keys(oldMeta).forEach((key) => {
      if (!(key in newMeta)) {
        diff.removed.push({
          type: 'metadata',
          key,
          value: oldMeta[key],
        });
      }
    });

    return diff;
  }

  /**
   * Restore a presentation to a previous version
   */
  async restoreVersion(
    presentationId: string,
    versionNumber: number
  ): Promise<any | null> {
    try {
      const version = await this.getVersion(presentationId, versionNumber);
      if (!version) {
        throw new Error('Version not found');
      }

      // Create a new version with current state before restoring
      // This ensures we can undo the restore if needed
      const { data: currentData, error: currentError } = await supabase
        .from('presentations')
        .select('content')
        .eq('id', presentationId)
        .single();

      if (currentError) throw currentError;

      await this.createVersion(
        presentationId,
        currentData.content,
        '[Before restore]'
      );

      // Restore the version
      const { error: updateError } = await supabase
        .from('presentations')
        .update({ content: version.snapshot })
        .eq('id', presentationId);

      if (updateError) throw updateError;

      return version.snapshot;
    } catch (error) {
      console.error('Error restoring version:', error);
      return null;
    }
  }

  /**
   * Delete a specific version
   */
  async deleteVersion(
    presentationId: string,
    versionNumber: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('presentation_versions')
        .delete()
        .eq('presentation_id', presentationId)
        .eq('version_number', versionNumber);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error deleting version:', error);
      return false;
    }
  }

  /**
   * Get version count for a presentation
   */
  async getVersionCount(presentationId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('presentation_versions')
        .select('*', { count: 'exact', head: true })
        .eq('presentation_id', presentationId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error getting version count:', error);
      return 0;
    }
  }
}

export const versionControl = new VersionControlService();
