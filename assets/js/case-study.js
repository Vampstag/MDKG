/* Shared behaviour for the case study pages in portfolio/.
 *
 * Every block here was duplicated inline, near-verbatim, across all seven of
 * those pages. The logic was identical; only a handful of asset paths differed,
 * and those now come from data attributes on <body> instead of being baked into
 * each copy.
 *
 * Each initialiser is feature-detected against the markup it needs, so a page
 * that lacks a given section simply skips that block. That is what lets one file
 * serve pages with different section sets.
 */

(function () {
    'use strict';

    /* ---------------------------------------------------------------------
     * Preloader
     *
     * Gated on the page's genuine heavy assets (hero image, showreel video
     * metadata, footer fetch), not a fixed-duration timer. The bar climbs fast
     * to HOLD_AT for feel, then actually waits there until those settle. Each
     * asset has a 4s cap so one stalled request can't strand the page behind
     * the overlay.
     * ------------------------------------------------------------------- */
    function initPreloader() {
        const preloader = document.getElementById('preloader');
        if (!preloader) return;

        const footerPromise = fetch('../footer.html').then((response) => response.text());

        // Set per page via <body data-hero-image="...">; without it the hero
        // simply isn't part of the gate, rather than blocking on a bad URL.
        const heroSrc = document.body.dataset.heroImage;
        const heroImagePromise = new Promise((resolve) => {
            if (!heroSrc) { resolve(); return; }
            const heroImg = new Image();
            heroImg.src = heroSrc;
            if (heroImg.complete) { resolve(); return; }
            heroImg.onload = resolve;
            heroImg.onerror = resolve;
            setTimeout(resolve, 4000);
        });

        const showreelVideoPromise = new Promise((resolve) => {
            const video = document.querySelector('#showreel .showreel-video, #showreel video');
            if (!video) { resolve(); return; }
            if (video.readyState >= 1) { resolve(); return; }
            video.addEventListener('loadedmetadata', resolve, { once: true });
            video.addEventListener('error', resolve, { once: true });
            setTimeout(resolve, 4000);
        });

        const counter = document.getElementById('counter');
        const bar = document.getElementById('bar');
        const phraseEl = preloader.querySelectorAll('.corner-text')[3] || null;
        const phrases = ['SYSTEM CHECK...', 'PREPARING ASSETS...', 'ALIGNING PIXELS...', 'OPTIMIZING UI...'];

        let currentProgress = 0;
        const HOLD_AT = 90;
        let assetsSettled = false;
        Promise.all([footerPromise, heroImagePromise, showreelVideoPromise]).then(() => {
            assetsSettled = true;
        });

        function finishLoading() {
            preloader.classList.add('finished');
            document.body.style.overflow = 'auto';
            if (window.lenis) window.lenis.start();
            window.dispatchEvent(new CustomEvent('preloaderDone'));
        }

        function updateCounter() {
            const jump = Math.floor(Math.random() * 40) + 30;
            currentProgress += jump;
            const ceiling = assetsSettled ? 100 : HOLD_AT;
            if (currentProgress > ceiling) currentProgress = ceiling;

            if (counter) counter.innerText = currentProgress.toString().padStart(2, '0') + '%';
            if (bar) bar.style.width = currentProgress + '%';

            if (phraseEl) {
                let pIndex = Math.floor((currentProgress / 100) * phrases.length);
                if (pIndex >= phrases.length) pIndex = phrases.length - 1;
                phraseEl.innerText = phrases[pIndex];
            }

            const delay = currentProgress < ceiling ? Math.floor(Math.random() * 20) + 10 : 80;

            if (currentProgress < 100) {
                setTimeout(updateCounter, delay);
                return;
            }

            const counterWrapper = document.querySelector('.counter-wrapper');
            if (counterWrapper) counterWrapper.classList.add('fade-out');

            footerPromise.then((footerData) => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = footerData;
                tempDiv.querySelectorAll('[data-w-id]').forEach((el) => el.removeAttribute('data-w-id'));
                const footerContainer = document.getElementById('footer-container');
                if (footerContainer) footerContainer.innerHTML = tempDiv.innerHTML;
                requestAnimationFrame(() => {
                    if (window.Webflow) {
                        Webflow.destroy();
                        Webflow.ready();
                        if (Webflow.require('ix2')) Webflow.require('ix2').init();
                    }
                    if (typeof window.initFooterGSAP === 'function') window.initFooterGSAP();
                    if (window.ScrollTrigger) ScrollTrigger.refresh();
                    setTimeout(finishLoading, 50);
                });
            }).catch(() => finishLoading());
        }

        document.body.classList.add('preloader-active');
        setTimeout(updateCounter, 50);
    }

    /* ---------------------------------------------------------------------
     * Sticky dot navigation
     *
     * Highlights the section currently in view, and fills a ring around the
     * active dot to show progress through that section specifically (not the
     * whole page).
     * ------------------------------------------------------------------- */
    function initStickyNav() {
        const navItems = document.querySelectorAll('.cs-nav-item');
        if (!navItems.length) return;

        const sections = document.querySelectorAll('section[id]');
        let activeSection = null;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                activeSection = entry.target;
                navItems.forEach((item) => {
                    item.classList.toggle('active', item.getAttribute('href') === `#${entry.target.id}`);
                });
            });
        }, { rootMargin: '-40% 0px -60% 0px' });

        sections.forEach((sec) => observer.observe(sec));

        const RING_CIRCUMFERENCE = 50.27; // 2 * PI * r(8), matching the SVG's viewBox
        let ticking = false;
        const updateRingProgress = () => {
            ticking = false;
            if (!activeSection) return;
            const rect = activeSection.getBoundingClientRect();
            const progress = Math.min(Math.max((-rect.top) / (rect.height - window.innerHeight || 1), 0), 1);
            const activeCircle = document.querySelector('.cs-nav-item.active .cs-nav-dot-ring circle');
            if (activeCircle) activeCircle.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(updateRingProgress); }
        }, { passive: true });
    }

    /* ---------------------------------------------------------------------
     * Essence pull-quote
     *
     * Per-letter reveal scrubbed to scroll position. Scrubbing rather than a
     * one-shot play is what makes it reverse cleanly on scroll-up.
     * ------------------------------------------------------------------- */
    function initEssenceReveal() {
        const quote = document.getElementById('essence-quote');
        if (!quote) return;

        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            setTimeout(initEssenceReveal, 50);
            return;
        }
        gsap.registerPlugin(ScrollTrigger);

        // Read the source HTML (not textContent) so the manual <br> line breaks
        // survive — textContent drops tags entirely, which let two words on either
        // side of a <br> collapse together with no space between them once rebuilt.
        // Collapse whitespace/indentation around the remaining text nodes, otherwise
        // newlines and leading spaces turn into stray empty/space spans that break centering.
        const originalHTML = quote.innerHTML.replace(/[ \t\n\r]+/g, ' ').trim();

        // Split on <br> first to preserve the forced line breaks, then wrap each
        // WORD within a line in its own span (word-level, not per-character) so the
        // browser still wraps lines normally between words instead of splitting mid-word.
        quote.innerHTML = originalHTML
            .split(/<br\s*\/?>/i)
            .map((line) => line.trim()
                .split(' ')
                .filter(Boolean)
                .map((word) => `<span class="essence-word-wrap" style="display:inline-block; overflow:hidden; vertical-align:top;"><span class="essence-word" style="opacity:0.08; display:inline-block; font-weight:800; transform:translateY(30px);">${word}</span></span>`)
                .join(' ')
            )
            .join('<br>');

        const words = quote.querySelectorAll('.essence-word');

        gsap.to(words, {
            opacity: 1,
            y: 0,
            duration: 0.4, // shorter than the gap between words, so each word's transition finishes before the next starts
            stagger: 4 / words.length, // wide gap between words so each reveal reads as a distinct step, not a blurred sweep
            ease: 'none',
            scrollTrigger: {
                trigger: quote,
                start: 'top 95%',   // reveal starts as soon as the quote first appears at the bottom
                end: 'bottom 60%',  // finishes well after the quote has scrolled up, so it plays out slowly
                scrub: 0.3 // ties progress directly to scroll position, so scrolling up reverses it (text-out)
            }
        });
    }

    /* ---------------------------------------------------------------------
     * Hero entrance
     * ------------------------------------------------------------------- */
    function initHero() {
        if (!document.querySelector('.cs-anim-el')) return;

        if (typeof gsap === 'undefined') {
            setTimeout(initHero, 50);
            return;
        }

        // Apple-like blur reveal: the elements start at opacity:0 inline in the
        // markup, so this is what makes them appear at all.
        gsap.fromTo('.cs-anim-el',
            { y: 30, opacity: 0, filter: 'blur(10px)', scale: 0.98 },
            {
                y: 0,
                opacity: 1,
                filter: 'blur(0px)',
                scale: 1,
                duration: 1.5,
                stagger: 0.2,
                ease: 'power3.out',
                delay: 0.1
            }
        );
    }

    function init() {
        initPreloader();
        initStickyNav();
        initEssenceReveal();
        initHero();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
