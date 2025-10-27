// LeadAI Pro - Authentication Hooks
// React hooks for authentication state management

import { useState, useEffect, useContext, createContext, ReactNode } from 'react'
import { authAPI, AuthUser, AuthResponse, LoginCredentials, RegisterData, AuthError } from '@/lib/auth'

// Auth context type
interface AuthContextType {
  user: AuthUser | null
  organization: any | null
  team: any | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasRole: (roles: string | string[]) => boolean
  hasSubscriptionTier: (tier: string) => boolean
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [organization, setOrganization] = useState<any | null>(null)
  const [team, setTeam] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state
  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      if (authAPI.getToken()) {
        const userData = await authAPI.getCurrentUser()
        setUser(userData.user)
        setOrganization(userData.organization)
        setTeam(userData.team)
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      // Clear invalid token
      authAPI.clearToken()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      const response = await authAPI.login(credentials)
      
      setUser(response.user)
      setOrganization(response.organization)
      setTeam(response.team)
    } catch (error) {
      throw new AuthError(
        error instanceof Error ? error.message : 'Login failed'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true)
      const response = await authAPI.register(data)
      
      setUser(response.user)
      setOrganization(response.organization)
      setTeam(response.team)
    } catch (error) {
      throw new AuthError(
        error instanceof Error ? error.message : 'Registration failed'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setOrganization(null)
      setTeam(null)
    }
  }

  const refreshUser = async () => {
    try {
      if (authAPI.getToken()) {
        const userData = await authAPI.getCurrentUser()
        setUser(userData.user)
        setOrganization(userData.organization)
        setTeam(userData.team)
      }
    } catch (error) {
      console.error('User refresh failed:', error)
      // If refresh fails, logout user
      await logout()
    }
  }

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    return allowedRoles.includes(user.role)
  }

  const hasSubscriptionTier = (tier: string): boolean => {
    if (!organization) return false
    const tierHierarchy = ['free', 'starter', 'professional', 'enterprise']
    const currentIndex = tierHierarchy.indexOf(organization.subscriptionTier)
    const requiredIndex = tierHierarchy.indexOf(tier)
    return currentIndex >= requiredIndex
  }

  const value: AuthContextType = {
    user,
    organization,
    team,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    hasSubscriptionTier,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// useAuth hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// useRequireAuth hook - redirects to login if not authenticated
export const useRequireAuth = (redirectTo: string = '/login') => {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = redirectTo
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo])

  return auth
}

// useRequireRole hook - checks for required role
export const useRequireRole = (roles: string | string[]) => {
  const auth = useAuth()
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (auth.user) {
      setHasAccess(auth.hasRole(roles))
    }
  }, [auth.user, roles])

  return { ...auth, hasAccess }
}

// useRequireSubscription hook - checks for subscription tier
export const useRequireSubscription = (tier: string) => {
  const auth = useAuth()
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    if (auth.organization) {
      setHasAccess(auth.hasSubscriptionTier(tier))
    }
  }, [auth.organization, tier])

  return { ...auth, hasAccess }
}

// Login form hook
export const useLoginForm = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  const handleChange = (field: keyof LoginCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error on input change
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!credentials.email || !credentials.password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await login(credentials)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    credentials,
    isSubmitting,
    error,
    handleChange,
    handleSubmit,
  }
}

// Register form hook
export const useRegisterForm = () => {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    fullName: '',
    organizationName: '',
    organizationDomain: '',
    industry: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register } = useAuth()

  const handleChange = (field: keyof RegisterData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null) // Clear error on input change
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password || !formData.fullName || !formData.organizationName) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await register(formData)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    isSubmitting,
    error,
    handleChange,
    handleSubmit,
  }
}

// Password reset hook
export const usePasswordReset = () => {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      await authAPI.forgotPassword(email)
      setIsSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Password reset failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    email,
    setEmail,
    isSubmitting,
    isSuccess,
    error,
    handleSubmit,
  }
}

// Session management hook
export const useSession = () => {
  const auth = useAuth()
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null)

  useEffect(() => {
    if (auth.isAuthenticated) {
      // Set up session monitoring
      const token = authAPI.getToken()
      if (token) {
        try {
          // Decode JWT to get expiry (simplified - in production use a proper JWT library)
          const payload = JSON.parse(atob(token.split('.')[1]))
          setSessionExpiry(new Date(payload.exp * 1000))
        } catch (error) {
          console.error('Failed to decode token:', error)
        }
      }
    }
  }, [auth.isAuthenticated])

  const isSessionExpiring = sessionExpiry 
    ? sessionExpiry.getTime() - Date.now() < 5 * 60 * 1000 // 5 minutes
    : false

  return {
    ...auth,
    sessionExpiry,
    isSessionExpiring,
  }
}
