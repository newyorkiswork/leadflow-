# LeadAI Pro - Database Schema Design

## 🏗️ Database Architecture Overview

Our database is designed to support advanced AI features, real-time updates, and scalable performance. We use PostgreSQL via Supabase for its excellent JSON support, full-text search, and built-in real-time capabilities.

### Key Design Principles:
1. **AI-Optimized**: Schema designed for machine learning and analytics
2. **Real-time Ready**: Supports live updates and notifications
3. **Scalable**: Handles growth from startup to enterprise
4. **Privacy-Compliant**: GDPR/CCPA ready with data retention policies
5. **Performance-First**: Optimized indexes and query patterns

## 📊 Core Entity Relationships

```
Users (1) ──── (M) Organizations (1) ──── (M) Teams
  │                                           │
  │                                           │
  └─── (M) Leads (1) ──── (M) Activities     │
           │                   │              │
           │                   └── (M) ───────┘
           │
           ├── (M) Conversations
           ├── (M) AI_Insights
           ├── (M) Lead_Scores
           └── (M) Journey_Events
```

## 🗃️ Detailed Schema Design

### 1. User Management Tables

```sql
-- Users table with Supabase Auth integration
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'sales_rep',
  organization_id UUID REFERENCES organizations(id),
  team_id UUID REFERENCES teams(id),
  preferences JSONB DEFAULT '{}',
  ai_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles enum
CREATE TYPE user_role AS ENUM (
  'admin', 'manager', 'sales_rep', 'marketing', 'viewer'
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  industry VARCHAR(100),
  size organization_size,
  settings JSONB DEFAULT '{}',
  ai_config JSONB DEFAULT '{}',
  subscription_tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE organization_size AS ENUM (
  'startup', 'small', 'medium', 'large', 'enterprise'
);

-- Teams table for lead assignment and collaboration
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Lead Management Tables

```sql
-- Main leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  
  -- Basic Information
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  job_title VARCHAR(255),
  
  -- Address Information
  address JSONB, -- {street, city, state, country, postal_code}
  
  -- Lead Status and Scoring
  status lead_status DEFAULT 'new',
  stage VARCHAR(100) DEFAULT 'prospect',
  source VARCHAR(100),
  campaign VARCHAR(255),
  
  -- AI-Enhanced Fields
  current_score INTEGER DEFAULT 0,
  score_confidence DECIMAL(3,2) DEFAULT 0.0,
  predicted_value DECIMAL(12,2),
  conversion_probability DECIMAL(3,2),
  
  -- Behavioral Insights
  engagement_level engagement_level DEFAULT 'unknown',
  communication_preference JSONB DEFAULT '{}',
  optimal_contact_time JSONB DEFAULT '{}',
  
  -- Custom Fields and Tags
  custom_fields JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  next_follow_up_at TIMESTAMP WITH TIME ZONE
);

-- Lead status enum
CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'qualified', 'proposal', 'negotiation', 
  'closed_won', 'closed_lost', 'nurturing', 'unqualified'
);

-- Engagement level enum
CREATE TYPE engagement_level AS ENUM (
  'unknown', 'low', 'medium', 'high', 'very_high'
);
```

### 3. AI and Analytics Tables

```sql
-- Lead scoring history and explanations
CREATE TABLE lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  model_version VARCHAR(50) NOT NULL,
  
  -- Scoring factors breakdown
  demographic_score INTEGER,
  behavioral_score INTEGER,
  temporal_score INTEGER,
  conversational_score INTEGER,
  
  -- Explanations and recommendations
  explanation JSONB NOT NULL, -- Array of explanation factors
  recommendations JSONB DEFAULT '[]', -- Suggested next actions
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights and predictions
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  insight_type insight_type NOT NULL,
  
  -- Insight data
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  priority priority_level DEFAULT 'medium',
  
  -- Insight metadata
  data JSONB DEFAULT '{}', -- Additional structured data
  expires_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE insight_type AS ENUM (
  'buying_signal', 'churn_risk', 'optimal_contact_time', 
  'content_recommendation', 'next_best_action', 'competitive_threat'
);

CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Lead journey tracking
CREATE TABLE journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  
  -- Event details
  description TEXT,
  properties JSONB DEFAULT '{}',
  
  -- Context
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  -- Timing
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Communication and Activity Tables

```sql
-- Activities (calls, emails, meetings, etc.)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Activity details
  type activity_type NOT NULL,
  subject VARCHAR(500),
  description TEXT,
  outcome VARCHAR(255),
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  
  -- AI Analysis
  sentiment_score DECIMAL(3,2), -- -1 to 1
  intent_detected VARCHAR(100),
  buying_signals JSONB DEFAULT '[]',
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE activity_type AS ENUM (
  'call', 'email', 'meeting', 'demo', 'proposal', 
  'follow_up', 'note', 'task', 'social_interaction'
);

-- Conversations (emails, chat messages, etc.)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id),
  
  -- Message details
  direction conversation_direction NOT NULL,
  channel VARCHAR(50) NOT NULL, -- email, phone, chat, etc.
  subject VARCHAR(500),
  content TEXT NOT NULL,
  
  -- AI Analysis Results
  sentiment JSONB DEFAULT '{}', -- {overall, confidence, emotions}
  intent JSONB DEFAULT '{}', -- {primary_intent, confidence, urgency}
  topics JSONB DEFAULT '[]', -- Extracted topics and keywords
  entities JSONB DEFAULT '[]', -- Named entities (people, companies, etc.)
  
  -- Metadata
  external_id VARCHAR(255), -- ID from external system (email, etc.)
  thread_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  analyzed_at TIMESTAMP WITH TIME ZONE
);

CREATE TYPE conversation_direction AS ENUM ('inbound', 'outbound');
```

### 5. Performance and Analytics Tables

```sql
-- Forecasting data
CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  forecast_type forecast_type NOT NULL,
  
  -- Forecast period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  granularity VARCHAR(20) DEFAULT 'monthly', -- daily, weekly, monthly
  
  -- Predictions
  predicted_value DECIMAL(15,2) NOT NULL,
  confidence_lower DECIMAL(15,2),
  confidence_upper DECIMAL(15,2),
  
  -- Model information
  model_version VARCHAR(50) NOT NULL,
  key_drivers JSONB DEFAULT '[]',
  scenarios JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE forecast_type AS ENUM (
  'revenue', 'lead_volume', 'conversion_rate', 'deal_velocity'
);

-- Performance metrics for users and teams
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  
  -- Time period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metrics
  leads_created INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  revenue_generated DECIMAL(15,2) DEFAULT 0,
  activities_completed INTEGER DEFAULT 0,
  
  -- Calculated metrics
  conversion_rate DECIMAL(5,4),
  average_deal_size DECIMAL(15,2),
  sales_velocity DECIMAL(10,2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔍 Indexes and Performance Optimization

```sql
-- Essential indexes for performance
CREATE INDEX idx_leads_organization_status ON leads(organization_id, status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_score ON leads(current_score DESC);
CREATE INDEX idx_leads_updated_at ON leads(updated_at DESC);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;

-- Full-text search indexes
CREATE INDEX idx_leads_search ON leads USING gin(to_tsvector('english', 
  coalesce(first_name, '') || ' ' || 
  coalesce(last_name, '') || ' ' || 
  coalesce(company, '') || ' ' || 
  coalesce(email, '')
));

-- AI-specific indexes
CREATE INDEX idx_lead_scores_lead_id_created ON lead_scores(lead_id, created_at DESC);
CREATE INDEX idx_ai_insights_lead_priority ON ai_insights(lead_id, priority, created_at DESC);
CREATE INDEX idx_journey_events_lead_occurred ON journey_events(lead_id, occurred_at DESC);

-- Activity and conversation indexes
CREATE INDEX idx_activities_lead_type_completed ON activities(lead_id, type, completed_at DESC);
CREATE INDEX idx_conversations_lead_created ON conversations(lead_id, created_at DESC);
CREATE INDEX idx_conversations_sentiment ON conversations USING gin(sentiment);
```
