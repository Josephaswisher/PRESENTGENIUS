/**
 * Collaboration Store (Zustand)
 *
 * Manages real-time collaboration state including:
 * - Active users (presence)
 * - Cursors
 * - Sync status
 */

import { create } from 'zustand';
import { 
  joinSession, 
  leaveSession, 
  broadcastCursor, 
  onCursorMove, 
  onPresenceUpdate,
  CursorPosition 
} from '../services/audience-sync';

interface CollaborationState {
  isConnected: boolean;
  activeUsers: { id: string; name: string; color: string }[];
  cursors: Record<string, CursorPosition>;
  currentUser: { id: string; name: string; color: string } | null;
}

interface CollaborationActions {
  connect: (sessionId: string, user: { id: string; name: string }) => Promise<void>;
  disconnect: () => void;
  updateCursor: (x: number, y: number) => void;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

export const useCollaborationStore = create<CollaborationState & CollaborationActions>((set, get) => ({
  isConnected: false,
  activeUsers: [],
  cursors: {},
  currentUser: null,

  connect: async (sessionId, user) => {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const success = await joinSession(sessionId, user.id, user.name);
    
    if (success) {
      set({ 
        isConnected: true, 
        currentUser: { ...user, color } 
      });

      // Subscribe to updates
      onPresenceUpdate((state) => {
        const users = Object.values(state).flat().map((u: any) => ({
          id: u.user_id,
          name: u.user_name,
          color: COLORS[Math.floor(Math.random() * COLORS.length)] // Ideally stable color from backend
        }));
        set({ activeUsers: users });
      });

      onCursorMove((cursor) => {
        if (cursor.userId !== user.id) {
          set((state) => ({
            cursors: { ...state.cursors, [cursor.userId]: cursor }
          }));
        }
      });
    }
  },

  disconnect: () => {
    leaveSession();
    set({ isConnected: false, activeUsers: [], cursors: {} });
  },

  updateCursor: (x, y) => {
    const { currentUser, isConnected } = get();
    if (isConnected && currentUser) {
      broadcastCursor(x, y, currentUser.id, currentUser.name, currentUser.color);
    }
  },
}));
