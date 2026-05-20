import { create } from 'zustand';

interface AuthState {
    username: string | null;
    login: (username: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    username: null,
    login: (username) => set({ username }),
    logout: () => set({ username: null }),
}));
