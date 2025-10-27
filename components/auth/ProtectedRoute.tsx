// LeadAI Pro - Protected Route Component
// Route protection with role-based access control

import { ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: string | string[]
  requiredSubscriptionTier?: string
  fallback?: ReactNode
  redirectTo?: string
}

export const ProtectedRoute = ({
  children,
  requiredRoles,
  requiredSubscriptionTier,
  fallback,
  redirectTo = '/login',
}: ProtectedRouteProps) => {
  const { user, organization, isLoading, isAuthenticated, hasRole, hasSubscriptionTier } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Check authentication
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      // Check role requirements
      if (requiredRoles && !hasRole(requiredRoles)) {
        router.push('/unauthorized')
        return
      }

      // Check subscription tier requirements
      if (requiredSubscriptionTier && !hasSubscriptionTier(requiredSubscriptionTier)) {
        router.push('/upgrade')
        return
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    organization,
    requiredRoles,
    requiredSubscriptionTier,
    router,
    redirectTo,
    hasRole,
    hasSubscriptionTier,
  ])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show fallback if not authenticated or authorized
  if (!isAuthenticated || 
      (requiredRoles && !hasRole(requiredRoles)) ||
      (requiredSubscriptionTier && !hasSubscriptionTier(requiredSubscriptionTier))) {
    return fallback || null
  }

  return <>{children}</>
}

// Higher-order component for route protection
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) => {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Role-based component rendering
interface RoleGuardProps {
  children: ReactNode
  roles: string | string[]
  fallback?: ReactNode
}

export const RoleGuard = ({ children, roles, fallback }: RoleGuardProps) => {
  const { hasRole } = useAuth()

  if (!hasRole(roles)) {
    return fallback || null
  }

  return <>{children}</>
}

// Subscription tier guard
interface SubscriptionGuardProps {
  children: ReactNode
  tier: string
  fallback?: ReactNode
}

export const SubscriptionGuard = ({ children, tier, fallback }: SubscriptionGuardProps) => {
  const { hasSubscriptionTier } = useAuth()

  if (!hasSubscriptionTier(tier)) {
    return fallback || null
  }

  return <>{children}</>
}

// Admin only component
export const AdminOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles="admin" fallback={fallback}>
    {children}
  </RoleGuard>
)

// Manager and above component
export const ManagerOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={['admin', 'manager']} fallback={fallback}>
    {children}
  </RoleGuard>
)

// Sales rep and above component
export const SalesOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <RoleGuard roles={['admin', 'manager', 'sales_rep']} fallback={fallback}>
    {children}
  </RoleGuard>
)
