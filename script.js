document.addEventListener('DOMContentLoaded', function () {

    // ===== CHECK LOGIN STATE AND UPDATE NAVBAR =====
    async function updateNavbarForLogin() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userData = localStorage.getItem('user');
        const signInBtn = document.getElementById('sign-in-btn');
        const signUpBtn = document.getElementById('sign-up-btn');
        const userProfileIcon = document.getElementById('user-profile-icon');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const navProfileImg = document.getElementById('nav-profile-img');
        const navProfileIconDefault = document.getElementById('nav-profile-icon-default');

        if (isLoggedIn && userData) {
            try {
                const user = JSON.parse(userData);
                if (userProfileIcon) userProfileIcon.style.display = 'block';
                if (signInBtn) signInBtn.style.display = 'none';
                if (signUpBtn) signUpBtn.style.display = 'none';
                if (profileName && user.firstName) profileName.textContent = `${user.firstName} ${user.lastName || ''}`.trim();
                if (profileEmail && user.email) profileEmail.textContent = user.email;

                // Fetch avatar
                if (navProfileImg && navProfileIconDefault) {
                    try {
                        const userId = user.id || user.userId || user._id;
                        // Mock fetch for now, or real endpoint if exists
                        // const response = await fetch(`/api/avatar/current/${userId}`);
                        // const data = await response.json();
                        navProfileImg.style.display = 'none'; // Default to icon for stability
                        navProfileIconDefault.style.display = 'inline-block';
                    } catch (err) {
                        navProfileImg.style.display = 'none';
                        navProfileIconDefault.style.display = 'inline-block';
                    }
                }
            } catch (e) { console.error('Error parsing user data:', e); }
        } else {
            if (signInBtn) signInBtn.style.display = 'inline-block';
            if (signUpBtn) signUpBtn.style.display = 'inline-block';
            if (userProfileIcon) userProfileIcon.style.display = 'none';
        }
    }
    updateNavbarForLogin();

    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
            updateNavbarForLogin();
            window.location.reload();
        });
    }

    // ===== DISABLE AUDIO/VIDEO =====
    function disableAllAudio() {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        document.querySelectorAll('video').forEach(v => { v.muted = true; v.volume = 0; });
        document.querySelectorAll('audio').forEach(a => { a.muted = true; a.volume = 0; a.pause(); });
    }
    disableAllAudio(); // on load

    // ===== HERO & RISK SECTIONS =====
    const calculateRiskBtn = document.querySelector('.btn-hero-primary');
    if (calculateRiskBtn) {
        calculateRiskBtn.addEventListener('click', function (e) {
            e.preventDefault();
            disableAllAudio();
            const riskSection = document.getElementById('risk-section-feature');
            if (riskSection) {
                riskSection.style.display = 'block';
                const y = riskSection.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        });
    }

    // ===== CHATBOT MODAL =====
    const chatbotModal = document.getElementById('chatbot-modal');
    const chatbotTriggers = document.querySelectorAll('.chatbot-trigger, #askcervi-link, #ai-analysis-btn');

    function openChatbotModal() {
        if (chatbotModal) {
            chatbotModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            disableAllAudio();
        }
    }

    chatbotTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openChatbotModal();
        });
    });

    // ===== GPS MODAL =====
    const gpsModal = document.getElementById('gps-modal');
    const gpsTriggers = document.querySelectorAll('.gps-trigger, #find-doctors-link');
    let map;

    function openGPSModal() {
        if (gpsModal) {
            gpsModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            setTimeout(() => { if (!map) initMap(); }, 100);
        }
    }

    gpsTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openGPSModal();
        });
    });

    function initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer || typeof L === 'undefined') return;

        map = L.map('map').setView([20.5937, 78.9629], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        document.getElementById('locate-me-btn')?.addEventListener('click', getUserLocation);
        document.getElementById('search-hospitals-btn')?.addEventListener('click', () => {
            window.open(`https://www.google.com/maps/search/hospital+gynecologist+near+me/`, '_blank');
        });
    }
    window.initMap = initMap;

    function getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(pos => {
                const { latitude, longitude } = pos.coords;
                if (map) {
                    map.setView([latitude, longitude], 13);
                    L.marker([latitude, longitude]).addTo(map).bindPopup('You are here').openPopup();
                }
                document.getElementById('hospital-results').innerHTML = `<div class='location-success'><h3>📍 Location Found</h3><p>Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}</p></div>`;
            }, err => {
                alert('Could not get location: ' + err.message);
            });
        } else {
            alert('Geolocation not supported');
        }
    }

    // ===== COMMON MODAL CLOSING =====
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.modal').style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // ===== HEALTH INSIGHTS MODAL & FEATURES =====
    const healthModal = document.getElementById('health-modal');
    const healthTriggers = document.querySelectorAll('.health-insights-trigger');
    const riskGaugeFill = document.getElementById('gauge-fill');
    const riskValueText = document.getElementById('risk-value-text');
    const riskLevelText = document.getElementById('risk-level-text');

    healthTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            if (healthModal) {
                healthModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                // Get risk from main page or default
                const currentRisk = parseInt(document.getElementById('riskPercent')?.innerText) || 24;
                updateRiskGauge(currentRisk);
            }
        });
    });

    // Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Update Risk Gauge Function
    function updateRiskGauge(percent) {
        if (!riskGaugeFill || !riskValueText) return;

        const offset = 126 - (percent / 100 * 126);
        let color = '#22c55e'; // Green
        let level = 'Low Risk';

        if (percent > 75) { color = '#ef4444'; level = 'Severe Risk'; }
        else if (percent > 50) { color = '#f97316'; level = 'High Risk'; }
        else if (percent > 25) { color = '#eab308'; level = 'Moderate Risk'; }

        riskGaugeFill.style.stroke = color;
        riskGaugeFill.style.strokeDashoffset = offset;
        riskValueText.innerText = percent + '%';
        riskValueText.style.color = color;
        if (riskLevelText) {
            riskLevelText.innerText = level;
            riskLevelText.style.color = color;
        }
    }

    // ===== ENHANCED DIET PLAN GENERATOR =====

    // Meal Database including Delhi NCR specials
    const mealDatabase = {
        vegetarian: {
            breakfast: [
                { name: 'Oats Porridge', ingredients: 'Oats, Milk, Almonds, Honey', time: '10 min', cost: 45, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Buy oats in bulk at Big Bazaar' },
                { name: 'Poha with Peanuts', ingredients: 'Poha, Peanuts, Turmeric, Curry Leaves', time: '15 min', cost: 30, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Fresh curry leaves at local sabzi mandi' },
                { name: 'Spinach Paratha', ingredients: 'Wheat Flour, Spinach, Flaxseeds, Ghee', time: '25 min', cost: 50, benefit: 'green', riskLevel: 'moderate', seasonal: 'Winter', quick: false, marketTip: 'Fresh spinach at Azadpur Mandi' },
                { name: 'Methi Thepla', ingredients: 'Wheat Flour, Fenugreek Leaves, Yogurt', time: '20 min', cost: 40, benefit: 'green', riskLevel: 'moderate', seasonal: 'Winter', quick: true, marketTip: 'Methi available Nov-Feb' }
            ],
            lunch: [
                { name: 'Dal Tadka & Rice', ingredients: 'Toor Dal, Rice, Cumin, Tomatoes', time: '30 min', cost: 55, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: false, marketTip: 'Dal best prices at Khari Baoli' },
                { name: 'Rajma Chawal', ingredients: 'Kidney Beans, Rice, Turmeric, Tomatoes', time: '35 min', cost: 60, benefit: 'red', riskLevel: 'moderate', seasonal: 'All', quick: false, marketTip: 'Buy rajma in bulk' },
                { name: 'Palak Paneer', ingredients: 'Spinach, Paneer, Wheat Roti, Garlic', time: '30 min', cost: 75, benefit: 'green', riskLevel: 'moderate', seasonal: 'Winter', quick: true, marketTip: 'Palak fresh in winter months' }
            ],
            dinner: [
                { name: 'Simple Khichdi', ingredients: 'Rice, Moong Dal, Ghee', time: '25 min', cost: 50, benefit: 'green', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Organic dal at Foodhall' },
                { name: 'Turmeric Dal', ingredients: 'Moong Dal, Spinach, Turmeric, Lemon', time: '25 min', cost: 65, benefit: 'green', riskLevel: 'high', seasonal: 'Winter', quick: true, marketTip: 'Organic turmeric recommended' }
            ],
            snacks: [
                { name: 'Fruit Chaat', ingredients: 'Apple, Banana, Orange, Chaat Masala', time: '5 min', cost: 35, benefit: 'red', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Morning fruit markets cheapest' },
                { name: 'Sprout Salad', ingredients: 'Moong Sprouts, Tomato, Lemon', time: '10 min', cost: 30, benefit: 'green', riskLevel: 'moderate', seasonal: 'All', quick: true, marketTip: 'Sprouts available everywhere' }
            ]
        },
        nonvegetarian: {
            breakfast: [
                { name: 'Egg Bhurji', ingredients: 'Eggs, Onion, Tomato, Bread', time: '15 min', cost: 50, benefit: 'yellow', riskLevel: 'low', seasonal: 'All', quick: true, marketTip: 'Fresh eggs at local dairy' }
            ],
            lunch: [
                { name: 'Chicken Curry', ingredients: 'Chicken, Rice, Tomato, Spices', time: '40 min', cost: 120, benefit: 'red', riskLevel: 'high', seasonal: 'All', quick: false, marketTip: 'Wholesale spices at Khari Baoli' }
            ],
            dinner: [
                { name: 'Grilled Chicken', ingredients: 'Chicken Breast, Olive Oil, Lemon', time: '30 min', cost: 110, benefit: 'green', riskLevel: 'moderate', seasonal: 'All', quick: true, marketTip: 'Frozen chicken at Modern Bazaar' }
            ],
            snacks: [
                { name: 'Chicken Tikka', ingredients: 'Chicken, Yogurt, Spices', time: '25 min', cost: 100, benefit: 'red', riskLevel: 'moderate', seasonal: 'All', quick: true, marketTip: 'Ready mix at local stores' }
            ]
        },
        vegan: { breakfast: [], lunch: [], dinner: [], snacks: [] },
        eggetarian: { breakfast: [], lunch: [], dinner: [], snacks: [] }
    };

    // Quick populate vegan/eggetarian for demo
    mealDatabase.vegan = JSON.parse(JSON.stringify(mealDatabase.vegetarian));
    mealDatabase.eggetarian = JSON.parse(JSON.stringify(mealDatabase.vegetarian));

    // Smart Substitutions
    const ingredientSubstitutions = {
        'Broccoli': { cheaper: 'Cauliflower', seasonal: 'Cabbage', similar: 'Green Beans' },
        'Quinoa': { cheaper: 'Daliya', seasonal: 'Millets', similar: 'Brown Rice' },
        'Avocado': { cheaper: 'Banana', seasonal: 'Coconut', similar: 'Paneer' },
        'Olive Oil': { cheaper: 'Mustard Oil', seasonal: 'Ghee', similar: 'Sesame Oil' },
        'Almonds': { cheaper: 'Peanuts', seasonal: 'Sunflower Seeds', similar: 'Walnuts' }
    };

    // Form Submission
    const dietForm = document.getElementById('diet-plan-form');
    if (dietForm) {
        dietForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Get values
            const budget = document.getElementById('budget-select').value;
            const diet = document.getElementById('diet-select').value;

            // Enhanced validation with visual feedback
            if (!budget || !diet) {
                alert('⚠️ Please select both Budget and Dietary Preference to generate your personalized plan.');

                // Highlight empty fields
                if (!budget) document.getElementById('budget-select').style.border = '2px solid #ef4444';
                if (!diet) document.getElementById('diet-select').style.border = '2px solid #ef4444';

                // Reset borders after 2 seconds
                setTimeout(() => {
                    document.getElementById('budget-select').style.border = '';
                    document.getElementById('diet-select').style.border = '';
                }, 2000);
                return;
            }

            // Show loading
            showLoading();

            // Simulate processing delay for better UX
            setTimeout(() => {
                try {
                    // Generate and Render
                    const riskVal = parseInt(riskValueText?.innerText) || 24;
                    const plan = generateRiskAwareMealPlan(riskVal, budget, diet);
                    renderEnhancedMealPlan(plan);
                    renderShoppingList(plan);

                    // Hide loading
                    hideLoading();

                    // Show success notification
                    showSuccess('🎉 Your personalized meal plan is ready!');

                    // Show Results
                    document.getElementById('diet-form-container').style.display = 'none';
                    document.getElementById('diet-plan-results').style.display = 'block';

                    // Scroll to results
                    document.getElementById('meal-plan-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });

                } catch (error) {
                    hideLoading();
                    console.error('Error generating meal plan:', error);
                    alert('❌ Something went wrong generating your meal plan. Please try again.');
                }
            }, 1500); // 1.5 second delay for smooth UX
        });
    }

    document.getElementById('back-to-form-btn')?.addEventListener('click', () => {
        document.getElementById('diet-form-container').style.display = 'block';
        document.getElementById('diet-plan-results').style.display = 'none';
    });

    function generateRiskAwareMealPlan(riskPercentage, budget, diet) {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const plan = [];
        const meals = mealDatabase[diet] || mealDatabase.vegetarian;

        // Risk Logic
        let riskCategory = 'low';
        if (riskPercentage > 50) riskCategory = 'high';
        else if (riskPercentage > 25) riskCategory = 'moderate';

        // Budget Logic
        const dailyBudget = budget === 'economical' ? 120 : (budget === 'midrange' ? 250 : 600);

        days.forEach(day => {
            plan.push({
                day: day,
                meals: {
                    breakfast: selectMeal(meals.breakfast, riskCategory, dailyBudget * 0.25),
                    lunch: selectMeal(meals.lunch, riskCategory, dailyBudget * 0.40),
                    dinner: selectMeal(meals.dinner, riskCategory, dailyBudget * 0.25),
                    snacks: selectMeal(meals.snacks, riskCategory, dailyBudget * 0.10)
                }
            });
        });
        return plan;
    }

    function selectMeal(list, riskCategory, maxCost) {
        if (!list || list.length === 0) return { name: 'Healthy Meal', ingredients: 'Veggies', time: '20 min', cost: 50, benefit: 'green', marketTip: '' };

        // Filter by cost
        let candidates = list.filter(m => m.cost <= maxCost);
        if (candidates.length === 0) candidates = list; // fallback

        // Prefer risk specific
        let riskMatches = candidates.filter(m => m.riskLevel === riskCategory);
        if (riskMatches.length > 0) candidates = riskMatches;

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    function renderEnhancedMealPlan(plan) {
        const grid = document.getElementById('meal-plan-grid');
        if (!grid) return;
        grid.innerHTML = '';

        plan.forEach(d => {
            let mealHTML = '';
            Object.keys(d.meals).forEach(type => {
                const m = d.meals[type];

                // Ingredients with Tooltips
                const ingDisplay = m.ingredients.split(',').map(i => {
                    const key = i.trim().split(' ')[0];
                    const sub = ingredientSubstitutions[key] || ingredientSubstitutions[i.trim()];
                    if (sub) {
                        return `<span class="ing-sub tooltip" style="border-bottom: 1px dotted #ccc; cursor: help;">${i.trim()}
                                <span class="tooltiptext" style="visibility: hidden; width: 140px; background: #333; color: #fff; text-align: center; border-radius: 6px; padding: 5px; position: absolute; z-index: 1;">
                                💡 Cheaper: ${sub.cheaper}<br>🌿 Seasonal: ${sub.seasonal}
                                </span></span>`;
                    }
                    return i.trim();
                }).join(', ');

                // Benefit badge text
                const benefitText = m.benefit === 'red' ? 'Anti-Cancer' : (m.benefit === 'yellow' ? 'Immunity' : 'Detox');

                mealHTML += `
                <div class="meal-card ${m.benefit}">
                    <div class="meal-type" style="text-transform:capitalize; color:#666; font-size:12px;">${type}</div>
                    <div class="meal-name" style="font-weight:bold; color:#06938c;">${m.name}</div>
                    <div class="meal-details" style="font-size:13px; margin: 4px 0;">${ingDisplay}</div>
                    <div class="meal-meta" style="display:flex; justify-content:space-between; font-size:12px; color:#555; margin: 8px 0;">
                        <span>⏱ ${m.time}</span>
                        <span>₹${m.cost}</span>
                        <span class="benefit-badge" style="background: ${m.benefit === 'red' ? '#fef2f2' : m.benefit === 'yellow' ? '#fefce8' : '#f0fdf4'}; color: ${m.benefit === 'red' ? '#991b1b' : m.benefit === 'yellow' ? '#854d0e' : '#14532d'}; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${benefitText}</span>
                    </div>
                    ${m.marketTip ? `<div class="market-tip" style="font-size:11px; color:#666; background:#f9fafb; padding:6px; border-radius:4px; margin-top:6px;">🛒 ${m.marketTip}</div>` : ''}
                </div>`;
            });

            const dayDiv = document.createElement('div');
            dayDiv.className = 'day-section';
            dayDiv.innerHTML = `<div class="day-header" style="background:#06938c; color:white; padding:5px 10px; border-radius:4px; margin-bottom:10px;">${d.day}</div>
                                <div class="meals-grid" style="display:grid; gap:10px;">${mealHTML}</div>`;
            grid.appendChild(dayDiv);
        });

        // Re-attach tooltip listeners if needed (CSS :hover usually handles it)
        // Adding simple style injection for tooltips if not in CSS
        if (!document.getElementById('tooltip-styles')) {
            const style = document.createElement('style');
            style.id = 'tooltip-styles';
            style.textContent = `.tooltip:hover .tooltiptext { visibility: visible !important; opacity: 1; bottom: 100%; left: 50%; margin-left: -70px; } .tooltip { position: relative; }`;
            document.head.appendChild(style);
        }
    }

    function renderShoppingList(plan) {
        const list = document.getElementById('shopping-list');
        if (!list) return;
        const items = new Set();
        plan.forEach(d => Object.values(d.meals).forEach(m => m.ingredients.split(',').forEach(i => items.add(i.trim()))));
        list.innerHTML = '';
        Array.from(items).sort().forEach(i => {
            const li = document.createElement('li');
            li.textContent = i;
            list.appendChild(li);
        });
    }

    // ===== PREVENTION TAB & CHECKLIST =====
    function loadChecklist() {
        ['check-screening', 'check-vaccination', 'check-diet', 'check-exercise', 'check-smoking'].forEach(id => {
            if (localStorage.getItem(id) === 'true') document.getElementById(id).checked = true;
            document.getElementById(id)?.addEventListener('change', function () {
                localStorage.setItem(id, this.checked);
            });
        });
    }
    loadChecklist();

    // Risk Advice Update
    const preventionTabBtn = document.querySelector('[data-tab="prevention-tab"]');
    if (preventionTabBtn) {
        preventionTabBtn.addEventListener('click', () => {
            const risk = parseInt(riskValueText?.innerText) || 24;
            const container = document.getElementById('prevention-risk-advice');
            if (container) {
                // Update text based on risk (simplified logic)
                let advice = "Maintain your healthy lifestyle.";
                if (risk > 50) advice = "Consult a doctor immediately and follow high-risk diet.";
                else if (risk > 25) advice = "Focus on active prevention and diet.";
                container.querySelector('.advice-subtitle').innerText = advice;
            }
        });
    }

});

// ===== FINISHING TOUCHES: GLOBAL FUNCTIONS =====

// Show Loading Overlay
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('active');
}

// Hide Loading Overlay
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('active');
}

// Show Success Notification
function showSuccess(message) {
    const notification = document.getElementById('success-notification');
    const messageEl = document.getElementById('success-message');
    if (notification && messageEl) {
        messageEl.textContent = message;
        notification.classList.add('active');
        setTimeout(() => {
            notification.classList.remove('active');
        }, 4000);
    }
}

// Social Share Functions
function sharePlan(platform) {
    const shareText = "Check out my personalized cancer-prevention meal plan from CerviCare! 🥗💚";
    const url = window.location.href;

    if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + url)}`, '_blank');
    } else if (navigator.share) {
        navigator.share({
            title: 'My CerviCare Meal Plan',
            text: shareText,
            url: url
        }).catch(err => console.log('Share cancelled'));
    } else {
        alert('Sharing not supported on this browser');
    }
}

// Download as PDF (requires jsPDF library - for now, show alert)
function downloadPlan() {
    alert('PDF download feature coming soon! For now, please use Print to save as PDF.');
    window.print();
}

// Save to Favorites
function saveFavorite() {
    const planHTML = document.getElementById('meal-plan-grid')?.innerHTML;
    if (planHTML) {
        localStorage.setItem('favorite-meal-plan', planHTML);
        localStorage.setItem('favorite-saved-date', new Date().toISOString());
        showSuccess('Meal plan saved to favorites! ❤️');
    }
}
