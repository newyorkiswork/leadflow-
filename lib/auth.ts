// LeadAI Pro - Authentication Utilities
// Client-side authentication helpers and Supabase integration

import { createClient } from '@supabase/supabase-js'
import { User } from '@prisma/client'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Types
export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: string
  organizationId: string
  teamId?: string
}

export interface AuthResponse {
  user: AuthUser
  organization: {
    id: string
    name: string
    domain?: string
    subscriptionTier: string
  }
  team?: {
    id: string
    name: string
  }
  token: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  fullName: string
  organizationName: string
  organizationDomain?: string
  industry?: string
}

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Auth API class
export class AuthAPI {
  private static instance: AuthAPI
  private token: string | null = null

  private constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('leadai_token')
    }
  }

  public static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI()
    }
    return AuthAPI.instance
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadai_token', token)
    }
  }

  // Get authentication token
  getToken(): string | null {
    return this.token
  }

  // Clear authentication token
  clearToken() {
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leadai_token')
    }
  }

  // Get authorization headers
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    return headers
  }

  // Make authenticated API request
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    this.setToken(response.token)
    return response
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })

    this.setToken(response.token)
    return response
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await this.apiRequest('/auth/logout', {
        method: 'POST',
      })
    } finally {
      this.clearToken()
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthResponse> {
    return this.apiRequest<AuthResponse>('/auth/me')
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const response = await this.apiRequest<{ token: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })

    this.setToken(response.token)
    return response
  }

  // Request password reset
  async forgotPassword(email: string): Promise<void> {
    await this.apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  // Reset password
  async resetPassword(token: string, password: string): Promise<void> {
    await this.apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.token
  }
}

// Auth context helpers
export const authAPI = AuthAPI.getInstance()

// Supabase auth helpers
export const supabaseAuth = {
  // Sign up with Supabase
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign in with Supabase
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  // Listen to auth changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },

  // Update password
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  },
}

// Token validation
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.ok
  } catch {
    return false
  }
}

// Role checking utilities
export const hasRole = (user: AuthUser, roles: string | string[]): boolean => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  return allowedRoles.includes(user.role)
}

export const isAdmin = (user: AuthUser): boolean => {
  return user.role === 'admin'
}

export const isManager = (user: AuthUser): boolean => {
  return ['admin', 'manager'].includes(user.role)
}

export const canAccessLeads = (user: AuthUser): boolean => {
  return ['admin', 'manager', 'sales_rep'].includes(user.role)
}

export const canManageUsers = (user: AuthUser): boolean => {
  return ['admin', 'manager'].includes(user.role)
}

// Subscription tier checking
export const hasSubscriptionTier = (
  subscriptionTier: string,
  requiredTier: string
): boolean => {
  const tierHierarchy = ['free', 'starter', 'professional', 'enterprise']
  const currentIndex = tierHierarchy.indexOf(subscriptionTier)
  const requiredIndex = tierHierarchy.indexOf(requiredTier)
  
  return currentIndex >= requiredIndex
}

// Auth error handling
export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Auto token refresh
export const setupTokenRefresh = () => {
  if (typeof window === 'undefined') return

  // Check token validity every 5 minutes
  setInterval(async () => {
    const token = authAPI.getToken()
    if (token && !(await validateToken(token))) {
      // Token is invalid, clear it
      authAPI.clearToken()
      // Redirect to login or show notification
      window.location.href = '/login'
    }
  }, 5 * 60 * 1000) // 5 minutes
}

// Initialize auth on app start
export const initializeAuth = async () => {
  if (typeof window === 'undefined') return null

  const token = authAPI.getToken()
  if (!token) return null

  try {
    // Validate token and get user data
    const userData = await authAPI.getCurrentUser()
    return userData
  } catch (error) {
    // Token is invalid, clear it
    authAPI.clearToken()
    return null
  }
}
