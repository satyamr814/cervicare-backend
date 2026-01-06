-- CerviCare Backend Phase 2 Database Schema
-- Focus: Operational capabilities, Admin control, and Action tracking

-- 1. Extend Users table for Role-Based Access Control (RBAC)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin'));

-- 2. Extend User Profiles for Consent and Automation
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;

-- 3. Extend Content tables for Soft Delete and Admin Tracking
ALTER TABLE diet_content 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

ALTER TABLE protection_plan_content 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- 4. Create User Actions table for Analytics and Insights
CREATE TABLE IF NOT EXISTS user_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL, -- signup, login, profile_completed, diet_plan_viewed, protection_plan_viewed
    source VARCHAR(50) DEFAULT 'website',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at);

-- 5. Create Admin Audit Logs table for security and tracking
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL, -- create, update, activate, deactivate
    target_table VARCHAR(100) NOT NULL,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target ON admin_audit_logs(target_table, target_id);

-- 6. Create Webhook Logs table for Customer Support / Automation Tracking
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    webhook_type VARCHAR(50) NOT NULL, -- n8n_support, whatsapp_reminder, etc.
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);

-- 7. Comments for documentation
COMMENT ON COLUMN users.role IS 'User role for access control: user, admin, super_admin';
COMMENT ON COLUMN user_profiles.whatsapp_consent IS 'User consent for WhatsApp communications';
COMMENT ON COLUMN user_profiles.marketing_consent IS 'User consent for marketing communications';
COMMENT ON COLUMN diet_content.is_active IS 'Soft delete flag for diet content';
COMMENT ON COLUMN protection_plan_content.is_active IS 'Soft delete flag for protection plan content';
COMMENT ON TABLE user_actions IS 'Tracks all significant user interactions for usage insights';
COMMENT ON TABLE admin_audit_logs IS 'Tracks all administrative changes to content and system state';
COMMENT ON TABLE webhook_logs IS 'Tracks all automated messages and support triggers';
