// LeadAI Pro - Leads API Client
// Frontend API client for lead management with advanced features

import { authAPI } from '@/lib/auth'

// Types
export interface Lead {
  id: string
  organizationId: string
  assignedTo?: string
  teamId?: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
  address?: any
  status: LeadStatus
  stage: string
  source?: string
  campaign?: string
  currentScore: number
  scoreConfidence: number
  predictedValue?: number
  conversionProbability?: number
  engagementLevel: EngagementLevel
  communicationPreference: any
  optimalContactTime: any
  customFields: any
  tags: string[]
  createdAt: string
  updatedAt: string
  lastContactedAt?: string
  nextFollowUpAt?: string
  assignedUser?: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
  }
  team?: {
    id: string
    name: string
  }
  scores?: LeadScore[]
  insights?: AiInsight[]
  _count?: {
    activities: number
    conversations: number
  }
}

export type LeadStatus = 
  | 'new' 
  | 'contacted' 
  | 'qualified' 
  | 'proposal' 
  | 'negotiation' 
  | 'closed_won' 
  | 'closed_lost' 
  | 'nurturing' 
  | 'unqualified'

export type EngagementLevel = 'unknown' | 'low' | 'medium' | 'high' | 'very_high'

export interface LeadScore {
  id: string
  score: number
  confidence: number
  modelVersion: string
  explanation: any
  recommendations: any
  createdAt: string
}

export interface AiInsight {
  id: string
  insightType: string
  title: string
  description: string
  confidence: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  data: any
  createdAt: string
}

export interface CreateLeadData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
  address?: any
  source?: string
  campaign?: string
  assignedTo?: string
  customFields?: any
  tags?: string[]
}

export interface UpdateLeadData {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  jobTitle?: string
  status?: LeadStatus
  stage?: string
  assignedTo?: string
  customFields?: any
  tags?: string[]
  nextFollowUpAt?: string
}

export interface LeadsFilters {
  page?: number
  limit?: number
  search?: string
  status?: LeadStatus
  assignedTo?: string
  minScore?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LeadsResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: LeadsFilters
}

export interface BulkUpdateData {
  leadIds: string[]
  updates: Partial<UpdateLeadData>
}

export interface LeadAnalytics {
  lead: {
    id: string
    firstName: string
    lastName: string
    company?: string
    status: LeadStatus
    currentScore: number
    engagementLevel: EngagementLevel
    createdAt: string
    lastContactedAt?: string
  }
  analytics: {
    totalActivities: number
    totalConversations: number
    lastActivity?: string
    scoreHistory: Array<{
      score: number
      confidence: number
      createdAt: string
    }>
    engagementTrend: EngagementLevel
  }
  recentActivities: any[]
}

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Leads API class
export class LeadsAPI {
  private static instance: LeadsAPI

  private constructor() {}

  public static getInstance(): LeadsAPI {
    if (!LeadsAPI.instance) {
      LeadsAPI.instance = new LeadsAPI()
    }
    return LeadsAPI.instance
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
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authAPI.getToken()}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Get all leads with filtering and pagination
  async getLeads(filters: LeadsFilters = {}): Promise<LeadsResponse> {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })

    const queryString = queryParams.toString()
    const endpoint = `/leads${queryString ? `?${queryString}` : ''}`

    return this.apiRequest<LeadsResponse>(endpoint)
  }

  // Get single lead by ID
  async getLead(id: string): Promise<{ lead: Lead }> {
    return this.apiRequest<{ lead: Lead }>(`/leads/${id}`)
  }

  // Create new lead
  async createLead(data: CreateLeadData): Promise<{ message: string; lead: Lead }> {
    return this.apiRequest<{ message: string; lead: Lead }>('/leads', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Update lead
  async updateLead(id: string, data: UpdateLeadData): Promise<{ message: string; lead: Lead }> {
    return this.apiRequest<{ message: string; lead: Lead }>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Delete lead
  async deleteLead(id: string): Promise<{ message: string }> {
    return this.apiRequest<{ message: string }>(`/leads/${id}`, {
      method: 'DELETE',
    })
  }

  // Bulk update leads
  async bulkUpdateLeads(data: BulkUpdateData): Promise<{ message: string; updatedCount: number }> {
    return this.apiRequest<{ message: string; updatedCount: number }>('/leads/bulk', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Get lead analytics
  async getLeadAnalytics(id: string): Promise<LeadAnalytics> {
    return this.apiRequest<LeadAnalytics>(`/leads/${id}/analytics`)
  }

  // Search leads (advanced search with AI)
  async searchLeads(query: string, filters: Omit<LeadsFilters, 'search'> = {}): Promise<LeadsResponse> {
    return this.getLeads({ ...filters, search: query })
  }

  // Get leads by status
  async getLeadsByStatus(status: LeadStatus, filters: Omit<LeadsFilters, 'status'> = {}): Promise<LeadsResponse> {
    return this.getLeads({ ...filters, status })
  }

  // Get assigned leads
  async getAssignedLeads(userId: string, filters: Omit<LeadsFilters, 'assignedTo'> = {}): Promise<LeadsResponse> {
    return this.getLeads({ ...filters, assignedTo: userId })
  }

  // Get high-score leads
  async getHighScoreLeads(minScore: number = 80, filters: Omit<LeadsFilters, 'minScore'> = {}): Promise<LeadsResponse> {
    return this.getLeads({ ...filters, minScore })
  }

  // Export leads
  async exportLeads(filters: LeadsFilters = {}): Promise<Blob> {
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString())
      }
    })

    const queryString = queryParams.toString()
    const endpoint = `/leads/export${queryString ? `?${queryString}` : ''}`

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${authAPI.getToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    return response.blob()
  }

  // Import leads
  async importLeads(file: File): Promise<{ message: string; imported: number; errors: any[] }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/leads/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authAPI.getToken()}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || 'Import failed')
    }

    return response.json()
  }
}

// Export singleton instance
export const leadsAPI = LeadsAPI.getInstance()

// Utility functions
export const getLeadFullName = (lead: Lead): string => {
  return `${lead.firstName} ${lead.lastName}`.trim()
}

export const getLeadDisplayName = (lead: Lead): string => {
  const fullName = getLeadFullName(lead)
  return lead.company ? `${fullName} (${lead.company})` : fullName
}

export const getLeadStatusColor = (status: LeadStatus): string => {
  const colors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-green-100 text-green-800',
    proposal: 'bg-purple-100 text-purple-800',
    negotiation: 'bg-orange-100 text-orange-800',
    closed_won: 'bg-green-100 text-green-800',
    closed_lost: 'bg-red-100 text-red-800',
    nurturing: 'bg-indigo-100 text-indigo-800',
    unqualified: 'bg-gray-100 text-gray-800',
  }
  return colors[status] || colors.new
}

export const getEngagementLevelColor = (level: EngagementLevel): string => {
  const colors = {
    unknown: 'bg-gray-100 text-gray-800',
    low: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-green-100 text-green-800',
    very_high: 'bg-emerald-100 text-emerald-800',
  }
  return colors[level] || colors.unknown
}

export const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

export const formatLeadScore = (score: number, confidence: number): string => {
  return `${score}/100 (${Math.round(confidence * 100)}% confidence)`
}
