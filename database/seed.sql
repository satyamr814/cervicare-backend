-- ============================================
-- CerviCare Phase 1 - Sample Curated Content
-- ============================================
-- This file contains expert-curated content for diet recommendations
-- and protection plans. This content is manually defined and not AI-generated.

-- Clear existing sample data (optional - comment out if you want to keep existing data)
-- DELETE FROM diet_content;
-- DELETE FROM protection_plan_content;

-- ============================================
-- DIET CONTENT - Curated Food Recommendations
-- ============================================

-- Vegetarian Diet - Low Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('veg', 'low', 'delhi_ncr', 'Spinach (Palak)', 'Rich in iron, folate, and vitamins A, C, E. Essential for cervical health and immune function.', '3-4 times per week'),
('veg', 'low', 'delhi_ncr', 'Carrots (Gajar)', 'High in beta-carotene and antioxidants. Supports immune system and cell health.', 'Daily'),
('veg', 'low', 'delhi_ncr', 'Tomatoes (Tamatar)', 'Contains lycopene, a powerful antioxidant. Supports cellular health.', 'Daily'),
('veg', 'low', 'delhi_ncr', 'Lentils (Dal)', 'High in protein, fiber, and folate. Essential for overall health.', 'Daily'),
('veg', 'low', 'delhi_ncr', 'Oranges (Santra)', 'Excellent source of vitamin C. Boosts immune system.', '3-4 times per week'),

('veg', 'low', 'mumbai', 'Spinach (Palak)', 'Rich in iron, folate, and vitamins. Essential for cervical health.', '3-4 times per week'),
('veg', 'low', 'mumbai', 'Sweet Potato (Shakarkandi)', 'High in beta-carotene and fiber. Supports immune function.', '2-3 times per week'),
('veg', 'low', 'mumbai', 'Cabbage (Patta Gobi)', 'Contains antioxidants and vitamin C. Supports cellular health.', '2-3 times per week'),

('veg', 'low', 'general', 'Leafy Greens', 'Rich in essential vitamins and minerals for cervical health.', '4-5 times per week'),
('veg', 'low', 'general', 'Citrus Fruits', 'High in vitamin C. Boosts immune system.', '3-4 times per week'),
('veg', 'low', 'general', 'Whole Grains', 'Provides fiber and B vitamins. Supports overall health.', 'Daily'),

-- Vegetarian Diet - Medium Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('veg', 'medium', 'delhi_ncr', 'Broccoli', 'Contains sulforaphane and antioxidants. Powerful for cellular health.', '2-3 times per week'),
('veg', 'medium', 'delhi_ncr', 'Bell Peppers (Shimla Mirch)', 'High in vitamin C and antioxidants. Supports immune function.', '3-4 times per week'),
('veg', 'medium', 'delhi_ncr', 'Berries (Strawberry, Blueberry)', 'Rich in antioxidants and vitamin C. Protects cells from damage.', '3-4 times per week'),
('veg', 'medium', 'delhi_ncr', 'Paneer (Cottage Cheese)', 'Good source of protein and calcium. Supports overall health.', '2-3 times per week'),
('veg', 'medium', 'delhi_ncr', 'Almonds', 'Rich in vitamin E and healthy fats. Supports immune system.', 'Daily (handful)'),

('veg', 'medium', 'bangalore', 'Broccoli', 'Contains powerful antioxidants for cellular health.', '2-3 times per week'),
('veg', 'medium', 'bangalore', 'Avocado', 'Rich in healthy fats and vitamin E. Supports hormone balance.', '2-3 times per week'),
('veg', 'medium', 'bangalore', 'Greek Yogurt', 'High in protein and probiotics. Supports gut and immune health.', 'Daily'),

('veg', 'medium', 'general', 'Cruciferous Vegetables', 'Contains compounds that support cellular health.', '3-4 times per week'),
('veg', 'medium', 'general', 'Nuts and Seeds', 'Rich in vitamin E and healthy fats.', 'Daily'),

-- Vegetarian Diet - High Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('veg', 'high', 'delhi_ncr', 'Quinoa', 'Complete protein source with all essential amino acids. Rich in nutrients.', '3-4 times per week'),
('veg', 'high', 'delhi_ncr', 'Kale', 'Superfood rich in vitamins A, C, K and antioxidants.', '3-4 times per week'),
('veg', 'high', 'delhi_ncr', 'Chia Seeds', 'High in omega-3 fatty acids and fiber. Supports overall health.', 'Daily'),
('veg', 'high', 'delhi_ncr', 'Exotic Berries', 'Powerful antioxidants. Protects cells from oxidative stress.', '4-5 times per week'),

('veg', 'high', 'general', 'Superfoods', 'Nutrient-dense foods with powerful health benefits.', 'Daily'),

-- Non-Vegetarian Diet - Low Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('nonveg', 'low', 'delhi_ncr', 'Eggs', 'Complete protein source. Rich in vitamins and minerals.', 'Daily'),
('nonveg', 'low', 'delhi_ncr', 'Chicken (Local)', 'Lean protein source. Supports immune function.', '2-3 times per week'),
('nonveg', 'low', 'delhi_ncr', 'Spinach', 'Rich in iron and folate. Essential for health.', '3-4 times per week'),
('nonveg', 'low', 'delhi_ncr', 'Carrots', 'High in beta-carotene. Supports immune system.', 'Daily'),

('nonveg', 'low', 'general', 'Eggs', 'Affordable complete protein with essential nutrients.', 'Daily'),
('nonveg', 'low', 'general', 'Leafy Greens', 'Rich in vitamins and minerals.', '4-5 times per week'),

-- Non-Vegetarian Diet - Medium Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('nonveg', 'medium', 'delhi_ncr', 'Salmon', 'Rich in omega-3 fatty acids. Powerful anti-inflammatory properties.', '2 times per week'),
('nonveg', 'medium', 'delhi_ncr', 'Chicken Breast', 'Lean protein. Supports muscle and immune health.', '3-4 times per week'),
('nonveg', 'medium', 'delhi_ncr', 'Broccoli', 'Contains antioxidants for cellular health.', '2-3 times per week'),
('nonveg', 'medium', 'delhi_ncr', 'Bell Peppers', 'High in vitamin C. Supports immune function.', '3-4 times per week'),

('nonveg', 'medium', 'bangalore', 'Fish (Mackerel, Sardines)', 'Rich in omega-3 and vitamin D. Supports overall health.', '2-3 times per week'),
('nonveg', 'medium', 'bangalore', 'Turkey', 'Lean protein source. Low in fat.', '2-3 times per week'),

('nonveg', 'medium', 'general', 'Fatty Fish', 'Rich in omega-3 fatty acids. Anti-inflammatory.', '2-3 times per week'),
('nonveg', 'medium', 'general', 'Lean Poultry', 'Good protein source. Supports immune health.', '3-4 times per week'),

-- Non-Vegetarian Diet - High Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('nonveg', 'high', 'delhi_ncr', 'Wild Salmon', 'Premium source of omega-3 fatty acids. Powerful health benefits.', '3 times per week'),
('nonveg', 'high', 'delhi_ncr', 'Organic Chicken', 'High-quality lean protein. Free from antibiotics.', '3-4 times per week'),
('nonveg', 'high', 'delhi_ncr', 'Tuna', 'Rich in protein and omega-3. Supports cellular health.', '2 times per week'),
('nonveg', 'high', 'delhi_ncr', 'Kale', 'Superfood with powerful antioxidants.', '3-4 times per week'),

('nonveg', 'high', 'general', 'Premium Seafood', 'Rich in omega-3 and essential nutrients.', '3-4 times per week'),

-- Vegan Diet - Low Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('vegan', 'low', 'delhi_ncr', 'Lentils (Masoor, Moong)', 'High in protein and fiber. Essential for vegan diet.', 'Daily'),
('vegan', 'low', 'delhi_ncr', 'Chickpeas (Chana)', 'Good protein source. Rich in nutrients.', '4-5 times per week'),
('vegan', 'low', 'delhi_ncr', 'Spinach', 'Rich in iron and vitamins. Essential for health.', '3-4 times per week'),
('vegan', 'low', 'delhi_ncr', 'Carrots', 'High in beta-carotene. Supports immune system.', 'Daily'),
('vegan', 'low', 'delhi_ncr', 'Peanuts', 'Affordable protein and healthy fats.', 'Daily (handful)'),

('vegan', 'low', 'general', 'Legumes', 'Essential protein source for vegan diet.', 'Daily'),
('vegan', 'low', 'general', 'Leafy Greens', 'Rich in vitamins and minerals.', '4-5 times per week'),

-- Vegan Diet - Medium Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('vegan', 'medium', 'delhi_ncr', 'Tofu', 'Complete protein source. Versatile and nutritious.', '3-4 times per week'),
('vegan', 'medium', 'delhi_ncr', 'Almonds', 'Rich in vitamin E and healthy fats.', 'Daily (handful)'),
('vegan', 'medium', 'delhi_ncr', 'Broccoli', 'Contains powerful antioxidants.', '2-3 times per week'),
('vegan', 'medium', 'delhi_ncr', 'Berries', 'Rich in antioxidants and vitamin C.', '3-4 times per week'),
('vegan', 'medium', 'delhi_ncr', 'Flaxseeds', 'Plant-based omega-3 source.', 'Daily'),

('vegan', 'medium', 'general', 'Soy Products', 'Complete protein for vegan diet.', '3-4 times per week'),
('vegan', 'medium', 'general', 'Nuts and Seeds', 'Rich in healthy fats and nutrients.', 'Daily'),

-- Vegan Diet - High Budget
INSERT INTO diet_content (diet_type, budget_level, region, food_name, reason, frequency) VALUES
('vegan', 'high', 'delhi_ncr', 'Quinoa', 'Complete protein with all amino acids.', '3-4 times per week'),
('vegan', 'high', 'delhi_ncr', 'Chia Seeds', 'Rich in omega-3 and fiber.', 'Daily'),
('vegan', 'high', 'delhi_ncr', 'Spirulina', 'Superfood rich in protein and nutrients.', '3-4 times per week'),
('vegan', 'high', 'delhi_ncr', 'Kale', 'Nutrient-dense superfood.', '3-4 times per week'),

('vegan', 'high', 'general', 'Superfoods', 'Nutrient-dense plant-based foods.', 'Daily'),

-- ============================================
-- PROTECTION PLAN CONTENT - Risk-Based Guidance
-- ============================================

-- LOW RISK BAND - Basic Plan
INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('low', 'basic', 'diet', 'Focus on a balanced diet rich in fruits and vegetables. Include at least 5 servings of colorful fruits and vegetables daily. Prioritize foods high in vitamins A, C, and E.'),
('low', 'basic', 'diet', 'Incorporate whole grains like brown rice, whole wheat, and oats into your daily meals for fiber and B vitamins.'),
('low', 'basic', 'diet', 'Stay hydrated with 8-10 glasses of water daily. Limit processed foods and sugary beverages.'),

('low', 'basic', 'lifestyle', 'Engage in at least 30 minutes of moderate physical activity 5 days a week. This can include brisk walking, yoga, or cycling.'),
('low', 'basic', 'lifestyle', 'Maintain a healthy weight through balanced nutrition and regular exercise.'),
('low', 'basic', 'lifestyle', 'Get 7-8 hours of quality sleep each night to support immune function.'),
('low', 'basic', 'lifestyle', 'Practice stress management through meditation, deep breathing, or hobbies you enjoy.'),

('low', 'basic', 'screening', 'Schedule regular health check-ups as recommended by your healthcare provider.'),
('low', 'basic', 'screening', 'Discuss cervical cancer screening options with your doctor, typically starting at age 21.'),
('low', 'basic', 'screening', 'Stay informed about HPV vaccination if you are in the eligible age group.'),

-- LOW RISK BAND - Complete Plan
INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('low', 'complete', 'diet', 'Follow a nutrient-dense diet with emphasis on cruciferous vegetables (broccoli, cauliflower, cabbage) 3-4 times per week.'),
('low', 'complete', 'diet', 'Include foods rich in folate such as leafy greens, lentils, and fortified grains daily.'),
('low', 'complete', 'diet', 'Consume antioxidant-rich berries and citrus fruits regularly to support cellular health.'),
('low', 'complete', 'diet', 'Limit alcohol consumption and avoid smoking to reduce risk factors.'),

('low', 'complete', 'lifestyle', 'Maintain an active lifestyle with a mix of cardio and strength training exercises.'),
('low', 'complete', 'lifestyle', 'Practice good hygiene and safe health practices.'),
('low', 'complete', 'lifestyle', 'Build a strong support system and maintain positive mental health.'),

('low', 'complete', 'screening', 'Follow recommended screening guidelines: Pap test every 3 years (ages 21-29) or Pap + HPV test every 5 years (ages 30-65).'),
('low', 'complete', 'screening', 'Keep a health journal to track screenings and any unusual symptoms.'),

-- MODERATE RISK BAND - Basic Plan
INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('moderate', 'basic', 'diet', 'Emphasize anti-inflammatory foods including colorful vegetables, fruits, and whole grains.'),
('moderate', 'basic', 'diet', 'Include foods high in vitamin C (citrus fruits, bell peppers) and vitamin E (nuts, seeds) daily.'),
('moderate', 'basic', 'diet', 'Reduce consumption of processed meats and high-fat foods.'),

('moderate', 'basic', 'lifestyle', 'Increase physical activity to 45 minutes of moderate exercise 5-6 days per week.'),
('moderate', 'basic', 'lifestyle', 'Focus on maintaining a healthy BMI through balanced nutrition and regular activity.'),
('moderate', 'basic', 'lifestyle', 'Prioritize stress reduction through regular relaxation practices.'),

('moderate', 'basic', 'screening', 'Adhere strictly to recommended screening schedules. Do not skip appointments.'),
('moderate', 'basic', 'screening', 'Discuss your personal risk factors with your healthcare provider.'),
('moderate', 'basic', 'screening', 'Be aware of warning signs and report any unusual symptoms promptly.'),

-- MODERATE RISK BAND - Complete Plan
INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('moderate', 'complete', 'diet', 'Follow a Mediterranean-style diet rich in vegetables, fruits, whole grains, and healthy fats.'),
('moderate', 'complete', 'diet', 'Include omega-3 rich foods (fatty fish, flaxseeds, walnuts) 2-3 times per week.'),
('moderate', 'complete', 'diet', 'Consume cruciferous vegetables (broccoli, kale, Brussels sprouts) at least 4 times per week.'),
('moderate', 'complete', 'diet', 'Consider vitamin D supplementation after consulting with your healthcare provider.'),

('moderate', 'complete', 'lifestyle', 'Engage in regular physical activity combining cardio, strength training, and flexibility exercises.'),
('moderate', 'complete', 'lifestyle', 'Avoid tobacco products completely and limit alcohol intake.'),
('moderate', 'complete', 'lifestyle', 'Maintain healthy sleep patterns and manage stress effectively.'),

('moderate', 'complete', 'screening', 'Follow recommended screening: Pap + HPV co-testing every 5 years or Pap test every 3 years.'),
('moderate', 'complete', 'screening', 'Discuss HPV vaccination with your doctor if you are in the eligible age range.'),
('moderate', 'complete', 'screening', 'Keep detailed records of all health screenings and follow up on any abnormal results immediately.'),

-- MODERATE RISK BAND - Premium Plan
INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('moderate', 'premium', 'diet', 'Work with a nutritionist to create a personalized anti-inflammatory diet plan.'),
('moderate', 'premium', 'diet', 'Include superfoods like berries, leafy greens, and omega-3 rich foods daily.'),
('moderate', 'premium', 'diet', 'Consider targeted supplementation (vitamins C, E, D, folate) under medical supervision.'),

('moderate', 'premium', 'lifestyle', 'Develop a comprehensive wellness plan including exercise, stress management, and sleep optimization.'),
('moderate', 'premium', 'lifestyle', 'Consider working with a fitness trainer for personalized exercise programs.'),

('moderate', 'premium', 'screening', 'Maintain regular screening schedule with a gynecologist you trust.'),
('moderate', 'premium', 'screening', 'Consider additional preventive consultations to discuss latest screening technologies.'),

-- HIGHER ATTENTION RISK BAND - Basic Plan
INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('higher_attention', 'basic', 'diet', 'Prioritize nutrient-dense, anti-inflammatory foods. Focus on vegetables, fruits, and whole grains.'),
('higher_attention', 'basic', 'diet', 'Increase intake of foods rich in antioxidants, vitamins, and minerals.'),
('higher_attention', 'basic', 'diet', 'Eliminate processed foods, excess sugar, and unhealthy fats from your diet.'),

('higher_attention', 'basic', 'lifestyle', 'Commit to regular physical activity - aim for 60 minutes of moderate exercise daily.'),
('higher_attention', 'basic', 'lifestyle', 'If sedentary lifestyle has been a pattern, gradually increase activity levels with medical guidance.'),
('higher_attention', 'basic', 'lifestyle', 'Prioritize stress management and mental well-being.'),

('higher_attention', 'basic', 'screening', 'Strictly adhere to all recommended screening schedules. This is critical.'),
('higher_attention', 'basic', 'screening', 'Establish a relationship with a trusted gynecologist for regular check-ups.'),
('higher_attention', 'basic', 'screening', 'Be vigilant about any unusual symptoms and report them immediately.'),

-- HIGHER ATTENTION RISK BAND - Complete Plan
INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('higher_attention', 'complete', 'diet', 'Follow a comprehensive anti-inflammatory diet rich in plant-based foods.'),
('higher_attention', 'complete', 'diet', 'Include cruciferous vegetables, berries, and omega-3 rich foods regularly.'),
('higher_attention', 'complete', 'diet', 'Work with a healthcare provider to address any nutritional deficiencies.'),
('higher_attention', 'complete', 'diet', 'Consider evidence-based supplements under medical supervision.'),

('higher_attention', 'complete', 'lifestyle', 'Develop a structured exercise routine combining cardio, strength, and flexibility training.'),
('higher_attention', 'complete', 'lifestyle', 'If over 50, discuss age-appropriate exercise programs with your doctor.'),
('higher_attention', 'complete', 'lifestyle', 'Eliminate all tobacco use and minimize alcohol consumption.'),
('higher_attention', 'complete', 'lifestyle', 'Prioritize 7-9 hours of quality sleep and effective stress management.'),

('higher_attention', 'complete', 'screening', 'Follow recommended screening: Pap + HPV co-testing every 5 years or as advised by your doctor.'),
('higher_attention', 'complete', 'screening', 'Discuss your age-related risk factors with your healthcare provider.'),
('higher_attention', 'complete', 'screening', 'Stay informed about latest screening guidelines and technologies.'),
('higher_attention', 'complete', 'screening', 'Never delay or skip scheduled screenings and follow-ups.'),

-- HIGHER ATTENTION RISK BAND - Premium Plan
INSERT INTO protection_plan_content (risk_band, plan_type, section, content_text) VALUES
('higher_attention', 'premium', 'diet', 'Work with a registered dietitian to create a personalized nutrition plan focused on cellular health.'),
('higher_attention', 'premium', 'diet', 'Include targeted superfoods and evidence-based supplements as recommended by your healthcare team.'),
('higher_attention', 'premium', 'diet', 'Consider regular nutritional assessments to optimize your diet.'),

('higher_attention', 'premium', 'lifestyle', 'Engage with a wellness coach or fitness professional for personalized guidance.'),
('higher_attention', 'premium', 'lifestyle', 'Develop a comprehensive lifestyle modification plan addressing exercise, sleep, and stress.'),
('higher_attention', 'premium', 'lifestyle', 'Consider mind-body practices like yoga or tai chi for overall well-being.'),

('higher_attention', 'premium', 'screening', 'Maintain close relationship with your gynecologist with regular check-ups.'),
('higher_attention', 'premium', 'screening', 'Discuss advanced screening options and personalized screening schedules.'),
('higher_attention', 'premium', 'screening', 'Stay proactive about your health with regular preventive consultations.'),
('higher_attention', 'premium', 'screening', 'Keep comprehensive health records and be an active participant in your healthcare decisions.');

-- ============================================
-- Verification
-- ============================================
-- Check inserted data
SELECT 'Diet Content Count:' as info, COUNT(*) as count FROM diet_content
UNION ALL
SELECT 'Protection Plan Content Count:' as info, COUNT(*) as count FROM protection_plan_content;
