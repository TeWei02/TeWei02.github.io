/**
 * 柯德瑋 Te-Wei Ko — Portfolio
 * Nav scroll state · Mobile toggle · Reveal animations · Active section detection
 */
(function () {
    'use strict';

    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const allNavLinks = document.querySelectorAll('.nav-link');
    const revealEls = document.querySelectorAll('.reveal');
    const sections = document.querySelectorAll('section[id]');

    /* ============================================================
       Nav scroll state
       ============================================================ */
    let ticking = false;

    function onScroll() {
        const y = window.scrollY;
        nav.classList.toggle('scrolled', y > 20);

        // Active section
        let current = '';
        sections.forEach(function (s) {
            const top = s.offsetTop - 120;
            if (y >= top) current = s.getAttribute('id');
        });
        allNavLinks.forEach(function (l) {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () { onScroll(); ticking = false; });
            ticking = true;
        }
    });

    /* ============================================================
       Mobile menu
       ============================================================ */
    navToggle.addEventListener('click', function () {
        const open = navLinks.classList.contains('open');
        navLinks.classList.toggle('open', !open);
        navToggle.classList.toggle('active', !open);
    });

    allNavLinks.forEach(function (l) {
        l.addEventListener('click', function () {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        });
    });

    document.addEventListener('click', function (e) {
        if (!nav.contains(e.target) && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
            navToggle.focus();
        }
    });

    /* ============================================================
       Reveal on scroll
       ============================================================ */
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

        revealEls.forEach(function (el) { observer.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('visible'); });
    }

    // Show above-fold reveals immediately on load
    setTimeout(function () {
        revealEls.forEach(function (el) {
            if (el.getBoundingClientRect().top < window.innerHeight) {
                el.classList.add('visible');
            }
        });
    }, 120);

    /* ============================================================
       Init
       ============================================================ */
    onScroll();

})();
