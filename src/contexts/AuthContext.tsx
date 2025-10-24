import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { 
  User, 
  UserProfile, 
  AuthState, 
  SignInCredentials, 
  SignUpCredentials 
} from '../types'

interface AuthContextType {
  authState: AuthState
  signIn: (credentials: SignInCredentials) => Promise<void>
  signUp: (credentials: SignUpCredentials) => Promise<void>
  signOut: () => Promise<void>
  continueAsGuest: () => void
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    isGuest: false,
  })

  // Initialize auth state from localStorage (will be replaced with Supabase)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for guest mode first
        const guestMode = localStorage.getItem('kanban-guest-mode')
        if (guestMode === 'true') {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
            isGuest: true,
          })
          return
        }

        // TODO: Replace with Supabase session check
        const savedAuth = localStorage.getItem('kanban-auth')
        if (savedAuth) {
          const { user, profile } = JSON.parse(savedAuth)
          setAuthState({
            user,
            profile,
            isLoading: false,
            isAuthenticated: true,
            isGuest: false,
          })
        } else {
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            isGuest: false,
          }))
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          isGuest: false,
        }))
      }
    }

    initializeAuth()
  }, [])

  const signIn = async (credentials: SignInCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // TODO: Replace with Supabase auth.signInWithPassword()
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      if (credentials.email === 'demo@example.com' && credentials.password === 'password') {
        const mockUser: User = {
          id: 'user-1',
          email: credentials.email,
          displayName: 'Demo User',
          avatar: undefined,
          createdAt: new Date(),
          lastLoginAt: new Date(),
        }

        const mockProfile: UserProfile = {
          id: 'profile-1',
          userId: 'user-1',
          displayName: 'Demo User',
          avatar: undefined,
          bio: 'Welcome to Kanban!',
          preferences: {
            theme: 'dark',
            notifications: true,
            autoSave: true,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        const authData = { user: mockUser, profile: mockProfile }
        localStorage.setItem('kanban-auth', JSON.stringify(authData))

        setAuthState({
          user: mockUser,
          profile: mockProfile,
          isLoading: false,
          isAuthenticated: true,
          isGuest: false,
        })
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signUp = async (credentials: SignUpCredentials): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // TODO: Replace with Supabase auth.signUp()
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: credentials.email,
        displayName: credentials.displayName,
        avatar: undefined,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      }

      const newProfile: UserProfile = {
        id: `profile-${Date.now()}`,
        userId: newUser.id,
        displayName: credentials.displayName,
        avatar: undefined,
        bio: '',
        preferences: {
          theme: 'dark',
          notifications: true,
          autoSave: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const authData = { user: newUser, profile: newProfile }
      localStorage.setItem('kanban-auth', JSON.stringify(authData))

      setAuthState({
        user: newUser,
        profile: newProfile,
        isLoading: false,
        isAuthenticated: true,
        isGuest: false,
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const signOut = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // TODO: Replace with Supabase auth.signOut()
      localStorage.removeItem('kanban-auth')
      localStorage.removeItem('kanban-guest-mode')
      
      setAuthState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
      })
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const continueAsGuest = (): void => {
    localStorage.setItem('kanban-guest-mode', 'true')
    localStorage.removeItem('kanban-auth')
    
    setAuthState({
      user: null,
      profile: null,
      isLoading: false,
      isAuthenticated: false,
      isGuest: true,
    })
  }

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!authState.profile) throw new Error('No profile to update')
    
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // TODO: Replace with Supabase database update
      const updatedProfile = {
        ...authState.profile,
        ...updates,
        updatedAt: new Date(),
      }

      const authData = { 
        user: authState.user, 
        profile: updatedProfile 
      }
      localStorage.setItem('kanban-auth', JSON.stringify(authData))

      setAuthState(prev => ({
        ...prev,
        profile: updatedProfile,
        isLoading: false,
      }))
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const resetPassword = async (email: string): Promise<void> => {
    try {
      // TODO: Replace with Supabase auth.resetPasswordForEmail(email)
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log(`Password reset sent to ${email}`)
      // Mock success - would send reset email
    } catch (error) {
      throw error
    }
  }

  const refreshAuth = async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // TODO: Replace with Supabase session refresh
      const savedAuth = localStorage.getItem('kanban-auth')
      if (savedAuth) {
        const { user, profile } = JSON.parse(savedAuth)
        setAuthState({
          user,
          profile,
          isLoading: false,
          isAuthenticated: true,
          isGuest: false,
        })
      } else {
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
          isGuest: false,
        })
      }
    } catch (error) {
      setAuthState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        isGuest: false,
      })
      throw error
    }
  }

  const value: AuthContextType = {
    authState,
    signIn,
    signUp,
    signOut,
    continueAsGuest,
    updateProfile,
    resetPassword,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}