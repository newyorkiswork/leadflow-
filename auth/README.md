# LeadAI Pro - Authentication System

## 🔐 Overview

Complete JWT-based authentication system with Supabase integration, designed for enterprise-grade security and user experience.

## 🏗️ Architecture

### Backend Authentication (`server/routes/auth.ts`)
- **JWT Token Management** - Secure token generation and validation
- **Supabase Integration** - User management and authentication
- **Password Security** - Bcrypt hashing and secure storage
- **Role-Based Access Control** - Admin, Manager, Sales Rep, Marketing, Viewer roles
- **Organization Isolation** - Multi-tenant data security

### Frontend Authentication (`lib/auth.ts`, `hooks/useAuth.ts`)
- **React Context** - Global authentication state management
- **Custom Hooks** - Reusable authentication logic
- **Token Management** - Automatic token storage and refresh
- **Route Protection** - Component-level access control

## 🚀 Features

### Core Authentication
- ✅ User registration with organization creation
- ✅ Secure login with JWT tokens
- ✅ Password reset functionality
- ✅ Token refresh mechanism
- ✅ Automatic session management

### Advanced Security
- ✅ Role-based access control (RBAC)
- ✅ Organization-level data isolation
- ✅ Subscription tier restrictions
- ✅ Rate limiting and brute force protection
- ✅ Security event logging

### User Experience
- ✅ Modern, responsive login/register forms
- ✅ Real-time form validation
- ✅ Loading states and error handling
- ✅ Remember me functionality
- ✅ Social login integration ready

## 📊 User Roles & Permissions

### Admin
- Full system access
- User management
- Organization settings
- Billing and subscriptions
- All lead and analytics access

### Manager
- Team management
- Lead assignment
- Performance analytics
- User performance monitoring
- Team-level settings

### Sales Rep
- Assigned lead management
- Activity tracking
- Personal performance metrics
- Lead communication
- Basic reporting

### Marketing
- Lead source analytics
- Campaign performance
- Lead generation tools
- Marketing automation
- Content management

### Viewer
- Read-only access
- Basic reporting
- Lead viewing (no editing)
- Dashboard access

## 🔧 Implementation Guide

### 1. Backend Setup

```typescript
// server/routes/auth.ts
import { authAPI } from '@/lib/auth'

// Register endpoint
router.post('/register', registerValidation, async (req, res) => {
  // Create Supabase user
  // Create organization and user in database
  // Generate JWT token
  // Return user data and token
})

// Login endpoint
router.post('/login', loginValidation, async (req, res) => {
  // Authenticate with Supabase
  // Validate user in database
  // Generate JWT token
  // Update last active timestamp
  // Return user data and token
})
```

### 2. Frontend Integration

```typescript
// pages/_app.tsx
import { AuthProvider } from '@/hooks/useAuth'

function MyApp({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  )
}
```

### 3. Route Protection

```typescript
// pages/dashboard.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function Dashboard() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'manager', 'sales_rep']}>
      <DashboardContent />
    </ProtectedRoute>
  )
}
```

### 4. Component-Level Access Control

```typescript
// components/LeadActions.tsx
import { RoleGuard, SubscriptionGuard } from '@/components/auth/ProtectedRoute'

export function LeadActions() {
  return (
    <div>
      <RoleGuard roles={['admin', 'manager']}>
        <button>Delete Lead</button>
      </RoleGuard>
      
      <SubscriptionGuard tier="professional">
        <button>AI Analysis</button>
      </SubscriptionGuard>
    </div>
  )
}
```

## 🔒 Security Best Practices

### Token Security
- JWT tokens with short expiration (24 hours)
- Secure token storage in localStorage
- Automatic token refresh
- Token validation on each request

### Password Security
- Minimum 8 character requirement
- Bcrypt hashing with salt rounds
- Password reset via secure email links
- Password strength validation

### Session Management
- Automatic session expiry detection
- Graceful logout on token expiration
- Session monitoring and alerts
- Multi-device session management

### API Security
- Rate limiting per IP and user
- Request validation and sanitization
- CORS configuration
- Security headers (Helmet.js)

## 📱 User Experience Features

### Login Form
- Email and password validation
- Show/hide password toggle
- Remember me functionality
- Social login buttons (Google, Microsoft)
- Forgot password link

### Registration Form
- Multi-step organization setup
- Real-time validation
- Industry selection
- Domain verification
- Terms and conditions

### Error Handling
- User-friendly error messages
- Form validation feedback
- Network error handling
- Retry mechanisms

## 🔄 Authentication Flow

### Registration Flow
1. User fills registration form
2. Frontend validates input
3. Backend creates Supabase user
4. Backend creates organization and user records
5. JWT token generated and returned
6. User automatically logged in
7. Redirect to dashboard

### Login Flow
1. User enters credentials
2. Frontend validates input
3. Backend authenticates with Supabase
4. Backend validates user in database
5. JWT token generated and returned
6. User session established
7. Redirect to dashboard

### Token Refresh Flow
1. Frontend detects token expiration
2. Refresh token sent to backend
3. Backend validates refresh token
4. New JWT token generated
5. Frontend updates stored token
6. User session continues seamlessly

## 🧪 Testing

### Authentication Tests
```bash
# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User",
    "organizationName": "Test Org"
  }'

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Test protected route
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/auth/me
```

## 🚀 Deployment Checklist

- [ ] Set secure JWT secret in production
- [ ] Configure Supabase production project
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domains
- [ ] Set up monitoring and alerting
- [ ] Test all authentication flows
- [ ] Verify rate limiting works
- [ ] Check security headers
- [ ] Test token refresh mechanism
- [ ] Verify role-based access control

## 📈 Monitoring & Analytics

### Security Metrics
- Failed login attempts
- Suspicious activity patterns
- Token refresh rates
- Session duration analytics
- Role-based access patterns

### User Experience Metrics
- Registration completion rates
- Login success rates
- Password reset usage
- Session timeout rates
- Feature usage by role

This authentication system provides enterprise-grade security while maintaining excellent user experience, setting the foundation for our industry-leading AI Lead Management platform.
