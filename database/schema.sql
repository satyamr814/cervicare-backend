-- CerviCare Backend Database Schema
-- PostgreSQL Schema for Phase 1 Preventive Healthcare Platform

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User profiles table for lifestyle and demographic data
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 120),
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
    city VARCHAR(100) NOT NULL,
    diet_type VARCHAR(20) NOT NULL CHECK (diet_type IN ('veg', 'nonveg', 'vegan')),
    budget_level VARCHAR(20) NOT NULL CHECK (budget_level IN ('low', 'medium', 'high')),
    lifestyle VARCHAR(30) NOT NULL CHECK (lifestyle IN ('sedentary', 'moderately_active', 'active')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Expert-curated diet content table
CREATE TABLE diet_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diet_type VARCHAR(20) NOT NULL CHECK (diet_type IN ('veg', 'nonveg', 'vegan')),
    budget_level VARCHAR(20) NOT NULL CHECK (budget_level IN ('low', 'medium', 'high')),
    region VARCHAR(100) NOT NULL,
    food_name VARCHAR(200) NOT NULL,
    reason TEXT NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Expert-curated protection plan content table
CREATE TABLE protection_plan_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_band VARCHAR(30) NOT NULL CHECK (risk_band IN ('low', 'moderate', 'higher_attention')),
    plan_type VARCHAR(20) NOT NULL CHECK (plan_type IN ('basic', 'complete', 'premium')),
    section VARCHAR(30) NOT NULL CHECK (section IN ('diet', 'lifestyle', 'screening')),
    content_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_diet_content_composite ON diet_content(diet_type, budget_level, region);
CREATE INDEX idx_protection_plan_composite ON protection_plan_content(risk_band, plan_type, section);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diet_content_updated_at BEFORE UPDATE ON diet_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_protection_plan_content_updated_at BEFORE UPDATE ON protection_plan_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (can be removed in production)
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('veg', 'low', 'delhi_ncr', 'Spinach', 'Rich in iron and folate, essential for cervical health', '3-4 times per week'),
('veg', 'medium', 'mumbai', 'Broccoli', 'Contains antioxidants and vitamin C', '2-3 times per week'),
('nonveg', 'high', 'bangalore', 'Salmon', 'High in omega-3 fatty acids', '2 times per week');

INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('low', 'basic', 'diet', 'Focus on balanced nutrition with plenty of fruits and vegetables.'),
('moderate', 'complete', 'lifestyle', 'Engage in regular physical activity and maintain healthy weight.'),
('higher_attention', 'premium', 'screening', 'Regular medical check-ups and screenings as recommended by healthcare providers.');
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
-- CerviCare Backend Phase 2 Database Schema Updates
-- Add consent fields and admin functionality

-- Add consent fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN whatsapp_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN marketing_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN phone VARCHAR(20);

-- Add index for phone field (useful for WhatsApp integration)
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone) WHERE phone IS NOT NULL;

-- Create admin_users table for admin access control
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create content_audit_log table for tracking admin changes
CREATE TABLE content_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete')),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create webhook_logs table for tracking automation events
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    webhook_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create google_sheets_sync_log table for tracking sync events
CREATE TABLE google_sheets_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id),
    data JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_content_audit_log_admin_id ON content_audit_log(admin_id);
CREATE INDEX idx_content_audit_log_created_at ON content_audit_log(created_at);
CREATE INDEX idx_webhook_logs_user_id ON webhook_logs(user_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);
CREATE INDEX idx_google_sheets_sync_user_id ON google_sheets_sync_log(user_id);
CREATE INDEX idx_google_sheets_sync_created_at ON google_sheets_sync_log(created_at);

-- Trigger to update updated_at for admin_users
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (change password in production)
INSERT INTO admin_users (email, password_hash, role) VALUES 
('admin@cervicare.com', '$2a$10$placeholder_hash_change_this', 'admin');

-- Comments for documentation
COMMENT ON COLUMN user_profiles.whatsapp_consent IS 'User consent for WhatsApp communications';
COMMENT ON COLUMN user_profiles.marketing_consent IS 'User consent for marketing communications';
COMMENT ON COLUMN user_profiles.phone IS 'User phone number for WhatsApp integration';
COMMENT ON TABLE admin_users IS 'Administrative users with access to content management';
COMMENT ON TABLE content_audit_log IS 'Audit trail for all content changes by administrators';
COMMENT ON TABLE webhook_logs IS 'Log of all webhook calls to automation systems';
COMMENT ON TABLE google_sheets_sync_log IS 'Log of Google Sheets synchronization events';
-- Profile Image and Avatar Support Schema Updates
-- Adds support for profile images, AI avatars, and custom uploads

-- Extend user_profiles table with image support
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(20) DEFAULT 'default' CHECK (avatar_type IN ('default', 'ai_generated', 'custom_upload', 'random')),
ADD COLUMN IF NOT EXISTS avatar_metadata JSONB,
ADD COLUMN IF NOT EXISTS image_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS image_processing_status VARCHAR(20) DEFAULT 'completed' CHECK (image_processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Create avatar templates table for AI and random avatars
CREATE TABLE IF NOT EXISTS avatar_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('ai_style', 'random_set', 'custom')),
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    description TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create image uploads table for tracking custom uploads
CREATE TABLE IF NOT EXISTS image_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    upload_status VARCHAR(20) DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed', 'deleted')),
    processing_error TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Create avatar generation requests table
CREATE TABLE IF NOT EXISTS avatar_generation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    generation_type VARCHAR(20) NOT NULL CHECK (generation_type IN ('ai_generated', 'random_selected')),
    request_data JSONB,
    result_image_url VARCHAR(500),
    generation_status VARCHAR(20) DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_avatar_type ON user_profiles(avatar_type);
CREATE INDEX IF NOT EXISTS idx_user_profiles_image_uploaded_at ON user_profiles(image_uploaded_at);
CREATE INDEX IF NOT EXISTS idx_avatar_templates_type ON avatar_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_avatar_templates_active ON avatar_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_image_uploads_user_id ON image_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_image_uploads_status ON image_uploads(upload_status);
CREATE INDEX IF NOT EXISTS idx_avatar_generation_requests_user_id ON avatar_generation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_avatar_generation_requests_status ON avatar_generation_requests(generation_status);

-- Insert default avatar templates
INSERT INTO avatar_templates (template_name, template_type, image_url, description, tags) VALUES
-- AI Style Avatars
('Professional Blue', 'ai_style', 'https://api.dicebear.com/7.x/avataaars/svg?seed=professional-blue&backgroundColor=3b82f6', 'Professional blue avatar', ['professional', 'blue', 'business']),
('Elegant Purple', 'ai_style', 'https://api.dicebear.com/7.x/avataaars/svg?seed=elegant-purple&backgroundColor=a855f7', 'Elegant purple avatar', ['elegant', 'purple', 'stylish']),
('Natural Green', 'ai_style', 'https://api.dicebear.com/7.x/avataaars/svg?seed=natural-green&backgroundColor=10b981', 'Natural green avatar', ['natural', 'green', 'fresh']),
('Warm Orange', 'ai_style', 'https://api.dicebear.com/7.x/avataaars/svg?seed=warm-orange&backgroundColor=f97316', 'Warm orange avatar', ['warm', 'orange', 'friendly']),
('Cool Teal', 'ai_style', 'https://api.dicebear.com/7.x/avataaars/svg?seed=cool-teal&backgroundColor=14b8a6', 'Cool teal avatar', ['cool', 'teal', 'calm']),

-- Random Set Avatars
('Adventurer 1', 'random_set', 'https://api.dicebear.com/7.x/adventurer/svg?seed=adventurer-1', 'Adventurer style avatar 1', ['adventurer', 'explorer', 'outdoor']),
('Adventurer 2', 'random_set', 'https://api.dicebear.com/7.x/adventurer/svg?seed=adventurer-2', 'Adventurer style avatar 2', ['adventurer', 'explorer', 'outdoor']),
('Bottts 1', 'random_set', 'https://api.dicebear.com/7.x/bottts/svg?seed=bottts-1', 'Bottts robot avatar 1', ['robot', 'tech', 'digital']),
('Bottts 2', 'random_set', 'https://api.dicebear.com/7.x/bottts/svg?seed=bottts-2', 'Bottts robot avatar 2', ['robot', 'tech', 'digital']),
('Lorelei 1', 'random_set', 'https://api.dicebear.com/7.x/lorelei/svg?seed=lorelei-1', 'Lorelei elegant avatar 1', ['elegant', 'stylish', 'fashion']),
('Lorelei 2', 'random_set', 'https://api.dicebear.com/7.x/lorelei/svg?seed=lorelei-2', 'Lorelei elegant avatar 2', ['elegant', 'stylish', 'fashion']),
('Notionists 1', 'random_set', 'https://api.dicebear.com/7.x/notionists/svg?seed=notionists-1', 'Notion style avatar 1', ['professional', 'business', 'clean']),
('Notionists 2', 'random_set', 'https://api.dicebear.com/7.x/notionists/svg?seed=notionists-2', 'Notion style avatar 2', ['professional', 'business', 'clean']),
('Personas 1', 'random_set', 'https://api.dicebear.com/7.x/personas/svg?seed=personas-1', 'Personas realistic avatar 1', ['realistic', 'natural', 'human']),
('Personas 2', 'random_set', 'https://api.dicebear.com/7.x/personas/svg?seed=personas-2', 'Personas realistic avatar 2', ['realistic', 'natural', 'human'])
ON CONFLICT (template_name) DO NOTHING;

-- Create function to update avatar usage count
CREATE OR REPLACE FUNCTION update_avatar_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.avatar_type != OLD.avatar_type THEN
        UPDATE avatar_templates 
        SET usage_count = usage_count + 1 
        WHERE template_name = COALESCE(NEW.avatar_metadata->>'template_name', '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for avatar usage tracking
CREATE TRIGGER trigger_update_avatar_usage_count
    AFTER UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_avatar_usage_count();

-- Create view for user profile summary with avatar info
CREATE OR REPLACE VIEW user_profile_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.role,
    u.plan_type,
    u.created_at as signup_date,
    up.avatar_type,
    up.profile_image_url,
    up.image_uploaded_at,
    up.avatar_metadata,
    CASE 
        WHEN up.profile_image_url IS NOT NULL THEN up.profile_image_url
        WHEN up.avatar_type = 'ai_generated' THEN COALESCE(up.avatar_metadata->>'generated_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')
        WHEN up.avatar_type = 'random' THEN COALESCE(up.avatar_metadata->>'template_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=default')
        ELSE 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
    END as display_image_url,
    up.age,
    up.gender,
    up.city,
    up.diet_type,
    up.lifestyle,
    up.whatsapp_consent,
    up.marketing_consent,
    up.phone
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended with avatar and image support';
COMMENT ON TABLE avatar_templates IS 'Pre-defined avatar templates for AI and random avatars';
COMMENT ON TABLE image_uploads IS 'Tracks custom image uploads by users';
COMMENT ON TABLE avatar_generation_requests IS 'Tracks AI avatar generation requests';

COMMIT;
-- CerviCare Backend Phase 4 Database Updates
-- Focus: Profile customization, Data integrity, and Completion tracking

-- 1. Add profile customization and status fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- 2. Add validation constraint for profile_image_url (basic protocol check)
-- This ensures the URL starts with http://, https://, or data:
-- Note: Already existing UI urls are expected.
ALTER TABLE user_profiles 
ADD CONSTRAINT check_profile_image_url 
CHECK (profile_image_url IS NULL OR profile_image_url ~* '^(https?://|data:image/)');

-- 3. Add index for profile_completed to help with analytics and filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_completed ON user_profiles(profile_completed);

-- 4. Audit Log Comments
COMMENT ON COLUMN user_profiles.profile_image_url IS 'URL for user profile picture or AI avatar';
COMMENT ON COLUMN user_profiles.profile_completed IS 'Derived flag indicating if all required profile fields are filled';

-- 5. Trigger or Function to help maintenance (optional, but good for integrity)
-- We will handle the flag update in the Node.js model for more flexibility with "rules",
-- but we ensure the column exists here.
