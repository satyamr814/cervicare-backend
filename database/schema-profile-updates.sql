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
