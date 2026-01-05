document.addEventListener("DOMContentLoaded", function() {

    // ===== CHECK LOGIN STATE AND UPDATE NAVBAR =====
    function updateNavbarForLogin() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userData = localStorage.getItem('user');
        const signInBtn = document.getElementById('sign-in-btn');
        const signUpBtn = document.getElementById('sign-up-btn');
        const userProfileIcon = document.getElementById('user-profile-icon');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        
        if (isLoggedIn && userData) {
            try {
                const user = JSON.parse(userData);
                // Show user profile icon
                if (userProfileIcon) {
                    userProfileIcon.style.display = 'block';
                }
                // Hide sign in/up buttons
                if (signInBtn) {
                    signInBtn.style.display = 'none';
                }
                if (signUpBtn) {
                    signUpBtn.style.display = 'none';
                }
                // Update profile info
                if (profileName && user.firstName) {
                    profileName.textContent = `${user.firstName} ${user.lastName || ''}`.trim();
                }
                if (profileEmail && user.email) {
                    profileEmail.textContent = user.email;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        } else {
            // Show sign in/up buttons
            if (signInBtn) {
                signInBtn.style.display = 'inline-block';
            }
            if (signUpBtn) {
                signUpBtn.style.display = 'inline-block';
            }
            // Hide user profile icon
            if (userProfileIcon) {
                userProfileIcon.style.display = 'none';
            }
        }
    }
    
    // Check login state on page load
    updateNavbarForLogin();
    
    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
            updateNavbarForLogin();
            // Optionally redirect to home or show a message
            window.location.reload();
        });
    }

    // ===== DISABLE ALL AUDIO/VIDEO SOUND =====
    // Mute all video elements
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.muted = true;
        video.volume = 0;
        // Ensure it stays muted even if something tries to change it
        video.addEventListener('volumechange', function() {
            if (!this.muted) {
                this.muted = true;
                this.volume = 0;
            }
        });
    });
    
    // Mute all audio elements
    const audios = document.querySelectorAll('audio');
    audios.forEach(audio => {
        audio.muted = true;
        audio.volume = 0;
        audio.pause();
    });
    
    // Cancel any speech synthesis that might be running - ULTRA AGGRESSIVE
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Prevent any new speech synthesis
        const originalSpeak = window.speechSynthesis.speak;
        window.speechSynthesis.speak = function() {
            window.speechSynthesis.cancel();
            return false;
        };
        
        // Continuously cancel speech synthesis - VERY FREQUENT
        setInterval(function() {
            window.speechSynthesis.cancel();
            if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                window.speechSynthesis.cancel();
            }
        }, 10); // Check every 10ms - ultra aggressive
    }

    // ===== AUTH BUTTONS =====
    const authButtons = document.querySelectorAll('.btn-click');
    authButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            authButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ===== HERO BUTTONS =====
    const heroButtons = document.querySelectorAll('.btn-click-hero');
    heroButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            heroButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Disable audio when risk assessment button is clicked
            disableAllAudio();
        });
    });
    
    // ===== RISK ASSESSMENT BUTTONS =====
    // Handle "Calculate My Risk" button
    const calculateRiskBtn = document.querySelector('.btn-hero-primary');
    if (calculateRiskBtn) {
        calculateRiskBtn.addEventListener('click', function(e) {
            e.preventDefault();
            disableAllAudio();
            // Scroll to risk assessment section
            const riskSection = document.getElementById('risk-section-feature');
            if (riskSection) {
                const yOffset = -80;
                const y = riskSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        });
    }
    
    // Handle "Start Assessment" button
    const startAssessmentBtns = document.querySelectorAll('.feature-btn');
    startAssessmentBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            // If it's the risk assessment button (not GPS trigger or external link)
            if (href === '#' && !this.classList.contains('gps-trigger')) {
                disableAllAudio();
            }
        });
    });
    
    // Monitor when risk assessment section comes into view
    const riskSection = document.getElementById('risk-section-feature');
    let riskSectionVisible = false;
    let aggressiveBlockInterval = null;
    
    if (riskSection) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                riskSectionVisible = entry.isIntersecting;
                if (entry.isIntersecting) {
                    // Disable audio when risk section is visible
                    disableAllAudio();
                    
                    // Aggressively block speech synthesis when risk section is visible
                    if ('speechSynthesis' in window && !aggressiveBlockInterval) {
                        aggressiveBlockInterval = setInterval(function() {
                            if (riskSectionVisible) {
                                window.speechSynthesis.cancel();
                                // Try to prevent new speech
                                if (window.speechSynthesis.speaking) {
                                    window.speechSynthesis.cancel();
                                }
                            } else {
                                if (aggressiveBlockInterval) {
                                    clearInterval(aggressiveBlockInterval);
                                    aggressiveBlockInterval = null;
                                }
                            }
                        }, 50); // Check every 50ms when section is visible
                    }
                } else {
                    // Stop aggressive blocking when section is not visible
                    if (aggressiveBlockInterval) {
                        clearInterval(aggressiveBlockInterval);
                        aggressiveBlockInterval = null;
                    }
                }
            });
        }, { threshold: 0.1 });
        
        observer.observe(riskSection);
    }
    
    // Function to disable all audio (uses global function if available)
    function disableAllAudio() {
        // Use global audio blocker function if available
        if (typeof window.disableAllAudio === 'function') {
            window.disableAllAudio();
        } else {
            // Fallback if audio-blocker.js hasn't loaded yet
            // Cancel speech synthesis
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
            
            // Mute all videos
            document.querySelectorAll('video').forEach(video => {
                video.muted = true;
                video.volume = 0;
            });
            
            // Mute and pause all audio
            document.querySelectorAll('audio').forEach(audio => {
                audio.muted = true;
                audio.volume = 0;
                audio.pause();
            });
        }
    }

    // ===== DYNAMIC RISK PERCENTAGE =====
    let risk = 24;
    const riskPercentEl = document.getElementById("riskPercent");
    const progressBarEl = document.querySelector(".progress-bar");
    setInterval(() => {
        if (risk < 30) {
            risk++;
            if(riskPercentEl) riskPercentEl.innerText = risk + "%";
            if(progressBarEl) progressBarEl.style.width = risk + "%";
        }
    }, 3000);

    // ===== NAVBAR SMOOTH SCROLL =====
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const id = this.getAttribute('id');
            
            // Handle AskCervi link
            if (id === 'askcervi-link') {
                e.preventDefault();
                openChatbotModal();
                return;
            }
            
            // Handle Find Doctors link (GPS)
            if (id === 'find-doctors-link') {
                e.preventDefault();
                openGPSModal();
                return;
            }
            
            // Only prevent default for anchor links (starting with #)
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetID = href.slice(1);
                const target = document.getElementById(targetID);
                if(target){
                    const yOffset = -80; // navbar height offset
                    const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({top: y, behavior: 'smooth'});
                }
            }
            // Allow normal navigation for external links (like protection.html)
        });
    });

    // ===== CHATBOT MODAL FUNCTIONALITY =====
    const chatbotModal = document.getElementById('chatbot-modal');
    const chatbotTriggers = document.querySelectorAll('.chatbot-trigger');
    const chatbotIframe = document.getElementById('chatbot-iframe');
    
    // Disable audio from chatbot iframe
    function disableChatbotAudio() {
        if (chatbotIframe) {
            try {
                // Try to access iframe content (will fail for cross-origin, but worth trying)
                const iframeWindow = chatbotIframe.contentWindow;
                const iframeDocument = chatbotIframe.contentDocument || (iframeWindow && iframeWindow.document);
                
                if (iframeDocument) {
                    // Mute all audio/video in iframe
                    iframeDocument.querySelectorAll('video, audio').forEach(function(media) {
                        media.muted = true;
                        media.volume = 0;
                        if (media.tagName === 'AUDIO') {
                            media.pause();
                        }
                    });
                    
                    // Cancel speech synthesis in iframe
                    if (iframeWindow && 'speechSynthesis' in iframeWindow) {
                        iframeWindow.speechSynthesis.cancel();
                    }
                }
            } catch (e) {
                // Cross-origin restriction - expected for external iframe
                // We cannot directly control cross-origin iframe content
            }
        }
        
        // Also try to mute the iframe element itself (may not work for cross-origin)
        if (chatbotIframe && chatbotIframe.contentWindow) {
            try {
                // Try to post a message to disable audio (if chatbot supports it)
                chatbotIframe.contentWindow.postMessage({ type: 'mute', value: true }, '*');
            } catch (e) {
                // Ignore errors
            }
        }
    }
    
    // Monitor iframe load and try to disable audio
    if (chatbotIframe) {
        chatbotIframe.addEventListener('load', function() {
            disableChatbotAudio();
            // Try multiple times as iframe content may load asynchronously
            setTimeout(disableChatbotAudio, 500);
            setTimeout(disableChatbotAudio, 1000);
            setTimeout(disableChatbotAudio, 2000);
        });
    }
    
    function openChatbotModal() {
        if (chatbotModal) {
            chatbotModal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
            
            // Disable audio when modal opens (try multiple times as iframe may load asynchronously)
            disableChatbotAudio();
            setTimeout(disableChatbotAudio, 500);
            setTimeout(disableChatbotAudio, 1000);
            setTimeout(disableChatbotAudio, 2000);
            setTimeout(disableChatbotAudio, 3000);
            
            // Continuously monitor and disable audio every 2 seconds while modal is open
            const audioMonitor = setInterval(function() {
                if (chatbotModal.style.display === 'flex') {
                    disableChatbotAudio();
                } else {
                    clearInterval(audioMonitor);
                }
            }, 2000);
        }
    }
    
    function closeChatbotModal() {
        if (chatbotModal) {
            chatbotModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
    
    // Add click listeners to chatbot triggers
    chatbotTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            openChatbotModal();
        });
    });
    
    // Add click listener to AskCervi nav link
    const askCerviLink = document.getElementById('askcervi-link');
    if (askCerviLink) {
        askCerviLink.addEventListener('click', function(e) {
            e.preventDefault();
            openChatbotModal();
        });
    }
    
    // Add click listener to AI Analysis floating button
    const aiAnalysisBtn = document.getElementById('ai-analysis-btn');
    if (aiAnalysisBtn) {
        aiAnalysisBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openChatbotModal();
        });
    }
    
    // Close modal when clicking X
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // ===== GPS MODAL FUNCTIONALITY (Basic - No API Key Required) =====
    const gpsModal = document.getElementById('gps-modal');
    const gpsTriggers = document.querySelectorAll('.gps-trigger');
    let map;
    let userMarker;
    let userLocation = null;
    
    function openGPSModal() {
        if (gpsModal) {
            gpsModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Initialize map if not already initialized
            if (!map && typeof L !== 'undefined') {
                initMap();
            } else if (typeof L === 'undefined') {
                // Wait for Leaflet to load
                setTimeout(() => {
                    if (typeof L !== 'undefined') {
                        initMap();
                    }
                }, 100);
            }
        }
    }
    
    // Add click listeners to GPS triggers
    gpsTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            openGPSModal();
        });
    });
    
    // Initialize Map using Leaflet (OpenStreetMap - Free, no API key)
    function initMap() {
        const mapContainer = document.getElementById('map');
        if (!mapContainer) return;
        
        // Default location (India center)
        const defaultLocation = [20.5937, 78.9629];
        
        // Create map
        map = L.map('map').setView(defaultLocation, 12);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
        
        // Locate me button
        const locateBtn = document.getElementById('locate-me-btn');
        if (locateBtn) {
            locateBtn.addEventListener('click', getUserLocation);
        }
        
        // Search hospitals button
        const searchBtn = document.getElementById('search-hospitals-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchNearbyHospitals);
        }
        
        // Try to get user location on load
        getUserLocation();
    }
    
    function getUserLocation() {
        const hospitalResults = document.getElementById('hospital-results');
        if (hospitalResults) {
            hospitalResults.innerHTML = '<p>Getting your location...</p>';
        }
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    // Center map on user location
                    if (map) {
                        map.setView([userLocation.lat, userLocation.lng], 15);
                        
                        // Remove existing marker
                        if (userMarker) {
                            map.removeLayer(userMarker);
                        }
                        
                        // Add user marker
                        userMarker = L.marker([userLocation.lat, userLocation.lng])
                            .addTo(map)
                            .bindPopup('📍 Your Location')
                            .openPopup();
                    }
                    
                    // Show success message
                    if (hospitalResults) {
                        hospitalResults.innerHTML = `
                            <div class="location-success">
                                <h3>📍 Location Found!</h3>
                                <p>Latitude: ${userLocation.lat.toFixed(6)}</p>
                                <p>Longitude: ${userLocation.lng.toFixed(6)}</p>
                                <a href="https://www.google.com/maps/search/hospital+gynecologist+near+me/@${userLocation.lat},${userLocation.lng},15z" 
                                   target="_blank" class="search-google-maps-btn">
                                    <i class="fa-solid fa-map-location-dot"></i> Search Hospitals on Google Maps
                                </a>
                            </div>
                        `;
                    }
                },
                function(error) {
                    console.error('Error getting location:', error);
                    const errorMsg = error.message || 'Unable to get your location';
                    if (hospitalResults) {
                        hospitalResults.innerHTML = `
                            <div class="location-error">
                                <h3>⚠️ Location Access Required</h3>
                                <p>${errorMsg}. Please allow location access and try again.</p>
                                <p>You can still search manually:</p>
                                <a href="https://www.google.com/maps/search/hospital+gynecologist" 
                                   target="_blank" class="search-google-maps-btn">
                                    <i class="fa-solid fa-map-location-dot"></i> Search Hospitals on Google Maps
                                </a>
                            </div>
                        `;
                    }
                }
            );
        } else {
            if (hospitalResults) {
                hospitalResults.innerHTML = `
                    <div class="location-error">
                        <h3>⚠️ Geolocation Not Supported</h3>
                        <p>Your browser does not support geolocation.</p>
                        <a href="https://www.google.com/maps/search/hospital+gynecologist" 
                           target="_blank" class="search-google-maps-btn">
                            <i class="fa-solid fa-map-location-dot"></i> Search Hospitals on Google Maps
                        </a>
                    </div>
                `;
            }
        }
    }
    
    function searchNearbyHospitals() {
        if (userLocation) {
            // If we have user location, redirect to Google Maps with search
            window.open(`https://www.google.com/maps/search/hospital+gynecologist+near+me/@${userLocation.lat},${userLocation.lng},15z`, '_blank');
        } else {
            // Otherwise, get location first
            getUserLocation();
        }
    }
    
    // Make initMap available globally
    window.initMap = initMap;

});
