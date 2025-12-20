/**
 * Supabase Database Types
 *
 * These types match the Supabase schema for:
 * - projects: User's saved presentations/artifacts
 * - folders: Organization structure
 * - versions: Version history with rollback
 * - sessions: Live polling sessions
 * - responses: Audience poll responses
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// Define all interfaces FIRST (before Database)
// ============================================

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  html_content: string;
  original_image: string | null;
  folder_id: string | null;
  activity_type: string | null;
  learner_level: string | null;
  tags: string[] | null;
  is_public: boolean;
  share_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectInsert {
  id?: string;
  user_id: string;
  title: string;
  description?: string | null;
  html_content: string;
  original_image?: string | null;
  folder_id?: string | null;
  activity_type?: string | null;
  learner_level?: string | null;
  tags?: string[] | null;
  is_public?: boolean;
  share_token?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectUpdate {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string | null;
  html_content?: string;
  original_image?: string | null;
  folder_id?: string | null;
  activity_type?: string | null;
  learner_level?: string | null;
  tags?: string[] | null;
  is_public?: boolean;
  share_token?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface FolderInsert {
  id?: string;
  user_id: string;
  name: string;
  parent_id?: string | null;
  color?: string | null;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FolderUpdate {
  id?: string;
  user_id?: string;
  name?: string;
  parent_id?: string | null;
  color?: string | null;
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Version {
  id: string;
  project_id: string;
  html_snapshot: string;
  change_summary: string | null;
  version_number: number;
  created_at: string;
}

export interface VersionInsert {
  id?: string;
  project_id: string;
  html_snapshot: string;
  change_summary?: string | null;
  version_number: number;
  created_at?: string;
}

export interface VersionUpdate {
  id?: string;
  project_id?: string;
  html_snapshot?: string;
  change_summary?: string | null;
  version_number?: number;
  created_at?: string;
}

export interface Session {
  id: string;
  project_id: string;
  user_id: string;
  session_code: string;
  is_active: boolean;
  current_slide: number;
  settings: Json | null;
  created_at: string;
  ended_at: string | null;
}

export interface SessionInsert {
  id?: string;
  project_id: string;
  user_id: string;
  session_code: string;
  is_active?: boolean;
  current_slide?: number;
  settings?: Json | null;
  created_at?: string;
  ended_at?: string | null;
}

export interface SessionUpdate {
  id?: string;
  project_id?: string;
  user_id?: string;
  session_code?: string;
  is_active?: boolean;
  current_slide?: number;
  settings?: Json | null;
  created_at?: string;
  ended_at?: string | null;
}

export interface Response {
  id: string;
  session_id: string;
  question_id: string;
  participant_id: string;
  answer: string;
  confidence: number | null;
  timestamp: string;
}

export interface ResponseInsert {
  id?: string;
  session_id: string;
  question_id: string;
  participant_id: string;
  answer: string;
  confidence?: number | null;
  timestamp?: string;
}

export interface ResponseUpdate {
  id?: string;
  session_id?: string;
  question_id?: string;
  participant_id?: string;
  answer?: string;
  confidence?: number | null;
  timestamp?: string;
}

// ============================================
// Database interface (references above types)
// ============================================

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: [];
      };
      folders: {
        Row: Folder;
        Insert: FolderInsert;
        Update: FolderUpdate;
        Relationships: [];
      };
      versions: {
        Row: Version;
        Insert: VersionInsert;
        Update: VersionUpdate;
        Relationships: [];
      };
      sessions: {
        Row: Session;
        Insert: SessionInsert;
        Update: SessionUpdate;
        Relationships: [];
      };
      responses: {
        Row: Response;
        Insert: ResponseInsert;
        Update: ResponseUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
