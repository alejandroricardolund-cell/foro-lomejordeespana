import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLocked: boolean
  loginAttempts: number
  lockUntil: number | null
  setUser: (user: User | null) => void
  logout: () => void
  addLoginAttempt: () => void
  resetLoginAttempts: () => void
  setLocked: (duration: number) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLocked: false,
      loginAttempts: 0,
      lockUntil: null,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      addLoginAttempt: () => set((state) => ({ loginAttempts: state.loginAttempts + 1 })),
      resetLoginAttempts: () => set({ loginAttempts: 0, isLocked: false, lockUntil: null }),
      setLocked: (duration) => set({ isLocked: true, lockUntil: Date.now() + duration }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
