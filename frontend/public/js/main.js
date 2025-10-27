// ===== Enhanced Main JavaScript =====

class FittedInApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupScrollEffects();
        this.setupNavbarEffects();
        this.setupAnimations();
        this.setupParallaxEffects();
        this.setupInteractiveElements();
        this.setupPerformanceOptimizations();
    }

    // ===== Scroll Effects =====
    setupScrollEffects() {
        // Navbar scroll effect
        let lastScrollTop = 0;
        const navbar = document.querySelector('.navbar');

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            lastScrollTop = scrollTop;
        });

        // Scroll animations
        this.setupScrollAnimations();
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .dashboard-card').forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
    }

    // ===== Navbar Effects =====
    setupNavbarEffects() {
        const navLinks = document.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            link.addEventListener('mouseenter', (e) => {
                this.createRippleEffect(e.target);
            });
        });
    }

    createRippleEffect(element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (rect.width / 2 - size / 2) + 'px';
        ripple.style.top = (rect.height / 2 - size / 2) + 'px';
        ripple.classList.add('ripple');

        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // ===== Animations =====
    setupAnimations() {
        // Hero section animations
        this.animateHeroElements();

        // Feature cards hover effects
        this.setupFeatureCardAnimations();

        // Button animations
        this.setupButtonAnimations();
    }

    animateHeroElements() {
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroCta = document.querySelector('.hero-cta');

        if (heroTitle) {
            setTimeout(() => {
                heroTitle.style.animation = 'slideInLeft 1s ease-out';
            }, 200);
        }

        if (heroSubtitle) {
            setTimeout(() => {
                heroSubtitle.style.animation = 'slideInLeft 1s ease-out 0.2s both';
            }, 400);
        }

        if (heroCta) {
            setTimeout(() => {
                heroCta.style.animation = 'slideInLeft 1s ease-out 0.4s both';
            }, 600);
        }
    }

    setupFeatureCardAnimations() {
        const featureCards = document.querySelectorAll('.feature-card');

        featureCards.forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });

            // Stagger animation on load
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    setupButtonAnimations() {
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-outline');

        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.createClickEffect(e);
            });
        });
    }

    createClickEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // ===== Parallax Effects =====
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('.hero-placeholder');

        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            parallaxElements.forEach(element => {
                element.style.transform = `translateY(${rate}px)`;
            });
        });
    }

    // ===== Interactive Elements =====
    setupInteractiveElements() {
        // Smooth scrolling for anchor links
        this.setupSmoothScrolling();

        // Form enhancements
        this.setupFormEnhancements();

        // Loading states
        this.setupLoadingStates();
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));

                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupFormEnhancements() {
        const inputs = document.querySelectorAll('input, textarea, select');

        inputs.forEach(input => {
            // Floating label effect
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });

            // Input validation styling
            input.addEventListener('input', () => {
                if (input.checkValidity()) {
                    input.classList.remove('invalid');
                    input.classList.add('valid');
                } else {
                    input.classList.remove('valid');
                    input.classList.add('invalid');
                }
            });
        });
    }

    setupLoadingStates() {
        const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');

        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                if (button.href && button.href.includes('#')) {
                    return; // Don't show loading for anchor links
                }

                this.showButtonLoading(button);
            });
        });
    }

    showButtonLoading(button) {
        const originalText = button.textContent;
        button.innerHTML = '<span class="loading"></span> Loading...';
        button.disabled = true;

        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    }

    // ===== Performance Optimizations =====
    setupPerformanceOptimizations() {
        // Lazy loading for images
        this.setupLazyLoading();

        // Debounced scroll events
        this.setupDebouncedScroll();

        // Preload critical resources
        this.preloadCriticalResources();
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');

        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    setupDebouncedScroll() {
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }

            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 10);
        });
    }

    handleScroll() {
        // Handle scroll-based animations and effects
        const scrolled = window.pageYOffset;
        const windowHeight = window.innerHeight;

        // Parallax effects
        document.querySelectorAll('.parallax').forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    preloadCriticalResources() {
        // Preload critical CSS and fonts
        const criticalResources = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = resource;
            document.head.appendChild(link);
        });
    }

    // ===== Utility Methods =====
    static addRippleStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .ripple {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple-animation 0.6s linear;
                pointer-events: none;
            }
            
            @keyframes ripple-animation {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .fade-in {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .fade-in.visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            .parallax {
                will-change: transform;
            }
            
            .lazy {
                opacity: 0;
                transition: opacity 0.3s;
            }
            
            .lazy.loaded {
                opacity: 1;
            }
            
            .btn-primary:disabled,
            .btn-secondary:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none !important;
            }
            
            .focused input,
            .focused textarea,
            .focused select {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
            }
            
            .valid {
                border-color: var(--success-color) !important;
            }
            
            .invalid {
                border-color: var(--error-color) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ===== Public Methods =====
    refreshAnimations() {
        this.setupScrollAnimations();
    }

    addCustomAnimation(element, animationClass) {
        element.classList.add(animationClass);

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        });

        observer.observe(element);
    }
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple styles
    FittedInApp.addRippleStyles();

    // Initialize the app
    window.fittedInApp = new FittedInApp();

    // Add some dynamic content loading
    loadDynamicContent();
});

// ===== Dynamic Content Loading =====
async function loadDynamicContent() {
    // Simulate loading dynamic content
    const featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';

            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100);
        }, index * 150);
    });
}

// ===== Enhanced Dashboard Functionality =====
class DashboardManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupDashboardAnimations();
        this.setupCardInteractions();
        this.loadUserData();
    }

    setupDashboardAnimations() {
        const cards = document.querySelectorAll('.dashboard-card');

        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';

            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    setupCardInteractions() {
        const cards = document.querySelectorAll('.dashboard-card');

        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
                card.style.boxShadow = 'var(--shadow-xl)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = 'var(--shadow-sm)';
            });
        });
    }

    async loadUserData() {
        try {
            // Use authState if available, otherwise fallback to localStorage
            const token = (typeof authState !== 'undefined' && authState.getToken)
                ? authState.getToken()
                : localStorage.getItem('token');
            const userId = (typeof authState !== 'undefined' && authState.getUserId)
                ? authState.getUserId()
                : localStorage.getItem('userId');

            // Only show dashboard links if logged in, but don't force redirect on index page
            if (token && userId) {
                // User is logged in - update navigation to show dashboard/profile links
                console.log('User is logged in - updating navigation');
                this.updateNavigationForLoggedInUser();
            } else {
                // User is not logged in - keep default navigation
                console.log('User is not logged in');
            }

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update user display name if element exists
            const userDisplayName = document.getElementById('userDisplayName');
            if (userDisplayName && token && userId) {
                userDisplayName.textContent = 'User'; // This would come from API
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }

    updateNavigationForLoggedInUser() {
        const navLinks = document.getElementById('navLinks');
        if (!navLinks) return;

        console.log('Updating navigation for logged in user');

        // Replace the last two links (Login and Get Started) with Dashboard, Profile, and Logout
        const featureLinks = navLinks.querySelectorAll('a[href^="#"]');
        const existingAuthLinks = navLinks.querySelectorAll('a[href*="login"], a[href*="register"], a[href*="dashboard"], a[href*="profile"], a[href="#"][onclick*="logout"]');

        // Remove old auth links
        existingAuthLinks.forEach(link => {
            // Only remove login/register/dashboard/profile/logout links, not #feature links
            if (link.href.includes('login') || link.href.includes('register') ||
                link.href.includes('dashboard') || link.href.includes('profile') ||
                link.onclick || link.getAttribute('data-auth')) {
                link.remove();
            }
        });

        // Add new auth links for logged in users
        const dashboardLink = document.createElement('a');
        dashboardLink.href = 'dashboard.html';
        dashboardLink.className = 'btn-outline';
        dashboardLink.textContent = 'Dashboard';
        dashboardLink.setAttribute('data-auth', 'true');

        const profileLink = document.createElement('a');
        profileLink.href = 'profile.html';
        profileLink.className = 'btn-outline';
        profileLink.textContent = 'Profile';
        profileLink.setAttribute('data-auth', 'true');

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = 'btn-primary';
        logoutLink.textContent = 'Logout';
        logoutLink.setAttribute('data-auth', 'true');
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.logout) {
                window.logout();
            }
        });

        navLinks.appendChild(dashboardLink);
        navLinks.appendChild(profileLink);
        navLinks.appendChild(logoutLink);
    }
}

// ===== Initialize Dashboard =====
if (document.querySelector('.dashboard')) {
    document.addEventListener('DOMContentLoaded', () => {
        new DashboardManager();
    });
}

// ===== Global Functions =====
// Note: Logout is handled by individual page scripts
// This file is for index.html and should not interfere with authentication

// ===== Performance Monitoring =====
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}