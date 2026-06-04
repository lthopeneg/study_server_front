import { create } from 'zustand';

interface AuthState {
    username: string | null;
    expiresAt: number | null; // 토큰 만료 시각 (타임스탬프)
    login: (username: string, expiresAt: number) => void;
    extendSession: (newExpiresAt: number) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    username: null,
    expiresAt: null,
    login: (username, expiresAt) => set({ username, expiresAt }),
    extendSession: (newExpiresAt) => set({ expiresAt: newExpiresAt }),
    logout: () => set({ username: null, expiresAt: null }),
}));
