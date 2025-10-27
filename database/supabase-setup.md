# LeadAI Pro - Supabase Database Setup

## 🚀 Quick Setup Guide

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name: "leadai-pro"
3. Generate a strong database password
4. Select a region close to your users
5. Wait for the project to be created (2-3 minutes)

### 2. Get Database Connection Details

From your Supabase dashboard:
1. Go to Settings → Database
2. Copy the connection string
3. Note down the database URL, API URL, and anon key

### 3. Environment Variables Setup

Create a `.env` file in your project root:

```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# AI Services
OPENAI_API_KEY="[YOUR-OPENAI-KEY]"
HUGGINGFACE_API_KEY="[YOUR-HUGGINGFACE-KEY]"

# App Configuration
NEXTAUTH_SECRET="[GENERATE-RANDOM-SECRET]"
NEXTAUTH_URL="http://localhost:3000"
```

## 📊 Database Schema Migration

### 1. Install Dependencies

```bash
npm install prisma @prisma/client
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
```

### 2. Initialize Prisma

```bash
npx prisma generate
npx prisma db push
```

### 3. Run Initial Migration

```bash
npx prisma migrate dev --name init
```

## 🔧 Advanced Database Configuration

### 1. Enable Row Level Security (RLS)

Run these SQL commands in the Supabase SQL editor:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
```

### 2. Create RLS Policies

```sql
-- Organizations: Users can only access their own organization
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can update own organization" ON organizations
  FOR UPDATE USING (
    id = (SELECT organization_id FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users: Users can view users in their organization
CREATE POLICY "Users can view organization members" ON users
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- Leads: Users can access leads in their organization
CREATE POLICY "Users can view organization leads" ON leads
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create leads" ON leads
  FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update assigned leads" ON leads
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()) AND
    (assigned_to = auth.uid() OR 
     EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  );

-- Activities: Users can access activities for leads in their organization
CREATE POLICY "Users can view lead activities" ON activities
  FOR SELECT USING (
    lead_id IN (
      SELECT id FROM leads WHERE organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    lead_id IN (
      SELECT id FROM leads WHERE organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

### 3. Create Database Functions

```sql
-- Function to automatically update lead scores when activities are added
CREATE OR REPLACE FUNCTION update_lead_score_on_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger AI scoring recalculation
  INSERT INTO lead_scores (lead_id, score, confidence, model_version, explanation)
  VALUES (
    NEW.lead_id,
    -- Placeholder score calculation (will be replaced by AI service)
    COALESCE((SELECT current_score FROM leads WHERE id = NEW.lead_id), 0) + 5,
    0.8,
    'v1.0',
    '["Activity added: ' || NEW.type || '"]'::jsonb
  );
  
  -- Update lead's current score
  UPDATE leads 
  SET 
    current_score = COALESCE(current_score, 0) + 5,
    updated_at = NOW()
  WHERE id = NEW.lead_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_lead_score
  AFTER INSERT ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score_on_activity();

-- Function to calculate performance metrics
CREATE OR REPLACE FUNCTION calculate_user_performance(
  user_uuid UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  leads_created INTEGER,
  leads_qualified INTEGER,
  leads_converted INTEGER,
  revenue_generated DECIMAL,
  conversion_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as leads_created,
    COUNT(CASE WHEN l.status IN ('qualified', 'proposal', 'negotiation', 'closed_won') THEN 1 END)::INTEGER as leads_qualified,
    COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END)::INTEGER as leads_converted,
    COALESCE(SUM(CASE WHEN l.status = 'closed_won' THEN l.predicted_value END), 0) as revenue_generated,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        COUNT(CASE WHEN l.status = 'closed_won' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL
      ELSE 0
    END as conversion_rate
  FROM leads l
  WHERE l.assigned_to = user_uuid
    AND l.created_at >= start_date
    AND l.created_at <= end_date;
END;
$$ LANGUAGE plpgsql;
```

### 4. Create Indexes for Performance

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_leads_org_status_score ON leads(organization_id, status, current_score DESC);
CREATE INDEX CONCURRENTLY idx_leads_assigned_updated ON leads(assigned_to, updated_at DESC);
CREATE INDEX CONCURRENTLY idx_activities_lead_completed ON activities(lead_id, completed_at DESC);
CREATE INDEX CONCURRENTLY idx_conversations_lead_created ON conversations(lead_id, created_at DESC);

-- Full-text search index
CREATE INDEX CONCURRENTLY idx_leads_fts ON leads USING gin(
  to_tsvector('english', 
    COALESCE(first_name, '') || ' ' || 
    COALESCE(last_name, '') || ' ' || 
    COALESCE(company, '') || ' ' || 
    COALESCE(email, '')
  )
);

-- JSON indexes for AI data
CREATE INDEX CONCURRENTLY idx_ai_insights_data ON ai_insights USING gin(data);
CREATE INDEX CONCURRENTLY idx_lead_scores_explanation ON lead_scores USING gin(explanation);
CREATE INDEX CONCURRENTLY idx_conversations_sentiment ON conversations USING gin(sentiment);
```

## 🔄 Real-time Subscriptions Setup

### 1. Enable Realtime for Tables

```sql
-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

### 2. Create Realtime Policies

```sql
-- Realtime policies (users can subscribe to their organization's data)
CREATE POLICY "Users can subscribe to organization leads" ON leads
  FOR SELECT USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can subscribe to lead activities" ON activities
  FOR SELECT USING (
    lead_id IN (
      SELECT id FROM leads WHERE organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );
```

## 🧪 Sample Data for Testing

### 1. Create Test Organization and Users

```sql
-- Insert test organization
INSERT INTO organizations (id, name, domain, industry, size) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Acme Corp', 'acme.com', 'Technology', 'medium');

-- Insert test users
INSERT INTO users (id, email, full_name, role, organization_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@acme.com', 'John Admin', 'admin', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440002', 'sales@acme.com', 'Jane Sales', 'sales_rep', '550e8400-e29b-41d4-a716-446655440000');
```

### 2. Create Sample Leads

```sql
-- Insert sample leads
INSERT INTO leads (first_name, last_name, email, company, job_title, status, current_score, organization_id, assigned_to) VALUES
('Alice', 'Johnson', 'alice@techcorp.com', 'TechCorp', 'CTO', 'qualified', 85, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002'),
('Bob', 'Smith', 'bob@startup.io', 'Startup Inc', 'CEO', 'new', 65, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002'),
('Carol', 'Davis', 'carol@enterprise.com', 'Enterprise Ltd', 'VP Sales', 'contacted', 75, '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002');
```

## 🔍 Database Monitoring and Maintenance

### 1. Performance Monitoring Queries

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT 
  indexrelname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### 2. Backup and Recovery

```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql $DATABASE_URL < backup_file.sql
```

## 🚨 Security Best Practices

1. **Always use RLS**: Never disable row level security
2. **Validate inputs**: Use Prisma's built-in validation
3. **Audit logs**: Enable audit logging for sensitive operations
4. **Regular backups**: Automated daily backups
5. **Monitor access**: Track unusual access patterns
6. **Update regularly**: Keep Supabase and dependencies updated

## 📈 Scaling Considerations

1. **Connection pooling**: Use PgBouncer for high-traffic applications
2. **Read replicas**: Consider read replicas for analytics queries
3. **Partitioning**: Partition large tables by date or organization
4. **Archiving**: Archive old data to separate tables
5. **Caching**: Use Redis for frequently accessed data
