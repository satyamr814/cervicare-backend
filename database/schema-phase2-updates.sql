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
