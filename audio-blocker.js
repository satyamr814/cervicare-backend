/**
 * Comprehensive Audio Blocker for CerviCare Website
 * This script completely disables all audio, voice, and speech synthesis
 * across all pages and sections of the website.
 */

(function() {
    'use strict';
    
    // ===== GLOBAL AUDIO BLOCKING SYSTEM =====
    
    // Block speech synthesis completely - ULTRA AGGRESSIVE
    if ('speechSynthesis' in window) {
        // Cancel any active speech immediately
        window.speechSynthesis.cancel();
        
        // Override the speak method to prevent any speech
        const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
        window.speechSynthesis.speak = function(utterance) {
            // Completely block speech synthesis - cancel immediately
            window.speechSynthesis.cancel();
            return false;
        };
        
        // Block all speech synthesis events
        ['start', 'end', 'error', 'pause', 'resume'].forEach(function(eventType) {
            window.speechSynthesis.addEventListener(eventType, function(e) {
                e.preventDefault();
                window.speechSynthesis.cancel();
            }, true);
        });
        
        // Continuously cancel any speech that might start - VERY FREQUENT
        const speechBlocker = setInterval(function() {
            window.speechSynthesis.cancel();
            // Cancel all pending utterances
            if (window.speechSynthesis.pending) {
                window.speechSynthesis.cancel();
            }
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }, 10); // Check every 10ms - very aggressive
        
        // Block speech on any utterance creation
        if (window.SpeechSynthesisUtterance) {
            const OriginalUtterance = window.SpeechSynthesisUtterance;
            window.SpeechSynthesisUtterance = function(text) {
                const utterance = new OriginalUtterance(text);
                // Prevent ALL events on this utterance
                ['onstart', 'onend', 'onerror', 'onpause', 'onresume', 'onmark', 'onboundary'].forEach(function(eventName) {
                    utterance[eventName] = function(e) {
                        e.preventDefault();
                        window.speechSynthesis.cancel();
                    };
                });
                // Cancel immediately
                window.speechSynthesis.cancel();
                return utterance;
            };
        }
        
        // Block getVoices to prevent voice selection
        if (window.speechSynthesis.getVoices) {
            const originalGetVoices = window.speechSynthesis.getVoices.bind(window.speechSynthesis);
            window.speechSynthesis.getVoices = function() {
                return []; // Return empty array
            };
        }
    }
    
    // Function to mute all media elements
    function muteAllMedia() {
        // Mute all video elements
        document.querySelectorAll('video').forEach(function(video) {
            video.muted = true;
            video.volume = 0;
            // Prevent unmuting
            video.addEventListener('volumechange', function() {
                if (!this.muted || this.volume > 0) {
                    this.muted = true;
                    this.volume = 0;
                }
            }, { capture: true });
        });
        
        // Mute and pause all audio elements
        document.querySelectorAll('audio').forEach(function(audio) {
            audio.muted = true;
            audio.volume = 0;
            audio.pause();
            // Prevent unmuting or playing
            audio.addEventListener('volumechange', function() {
                if (!this.muted || this.volume > 0) {
                    this.muted = true;
                    this.volume = 0;
                }
            }, { capture: true });
            audio.addEventListener('play', function() {
                this.pause();
            }, { capture: true });
        });
    }
    
    // Function to block Web Audio API
    function blockWebAudio() {
        if (window.AudioContext || window.webkitAudioContext) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const originalCreateGain = AudioContextClass.prototype.createGain;
            AudioContextClass.prototype.createGain = function() {
                const gainNode = originalCreateGain.call(this);
                const originalGain = gainNode.gain.value;
                Object.defineProperty(gainNode.gain, 'value', {
                    get: function() { return 0; },
                    set: function() { return 0; }
                });
                return gainNode;
            };
        }
    }
    
    // Initial mute on page load
    function initializeAudioBlocking() {
        muteAllMedia();
        blockWebAudio();
        
        // Cancel speech synthesis
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }
    
    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAudioBlocking);
    } else {
        initializeAudioBlocking();
    }
    
    // Also run immediately (in case DOMContentLoaded already fired)
    initializeAudioBlocking();
    
    // Monitor for new media elements and mute them immediately
    const mediaObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    // Check if it's a media element
                    if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                        if (node.tagName === 'VIDEO') {
                            node.muted = true;
                            node.volume = 0;
                        } else {
                            node.muted = true;
                            node.volume = 0;
                            node.pause();
                        }
                    }
                    // Check for media elements inside the added node
                    const mediaElements = node.querySelectorAll && node.querySelectorAll('video, audio');
                    if (mediaElements) {
                        mediaElements.forEach(function(media) {
                            if (media.tagName === 'VIDEO') {
                                media.muted = true;
                                media.volume = 0;
                            } else {
                                media.muted = true;
                                media.volume = 0;
                                media.pause();
                            }
                        });
                    }
                }
            });
        });
        // Also mute all existing media (in case something changed)
        muteAllMedia();
    });
    
    // Start observing when body is available
    if (document.body) {
        mediaObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    } else {
        document.addEventListener('DOMContentLoaded', function() {
            if (document.body) {
                mediaObserver.observe(document.body, {
                    childList: true,
                    subtree: true
                });
            }
        });
    }
    
    // Continuously monitor and mute all media (every 100ms - very frequent)
    setInterval(function() {
        muteAllMedia();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            // Cancel all pending and speaking
            if (window.speechSynthesis.pending || window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
            }
        }
    }, 100); // Check every 100ms - very aggressive
    
    // Block audio on iframe load
    window.addEventListener('load', function() {
        document.querySelectorAll('iframe').forEach(function(iframe) {
            try {
                iframe.addEventListener('load', function() {
                    try {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                        if (iframeDoc) {
                            iframeDoc.querySelectorAll('video, audio').forEach(function(media) {
                                if (media.tagName === 'VIDEO') {
                                    media.muted = true;
                                    media.volume = 0;
                                } else {
                                    media.muted = true;
                                    media.volume = 0;
                                    media.pause();
                                }
                            });
                        }
                    } catch (e) {
                        // Cross-origin restriction - expected
                    }
                });
            } catch (e) {
                // Ignore errors
            }
        });
    });
    
    // Block audio context creation - COMPLETE BLOCK
    if (window.AudioContext) {
        const OriginalAudioContext = window.AudioContext;
        window.AudioContext = function() {
            const context = new OriginalAudioContext();
            // Mute all audio nodes
            const originalCreateGain = context.createGain.bind(context);
            context.createGain = function() {
                const gainNode = originalCreateGain();
                gainNode.gain.value = 0;
                // Lock the gain value
                Object.defineProperty(gainNode.gain, 'value', {
                    get: function() { return 0; },
                    set: function() { return 0; },
                    configurable: false
                });
                return gainNode;
            };
            // Block createMediaStreamSource
            if (context.createMediaStreamSource) {
                const originalCreateMediaStreamSource = context.createMediaStreamSource.bind(context);
                context.createMediaStreamSource = function(stream) {
                    const source = originalCreateMediaStreamSource(stream);
                    // Mute the source
                    const gainNode = context.createGain();
                    gainNode.gain.value = 0;
                    source.connect(gainNode);
                    return source;
                };
            }
            return context;
        };
    }
    
    // Block webkitAudioContext as well
    if (window.webkitAudioContext) {
        const OriginalWebkitAudioContext = window.webkitAudioContext;
        window.webkitAudioContext = function() {
            const context = new OriginalWebkitAudioContext();
            const originalCreateGain = context.createGain.bind(context);
            context.createGain = function() {
                const gainNode = originalCreateGain();
                gainNode.gain.value = 0;
                Object.defineProperty(gainNode.gain, 'value', {
                    get: function() { return 0; },
                    set: function() { return 0; },
                    configurable: false
                });
                return gainNode;
            };
            return context;
        };
    }
    
    // Block MediaStream audio tracks
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = function(constraints) {
            if (constraints && constraints.audio) {
                // Block audio requests
                return Promise.reject(new Error('Audio access blocked'));
            }
            return originalGetUserMedia(constraints);
        };
    }
    
    // Export function for manual use
    window.disableAllAudio = function() {
        muteAllMedia();
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        blockWebAudio();
    };
    
    console.log('🔇 Audio blocking system activated - All audio, voice, and speech synthesis disabled');
})();

