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
