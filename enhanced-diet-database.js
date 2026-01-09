// Enhanced Meal Database with Risk-Based & Delhi NCR Features
// This will replace the existing mealDatabase in script.js

const enhancedMealDatabase = {
    vegetarian: {
        breakfast: [
            // LOW RISK - Maintenance
            { name: 'Oats Porridge', ingredients: 'Oats, Milk, Almonds, Honey', time: '10 min', cost: 45, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Buy oats in bulk at Big Bazaar', details: 'Rich in fiber and antioxidants. Soothes digestive system.' },
            { name: 'Poha with Peanuts', ingredients: 'Poha, Peanuts, Turmeric, Curry Leaves', time: '15 min', cost: 30, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Fresh curry leaves at local sabzi mandi', details: 'Light breakfast with turmeric\'s anti-inflammatory properties.' },
            
            // MODERATE RISK - Prevention
            { name: 'Spinach Paratha with Flaxseeds', ingredients: 'Wheat Flour, Spinach, Flaxseeds, Ghee', time: '25 min', cost: 50, benefit: 'green', riskLevel: 'moderate', seasonal: 'Winter', quick: false, marketTip: 'Fresh spinach at Azadpur Mandi (Winter)', details: 'Flaxseeds provide omega-3. Spinach rich in iron and folate.' },
            { name: 'Methi Thepla', ingredients: 'Wheat Flour, Fenugreek Leaves, Yogurt', time: '20 min', cost: 40, benefit: 'green', riskLevel: 'moderate', seasonal: 'Winter', quick: true, marketTip: 'Methi available Nov-Feb at local markets', details: 'Fenugreek helps regulate blood sugar and has anti-cancer properties.' },
            
            // HIGH RISK - Intervention
            { name: 'Broccoli & Tomato Cheela', ingredients: 'Broccoli, Tomato, Besan, Turmeric', time: '20 min', cost: 55, benefit: 'red', riskLevel: 'high', seasonal: 'Winter', quick: true, marketTip: 'Broccoli best in winter at Azadpur', details: 'Broccoli has sulforaphane, strong anti-cancer compound. Tomatoes provide lycopene.' },
            { name: 'Berry & Chia Smoothie Bowl', ingredients: 'Berries, Chia Seeds, Almonds, Yogurt', time: '10 min', cost: 80, benefit: 'red', riskLevel: 'high', seasonal: 'All', quick: true, marketTip: 'Frozen berries at Modern Bazaar', details: 'Berries rich in antioxidants. Chia provides omega-3 and fiber.' },
            
            // Additional options
            { name: 'Idli Sambar', ingredients: 'Rice Idli, Toor Dal, Vegetables', time: '15 min', cost: 40, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Ready batter at Nature\'s Basket', details: 'Fermented food aids gut health. Light and nutritious.' },
            { name: 'Paneer Sandwich', ingredients: 'Bread, Paneer, Tomato, Mint Chutney', time: '10 min', cost: 50, benefit: 'red', riskLevel: 'moderate', seasonal: 'All', quick: true, marketTip: 'Fresh paneer from Mother Dairy', details: 'Protein-rich breakfast. Mint aids digestion.' },
        ],
        
        lunch: [
            // LOW RISK
            { name: 'Dal Tadka & Rice', ingredients: 'Toor Dal, Rice, Cumin, Tomatoes', time: '30 min', cost: 55, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: false, marketTip: 'Dal best prices at Khari Baoli', details: 'Complete protein source. Turmeric in tadka has anti-inflammatory benefits.' },
            { name: 'Veg Pulao with Raita', ingredients: 'Basmati Rice, Mixed Veg, Curd', time: '25 min', cost: 65, benefit: 'green', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Fresh vegetables Tuesday/Friday at local mandi', details: 'Balanced meal with probiotics from curd.' },
            
            // MODERATE RISK
            { name: 'Rajma Chawal with Extra Turmeric', ingredients: 'Kidney Beans, Rice, Turmeric, Tomatoes', time: '35 min', cost: 60, benefit: 'red', riskLevel: 'moderate', seasonal: 'All', quick: false, marketTip: 'Buy rajma in bulk at Big Bazaar', details: 'Enhanced with anti-inflammatory turmeric. High in protein and fiber.' },
            { name: 'Chole with Broccoli', ingredients: 'Chickpeas, Broccoli, Onions, Spices', time: '30 min', cost: 70, benefit: 'red', riskLevel: 'moderate', seasonal: 'Winter', quick: true, marketTip: 'Broccoli fresh at Azadpur (Winter)', details: 'Delhi favorite with cancer-fighting broccoli added.' },
            { name: 'Palak Paneer & Roti', ingredients: 'Spinach, Paneer, Wheat Roti, Garlic', time: '30 min', cost: 75, benefit: 'green', riskLevel: 'moderate', seasonal: 'Winter', quick: true, marketTip: 'Palak fresh in winter months', details: 'Spinach rich in folate. Garlic boosts immunity.' },
            
            // HIGH RISK
            { name: 'Quinoa Khichdi with Vegetables', ingredients: 'Quinoa, Moong Dal, Broccoli, Turmeric', time: '25 min', cost: 90, benefit: 'red', riskLevel: 'high', seasonal: 'All', quick: true, marketTip: 'Quinoa at Nature\'s Basket or Amazon', details: 'Superfood combination. High in complete proteins and antioxidants.' },
            { name: 'Brown Rice with Mixed Dal', ingredients: 'Brown Rice, Mixed Dal, Garlic, Tomatoes', time: '35 min', cost: 70, benefit: 'yellow', riskLevel: 'high', seasonal: 'All', quick: false, marketTip: 'Brown rice at organic stores', details: 'Whole grain with higher fiber. Garlic has allicin with anti-cancer properties.' },
            
            // Additional
            { name: 'Veg Korma & Pulao', ingredients: 'Mixed Veg, Cashews, Rice', time: '35 min', cost: 85, benefit: 'green', riskLevel: 'low', seasonal: 'All', quick: false, marketTip: 'Cashews at Khari Baoli', details: 'Rich, satisfying meal with healthy fats from cashews.' },
        ],
        
        dinner: [
            // LOW RISK
            { name: 'Simple Khichdi', ingredients: 'Rice, Moong Dal, Ghee', time: '25 min', cost: 50, benefit: 'green', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Organic dal at Foodhall', details: 'Easy to digest. Perfect comfort food.' },
            { name: 'Aloo Gobi Sabzi', ingredients: 'Potato, Cauliflower, Turmeric', time: '25 min', cost: 45, benefit: 'yellow', riskLevel: 'low', seasonal: 'Winter', quick: true, marketTip: 'Gobi cheapest in winter', details: 'Cauliflower contains compounds that may prevent cancer.' },
            
            // MODERATE RISK
            { name: 'Paneer Tikka & Whole Wheat Roti', ingredients: 'Paneer, Bell Peppers, Yogurt, Wheat Roti', time: '30 min', cost: 80, benefit: 'red', riskLevel: 'moderate', seasonal: 'All', quick: true, marketTip: 'Capsicum best Nov-March', details: 'Grilled preparation reduces oil. Bell peppers rich in Vitamin C.' },
            { name: 'Vegetable Soup with Garlic Toast', ingredients: 'Carrot, Tomato, Broccoli, Garlic', time: '20 min', cost: 60, benefit: 'red', riskLevel: 'moderate', seasonal: 'Winter', quick: true, marketTip: 'Winter vegetables at local mandi', details: 'Light dinner. Garlic and veggies boost immunity.' },
            
            // HIGH RISK
            { name: 'Turmeric Dal with Greens', ingredients: 'Moong Dal, Spinach, Turmeric, Lemon', time: '25 min', cost: 65, benefit: 'green', riskLevel: 'high', seasonal: 'Winter', quick: true, marketTip: 'Organic turmeric at organic bazaar', details: 'Maximum anti-inflammatory benefits. Lemon enhances turmeric absorption.' },
            { name: 'Millet Roti with Mixed Veg', ingredients: 'Bajra Flour, Seasonal Vegetables', time: '30 min', cost: 70, benefit: 'green', riskLevel: 'high', seasonal: 'Winter', quick: false, marketTip: 'Bajra flour at Khari Baoli', details: 'Millets are gluten-free and rich in minerals.' },
            
            // Additional
            { name: 'Mixed Dal & Rice', ingredients: 'Mixed Lentils, Rice, Cumin', time: '30 min', cost: 55, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: false, marketTip: 'Mixed dal packets save time', details: 'Variety of dals provide complete nutrition.' },
        ],
        
        snacks: [
            { name: 'Fruit Chaat', ingredients: 'Apple, Banana, Orange, Chaat Masala', time: '5 min', cost: 35, benefit: 'red', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Morning fruit markets cheapest', details: 'Fresh fruits rich in vitamins and fiber.' },
            { name: 'Roasted Makhana', ingredients: 'Fox Nuts, Ghee, Black Pepper', time: '10 min', cost: 40, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Makhana at Modern Bazaar', details: 'Low calorie, high protein snack.' },
            { name: 'Sprout Salad', ingredients: 'Moong Sprouts, Tomato, Lemon', time: '10 min', cost: 30, benefit: 'green', riskLevel: 'moderate', seasonal: 'All', quick: true, marketTip: 'Sprouts available everywhere', details: 'Living food with enzymes and nutrients.' },
            { name: 'Carrot & Tomato Soup', ingredients: 'Carrot, Tomato, Garlic, Herbs', time: '15 min', cost: 35, benefit: 'red', riskLevel: 'high', seasonal: 'Winter', quick: true, marketTip: 'Winter vegetables freshest', details: 'Beta-carotene and lycopene for cancer prevention.' },
        ]
    },
    
    // Similar enhanced structure for nonvegetarian, vegan, eggetarian...
    // (truncated for brevity but would include all diet types)
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = enhancedMealDatabase;
}
