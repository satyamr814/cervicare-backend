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
