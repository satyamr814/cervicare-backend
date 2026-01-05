-- CerviCare Backend Phase 4 Database Schema Updates
-- Adds role-based access control, analytics, monetization readiness, and production hardening

-- Extend users table with roles and plan information
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'trial'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Product analytics events table
CREATE TABLE IF NOT EXISTS product_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for events table
CREATE INDEX IF NOT EXISTS idx_product_events_user_id ON product_events(user_id);
CREATE INDEX IF NOT EXISTS idx_product_events_event_type ON product_events(event_type);
CREATE INDEX IF NOT EXISTS idx_product_events_timestamp ON product_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_product_events_session_id ON product_events(session_id);

-- User engagement metrics table (aggregated data)
CREATE TABLE IF NOT EXISTS user_engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    events_count INTEGER DEFAULT 0,
    unique_sessions INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE,
    engagement_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Content performance analytics
CREATE TABLE IF NOT EXISTS content_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    views_count INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    last_viewed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    performance_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, content_type)
);

-- Premium feature usage tracking
CREATE TABLE IF NOT EXISTS premium_feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, feature_name)
);

-- Security audit logs
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action ON security_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_timestamp ON security_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_success ON security_audit_logs(success);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address INET NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    request_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    blocked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_address ON rate_limit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_endpoint ON rate_limit_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_window_start ON rate_limit_logs(window_start);

-- System metrics for health monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    metric_unit VARCHAR(20),
    tags JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for system metrics
CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp);

-- Feature flags table for gradual rollouts
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    rollout_percentage DECIMAL(5,2) DEFAULT 0.00,
    target_user_roles TEXT[],
    target_plan_types TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User feature assignments
CREATE TABLE IF NOT EXISTS user_feature_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    flag_name VARCHAR(100) REFERENCES feature_flags(flag_name) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, flag_name)
);

-- Insert default admin user (if not exists)
INSERT INTO users (id, email, password_hash, role, plan_type, is_active, email_verified, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    'admin@cervicare.com',
    '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
    'admin',
    'premium',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@cervicare.com');

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, description, enabled, rollout_percentage, target_user_roles, target_plan_types)
VALUES 
    ('premium_analytics', 'Advanced analytics dashboard for premium users', false, 0.00, ARRAY['admin', 'user'], ARRAY['premium']),
    ('whatsapp_automation', 'WhatsApp automation features', true, 100.00, ARRAY['admin', 'user'], ARRAY['free', 'premium']),
    ('advanced_recommendations', 'AI-powered health recommendations', false, 0.00, ARRAY['admin', 'user'], ARRAY['premium']),
    ('export_data', 'Export user data functionality', false, 0.00, ARRAY['admin'], ARRAY['premium'])
ON CONFLICT (flag_name) DO NOTHING;

-- Create view for user analytics summary
CREATE OR REPLACE VIEW user_analytics_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u.plan_type,
    u.created_at as signup_date,
    u.last_login_at,
    COALESCE(up.age, 0) as age,
    COALESCE(up.gender, 'unknown') as gender,
    COALESCE(up.city, 'unknown') as city,
    COALESCE(up.diet_type, 'unknown') as diet_type,
    COALESCE(up.lifestyle, 'unknown') as lifestyle,
    COALESCE(pe.total_events, 0) as total_events,
    COALESCE(pe.last_activity, u.created_at) as last_activity,
    COALESCE(pe.engagement_score, 0.00) as engagement_score,
    CASE 
        WHEN u.last_login_at >= CURRENT_DATE - INTERVAL '7 days' THEN 'active'
        WHEN u.last_login_at >= CURRENT_DATE - INTERVAL '30 days' THEN 'moderate'
        ELSE 'inactive'
    END as activity_status
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_events,
        MAX(timestamp) as last_activity,
        AVG(engagement_score) as engagement_score
    FROM product_events
    WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id
) pe ON u.id = pe.user_id;

-- Create view for content performance summary
CREATE OR REPLACE VIEW content_performance_summary AS
SELECT 
    ca.content_id,
    ca.content_type,
    ca.views_count,
    ca.unique_users,
    ca.conversion_rate,
    ca.performance_score,
    CASE 
        WHEN ca.content_type = 'diet' THEN dc.food_name
        WHEN ca.content_type = 'protection' THEN ppc.reason
        ELSE 'Unknown Content'
    END as content_title,
    ca.last_viewed
FROM content_analytics ca
LEFT JOIN diet_content dc ON ca.content_id = dc.id AND ca.content_type = 'diet'
LEFT JOIN protection_plan_content ppc ON ca.content_id = ppc.id AND ca.content_type = 'protection';

-- Create function to update user engagement metrics
CREATE OR REPLACE FUNCTION update_user_engagement_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_engagement_metrics (user_id, date, events_count, unique_sessions, last_activity, engagement_score)
    VALUES (
        NEW.user_id,
        CURRENT_DATE,
        1,
        CASE WHEN NEW.session_id IS NOT NULL THEN 1 ELSE 0 END,
        NEW.timestamp,
        CASE 
            WHEN NEW.event_type IN ('diet_plan_viewed', 'protection_plan_viewed') THEN 10.0
            WHEN NEW.event_type IN ('profile_completed', 'whatsapp_opt_in') THEN 8.0
            WHEN NEW.event_type = 'user_signed_up' THEN 5.0
            ELSE 1.0
        END
    )
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        events_count = user_engagement_metrics.events_count + 1,
        unique_sessions = user_engagement_metrics.unique_sessions + 
            CASE WHEN NEW.session_id IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM product_events pe 
                WHERE pe.user_id = NEW.user_id 
                AND pe.session_id = NEW.session_id 
                AND pe.timestamp >= CURRENT_DATE
            ) THEN 1 ELSE 0 END,
        last_activity = NEW.timestamp,
        engagement_score = user_engagement_metrics.engagement_score + 
        CASE 
            WHEN NEW.event_type IN ('diet_plan_viewed', 'protection_plan_viewed') THEN 10.0
            WHEN NEW.event_type IN ('profile_completed', 'whatsapp_opt_in') THEN 8.0
            WHEN NEW.event_type = 'user_signed_up' THEN 5.0
            ELSE 1.0
        END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic engagement metrics
CREATE TRIGGER trigger_update_user_engagement_metrics
    AFTER INSERT ON product_events
    FOR EACH ROW
    EXECUTE FUNCTION update_user_engagement_metrics();

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_audit_logs (user_id, action, resource_type, resource_id, success, timestamp)
    VALUES (
        COALESCE(NEW.user_id, NULL),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, NULL),
        true,
        CURRENT_TIMESTAMP
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for security logging
CREATE TRIGGER trigger_security_log_users
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_security_event();

CREATE TRIGGER trigger_security_log_admin_users
    AFTER INSERT OR UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION log_security_event();

-- Create function to cleanup old analytics data
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete product events older than 90 days
    DELETE FROM product_events WHERE timestamp < CURRENT_DATE - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete rate limit logs older than 7 days
    DELETE FROM rate_limit_logs WHERE window_start < CURRENT_DATE - INTERVAL '7 days';
    
    -- Delete system metrics older than 30 days
    DELETE FROM system_metrics WHERE timestamp < CURRENT_DATE - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create index for better performance on analytics queries
CREATE INDEX IF NOT EXISTS idx_product_events_user_timestamp ON product_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_content_analytics_performance ON content_analytics(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_engagement_metrics_score ON user_engagement_metrics(engagement_score DESC);

-- Add comments for documentation
COMMENT ON TABLE product_events IS 'Tracks all user interactions and events for analytics';
COMMENT ON TABLE user_engagement_metrics IS 'Aggregated daily engagement metrics per user';
COMMENT ON TABLE content_analytics IS 'Performance metrics for content pieces';
COMMENT ON TABLE premium_feature_usage IS 'Tracks usage of premium features by users';
COMMENT ON TABLE security_audit_logs IS 'Security and compliance audit trail';
COMMENT ON TABLE rate_limit_logs IS 'Rate limiting enforcement tracking';
COMMENT ON TABLE system_metrics IS 'System health and performance metrics';
COMMENT ON TABLE feature_flags IS 'Feature flag management for gradual rollouts';

COMMIT;
