import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthStore } from '../types/user';

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: (user: User) => set({ 
        user, 
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        isAuthenticated: false 
      }),
      
      updateUser: (userData: Partial<User>) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),

      // 임시 로그인 기능 (개발용)
      tempLogin: () => set({
        user: {
          id: 'temp-user-123',
          email: 'temp@example.com',
          nickname: '개발자',
          profileImage: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isAuthenticated: true
      }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
