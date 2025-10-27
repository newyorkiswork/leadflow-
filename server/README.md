# LeadAI Pro - Backend API Server

## 🚀 Overview

This is the Express.js backend server for LeadAI Pro, built with TypeScript and designed to support our industry-leading AI features.

## 🏗️ Architecture

### Core Components
- **Express.js** - Web framework
- **TypeScript** - Type safety and modern JavaScript features
- **Prisma** - Database ORM with PostgreSQL
- **JWT** - Authentication and authorization
- **Supabase** - Database and auth provider

### Middleware Stack
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logging
- **Rate Limiting** - API rate limiting
- **Custom Auth** - JWT-based authentication
- **Error Handling** - Centralized error management

## 📁 Project Structure

```
server/
├── index.ts              # Main server entry point
├── middleware/           # Custom middleware
│   ├── auth.ts          # Authentication & authorization
│   ├── errorHandler.ts  # Error handling
│   └── logger.ts        # Request logging & metrics
├── routes/              # API route handlers
│   ├── auth.ts          # Authentication routes
│   ├── leads.ts         # Lead management
│   ├── users.ts         # User management
│   ├── organizations.ts # Organization settings
│   ├── activities.ts    # Activity tracking
│   ├── analytics.ts     # Analytics & reporting
│   └── ai.ts           # AI-powered features
└── test-server.ts       # Simple test server
```

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

### 4. Start Development Server
```bash
# Start both frontend and backend
npm run dev

# Or start only backend
npm run dev:server
```

## 🛡️ Security Features

### Authentication
- JWT-based authentication
- Supabase integration for user management
- Token refresh mechanism
- Password reset functionality

### Authorization
- Role-based access control (RBAC)
- Organization-level data isolation
- Resource-specific permissions
- Subscription tier restrictions

### Security Middleware
- Helmet for security headers
- CORS configuration
- Rate limiting per IP and user
- Input validation and sanitization

## 📊 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /refresh` - Token refresh
- `GET /me` - Current user profile
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset

### Leads (`/api/leads`)
- `GET /` - List leads with filtering and pagination
- `GET /:id` - Get single lead with details
- `POST /` - Create new lead
- `PUT /:id` - Update lead
- `DELETE /:id` - Delete lead
- `PATCH /bulk` - Bulk update leads
- `GET /:id/analytics` - Lead analytics

### Users (`/api/users`)
- `GET /` - List organization users
- `GET /profile` - User profile
- `PUT /profile` - Update profile

### Organizations (`/api/organizations`)
- `GET /` - Organization details
- `PUT /` - Update organization
- `GET /analytics` - Organization analytics

### Activities (`/api/activities`)
- `GET /lead/:leadId` - Lead activities
- `POST /` - Create activity
- `PUT /:id` - Update activity
- `DELETE /:id` - Delete activity

### Analytics (`/api/analytics`)
- `GET /dashboard` - Dashboard metrics
- `GET /leads` - Lead analytics
- `GET /performance` - User performance
- `GET /forecast` - Forecasting data

### AI Features (`/api/ai`)
- `GET /insights/:leadId` - AI insights
- `POST /score/:leadId` - Trigger lead scoring
- `POST /analyze-conversation` - Conversation analysis
- `GET /recommendations/:leadId` - Content recommendations
- `GET /forecast` - AI forecasting

## 🔍 Error Handling

### Error Types
- `ValidationError` (400) - Input validation failures
- `AuthenticationError` (401) - Authentication required
- `AuthorizationError` (403) - Insufficient permissions
- `NotFoundError` (404) - Resource not found
- `ConflictError` (409) - Resource conflicts
- `RateLimitError` (429) - Rate limit exceeded
- `AppError` (500) - Internal server errors

### Error Response Format
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "requestId": "uuid",
    "details": {} // Development only
  }
}
```

## 📈 Logging & Monitoring

### Log Types
- **Request Logs** - HTTP requests and responses
- **Security Logs** - Authentication and authorization events
- **Business Logs** - Lead activities and conversions
- **Performance Logs** - Response times and resource usage
- **Error Logs** - Application errors and exceptions

### Metrics Tracking
- API endpoint usage
- AI service utilization
- Database query performance
- User activity patterns
- System resource usage

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Test protected endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/leads
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment Variables
Ensure all required environment variables are set in production:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## 🔄 Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit files in `server/` directory
3. **Auto Reload**: Nodemon automatically restarts server
4. **Test Changes**: Use curl or API client
5. **Check Logs**: Monitor console output
6. **Database Changes**: Run `npm run db:push` after schema updates

## 📚 Next Steps

1. Set up Supabase project and database
2. Configure environment variables
3. Implement AI service integrations
4. Add comprehensive testing
5. Set up monitoring and alerting
6. Deploy to production environment
