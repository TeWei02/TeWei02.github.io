/**
 * Te-Wei Ko Portfolio — Main JavaScript
 * Handles: scroll-based nav state, mobile menu, reveal animations,
 * active section detection, smooth interactions
 */
(function () {
    'use strict';

    /* ============================================
       DOM References
       ============================================ */
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const allNavLinks = document.querySelectorAll('.nav-link');
    const revealElements = document.querySelectorAll('.reveal');
    const sections = document.querySelectorAll('section[id]');

    /* ============================================
       Nav Scroll State
       ============================================ */
    function updateNavState() {
        const scrollY = window.scrollY;

        // Toggle scrolled class (blur background)
        if (scrollY > 20) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }

        // Update active nav link based on scroll position
        let currentSectionId = '';
        const viewportMiddle = scrollY + window.innerHeight / 3;

        sections.forEach(function (section) {
            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (scrollY >= sectionTop && scrollY < sectionBottom) {
                currentSectionId = section.getAttribute('id');
            }
        });

        allNavLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSectionId) {
                link.classList.add('active');
            }
        });
    }

    /* ============================================
       Mobile Menu Toggle
       ============================================ */
    navToggle.addEventListener('click', function () {
        const isOpen = navLinks.classList.contains('open');
        if (isOpen) {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        } else {
            navLinks.classList.add('open');
            navToggle.classList.add('active');
        }
    });

    // Close mobile menu when a link is clicked
    allNavLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (e) {
        if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        }
    });

    /* ============================================
       Reveal on Scroll (Intersection Observer)
       ============================================ */
    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        // Once revealed, stop observing
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -40px 0px'
            }
        );

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        // Fallback: show all immediately
        revealElements.forEach(function (el) {
            el.classList.add('visible');
        });
    }

    /* ============================================
       Smooth Section Visibility (for nav dot)
       ============================================ */
    // Add slight delay so hero animations play on load
    setTimeout(function () {
        document.querySelectorAll('.reveal').forEach(function (el) {
            var rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight) {
                el.classList.add('visible');
            }
        });
    }, 100);

    /* ============================================
       Event Listeners
       ============================================ */
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                updateNavState();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial state
    updateNavState();

    /* ============================================
       Contact Form — Prevent actual submission
       ============================================ */
    var contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var submitBtn = contactForm.querySelector('.form-submit');
            var originalText = submitBtn.textContent;
            submitBtn.textContent = 'Message sent! (demo)';
            submitBtn.style.background = '#0d9488';
            setTimeout(function () {
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
            }, 2500);
            contactForm.reset();
        });
    }

    /* ============================================
       Keyboard: ESC closes mobile menu
       ============================================ */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
            navToggle.focus();
        }
    });

})();
