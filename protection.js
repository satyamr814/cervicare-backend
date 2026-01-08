document.addEventListener('DOMContentLoaded', function () {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('user'));
    const API_BASE_URL = window.location.origin;

    if (!isLoggedIn || !userData) {
        console.warn('User not logged in, redirecting to login page...');
        window.location.href = 'auth.html?tab=login';
        return;
    }

    // Elements
    const inProgressCountEl = document.getElementById('inProgressCount');
    const completedCountEl = document.getElementById('completedCount');
    const overallProgressEl = document.getElementById('overallProgress');
    const completedTextEl = document.getElementById('completedText');
    const protectionScoreEl = document.querySelector('.protection-score .stat-number');
    const progressRingEl = document.querySelector('.progress-ring-progress');

    // Initialize UI
    fetchProtectionData();
    checkUrlForRecommendation();

    function checkUrlForRecommendation() {
        const urlParams = new URLSearchParams(window.location.search);
        const riskScore = urlParams.get('risk'); // Expecting 0-100
        const clickSource = urlParams.get('click_source');

        // Parse detailed custom params
        const customParams = {
            age: parseInt(urlParams.get('age')) || 0,
            smoke: parseFloat(urlParams.get('smoke')) || 0,
            partners: parseInt(urlParams.get('partners')) || 0,
            contra: urlParams.get('contra') || 'No'
        };

        if (riskScore !== null) {
            recommendPlanByRisk(parseInt(riskScore), customParams);
        }
    }

    function recommendPlanByRisk(risk, params) {
        let recommendedPlanId = 7; // Default to lowest intensity (Sleep)

        // RECOMMENDATION LOGIC
        if (risk >= 80) recommendedPlanId = 1;      // Early Detection (Urgent)
        else if (risk >= 60) recommendedPlanId = 2; // Risk Reduction Strategy
        else if (risk >= 40) recommendedPlanId = 3; // Lifestyle Integration
        else if (risk >= 30) recommendedPlanId = 4; // Nutrition Foundation
        else if (risk >= 20) recommendedPlanId = 5; // Exercise Program
        else if (risk >= 10) recommendedPlanId = 6; // Stress Reduction
        else recommendedPlanId = 7;                 // Sleep Optimization

        console.log(`Risk: ${risk}%, Recommended Plan: ${recommendedPlanId}`);

        setTimeout(() => {
            const planCard = document.querySelector(`.plan-card[data-plan-id="${recommendedPlanId}"]`);
            if (planCard) {
                // Scroll to view
                planCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Add Visual Highlight
                planCard.style.border = '4px solid #fbbc04'; // Yellow highlight
                planCard.style.boxShadow = '0 0 20px rgba(251, 188, 4, 0.4)';

                // Add Badge dynamically
                const tagsContainer = planCard.querySelector('.plan-tags');
                if (tagsContainer) {
                    // Check if badge already exists
                    if (!tagsContainer.querySelector('.bot-rec-badge')) {
                        const recBadge = document.createElement('span');
                        recBadge.className = 'tag bot-rec-badge';
                        recBadge.style.background = '#fbbc04';
                        recBadge.style.color = '#000';
                        recBadge.style.fontWeight = 'bold';
                        recBadge.innerHTML = '<i class="fas fa-robot"></i> Bot Personalized Plan';
                        tagsContainer.prepend(recBadge);
                    }
                }

                // APPLY DYNAMIC CUSTOMIZATIONS
                customizePlanContent(planCard, params);
            }
        }, 500); // Small delay to ensure DOM is ready
    }

    function customizePlanContent(card, params) {
        const stepsList = card.querySelector('.steps-list');
        const notesArea = card.querySelector('.notes-textarea'); // Changed from .plan-notes to .notes-textarea based on existing code

        // 1. Smoking Customization
        if (params.smoke > 0) {
            const smokeStep = document.createElement('li');
            smokeStep.innerHTML = `
                <span class="step-number" style="background: #ef4444;">!</span>
                <div class="step-content">
                    <p style="color: #ef4444; font-weight: bold;">Critical: Tobacco Cessation Protocol</p>
                    <small>Your ${params.smoke} years of smoking significantly increases risk. Immediate cessation is required.</small>
                    <span class="step-frequency">(Immediate Action)</span>
                </div>
            `;
            if (stepsList) stepsList.prepend(smokeStep); // Add as FIRST step
        }

        // 2. Age/Menopause Customization
        if (params.age > 45) {
            const ageDiv = document.createElement('div');
            ageDiv.style.background = '#e0f2fe';
            ageDiv.style.padding = '10px';
            ageDiv.style.borderRadius = '8px';
            ageDiv.style.marginBottom = '10px';
            ageDiv.innerHTML = `<i class="fas fa-info-circle"></i> <strong>Age-Specific Note:</strong> Since you are ${params.age}, ensure screening includes HPV co-testing as guidelines change post-menopause.`;
            if (notesArea) notesArea.parentNode.insertBefore(ageDiv, notesArea); // Insert before the notes textarea
        }

        // 3. Contraceptives Customization
        if (params.contra === 'Yes' || params.contra === 'yes') {
            const pillStep = document.createElement('li');
            pillStep.innerHTML = `
                <span class="step-number" style="background: #f59e0b;">!</span>
                <div class="step-content">
                    <p style="color: #d97706; font-weight: bold;">Hormonal Contraceptive Review</p>
                    <small>Long-term use is a cofactor. Discuss non-hormonal alternatives with your gynecologist.</small>
                    <span class="step-frequency">(Next Consult)</span>
                </div>
            `;
            if (stepsList && stepsList.children.length > 0) {
                stepsList.insertBefore(pillStep, stepsList.children[1]); // Insert as second step
            } else if (stepsList) {
                stepsList.appendChild(pillStep); // If no other steps, just append
            }
        }
    }

    async function fetchProtectionData() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/protection/${userData.id}`);
            const result = await response.json();
            if (result.success) {
                updateUI(result.data);
            }
        } catch (error) {
            console.error('Error fetching protection data:', error);
        }
    }

    function updateUI(data) {
        const { score, plans } = data;

        // Update Stats
        const inProgressCount = plans.filter(p => p.status === 'in-progress').length;
        const completedCount = plans.filter(p => p.status === 'completed').length;
        const totalCount = plans.length;

        if (inProgressCountEl) inProgressCountEl.textContent = inProgressCount;
        if (completedCountEl) completedCountEl.textContent = completedCount;
        if (completedTextEl) completedTextEl.textContent = completedCount;

        if (overallProgressEl) {
            const progressPercent = (completedCount / totalCount) * 100;
            overallProgressEl.style.width = `${progressPercent}%`;
        }

        // Update Score Circular Progress
        if (protectionScoreEl) protectionScoreEl.textContent = `${score}%`;
        if (progressRingEl) {
            const radius = 36;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            progressRingEl.style.strokeDashoffset = offset;
            progressRingEl.style.stroke = score > 70 ? '#22c55e' : (score > 40 ? '#f59e0b' : '#ef4444');
        }

        // Update Plan Cards
        plans.forEach(plan => {
            const planCard = document.querySelector(`.plan-card[data-plan-id="${plan.id.replace('plan-', '')}"]`);
            if (planCard) {
                planCard.setAttribute('data-status', plan.status);

                // Update Badge/Status Text
                const statusBadge = planCard.querySelector('.plan-status');
                if (statusBadge) {
                    statusBadge.setAttribute('data-status', plan.status);
                    const statusText = statusBadge.querySelector('span');
                    if (statusText) {
                        statusText.textContent = plan.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                    }
                }

                // Update Notes
                const notesArea = planCard.querySelector('.notes-textarea');
                if (notesArea) notesArea.value = plan.notes || '';

                // Handle Button Visibility
                const startBtn = planCard.querySelector('.start-plan-btn');
                const completeBtn = planCard.querySelector('.mark-complete-btn');

                if (plan.status === 'not-started') {
                    if (startBtn) startBtn.style.display = 'inline-flex';
                    if (completeBtn) completeBtn.style.display = 'none';
                } else if (plan.status === 'in-progress') {
                    if (startBtn) startBtn.style.display = 'none';
                    if (completeBtn) completeBtn.style.display = 'inline-flex';
                } else if (plan.status === 'completed') {
                    if (startBtn) startBtn.style.display = 'none';
                    if (completeBtn) completeBtn.style.display = 'none';
                }
            }
        });
    }

    // Global event listener for actions since cards might be many
    document.addEventListener('click', async function (e) {
        // Start Plan
        if (e.target.closest('.start-plan-btn')) {
            const planCard = e.target.closest('.plan-card');
            const planId = `plan-${planCard.dataset.planId}`;
            await updatePlanOnServer(planId, 'in-progress');
        }

        // Mark Complete
        if (e.target.closest('.mark-complete-btn')) {
            const planCard = e.target.closest('.plan-card');
            const planId = `plan-${planCard.dataset.planId}`;
            await updatePlanOnServer(planId, 'completed');
        }

        // Save Notes
        if (e.target.closest('.save-notes-btn')) {
            const planCard = e.target.closest('.plan-card');
            const planId = `plan-${planCard.dataset.planId}`;
            const notes = planCard.querySelector('.notes-textarea').value;
            await updatePlanOnServer(planId, null, notes);
        }
    });

    async function updatePlanOnServer(planId, status, notes) {
        try {
            const body = { userId: userData.id, planId };
            if (status) body.status = status;
            if (notes !== undefined) body.notes = notes;

            const response = await fetch(`${API_BASE_URL}/api/protection/plans/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const result = await response.json();
            if (result.success) {
                updateUI(result.data);
                if (status === 'completed') {
                    showSuccessToast('Plan marked as completed! Your protection score increased.');
                } else if (status === 'in-progress') {
                    showSuccessToast('Plan started! Good luck on your journey.');
                } else if (notes !== undefined) {
                    showSuccessToast('Notes saved successfully.');
                }
            }
        } catch (error) {
            console.error('Error updating plan:', error);
            showErrorToast('Failed to update plan. Please try again.');
        }
    }

    function showSuccessToast(message) {
        // Simple alert for now, can be replaced with a beautiful toast
        console.log('Success:', message);
    }

    function showErrorToast(message) {
        console.error('Error:', message);
    }
});
