// LeadAI Pro - Lead Management Hooks
// React hooks for lead data management with React Query

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  leadsAPI, 
  Lead, 
  LeadsFilters, 
  CreateLeadData, 
  UpdateLeadData, 
  BulkUpdateData,
  LeadAnalytics 
} from '@/lib/api/leads'
import { useAuth } from './useAuth'

// Query keys
export const leadQueryKeys = {
  all: ['leads'] as const,
  lists: () => [...leadQueryKeys.all, 'list'] as const,
  list: (filters: LeadsFilters) => [...leadQueryKeys.lists(), filters] as const,
  details: () => [...leadQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadQueryKeys.details(), id] as const,
  analytics: (id: string) => [...leadQueryKeys.all, 'analytics', id] as const,
}

// useLeads hook - Get leads with filtering and pagination
export const useLeads = (filters: LeadsFilters = {}) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: leadQueryKeys.list(filters),
    queryFn: () => leadsAPI.getLeads(filters),
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

// useLead hook - Get single lead
export const useLead = (id: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: leadQueryKeys.detail(id),
    queryFn: () => leadsAPI.getLead(id),
    enabled: !!user && !!id,
    staleTime: 60 * 1000, // 1 minute
  })
}

// useLeadAnalytics hook - Get lead analytics
export const useLeadAnalytics = (id: string) => {
  const { user } = useAuth()

  return useQuery({
    queryKey: leadQueryKeys.analytics(id),
    queryFn: () => leadsAPI.getLeadAnalytics(id),
    enabled: !!user && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// useCreateLead hook - Create new lead
export const useCreateLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateLeadData) => leadsAPI.createLead(data),
    onSuccess: () => {
      // Invalidate and refetch leads list
      queryClient.invalidateQueries({ queryKey: leadQueryKeys.lists() })
    },
  })
}

// useUpdateLead hook - Update lead
export const useUpdateLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadData }) => 
      leadsAPI.updateLead(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific lead and lists
      queryClient.invalidateQueries({ queryKey: leadQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: leadQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadQueryKeys.analytics(id) })
    },
  })
}

// useDeleteLead hook - Delete lead
export const useDeleteLead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => leadsAPI.deleteLead(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: leadQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: leadQueryKeys.lists() })
    },
  })
}

// useBulkUpdateLeads hook - Bulk update leads
export const useBulkUpdateLeads = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BulkUpdateData) => leadsAPI.bulkUpdateLeads(data),
    onSuccess: () => {
      // Invalidate all lead queries
      queryClient.invalidateQueries({ queryKey: leadQueryKeys.all })
    },
  })
}

// useLeadFilters hook - Manage lead filters state
export const useLeadFilters = (initialFilters: LeadsFilters = {}) => {
  const [filters, setFilters] = useState<LeadsFilters>(initialFilters)

  const updateFilter = useCallback((key: keyof LeadsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value, // Reset page when other filters change
    }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  const clearFilter = useCallback((key: keyof LeadsFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }, [])

  return {
    filters,
    updateFilter,
    resetFilters,
    clearFilter,
    setFilters,
  }
}

// useLeadSearch hook - Search leads with debouncing
export const useLeadSearch = (debounceMs: number = 300) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  useState(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, debounceMs)

    return () => clearTimeout(timer)
  })

  const { data, isLoading, error } = useLeads({ 
    search: debouncedQuery || undefined,
    limit: 20 
  })

  return {
    searchQuery,
    setSearchQuery,
    results: data?.leads || [],
    isLoading: isLoading && !!debouncedQuery,
    error,
    hasResults: !!data?.leads.length,
  }
}

// useLeadSelection hook - Manage lead selection for bulk operations
export const useLeadSelection = () => {
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())

  const toggleLead = useCallback((leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(leadId)) {
        newSet.delete(leadId)
      } else {
        newSet.add(leadId)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback((leadIds: string[]) => {
    setSelectedLeads(new Set(leadIds))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedLeads(new Set())
  }, [])

  const isSelected = useCallback((leadId: string) => {
    return selectedLeads.has(leadId)
  }, [selectedLeads])

  return {
    selectedLeads: Array.from(selectedLeads),
    selectedCount: selectedLeads.size,
    toggleLead,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection: selectedLeads.size > 0,
  }
}

// useLeadForm hook - Manage lead form state
export const useLeadForm = (initialData?: Partial<CreateLeadData>) => {
  const [formData, setFormData] = useState<CreateLeadData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    jobTitle: '',
    source: '',
    campaign: '',
    customFields: {},
    tags: [],
    ...initialData,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateField = useCallback((field: keyof CreateLeadData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const resetForm = useCallback(() => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      source: '',
      campaign: '',
      customFields: {},
      tags: [],
      ...initialData,
    })
    setErrors({})
  }, [initialData])

  return {
    formData,
    errors,
    updateField,
    validateForm,
    resetForm,
    isValid: Object.keys(errors).length === 0,
  }
}

// useLeadStats hook - Get lead statistics
export const useLeadStats = () => {
  const { user } = useAuth()

  // Get leads for different statuses
  const { data: newLeads } = useLeads({ status: 'new', limit: 1 })
  const { data: qualifiedLeads } = useLeads({ status: 'qualified', limit: 1 })
  const { data: closedWonLeads } = useLeads({ status: 'closed_won', limit: 1 })
  const { data: allLeads } = useLeads({ limit: 1 })

  return {
    totalLeads: allLeads?.pagination.total || 0,
    newLeads: newLeads?.pagination.total || 0,
    qualifiedLeads: qualifiedLeads?.pagination.total || 0,
    closedWonLeads: closedWonLeads?.pagination.total || 0,
    conversionRate: allLeads?.pagination.total 
      ? ((closedWonLeads?.pagination.total || 0) / allLeads.pagination.total) * 100 
      : 0,
  }
}

// useLeadActions hook - Common lead actions
export const useLeadActions = () => {
  const createMutation = useCreateLead()
  const updateMutation = useUpdateLead()
  const deleteMutation = useDeleteLead()
  const bulkUpdateMutation = useBulkUpdateLeads()

  const createLead = useCallback(async (data: CreateLeadData) => {
    try {
      const result = await createMutation.mutateAsync(data)
      return { success: true, data: result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create lead' 
      }
    }
  }, [createMutation])

  const updateLead = useCallback(async (id: string, data: UpdateLeadData) => {
    try {
      const result = await updateMutation.mutateAsync({ id, data })
      return { success: true, data: result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update lead' 
      }
    }
  }, [updateMutation])

  const deleteLead = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete lead' 
      }
    }
  }, [deleteMutation])

  const bulkUpdateLeads = useCallback(async (data: BulkUpdateData) => {
    try {
      const result = await bulkUpdateMutation.mutateAsync(data)
      return { success: true, data: result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update leads' 
      }
    }
  }, [bulkUpdateMutation])

  return {
    createLead,
    updateLead,
    deleteLead,
    bulkUpdateLeads,
    isLoading: createMutation.isPending || updateMutation.isPending || 
               deleteMutation.isPending || bulkUpdateMutation.isPending,
  }
}
