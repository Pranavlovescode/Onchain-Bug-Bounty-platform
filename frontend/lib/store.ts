import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global application state management
 */

export interface BountyFilter {
  severity?: 'critical' | 'high' | 'medium' | 'low';
  minReward?: number;
  maxReward?: number;
  searchQuery?: string;
}

interface AppState {
  // User state
  userAddress: string | null;
  userRole: 'researcher' | 'creator' | 'reviewer' | null;
  ensName: string | null;

  // UI state
  sidebarOpen: boolean;
  darkMode: boolean;

  // Bounty filters
  bountyFilters: BountyFilter;
  setBountyFilters: (filters: BountyFilter) => void;

  // Transaction state
  pendingTransactions: Map<string, { hash: string; status: 'pending' | 'confirmed' | 'failed' }>;
  addPendingTx: (id: string, hash: string) => void;
  updateTxStatus: (id: string, status: 'pending' | 'confirmed' | 'failed') => void;
  removePendingTx: (id: string) => void;

  // User preferences
  setUserAddress: (address: string | null) => void;
  setUserRole: (role: 'researcher' | 'creator' | 'reviewer' | null) => void;
  setEnsName: (name: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setDarkMode: (dark: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userAddress: null,
      userRole: null,
      ensName: null,
      sidebarOpen: true,
      darkMode: true,
      bountyFilters: {},
      pendingTransactions: new Map(),

      setBountyFilters: (filters) => set({ bountyFilters: filters }),
      setUserAddress: (address) => set({ userAddress: address }),
      setUserRole: (role) => set({ userRole: role }),
      setEnsName: (name) => set({ ensName: name }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setDarkMode: (dark) => set({ darkMode: dark }),

      addPendingTx: (id, hash) =>
        set((state) => {
          const newTxs = new Map(state.pendingTransactions);
          newTxs.set(id, { hash, status: 'pending' });
          return { pendingTransactions: newTxs };
        }),

      updateTxStatus: (id, status) =>
        set((state) => {
          const newTxs = new Map(state.pendingTransactions);
          const tx = newTxs.get(id);
          if (tx) {
            newTxs.set(id, { ...tx, status });
          }
          return { pendingTransactions: newTxs };
        }),

      removePendingTx: (id) =>
        set((state) => {
          const newTxs = new Map(state.pendingTransactions);
          newTxs.delete(id);
          return { pendingTransactions: newTxs };
        }),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        darkMode: state.darkMode,
        bountyFilters: state.bountyFilters,
      }),
    },
  ),
);
