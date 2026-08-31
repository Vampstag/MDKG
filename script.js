//#region GLOBAL INITIALIZATION
// =========================================
// 1. CORE SETUP & EVENT LISTENERS
// =========================================

// [NEW] Film grain overlay: injected once, globally, on every page that loads this script.
// A fixed, non-interactive noise layer — cheap (inline SVG, no image request) and applied
// site-wide so no per-page HTML edits are needed.
(function injectGrainOverlay() {
    if (document.querySelector('.grain-overlay')) return;
    const grain = document.createElement('div');
    grain.className = 'grain-overlay';
    grain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grain);
})();

// [NEW] PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed: ', err);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // [NEW] Lacak status preloader agar animasi Hero tidak dimainkan saat layar masih hitam
    let isPreloaderDone = !document.body.classList.contains('preloader-active');
    window.addEventListener('preloaderDone', () => {
        isPreloaderDone = true;
    });

    // Position the hero video carousel immediately — while the preloader is still covering
    // the screen — instead of waiting for preloaderDone like the other hero effects. The
    // 20 cards' circular arrangement is pure CSS transform math (video .play() calls stay
    // lazy/staggered internally, so this doesn't reintroduce the decode-cost stutter this
    // function's own staggering was built to avoid); the only thing it actually needs is
    // the DOM being present, not the preloader being finished. Running it here means the
    // circle is already correct by the time the preloader slides away, instead of visibly
    // snapping from "stacked at default position" to "circular" right after the reveal —
    // most noticeable on mobile where that stacked flash was previously visible.
    try {
        initHeroCarousel();
    } catch (err) {
        console.error('initHeroCarousel (early call) failed:', err);
    }

    // The 3D hero title loads its font from a CDN asynchronously — it's the single most
    // visually important element on the page, so it also runs now (independent of
    // preloaderDone) instead of waiting behind the preloader like the other WebGL hero
    // effects. window.__hero3DTitleReady is a promise the inline preloader script in
    // index.html's <head> awaits before it lets the preloader finish, so the reveal is
    // gated on the title genuinely being ready (or having genuinely failed and fallen
    // back to flat text) instead of a fixed timer that may fire before or long after.
    window.__hero3DTitleReady = new Promise((resolve) => {
        try {
            initHero3DTitle(resolve);
        } catch (err) {
            console.error('initHero3DTitle (early call) failed:', err);
            resolve();
        }
    });

    // Journal data di-fetch dari data/journal.json, untuk tambah artikel edit file itu saja.
    // Path relatif (bukan absolut dari root domain) agar tetap jalan meski dev server-nya
    // di-root-kan ke folder parent (mis. Live Server dibuka dari luar vampstag-portfolio/),
    // bukan cuma saat di-deploy dengan domain root persis di folder ini.
    const isJournalSubPage = window.location.pathname.includes('/case-study/') || window.location.pathname.includes('/study-case/') || window.location.pathname.includes('/journal/') || window.location.pathname.includes('/portfolio/');
    const journalDataPath = (isJournalSubPage ? '../' : '') + 'data/journal.json';
    const journalPromise = fetch(journalDataPath).then(r => r.json()).catch(() => []);

    function injectJournalSchema(journalData) {
        if (document.getElementById('journal-grid')) {
            const schema = {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "itemListElement": journalData.map((post, index) => {
                    const cleanPath = post.link.startsWith('/') ? post.link.substring(1) : post.link.replace('../', '');
                    const absoluteUrl = post.link.startsWith('http') ? post.link : `https://hellodimas.my.id/${cleanPath}`;
                    return {
                        "@type": "ListItem",
                        "position": index + 1,
                        "url": absoluteUrl,
                        "name": post.title
                    };
                })
            };
            const scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            scriptTag.text = JSON.stringify(schema, null, 2);
            document.head.appendChild(scriptTag);
        }
    }

    function renderJournal(journalData) {
        const homeGrid = document.getElementById('latest-journal-grid');
        const journalGrid = document.getElementById('journal-grid');

        // Otomatis menyesuaikan path folder
        const isSubPage = window.location.pathname.includes('/case-study/') || window.location.pathname.includes('/study-case/') || window.location.pathname.includes('/journal/') || window.location.pathname.includes('/portfolio/');
        const prefix = isSubPage ? '../' : '';

        // 1. Render untuk Halaman Home (Ambil 3 teratas)
        if (homeGrid) {
            const latestThree = journalData.slice(0, 3);
            let html = '';
            latestThree.forEach(post => {
                const imgPath = post.image ? (post.image.startsWith('http') ? post.image : prefix + post.image) : '';
                const linkPath = post.link.startsWith('http') || post.link.startsWith('/') || post.link === '#' ? post.link : prefix + post.link;

                html += `
                <div class="latest-journal-card-wrap">
                    <a href="${linkPath}" class="journal-card ${post.isTextOnly ? 'text-only-card' : ''}">
                        ${!post.isTextOnly ? `
                        <div class="journal-card__image-wrapper">
                            <img src="${imgPath}" alt="${post.altText || post.title}" title="${post.imgTitle || post.title}" class="journal-card__image" loading="lazy" decoding="async">
                        </div>
                        ` : ''}
                        <div class="journal-card__content">
                            <div class="journal-card__meta">
                                <span>${post.displayDate}</span>
                                <span>•</span>
                                <span>${post.readTime}</span>
                            </div>
                            <h3 class="journal-card__title">${post.title}</h3>
                            <p class="journal-card__excerpt">${post.excerpt}</p>
                        </div>
                    </a>
                </div>
                `;
            });
            homeGrid.innerHTML = html;
        }

        // 2. Render untuk Halaman Journal (Semua)
        if (journalGrid) {
            let html = '';
            journalData.forEach((post, index) => {
                const imgPath = post.image ? (post.image.startsWith('http') ? post.image : prefix + post.image) : '';
                const linkPath = post.link.startsWith('http') || post.link.startsWith('/') || post.link === '#' ? post.link : prefix + post.link;

                // [OPTIMIZATION] Artikel pertama selalu prioritas LCP di halaman Journal
                const imgLoading = index === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"';

                html += `
                <div class="masonry-item journal-anim-item" style="opacity: 0; transform: translateY(40px);">
                    <a href="${linkPath}" class="journal-card ${post.isTextOnly ? 'text-only-card' : ''}">
                        ${!post.isTextOnly ? `
                        <div class="journal-card__image-wrapper">
                            <img src="${imgPath}" alt="${post.altText || post.title}" title="${post.imgTitle || post.title}" class="journal-card__image" ${imgLoading}>
                        </div>
                        ` : ''}
                        <div class="journal-card__content">
                            <div class="journal-card__meta">
                                <span>${post.displayDate}</span>
                                <span>•</span>
                                <span>${post.readTime}</span>
                            </div>
                            <h3 class="journal-card__title">${post.title}</h3>
                            <p class="journal-card__excerpt">${post.excerpt}</p>
                        </div>
                    </a>
                </div>
                `;
            });
            journalGrid.innerHTML = html;
        }
    }

    function initMobileJournalSnap() {
        const container = document.getElementById('latest-journal-grid');
        if (!container) return;

        const cards = container.querySelectorAll('.latest-journal-card-wrap');

        if (cards.length <= 1) {
            if (cards.length === 1) cards[0].classList.add('is-center');
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-center');
                } else {
                    entry.target.classList.remove('is-center');
                }
            });
        }, {
            root: null,
            rootMargin: "0px -35% 0px -35%",
            threshold: 0
        });

        cards.forEach(card => observer.observe(card));
    }

    // Fetch data, sort, render journal, lalu init snap
    journalPromise.then(data => {
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        injectJournalSchema(data);
        renderJournal(data);
        initMobileJournalSnap();
    });

    // [OPTIMIZATION] 1. Initialize Lenis (Smooth Scroll) & GSAP Secara Sinkronus!
    // Jangan menunggu fetch navbar/footer selesai agar user bisa langsung scroll jika koneksi lambat.
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });
    window.lenis = lenis;

    // --- GSAP & SCROLLTRIGGER INTEGRATION ---
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    lenis.on('scroll', ScrollTrigger.update);

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"], .back-to-top');
        if (link) {
            const targetId = link.getAttribute('href');
            if (link.classList.contains('back-to-top') || targetId === '#' || targetId === '#top') {
                e.preventDefault();
                e.stopPropagation();
                lenis.scrollTo(0, { duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
            } else if (targetId && targetId.startsWith('#') && document.querySelector(targetId)) {
                e.preventDefault();
                e.stopPropagation();
                lenis.scrollTo(targetId, { duration: 1.2 });
            }
        }
    }, true);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // Refresh ScrollTrigger when preloader is done to ensure correct positions
    window.addEventListener('preloaderDone', () => {
        if (document.readyState === 'complete') {
            requestAnimationFrame(() => ScrollTrigger.refresh());
        } else {
            window.addEventListener('load', () => requestAnimationFrame(() => ScrollTrigger.refresh()));
        }
    });

    // 2. Async Loading: Pull in shared navbar AND footer if placeholders exist
    Promise.all([loadNavbar(), loadFooter()]).then(() => {
        // 3. Navbar Logic (Scroll & Mobile)
        // Wrapped in try/catch: an exception anywhere in navbar init must not be able to
        // block the hero animations below it, since both run in this same callback chain.
        try {
            initNavbar();
        } catch (err) {
            console.error('initNavbar failed:', err);
        }

        // 3. Render Projects
        // renderProjects(); // This function is for portfolio.html, not index.html

        // 4. & 5. Animations - Tunggu Preloader beres dulu agar tidak flickering kosong!
        // Staggered across several animation frames rather than firing all seven at once:
        // three of these create their own WebGL context (3D title + 2 sparkles) and one
        // starts 20 videos decoding/playing simultaneously (the carousel) — running all
        // of that in the same tick the preloader's own slide-up transition starts was
        // exactly what caused the stutter/jank right as the preloader finished. Spacing
        // them out lets each one's setup cost land in its own frame instead of piling up
        // in one, and gives the preloader's CSS transition a clear first frame to itself.
        const runAnimations = () => {
            // Frame 1: the interactive hero (Draggable setup) — needed immediately since
            // it's the very first thing visible once the preloader clears.
            initInteractiveHero();

            requestAnimationFrame(() => {
                // initHero3DTitle() is NOT called here anymore — it now runs at
                // DOMContentLoaded, before the preloader hides (see window.__hero3DTitleReady
                // above), since the preloader needs to actually wait on it.

                requestAnimationFrame(() => {
                    // Frame 3: the two sparkle WebGL contexts together — small/cheap
                    // individually, but two new WebGL contexts is still real GPU setup cost.
                    initHero3DSparkles();
                    initHeroDepthParallax();

                    requestAnimationFrame(() => {
                        // Frame 4: ScrollTrigger pin — layout-dependent, benefits from
                        // running after the elements above have already settled.
                        initHeroRevealPin();

                        requestAnimationFrame(() => {
                            // initHeroCarousel() is NOT called here — it now runs immediately
                            // at DOMContentLoaded (see below), before the preloader even starts
                            // hiding. It used to run here, after preloaderDone, which meant the
                            // 20 cards sat stacked at their default (unpositioned) spot for a
                            // beat AFTER the preloader had already slid away — visible on mobile
                            // as a jump from "stacked" to "circular." Positioning is pure CSS
                            // transform math (cheap, no video work — video .play() calls stay
                            // lazy/staggered exactly as before), so there's no cost reason it
                            // needed to wait this long; it only ever needed to wait for the DOM.
                            initAboutStickyFlip();
                            initHomeServicesAccordion();
                        });
                    });
                });
            });
        };

        if (!isPreloaderDone) {
            window.addEventListener('preloaderDone', runAnimations, { once: true });
        } else {
            runAnimations();
        }

        // 6. Lazy Load Bits Slider (Hanya jalankan Swiper saat elemen mendekati viewport)
        const bitsSliderEl = document.querySelector('.bits-slider');
        if (bitsSliderEl && typeof IntersectionObserver !== 'undefined') {
            const sliderObserver = new IntersectionObserver((entries, obs) => {
                if (entries[0].isIntersecting) {
                    initBitsSlider();
                    obs.disconnect(); // Hentikan observasi setelah slider berhasil dibuat
                }
            }, { rootMargin: "300px 0px" }); // Trigger 300px sebelum masuk layar
            sliderObserver.observe(bitsSliderEl);
        } else if (bitsSliderEl) {
            initBitsSlider(); // Fallback
        }

        // 7. Lightbox
        initLightbox();

        // 8. FAQ Accordion
        initFAQ();

        // 10. Video Card Controls
        initVideoCards();

        // 11. Tab Title Switch
        initTabTitleSwitch();

        // 12. Logo Marquee — measures exact loop width (see initLogoMarqueeLoop)
        initLogoMarqueeLoop();

        // 12b. Featured Work Card Tilt — cursor-driven, see initWorkCardTilt
        initWorkCardTilt();

        // 12c. Case Study Hero Showreel — pause off-screen, see initCaseStudyShowreelVisibility
        initCaseStudyShowreelVisibility();

        // 13. Data Validation Counter
        initDataCounter();

        // 14. Data Parallax
        initDataParallax();

        // 15. Audio Narrator
        initAudioNarrator();

        // 15b. Magnetic Buttons
        initMagneticButtons();

        // 15b-ii. About Section Showreel Player
        try {
            initAboutIntroPlayer();
            initAboutIntroVideoModal();
            initAboutShowreelReveal();
        } catch (err) {
            console.error('initAboutIntroPlayer failed:', err);
        }

        // 15b-iii. About Section 3D Accents
        try {
            initAboutAccent3D();
        } catch (err) {
            console.error('initAboutAccent3D failed:', err);
        }

        // 15c. Scroll-Linked Text Distortion
        // Wrapped in try/catch: a failure here must not be able to stop initClipPathReveal()
        // (and anything else) below it from running — that previously left the bento grid
        // stuck invisible (clip-path never opened) because one unrelated effect threw.
        try {
            initScrollTextDistortion();
        } catch (err) {
            console.error('initScrollTextDistortion failed:', err);
        }

        // 15d. Clip-Path Reveal for Project Media
        try {
            initClipPathReveal();
        } catch (err) {
            console.error('initClipPathReveal failed:', err);
        }

        // 16. Share Buttons (Web Share API)
        initShareButtons();

        // 17. Page Transitions
        initPageTransitions();

        // Refresh ScrollTrigger after async elements are injected
        ScrollTrigger.refresh();
    });
});

// helper: load navbar html into placeholder, returns a promise that resolves after injection
function loadNavbar() {
    const container = document.getElementById('navbar-container');
    if (!container) return Promise.resolve();
    // choose path relative to current location; case study pages are one level deep
    let url = 'navbar.html';
    if (window.location.pathname.includes('/case-study/') || window.location.pathname.includes('/study-case/') || window.location.pathname.includes('/journal/') || window.location.pathname.includes('/portfolio/')) {
        url = '../navbar.html';
    }
    return fetch(url)
        .then(resp => resp.text())
        .then(html => {
            container.innerHTML = html;

            // [SECRET PAGE HACK] Hapus tautan Services dari Navbar (Desktop & Mobile)
            container.querySelectorAll('a').forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href === '/services' || href === 'services.html' || href === '../services' || href === '../services.html')) {
                    link.remove(); // Hapus tombol/teks dari DOM
                }
            });

                // [NEW] Khusus untuk halaman Study Case, beri class navbar-invert-top agar teksnya putih
                const navbarElement = container.querySelector('.navbar');
                if (navbarElement && document.querySelector('.portfolio-hero-section-center, .hero-bg-image')) {
                    navbarElement.classList.add('navbar-invert-top');
                }

            // fix relative link paths when the page is inside a subfolder
            if (window.location.pathname.includes('/case-study/') || window.location.pathname.includes('/study-case/') || window.location.pathname.includes('/journal/') || window.location.pathname.includes('/portfolio/')) {
                container.querySelectorAll('a').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && !href.startsWith('http') && !href.startsWith('../') && !href.startsWith('/')) {
                        link.setAttribute('href', '../' + href);
                    }
                });
            }
            
                // [NEW] Smart Dynamic Active State for Navbar Links
                const pathname = window.location.pathname;
                
                container.querySelectorAll('.navigation-link, .mobile-link').forEach(link => {
                    const href = link.getAttribute('href');
                    if (!href) return;
                    
                    let isActive = false;
                    if (href === '/' && (pathname === '/' || pathname === '/index.html' || pathname === '')) {
                        isActive = true;
                    } else if (href !== '/' && pathname.startsWith(href)) {
                        isActive = true;
                    }
                    
                    if (isActive) {
                        link.classList.add('w--current', 'active');
                        link.setAttribute('aria-current', 'page');
                    }
                });

            // If Webflow interactions are used inside navbar we need to re-init them
            if (window.Webflow) {
                Webflow.destroy();
                Webflow.ready();
                if (Webflow.require && Webflow.require('ix2')) {
                    Webflow.require('ix2').init();
                }
            }

            if (window.ScrollTrigger) {
                ScrollTrigger.refresh();
            }
        })
        .catch(err => {
            console.error('Failed to load navbar:', err);
        });
}

// helper: load footer html into placeholder
function loadFooter() {
    const container = document.getElementById('footer-container');
    // Don't interfere if the page has its own preloader logic (like index.html) that loads footer
    if (!container || document.getElementById('preloader')) return Promise.resolve();

    let url = 'footer.html';
    const isSubPage = window.location.pathname.includes('/case-study/') || window.location.pathname.includes('/study-case/') || window.location.pathname.includes('/journal/') || window.location.pathname.includes('/portfolio/');
    
    if (isSubPage) {
        url = '../footer.html';
    }

    return fetch(url)
        .then(resp => resp.text())
        .then(html => {
            // [FIX] Bersihkan atribut data Webflow dari footer untuk mematikan animasi lawas
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            tempDiv.querySelectorAll('[data-w-id]').forEach(el => el.removeAttribute('data-w-id'));

            container.innerHTML = tempDiv.innerHTML;

            // [SECRET PAGE HACK] Hapus tautan Services dari Footer
            container.querySelectorAll('a').forEach(link => {
                const href = link.getAttribute('href');
                if (href && (href === '/services' || href === 'services.html' || href === '../services' || href === '../services.html')) {
                    link.remove(); // Hapus link ratecard dari footer
                }
            });

            // Fix relative paths for links and images in footer
            if (isSubPage) {
                container.querySelectorAll('a, img').forEach(el => {
                    const href = el.getAttribute('href');
                    const src = el.getAttribute('src');
                    // Fix links that are relative (not http, mailto, hash, or already corrected)
                    if (href && !href.match(/^(http|#|mailto:|\.\.\/|\/)/)) el.setAttribute('href', '../' + href);
                    if (src && !src.match(/^(http|data:|\.\.\/|\/)/)) el.setAttribute('src', '../' + src);
                });
            }

            // [MATCH HOME] Use requestAnimationFrame for consistent timing
            requestAnimationFrame(() => {
                // 1. Re-initialize Webflow Interactions (Diaktifkan kembali untuk fitur halaman lain, footer aman karena atributnya sudah dicopot)
                if (window.Webflow) {
                    Webflow.destroy(); 
                    Webflow.ready();
                    if (Webflow.require && Webflow.require('ix2')) {
                        Webflow.require('ix2').init();
                    }
                }

                // 2. Universal Premium Footer Animation
                if (typeof window.initFooterGSAP === 'function') {
                    window.initFooterGSAP();
                }

                // 3. Refresh ScrollTrigger
                if (window.ScrollTrigger) {
                    ScrollTrigger.refresh();
                }

                // 4. Initialize Formspree AJAX
                if (!document.getElementById('formspree-sdk')) {
                    const script = document.createElement('script');
                    script.id = 'formspree-sdk';
                    script.src = "https://unpkg.com/@formspree/ajax@1";
                    script.defer = true;
                    script.onload = () => {
                        window.formspree = window.formspree || function () { (window.formspree.q = window.formspree.q || []).push(arguments); };
                        window.formspree('initForm', { formElement: '#wf-form-Email-Form', formId: 'xqenneyy' });
                    };
                    document.body.appendChild(script);
                } else if (window.formspree) {
                    window.formspree('initForm', { formElement: '#wf-form-Email-Form', formId: 'xqenneyy' });
                }
            });
        })
        .catch(err => {
            console.error('Failed to load footer:', err);
        });
}

// [NEW] Universal Premium Footer Entry Animation
window.initFooterGSAP = function() {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;

    // Footer 3D marquee icons (camera/asterisk/play button, see initAboutAccent3D) —
    // called here rather than in the main init sequence because footer.html is fetched
    // and injected asynchronously (see loadFooter()); this callback is the one place
    // guaranteed to run after that injection completes on every page, homepage
    // included (which loads the footer through its own inline preloader script, not
    // loadFooter(), but still calls window.initFooterGSAP() at the same point).
    if (!footerContainer.dataset.accent3dInit) {
        footerContainer.dataset.accent3dInit = 'true'; // guard against double-init if this ever fires twice for the same footer
        try {
            initAboutAccent3D('.footer-accent-3d', { requireDesktop: false, interactive: false });
        } catch (err) {
            console.error('Footer 3D accents failed:', err);
        }
    }

    // Cari elemen pembungkus (kolom atau grid) di dalam footer untuk di-stagger
    let targets = footerContainer.querySelectorAll('.w-layout-grid > div, .footer-column, .footer-wrapper > div, .footer-main-block > div');
    
    // Fallback jika class spesifik tidak ditemukan
    if (!targets || targets.length === 0) {
        targets = footerContainer.firstElementChild;
    }

    gsap.fromTo(targets, 
        { y: 50, opacity: 0 },
        {
            y: 0, 
            opacity: 1, 
            duration: 1.2, 
            stagger: 0.1, 
            ease: "power3.out",
            scrollTrigger: {
                trigger: footerContainer,
                start: "top 95%", // Memicu animasi ketika bagian atas footer baru terlihat 5%
                once: true
            }
        }
    );
};
//#endregion

//#region NAVBAR LOGIC
// =========================================
// 2. NAVBAR & MOBILE MENU
// =========================================
/**
 * Handles sticky navbar state and mobile menu toggling.
 * Why: To ensure navigation is accessible and provides visual feedback on scroll.
 */
function initNavbar() {
    // -- Selectors --
    const navbar = document.querySelector('.navbar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');
    const progressBar = document.getElementById('scroll-progress');
    let navRafId = null;

    // -- Scroll Effect Logic ---
    // Direction comes from Lenis's own {scroll, direction} payload, not window.scrollY —
    // with Lenis smooth-scroll active, window.scrollY overshoots/settles-back relative to
    // Lenis's actual virtual position, which made the raw-position comparison misread
    // scroll direction and caused the navbar to jitter/stay visible on scroll-down (the
    // same root cause behind the earlier music-widget flicker bug). Falls back to
    // window.scrollY only if Lenis isn't available at all.
    const handleScroll = (currentScroll, direction) => {
        // 1. Shrink Effect (Class-based for performance)
        if (currentScroll > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 2. Smart Hide/Show (UX Optimization)
        // Hide when scrolling down (> 100px), Show when scrolling up
        // FIX: Don't hide navbar if mobile menu is currently open
        if (mobileOverlay && mobileOverlay.classList.contains('is-active')) {
            navbar.classList.remove('navbar-hidden');
        } else if (direction > 0 && currentScroll > 100) {
            navbar.classList.add('navbar-hidden');
        } else if (direction < 0) {
            navbar.classList.remove('navbar-hidden');
        }

        if (progressBar) {
            // Calculate scroll percentage for the top progress bar
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            if (scrollHeight > 0) {
                const scrolled = (currentScroll / scrollHeight) * 100;
                progressBar.style.transform = `scaleX(${scrolled / 100})`;
            } else {
                progressBar.style.transform = 'scaleX(0)';
            }
        }
    };

    if (window.lenis) {
        window.lenis.on('scroll', ({ scroll, direction }) => {
            if (navRafId !== null) return;
            navRafId = requestAnimationFrame(() => {
                navRafId = null;
                handleScroll(scroll, direction);
            });
        });
        handleScroll(window.lenis.scroll || 0, 0);
    } else {
        // Fallback for pages/contexts without Lenis: derive direction from raw scrollY.
        let lastScrollTop = Math.max(0, window.scrollY);
        const onScroll = () => {
            if (navRafId !== null) return;
            navRafId = requestAnimationFrame(() => {
                navRafId = null;
                const currentScroll = window.scrollY;
                const direction = currentScroll > lastScrollTop ? 1 : -1;
                lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
                handleScroll(currentScroll, direction);
            });
        };
        window.addEventListener('scroll', onScroll);
        handleScroll(window.scrollY, 0);
    }

    // -- Mobile Menu Toggle Logic --
    if (menuBtn && mobileOverlay) {
        menuBtn.addEventListener('click', () => {
            const isActive = mobileOverlay.classList.toggle('is-active');
            menuBtn.classList.toggle('is-active');
            
            // Sinkronisasi class menu-open untuk mengembalikan warna asli elemen navbar (Hitam)
            if (navbar) navbar.classList.toggle('menu-open', isActive);
            
            // Lock body scroll when menu is open
            document.body.style.overflow = isActive ? 'hidden' : 'auto';
            
            if (isActive) {
                gsap.to(mobileLinks, {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.1,
                    ease: "power3.out",
                    delay: 0.2
                });
            } else {
                gsap.to(mobileLinks, {
                    y: 40,
                    opacity: 0,
                    duration: 0.3
                });
            }
        });
    }

}
//#endregion

//#region PAGE TRANSITION
// =========================================
// 18. SEAMLESS PAGE TRANSITION
// =========================================
// Synthesized (no mp3 asset) via Web Audio API, same approach already used elsewhere
// on the site (see playLockFeedback in portfolio.js) rather than adding a new audio
// dependency for two one-off sounds. One shared AudioContext, created lazily on first
// actual use — browsers require a user gesture before audio can play, and a link click
// (the exit sound's trigger) satisfies that; the arrival sound on the next page relies
// on the browser still considering the session "activated" from that same click, which
// is standard behavior but not guaranteed on every browser, so both sounds are wrapped
// in try/catch and silently no-op if audio can't play — the transition itself must
// never depend on sound succeeding.
let __pageTransitionAudioCtx = null;
function getPageTransitionAudioCtx() {
    if (__pageTransitionAudioCtx) return __pageTransitionAudioCtx;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    __pageTransitionAudioCtx = new AudioContextClass();
    return __pageTransitionAudioCtx;
}

// Filtered white noise, not an oscillator tone — a sine/oscillator sweep reads as a
// musical pitch bend (a "digital beep"), which is exactly the "aneh, mencolok, digital"
// character that didn't work here. Real whoosh sounds (wind, air movement, fabric) are
// noise-based: broadband white noise pushed through a lowpass filter whose cutoff
// frequency sweeps down over the sound's duration is the standard technique for a
// natural, breathy, LOW-weighted whoosh with no discernible pitch at all.
function createNoiseBuffer(ctx, durationSeconds) {
    const bufferSize = Math.ceil(ctx.sampleRate * durationSeconds);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
}

// Exit sound: a low, breathy whoosh sweeping downward in tone — signals "leaving"
// as an unobtrusive texture under the overlay's own swipe, not a sound anyone should
// consciously register.
function playPageExitSfx() {
    try {
        const ctx = getPageTransitionAudioCtx();
        if (!ctx) return;
        const duration = 0.4;
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(ctx, duration);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        // Sweeping the cutoff down (not up) is what gives this its "heavy/low" weight —
        // it opens with some air/texture and settles into a dull, low rumble rather than
        // brightening toward a hiss.
        filter.frequency.setValueAtTime(900, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + duration);
        filter.Q.value = 0.7;

        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        // Quiet, quick attack and a longer soft tail — kept low enough (peak 0.05) that
        // it sits under the visual transition as texture, not a sound effect in its
        // own right.
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + duration);
    } catch (e) { /* audio is a nicety, never block navigation on it */ }
}

// Arrival sound: the same low noise-whoosh technique, mirrored — a short breath
// settling in, marking "you've landed" without a rising pitch that would read as a
// notification chime.
function playPageArrivalSfx() {
    try {
        const ctx = getPageTransitionAudioCtx();
        if (!ctx) return;
        const duration = 0.3;
        const noise = ctx.createBufferSource();
        noise.buffer = createNoiseBuffer(ctx, duration);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.12);
        filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + duration);
        filter.Q.value = 0.7;

        const gain = ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + duration);
    } catch (e) { /* audio is a nicety, never block navigation on it */ }
}

// Arrival fires once per page load, right as this page's own preloader finishes (every
// page on the site dispatches 'preloaderDone' — see each page's inline preloader
// script) — that's the moment the visual transition actually completes from the
// visitor's side, not DOMContentLoaded, which fires earlier while the overlay is
// typically still covering the screen.
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('preloader-active')) {
        window.addEventListener('preloaderDone', playPageArrivalSfx, { once: true });
    } else {
        // No preloader on this page (or it already finished before this script ran) —
        // play immediately rather than waiting on an event that will never fire.
        playPageArrivalSfx();
    }
});

function initPageTransitions() {
    if (typeof gsap === 'undefined') return;

    // Buat elemen tirai transisi (overlay) secara dinamis
    const overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    document.body.appendChild(overlay);

    // [OPTIMIZATION] Smart Hover Prefetching (Membuat Pindah Halaman Terasa Instan)
    const prefetchedUrls = new Set();
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a');
        if (link && link.href) {
            const url = link.href;
            // Hanya prefetch link internal, bukan anchor (#), dan belum pernah di-prefetch
            if (url.startsWith(window.location.origin) && !url.includes('#') && !prefetchedUrls.has(url)) {
                const prefetchTag = document.createElement('link');
                prefetchTag.rel = 'prefetch';
                prefetchTag.href = url;
                document.head.appendChild(prefetchTag);
                prefetchedUrls.add(url); // Tandai agar tidak di-download dua kali
            }
        }
    }, { passive: true });

    // Animasi Keluar (Exit) saat tautan diklik
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const targetUrl = link.getAttribute('href');
        const isExternal = targetUrl && targetUrl.startsWith('http') && !targetUrl.includes(window.location.hostname);
        
        if (
            !targetUrl || targetUrl === '#' || targetUrl.startsWith('#') || 
            targetUrl.startsWith('mailto:') || targetUrl.startsWith('tel:') || 
            targetUrl.startsWith('javascript:') || link.getAttribute('target') === '_blank' || isExternal ||
            link.classList.contains('lightbox-close') || link.classList.contains('video-modal-close')
        ) return;

        e.preventDefault();

        playPageExitSfx();

        // [NEW] Narrative transition: if the clicked link (or an ancestor, e.g. a project
        // card) carries a data-accent-color, tint the overlay with it instead of always
        // using plain black — the outgoing page's own color briefly "carries through" to
        // the next one. Falls back to the overlay's default black when no accent is set.
        const accentSource = link.closest('[data-accent-color]');
        overlay.style.backgroundColor = accentSource ? accentSource.dataset.accentColor : '';

        gsap.to(overlay, {
            y: "0%", duration: 0.5, ease: "power3.inOut",
            onComplete: () => window.location.href = targetUrl
        });
    });

    // Fallback BFCache (Safari Back Button Fix)
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) gsap.set(overlay, { y: "150%" });
    });
}
//#endregion

//#region PORTFOLIO LOGIC
// =========================================
// 3. PROJECT RENDERING
// =========================================
/**
 * Dynamically renders project cards into the grid.
 * Why: Allows for easy updates to project data without touching HTML structure.
 */
function renderProjects() {
    const grid = document.getElementById('portfolio-grid');
    
    // Error Prevention: Check if grid or data exists
    if (!grid || typeof projectsData === 'undefined') return;

    grid.innerHTML = ''; // Clear existing

    try {
        projectsData.forEach(project => {
        const card = document.createElement('div');
        card.className = `project-card fade-in-section ${project.ongoing ? 'is-ongoing' : ''}`;
        card.style.opacity = '0'; // Initial state for animation

        // Render tag & properti berbeda jika project on-going
        const isClickable = !project.ongoing;
        const WrapperTag = isClickable ? 'a' : 'div';
        const hrefAttr = isClickable ? `href="${project.link}"` : '';
        // Feeds the narrative page-transition overlay (see initPageTransitions) with this
        // project's brand color, so the transition tints toward where the user is headed.
        const accentAttr = project.accentColor ? `data-accent-color="${project.accentColor}"` : '';
        const badgeHTML = project.ongoing ? `<div class="ongoing-badge">ON-GOING</div>` : '';
        const categoryBadgesHTML = (project.category || '').split('·').map(cat => `<div class="portfolio-card-category-badge">${cat.trim()}</div>`).join('');

        card.innerHTML = `
            <${WrapperTag} ${hrefAttr} ${accentAttr} class="project-link w-inline-block">
                <div class="project-image-wrapper">
                    <img src="${project.image}" alt="${project.title}" class="project-image" loading="lazy">
                    ${badgeHTML}
                </div>
                <div class="project-info" style="padding: 28px 24px; display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        ${categoryBadgesHTML}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                        <h3 class="project-title" style="margin: 0; font-size: clamp(1.35rem, 4vw, 1.75rem); letter-spacing: -0.03em;">${project.title}</h3>
                        <span class="project-year" style="font-size: 1rem; color: #888; font-weight: 600; margin-top: 6px; flex-shrink: 0;">${project.ongoing ? 'On-going' : '2026'}</span>
                    </div>
                </div>
            </${WrapperTag}>
        `;
        grid.appendChild(card);
    });
    } catch (error) {
        console.error("Error rendering projects:", error);
    }
}
//#endregion

//#region ANIMATIONS
// =========================================
// 4. GSAP ANIMATIONS
// =========================================

/**
 * Uses a single IntersectionObserver to handle all scroll-triggered animations
 * for better performance than multiple ScrollTriggers.
 */
function initObserverAnimations(context = document) {
    // Select all elements intended for scroll-based animations
    const animatedElements = context.querySelectorAll('.fade-in-section, .text-reveal');

    if (!animatedElements.length) return;

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Handle complex text reveal animation
                if (entry.target.classList.contains('text-reveal')) {
                    animateTextReveal(entry.target);
                } 
                // Handle specific Experience item animation
                else if (entry.target.classList.contains('experience-item')) {
                    animateExperienceItem(entry.target);
                }
                        // [NEW] Handle specific Latest Journal reveal (Slower fade-in)
                        else if (entry.target.id === 'latest-journal') {
                            animateJournalSection(entry.target);
                        }
                // Handle simple fade-in animations
                else {
                    entry.target.classList.add('is-visible');
                }
                // Stop observing the element after it has animated once
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.05, // Mulai lebih cepat (hanya 5% masuk)
        rootMargin: "0px 0px 50px 0px" // Trigger 50px SEBELUM elemen masuk layar
    });

    animatedElements.forEach(el => {
        if (el.dataset.observed) return; // Prevent double observation
        el.dataset.observed = "true";
        observer.observe(el);
    });
}

/**
 * Animates an experience item with a staggered effect.
 * This is more performant than the old hover-reveal and more interesting
 * than a simple fade-in.
 * @param {HTMLElement} item The .experience-item element to animate.
 */
function animateExperienceItem(item) {
    const title = item.querySelector('.experience-item__title');
    const company = item.querySelector('.experience-item__company');
    const meta = item.querySelector('.experience-item__meta');

    // Use a GSAP timeline for a controlled, staggered sequence. Ease/duration match
    // the site's standard reveal weight (see --reveal-duration/.fade-in-section in
    // css/style.css) so this reads as the same visual language, not its own thing.
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

    tl.to(item, {
        opacity: 1,
        x: 0,
        duration: 0.7,
        clearProps: "transform" // [FIX] Cegah bentrok dengan CSS hover transition
    })
    .fromTo([title, company, meta],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
        "-=0.55" // Overlap animations for a smoother effect
    );
}

/**
 * Slower, grander reveal for Latest Journal section
 * @param {HTMLElement} section The journal section element.
 */
function animateJournalSection(section) {
    // Matikan transisi CSS bawaan agar tidak bentrok dengan GSAP
    section.classList.remove('fade-in-section');
    section.style.opacity = 1;
    section.style.transform = 'none';
    
    const headline = section.querySelector('.section-headline-margin');
    const cards = section.querySelectorAll('.latest-journal-card-wrap');
    
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } }); // Kurva ease lebih snappy
    
    if (headline) {
        tl.fromTo(headline, 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6 }
        );
    }
    
    if (cards.length > 0) {
        tl.fromTo(cards,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 },
            "-=0.4" // Mulai hampir bersamaan dengan headline
        );
    }
}

/**
 * Helper function to run the GSAP text animation for headlines.
 * This is called by the IntersectionObserver.
 * @param {HTMLElement} element The .text-reveal element to animate.
 */
function animateTextReveal(element) {
    element.style.opacity = '1'; // Make container visible

    // Mobile: skip the per-character split (dozens of individually staggered/animated
    // <span> elements per headline) in favor of one simple fade+rise on the whole block.
    // This element's reveal often lands in the same frame window as the hero-reveal pin
    // (see initHeroRevealPin) — on mobile that pin's own scroll-driven work is already
    // heavy, and stacking a per-character stagger on top of it was what made the text
    // visibly stutter/freeze mid-reveal instead of completing smoothly.
    if (!window.matchMedia('(min-width: 992px)').matches) {
        gsap.fromTo(element,
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
        );
        return;
    }

    // innerText (not textContent) so hand-authored <br> tags survive as \n instead of
    // being silently dropped — otherwise a multi-line headline like "Hi, I'm Dimas<br>..."
    // would get rebuilt as one continuous line with the break lost.
    const lines = element.innerText.split('\n');
    element.innerHTML = '';

    const chars = [];
    lines.forEach((line, lineIndex) => {
        const words = line.split(' ');
        words.forEach((word, wordIndex) => {
            // Wrap each word so its letters can never be split across a line break.
            // font-weight: inherit is explicit here because the shared `span { ... }`
            // rule in css/style.css (used for ordinary inline text like italics/links)
            // sets font-weight: 400 for every span on the page — a real, generic global
            // rule, not a bug on its own. It never affected headlines before because
            // headline text used to render as a plain text node inside the <h2>, never
            // wrapped in a span. This function is the one place that changes that: it
            // rebuilds the heading's text into per-character spans for the stagger
            // animation, and those spans were silently picking up the global span rule's
            // 400 weight instead of the heading's own 700 — the actual root cause of the
            // mobile/desktop weight mismatch (mobile skips this per-char rebuild
            // entirely, see the early return above, so it never hit this at all).
            const wordSpan = document.createElement('span');
            wordSpan.style.display = 'inline-block';
            wordSpan.style.whiteSpace = 'nowrap';
            wordSpan.style.fontWeight = 'inherit';

            word.split('').forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.transform = 'translateY(20px)';
                wordSpan.appendChild(span);
                chars.push(span);
            });
            element.appendChild(wordSpan);

            if (wordIndex < words.length - 1) {
                element.appendChild(document.createTextNode(' '));
            }
        });

        if (lineIndex < lines.length - 1) {
            element.appendChild(document.createElement('br'));
        }
    });

    gsap.to(chars, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.015,
        ease: "power2.out" // matches the site's standard reveal ease (see .fade-in-section)
    });
}

/**
 * Animates the NEW Interactive Hero section.
 */
function initInteractiveHero() {
    // Cek apakah section hero interaktif dan plugin Draggable tersedia
    if (!document.querySelector('.hero-playground-section') || typeof Draggable === 'undefined') {
        initObserverAnimations(); // Tetap jalankan animasi scroll standar
        return;
    }

    // Draggable (drag-to-reposition) used to be enabled here for .drag-item (the two
    // hero sparkles) — removed in favor of drag-to-rotate on the sparkles themselves
    // (see initHero3DSparkles), which would otherwise fight this same mousedown/drag
    // gesture for control of the same elements. gsap.registerPlugin(Draggable) is kept
    // in case any other code path expects the plugin registered, even though nothing
    // currently calls Draggable.create.
    if (typeof Draggable !== 'undefined') {
        gsap.registerPlugin(Draggable);
    }

    // 3. Entrance Animation (Pop in elements)
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.7)" } });

    // Split the hero title into per-letter spans so it reveals letter by letter on load,
    // instead of animating in as a single blurred block. Line breaks (<br>) are preserved
    // so "Brand" / "Creative" still stack the same way.
    const heroTitle = document.querySelector(".hero-huge-title");
    let heroTitleChars = [];
    if (heroTitle && !heroTitle.dataset.split) {
        heroTitle.dataset.split = 'true'; // guard against double-init re-splitting already-split spans
        const lines = heroTitle.innerHTML.split(/<br\s*\/?>/i);
        heroTitle.innerHTML = '';
        lines.forEach(line => {
            const lineEl = document.createElement('span');
            lineEl.style.display = 'block';
            line.trim().split('').forEach(char => {
                const span = document.createElement('span');
                span.textContent = char;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.transform = 'translateY(40px)';
                lineEl.appendChild(span);
                heroTitleChars.push(span);
            });
            heroTitle.appendChild(lineEl);
        });
    }

    // Safety net: if this timeline never runs/completes for any reason, the split letters
    // must not stay stuck at opacity:0 forever (invisible title). Forces them visible after
    // a short delay regardless of what happened to the GSAP timeline.
    if (heroTitleChars.length) {
        setTimeout(() => {
            heroTitleChars.forEach(span => {
                span.style.opacity = '1';
                span.style.transform = 'translateY(0)';
            });
        }, 2500);
    }

    // Animate Text First
    tl.to(heroTitleChars,
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.04, ease: "power4.out" }
    )
    .fromTo(".hero-subtitle, .hero-badge",
        { y: 30, opacity: 0, filter: "blur(12px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 1.2, ease: "power3.out" },
        "-=1.0"
    );

    // Animate Draggable Items (Staggered Pop)
    const items = document.querySelectorAll('.drag-item');
    if (items.length > 0) {
        tl.fromTo(items, 
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.6, stagger: 0.1 },
            "-=0.4"
        );
    }
    // Call the observer-based animations after the main hero is set up
    initObserverAnimations();
}
//#endregion

/**
 * Renders "Visual Creative" as real extruded 3D geometry in a WebGL canvas layered over the
 * hero's <h1> text — lit, rotating gently toward the mouse. The <h1> itself is never
 * removed: it's the accessible/SEO copy and the automatic fallback if WebGL, the font, or
 * any Three.js dependency isn't available. Every failure path below simply leaves the
 * canvas hidden and the plain text visible — this must never be able to break the rest of
 * the hero (see the try/catch wrapping the whole thing).
 */
function initHero3DTitle(onReady) {
    // onReady (optional): called exactly once, whether the font loads or fails, so a
    // caller can treat "3D title is settled" as a real load signal (see the preloader's
    // buildLoadPromises() in index.html, which waits on this instead of a fake timer).
    const signalReady = onReady || (() => {});
    try {
        const canvas = document.getElementById('hero-3d-title-canvas');
        if (!canvas) { signalReady(); return; }
        if (typeof THREE === 'undefined' || !THREE.FontLoader || !THREE.TextGeometry) { signalReady(); return; }
        // Enabled on all screen sizes (previously desktop-only) so mobile/tablet get the
        // same premium 3D chrome title instead of falling back to flat 2D text.

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 60;

        // Editorial lighting setup: a soft ambient floor so nothing goes pure black, one
        // directional key light for the main highlight (angled, not flat-on, so the bevel
        // edges actually catch light and read as dimensional), a cooler fill from the
        // opposite side to keep shadow areas from going dead, and a rim light behind to
        // separate the letterforms from the background — closer to how a print ad or
        // product shot is lit than a single flat headlamp.
        scene.add(new THREE.AmbientLight(0xffffff, 0.35));
        const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.1);
        keyLight.position.set(-40, 50, 70);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xcfe0ff, 0.4);
        fillLight.position.set(50, -10, 30);
        scene.add(fillLight);
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(10, 20, -60);
        scene.add(rimLight);

        // Dark charcoal instead of flat pure black, with enough smoothness (low roughness)
        // and a touch of metalness/clearcoat to pick up a soft highlight along the bevel —
        // reads as a considered material instead of a matte silhouette.
        const material = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a1a,
            metalness: 0.4,
            roughness: 0.22,
            clearcoat: 0.5,
            clearcoatRoughness: 0.25,
        });

        // Self-hosted (previously loaded from threejs.org directly) — on mobile networks
        // that external fetch was slow/unreliable enough to blow past a usable load time,
        // silently leaving the canvas hidden and only the flat <h1> fallback visible.
        const loader = new THREE.FontLoader();
        loader.load(
            'assets/fonts/helvetiker_regular.typeface.json', // Regular, not Bold — reads lighter/more editorial
            (font) => {
                const group = new THREE.Group();
                const lines = ['Visual', 'Creative'];
                const lineSize = 13; // Sized up for more presence, still comfortably inside the canvas's 130% headroom
                const lineGap = 15.5;

                // TextGeometry has no letter-spacing/tracking parameter of its own — it lays
                // out glyphs using the font's built-in advance widths only. At this size, tight
                // pairs like "Cr" in "Creative" have bevel edges (bevelThickness/bevelSize below,
                // which extrude the glyph outline outward) that reach far enough to visually
                // touch. Building each line letter-by-letter, as separate meshes offset by a
                // fixed pen position plus a small manual gap, gives it real tracking instead.
                const letterGap = 0.8;

                lines.forEach((line, i) => {
                    const lineGroup = new THREE.Group();
                    let penX = 0;

                    [...line].forEach((ch) => {
                        if (ch === ' ') { penX += lineSize * 0.28; return; }
                        const glyphGeo = new THREE.TextGeometry(ch, {
                            font,
                            size: lineSize,
                            height: 3,
                            curveSegments: 8,
                            bevelEnabled: true,
                            bevelThickness: 0.5,
                            bevelSize: 0.32,
                            bevelSegments: 3,
                        });
                        glyphGeo.computeBoundingBox();
                        const advance = glyphGeo.boundingBox.max.x - glyphGeo.boundingBox.min.x;
                        const glyphMesh = new THREE.Mesh(glyphGeo, material);
                        glyphMesh.position.x = penX;
                        lineGroup.add(glyphMesh);
                        penX += advance + letterGap;
                    });

                    // Center the whole line (built left-to-right from x=0) the same way
                    // geo.center() used to for a single-geometry line.
                    const lineWidth = penX - letterGap;
                    lineGroup.children.forEach((glyphMesh) => {
                        glyphMesh.position.x -= lineWidth / 2;
                    });
                    lineGroup.position.y = i === 0 ? lineGap / 2 : -lineGap / 2;
                    group.add(lineGroup);
                });

                scene.add(group);

                // Gentle rotation toward the cursor — never far from facing the camera,
                // since this is a wordmark, not a spinning logo.
                let targetRotX = 0, targetRotY = 0;
                window.addEventListener('mousemove', (e) => {
                    const nx = (e.clientX / window.innerWidth) * 2 - 1;
                    const ny = (e.clientY / window.innerHeight) * 2 - 1;
                    targetRotY = nx * 0.25;
                    targetRotX = ny * 0.15;
                });

                const clock = new THREE.Clock();
                // Was an unconditional RAF loop — kept rendering every frame even once the
                // hero scrolled off past the pinned reveal, stacking GPU work on top of the
                // 15+ carousel videos and the scroll pin itself while scrolling through the
                // sections below (e.g. the intro/positioning-statement text), which is what
                // showed up as mobile jank there. Only render while the hero is actually
                // in/near the viewport.
                let isInView = true;
                const io = new IntersectionObserver((entries) => {
                    isInView = entries[0].isIntersecting;
                }, { rootMargin: '200px 0px' });
                io.observe(canvas);

                const animate = () => {
                    requestAnimationFrame(animate);
                    if (!isInView) return;
                    group.rotation.y += (targetRotY - group.rotation.y) * 0.05;
                    group.rotation.x += (-targetRotX - group.rotation.x) * 0.05;
                    // A slow idle drift so it doesn't look frozen when the mouse hasn't moved
                    group.rotation.y += Math.sin(clock.getElapsedTime() * 0.3) * 0.0008;
                    renderer.render(scene, camera);
                };
                animate();

                canvas.classList.add('is-active');
                signalReady();

                // Mobile GPUs under memory pressure (heavy scroll-pinned hero + many carousel
                // videos) can drop the WebGL context mid-session. Without handling this, the
                // canvas stayed marked .is-active (so the h1 fallback stayed hidden via the
                // CSS sibling rule) while rendering nothing — the title visually vanished
                // while scrolling, instead of falling back to the flat text. Restore the
                // fallback on loss, and let the browser's own restore re-trigger a repaint.
                canvas.addEventListener('webglcontextlost', (e) => {
                    e.preventDefault();
                    canvas.classList.remove('is-active');
                }, false);
                canvas.addEventListener('webglcontextrestored', () => {
                    canvas.classList.add('is-active');
                }, false);
            },
            undefined,
            () => {
                // font failed to load — canvas stays hidden, h1 fallback remains visible
                signalReady();
            }
        );

        window.addEventListener('resize', () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });
    } catch (err) {
        console.error('initHero3DTitle failed, falling back to flat text:', err);
        signalReady();
    }
}

/**
 * Renders the two hero sticker glyphs as real chrome/iridescent 3D sparkles instead of a
 * flat SVG/text glyph — same "real WebGL geometry, not a CSS fake" approach as the 3D hero
 * title. Each sparkle gets its own canvas + renderer sized to fill its .sticker-icon
 * wrapper completely (no fixed small box), and the camera's view height is derived
 * directly from the geometry's own bounding radius, so the star can never render larger
 * than the canvas and get clipped regardless of wrapper size. The chrome look comes from
 * a small procedural gradient cube texture used as an envMap — r128 (the version loaded
 * on this site) predates MeshPhysicalMaterial's iridescence parameters, so faking
 * reflections with an envMap + high metalness/low roughness is the standard workaround.
 */
function initHero3DSparkles() {
    try {
        const canvases = document.querySelectorAll('.sparkle-3d-canvas');
        if (!canvases.length || typeof THREE === 'undefined') return;
        // Enabled on all screen sizes (previously desktop-only) for visual parity with mobile/tablet.

        // Neutral white/grey studio-lighting gradient — same idea as before (an envMap gives
        // the chrome material something to reflect so its facets aren't flat), but colorless,
        // so the sparkle reads white/chrome like the 3D hero title instead of tinted purple.
        const buildEnvMap = (renderer) => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createLinearGradient(0, 0, 0, size);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, '#e4e4e4');
            grad.addColorStop(0.7, '#3a3a3a');
            grad.addColorStop(1, '#f2f2f2');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, size, size);
            const tex = new THREE.CanvasTexture(canvas);
            const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(size);
            cubeRenderTarget.fromEquirectangularTexture(renderer, tex);
            return cubeRenderTarget.texture;
        };

        // A flat 4-point star outline, extruded into a real 3D solid via ExtrudeGeometry.
        const buildSparkleGeometry = () => {
            const shape = new THREE.Shape();
            const pts = [
                [0, 12], [2.2, 3.2], [11, 0], [2.2, -3.2],
                [0, -12], [-2.2, -3.2], [-11, 0], [-2.2, 3.2],
            ];
            shape.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
            shape.closePath();
            return new THREE.ExtrudeGeometry(shape, {
                depth: 2.6,
                bevelEnabled: true,
                bevelThickness: 0.5,
                bevelSize: 0.4,
                bevelSegments: 4,
                curveSegments: 6,
            });
        };

        canvases.forEach((canvas, idx) => {
            const wrapper = canvas.closest('.sticker-icon');
            if (!wrapper) return;

            const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
            const w = Math.max(wrapper.clientWidth, 40);
            const h = Math.max(wrapper.clientHeight, 40);
            renderer.setSize(w, h, false); // updateStyle=false: CSS (width/height:100%) keeps owning layout
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 200);
            camera.position.z = 32;

            // Same three-point editorial setup as the 3D hero title (see initHero3DTitle):
            // warm key, cool fill, white rim — kept colorless here (no purple/blue tint) so
            // the sparkle's highlights read consistently with the title's material.
            scene.add(new THREE.AmbientLight(0xffffff, 0.35));
            const key = new THREE.DirectionalLight(0xfff4e6, 1.2);
            key.position.set(-30, 40, 50);
            scene.add(key);
            const fill = new THREE.DirectionalLight(0xe8eefc, 0.5);
            fill.position.set(30, -15, 20);
            scene.add(fill);
            const rim = new THREE.DirectionalLight(0xffffff, 0.9);
            rim.position.set(20, -20, -30);
            scene.add(rim);

            const material = new THREE.MeshPhysicalMaterial({
                color: 0x1a1a1a,
                metalness: 0.85,
                roughness: 0.16,
                clearcoat: 1,
                clearcoatRoughness: 0.08,
                envMap: buildEnvMap(renderer),
                envMapIntensity: 1.2,
                reflectivity: 1,
            });

            const mesh = new THREE.Mesh(buildSparkleGeometry(), material);
            mesh.geometry.center();
            scene.add(mesh);

            // Fit the geometry to the canvas: compute the sphere that bounds the star,
            // then scale the mesh so that sphere exactly fills ~80% of the camera's
            // vertical view height at the mesh's distance from the camera — guarantees
            // the sparkle is never larger than what the canvas can actually show, no
            // matter how small the wrapper or how the geometry's numbers change later.
            mesh.geometry.computeBoundingSphere();
            const boundRadius = mesh.geometry.boundingSphere.radius;
            const distance = camera.position.z - mesh.position.z;
            const viewHeight = 2 * Math.tan((camera.fov * Math.PI / 180) / 2) * distance;
            const targetRadius = (viewHeight / 2) * 0.8;
            const fitScale = targetRadius / boundRadius;
            mesh.scale.setScalar(fitScale);

            const clock = new THREE.Clock();
            const spinSpeed = 0.25 + idx * 0.08;

            // Drag-to-rotate: same additive-offset-plus-momentum pattern as the About
            // section's 3D accents (see initAboutAccent3D) and the hero carousel/logo
            // marquee drags — dragOffsetY/X sit on top of the automatic idle spin
            // rather than replacing it, so releasing never snaps back to "where
            // auto-rotation would have been."
            let isDragging = false;
            let dragOffsetY = 0, dragOffsetX = 0;
            let velocityY = 0;
            let lastPointerX = 0, lastPointerY = 0, lastPointerTime = 0;
            const FRICTION = 0.94;

            const animate = () => {
                requestAnimationFrame(animate);
                const t = clock.getElapsedTime();
                if (!isDragging) {
                    dragOffsetY += velocityY;
                    velocityY *= FRICTION;
                    if (Math.abs(velocityY) < 0.0002) velocityY = 0;
                }
                mesh.rotation.y = t * spinSpeed + dragOffsetY;
                mesh.rotation.x = Math.sin(t * 0.6) * 0.3 + dragOffsetX;
                mesh.rotation.z = Math.sin(t * 0.4 + idx) * 0.15;
                renderer.render(scene, camera);
            };
            animate();

            // Hold-and-rotate on the sparkle itself — same interaction as the About
            // section's camera/play-button accents (see initAboutAccent3D), extended
            // here so the whole site's small 3D accents behave consistently rather
            // than only some of them being interactive.
            canvas.style.pointerEvents = 'auto';
            canvas.style.cursor = 'grab';

            const getPointerXY = (e) => {
                const point = e.touches ? e.touches[0] : e;
                return { x: point.clientX, y: point.clientY };
            };
            const onDragStart = (e) => {
                isDragging = true;
                velocityY = 0;
                canvas.style.cursor = 'grabbing';
                const p = getPointerXY(e);
                lastPointerX = p.x;
                lastPointerY = p.y;
                lastPointerTime = performance.now();
            };
            const onDragMove = (e) => {
                if (!isDragging) return;
                const p = getPointerXY(e);
                const now = performance.now();
                const dt = Math.max(now - lastPointerTime, 1);
                const dx = p.x - lastPointerX;
                const dy = p.y - lastPointerY;
                dragOffsetY += dx * 0.012;
                dragOffsetX = Math.max(-1, Math.min(1, dragOffsetX + dy * 0.008));
                velocityY = (dx * 0.012 / dt) * 16.7;
                lastPointerX = p.x;
                lastPointerY = p.y;
                lastPointerTime = now;
            };
            const onDragEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                canvas.style.cursor = 'grab';
            };

            canvas.addEventListener('mousedown', onDragStart);
            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('mouseup', onDragEnd);
            canvas.addEventListener('touchstart', onDragStart, { passive: true });
            window.addEventListener('touchmove', onDragMove, { passive: true });
            window.addEventListener('touchend', onDragEnd);
            window.addEventListener('blur', onDragEnd);

            wrapper.classList.add('has-3d-sparkle');
        });
    } catch (err) {
        console.error('initHero3DSparkles failed, falling back to flat glyphs:', err);
    }
}

/**
 * Small WebGL accents in the About section: a play button (.about-accent-3d--play) and
 * a camera (.about-accent-3d--camera) in the gap between the intro's two text columns,
 * plus a 3D asterisk (.about-accent-3d--asterisk) replacing the flat "*" glyph in
 * .about-facts-strip. All three are built from primitive/extruded THREE geometry
 * grouped into one mesh; a plain icosahedron is the fallback shape for any
 * .about-accent-3d canvas that isn't one of those three. Same chrome/metalness
 * "editorial" material language as the hero's 3D title and sparkle stickers (see
 * initHero3DTitle/initHero3DSparkles) so these read as the same visual system rather
 * than a one-off decoration.
 *
 * Unlike initHero3DSparkles, this one IS visibility-gated: the hero sparkles' RAF loops
 * run unconditionally for the page's whole lifetime (a real, known cost — see the
 * performance audit that flagged it), and rather than repeat that here, each accent's
 * render loop only runs while its own canvas is actually on-screen.
 */
function initAboutAccent3D(selector = '.about-accent-3d', { requireDesktop = true, interactive = true } = {}) {
    // Also reused for the footer's marquee icons (.footer-accent-3d, see initFooterAccent3D
    // below) — that marquee is responsive at every width (clamp()-sized icons, no
    // desktop-only grid layout the way the About section's accents are), so it opts out
    // of the 992px gate via requireDesktop:false rather than duplicating this whole
    // ~250-line function for a second selector.
    const canvases = document.querySelectorAll(selector);
    if (!canvases.length || typeof THREE === 'undefined') return;
    if (requireDesktop && !window.matchMedia('(min-width: 992px)').matches) return; // hidden via CSS below 992px anyway — skip the WebGL cost entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const buildEnvMap = (renderer) => {
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, size);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#e4e4e4');
        grad.addColorStop(0.7, '#3a3a3a');
        grad.addColorStop(1, '#f2f2f2');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        const tex = new THREE.CanvasTexture(canvas);
        const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(size);
        cubeRenderTarget.fromEquirectangularTexture(renderer, tex);
        return cubeRenderTarget.texture;
    };

    // A minimal vintage-camera silhouette built from primitive geometries (box body,
    // cylindrical lens barrel + front ring, small viewfinder hump) rather than an
    // imported model — same approach as everything else in this function, no external
    // asset dependency. Returns a THREE.Group so it can be scaled/rotated as one unit.
    const buildCameraGroup = () => {
        const group = new THREE.Group();

        const body = new THREE.Mesh(new THREE.BoxGeometry(15, 9, 6));
        group.add(body);

        const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 5, 24));
        lensBarrel.rotation.x = Math.PI / 2;
        lensBarrel.position.set(0, 0, 5.2);
        group.add(lensBarrel);

        const lensRing = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.7, 1, 24));
        lensRing.rotation.x = Math.PI / 2;
        lensRing.position.set(0, 0, 7.5);
        group.add(lensRing);

        // Inner lens glass — slightly recessed, a hair narrower than the ring so it
        // reads as glass sitting inside the barrel rather than another solid disc.
        const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.3, 24));
        lensGlass.rotation.x = Math.PI / 2;
        lensGlass.position.set(0, 0, 7.9);
        group.add(lensGlass);

        // Shutter speed dial — sits toward the right edge of the top plate, next to the
        // shutter button (its real position on a rangefinder body), not centered/oversized.
        const shutterDial = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.7, 24));
        shutterDial.position.set(3.6, 4.85, 0.8);
        group.add(shutterDial);

        // Small numbered ring detail sitting slightly proud of the main dial, echoing
        // the printed speed markings without needing actual text geometry.
        const shutterDialRing = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.2, 24, 1, true));
        shutterDialRing.position.set(3.6, 5.0, 0.8);
        group.add(shutterDialRing);

        // Shutter button — small cylinder further right, past the dial, angled slightly
        // like a real shutter release rather than sitting flush/vertical.
        const shutterButton = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.7, 16));
        shutterButton.position.set(6.2, 4.85, 1.6);
        shutterButton.rotation.z = 0.15;
        group.add(shutterButton);

        // Power/drive collar — a wide, flat ring around the shutter button's base, the
        // twist collar a rangefinder body has there for on/off + drive mode.
        const powerCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.35, 20));
        powerCollar.position.set(6.2, 4.7, 1.6);
        group.add(powerCollar);

        // Frame-counter dial — small dial off to the left, separate from the viewfinder
        // block, matching the little top-left dial in the reference photo.
        const frameCounter = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.5, 20));
        frameCounter.position.set(-7, 4.6, 1.8);
        group.add(frameCounter);

        // Hotshoe — a small raised block on top, between the viewfinder and the dial.
        const hotshoe = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 1.4));
        hotshoe.position.set(-1.8, 4.9, -0.5);
        group.add(hotshoe);

        // Strap lugs — two small rings on either side of the body, where a camera
        // strap would clip on.
        [-7.6, 7.6].forEach(x => {
            const lug = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.22, 8, 16));
            lug.position.set(x, 3, 0);
            group.add(lug);
        });

        // Aperture ring — a second, slightly larger ring further forward on the lens
        // barrel, subtly notched by uneven segments (fewer radial segments than the
        // smooth lensRing/lensGlass) so it reads as a grippable knurled ring rather
        // than another perfectly smooth disc.
        const apertureRing = new THREE.Mesh(new THREE.CylinderGeometry(3.9, 3.9, 1.4, 14));
        apertureRing.rotation.x = Math.PI / 2;
        apertureRing.position.set(0, 0, 6.3);
        group.add(apertureRing);

        // Flash unit — a small block beside the hotshoe (which now sits between the
        // viewfinder and shutter dial, matching the reference layout), like a compact
        // pop-up/fixed flash housing rather than the hotshoe sitting alone.
        const flashUnit = new THREE.Mesh(new THREE.BoxGeometry(2, 1.3, 2.4));
        flashUnit.position.set(-1.8, 4.9, -2.5);
        group.add(flashUnit);

        // Bottom tripod mount — a small flat cylinder centered on the base, the socket
        // every camera body has for a tripod plate.
        const tripodMount = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.4, 16));
        tripodMount.position.set(0, -4.7, 0);
        group.add(tripodMount);

        // Rear control buttons — two small flat discs on the back-left, standing in
        // for menu/playback controls beside where the LCD would be.
        [1.3, -0.7].forEach(y => {
            const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 14));
            btn.rotation.x = Math.PI / 2;
            btn.position.set(-6.5, y, -3.1);
            group.add(btn);
        });

        // Battery door seam — a very thin, wide bar low on the body, reading as the
        // hairline seam of a battery compartment door rather than a smooth unbroken
        // bottom edge.
        const batteryDoorSeam = new THREE.Mesh(new THREE.BoxGeometry(13, 0.15, 0.1));
        batteryDoorSeam.position.set(0, -3.5, 3.05);
        group.add(batteryDoorSeam);

        // Second focus ring — set further back on the barrel, closer to the body, so
        // the lens reads as a two-ring zoom assembly (focus + aperture) rather than a
        // single control ring.
        const focusRing = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 1, 16));
        focusRing.rotation.x = Math.PI / 2;
        focusRing.position.set(0, 0, 3.6);
        group.add(focusRing);

        // Brand badge — a tiny flat plate on the front face, standing in for a
        // manufacturer logo/nameplate.
        const badge = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 0.15));
        badge.position.set(-5, -2, 3.05);
        group.add(badge);

        // Flash hinge — a slim bar along the flash unit's rear edge, implying it's a
        // hinged pop-up housing rather than one solid fixed block.
        const flashHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2, 10));
        flashHinge.rotation.z = Math.PI / 2;
        flashHinge.position.set(-1.8, 4.9, -3.7);
        group.add(flashHinge);

        // Diopter adjustment knob — small ridged cylinder near where the viewfinder
        // eyepiece would be, on the back-left of the top plate.
        const diopterKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.45, 12));
        diopterKnob.rotation.z = Math.PI / 2;
        diopterKnob.position.set(-4.5, 4.8, -2.6);
        group.add(diopterKnob);

        // Front grip texture bar — a raised panel on the right-front of the body (where
        // a right hand's fingers wrap around), standing in for the textured/rubberized
        // grip strip real camera bodies have there.
        const gripBar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.5, 0.6));
        gripBar.position.set(6.2, -0.5, 3.15);
        group.add(gripBar);

        // Rear thumb rest — a raised pad on the back-right, the grip's rear counterpart
        // to the front gripBar above.
        const thumbRest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3, 0.7));
        thumbRest.position.set(6, 1.8, -2.8);
        thumbRest.rotation.z = -0.08;
        group.add(thumbRest);

        // Extra rear control button, alongside the existing pair, filling out the
        // menu/playback cluster on the back of the body.
        const extraRearButton = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.3, 14));
        extraRearButton.rotation.x = Math.PI / 2;
        extraRearButton.position.set(-6.5, -2.7, -3.1);
        group.add(extraRearButton);

        // Cold shoe cover — a thin cap sitting in the hotshoe's contact channel, slightly
        // narrower/shorter than the shoe itself so it reads as an insert.
        const coldShoeCover = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 1.1));
        coldShoeCover.position.set(-1.8, 5.4, -0.5);
        group.add(coldShoeCover);

        return group;
    };

    // An asterisk (*) — three thin extruded bars crossing at 60° from each other, the
    // same glyph shape as .about-facts-marker's flat "*" span (see .about-facts-strip
    // in index.html) but rendered as real 3D geometry instead of a text character.
    const buildAsteriskGroup = () => {
        const group = new THREE.Group();
        const barShape = new THREE.Shape();
        const halfLen = 8, halfWidth = 1.1;
        barShape.moveTo(-halfWidth, -halfLen);
        barShape.lineTo(halfWidth, -halfLen);
        barShape.lineTo(halfWidth, halfLen);
        barShape.lineTo(-halfWidth, halfLen);
        barShape.closePath();
        const barGeometry = new THREE.ExtrudeGeometry(barShape, {
            depth: 2.2,
            bevelEnabled: true,
            bevelThickness: 0.35,
            bevelSize: 0.3,
            bevelSegments: 3,
            curveSegments: 6,
        });
        barGeometry.center();

        [0, Math.PI / 3, (2 * Math.PI) / 3].forEach(angle => {
            const bar = new THREE.Mesh(barGeometry, undefined); // material assigned uniformly via group.traverse() by the caller
            bar.rotation.z = angle;
            group.add(bar);
        });

        return group;
    };

    // A play button — the same outer-ring shape as the torus this replaces, but with a
    // real extruded triangle solid sitting inside it (echoing the ▶ icon already used
    // next to "Watch Showreel" — see .about-intro-watch-label__icon in index.html),
    // rather than the torus's plain empty ring.
    const buildPlayButtonGroup = () => {
        const group = new THREE.Group();

        const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 1.6, 20, 48));
        group.add(ring);

        const shape = new THREE.Shape();
        // Equilateral-ish triangle pointing along +x, centered near the ring's own
        // center — matches a play icon's slightly-right-of-center optical balance
        // (a symmetric triangle reads as leaning left, the same reason .about-intro-
        // watch-label__icon's own SVG nudges its play glyph with margin-left).
        const r = 6;
        shape.moveTo(r, 0);
        shape.lineTo(-r * 0.6, r * 0.85);
        shape.lineTo(-r * 0.6, -r * 0.85);
        shape.closePath();
        const triangle = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, {
            depth: 3,
            bevelEnabled: true,
            bevelThickness: 0.4,
            bevelSize: 0.3,
            bevelSegments: 3,
            curveSegments: 8,
        }));
        triangle.geometry.center();
        triangle.position.x = 0.8; // Optical nudge right, same reasoning as the shape offset above
        group.add(triangle);

        return group;
    };

    canvases.forEach((canvas) => {
        const isPlayButton = canvas.classList.contains('about-accent-3d--play') || canvas.classList.contains('footer-accent-3d--play');
        const isCamera = canvas.classList.contains('about-accent-3d--camera') || canvas.classList.contains('footer-accent-3d--camera');
        const isAsterisk = canvas.classList.contains('about-accent-3d--asterisk') || canvas.classList.contains('footer-accent-3d--asterisk');

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        const w = Math.max(canvas.clientWidth, 40);
        const h = Math.max(canvas.clientHeight, 40);
        renderer.setSize(w, h, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();
        // Named viewCamera (not camera) to avoid clashing with isCamera below, which
        // refers to the camera-shaped 3D accent, not the THREE.PerspectiveCamera.
        const viewCamera = new THREE.PerspectiveCamera(35, w / h, 0.1, 200);
        viewCamera.position.z = 32;

        // Same three-point editorial lighting as the hero's 3D title/sparkles.
        scene.add(new THREE.AmbientLight(0xffffff, 0.35));
        const key = new THREE.DirectionalLight(0xfff4e6, 1.2);
        key.position.set(-30, 40, 50);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xe8eefc, 0.5);
        fill.position.set(30, -15, 20);
        scene.add(fill);
        const rim = new THREE.DirectionalLight(0xffffff, 0.9);
        rim.position.set(20, -20, -30);
        scene.add(rim);

        const material = new THREE.MeshPhysicalMaterial({
            color: 0x1a1a1a,
            metalness: 0.85,
            roughness: 0.16,
            clearcoat: 1,
            clearcoatRoughness: 0.08,
            envMap: buildEnvMap(renderer),
            envMapIntensity: 1.2,
            reflectivity: 1,
        });

        // Camera and play-button shapes are each a Group of several meshes sharing one
        // material (each needs its own Mesh instance since a Group has no single
        // geometry of its own), while the icosahedron is still a single Mesh — mesh
        // below refers to whichever ends up in the scene, so the rest of this function
        // (fit-to-canvas, rotation) doesn't need to branch on which case it is.
        let mesh;
        if (isCamera || isPlayButton || isAsterisk) {
            mesh = isCamera ? buildCameraGroup() : isPlayButton ? buildPlayButtonGroup() : buildAsteriskGroup();
            mesh.traverse(child => { if (child.isMesh && !child.userData.skipMaterial) child.material = material; });
        } else {
            const geometry = new THREE.IcosahedronGeometry(10, 0); // detail 0 = flat-faceted, not the smoothed sphere-like higher-detail version
            mesh = new THREE.Mesh(geometry, material);
            mesh.geometry.center();
        }
        scene.add(mesh);

        // Fit to canvas the same way initHero3DSparkles does — scale so the mesh's
        // bounding sphere fills ~80% of the camera's view height, independent of the
        // geometry's own raw numbers. THREE.Box3 works for both a single Mesh and a
        // Group (it walks all descendants), so this one path covers every shape here.
        const box = new THREE.Box3().setFromObject(mesh);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const boundRadius = sphere.radius;
        const distance = viewCamera.position.z - mesh.position.z;
        const viewHeight = 2 * Math.tan((viewCamera.fov * Math.PI / 180) / 2) * distance;
        const targetRadius = (viewHeight / 2) * 0.8;
        mesh.scale.setScalar(targetRadius / boundRadius);

        let rafId = null;
        let isVisible = false;
        const clock = new THREE.Clock();
        const spinSpeed = isPlayButton ? 0.18 : isCamera ? 0.2 : isAsterisk ? 0.3 : 0.24;

        // Drag-to-rotate: dragOffsetY/X accumulate on top of the automatic idle spin
        // rather than replacing it, so releasing the drag doesn't snap back to where
        // auto-rotation "would have been" — it continues smoothly from wherever the
        // user left it. velocityY carries hand speed into a momentum coast after
        // release (FRICTION decay), same physics pattern as the hero carousel drag and
        // the logo marquee drag (see initHeroCarousel/initLogoMarqueeLoop) — established
        // site convention for "grab and spin" rather than a one-off for this element.
        let isDragging = false;
        let dragOffsetY = 0, dragOffsetX = 0;
        let velocityY = 0;
        let lastPointerX = 0, lastPointerY = 0, lastPointerTime = 0;
        let dragMovedDistance = 0; // accumulated |dx| across the current drag gesture — distinguishes a real drag from a stray click
        const FRICTION = 0.94;

        const animate = () => {
            const t = clock.getElapsedTime();
            if (!isDragging) {
                dragOffsetY += velocityY;
                velocityY *= FRICTION;
                if (Math.abs(velocityY) < 0.0002) velocityY = 0;
            }
            mesh.rotation.y = t * spinSpeed + dragOffsetY;
            mesh.rotation.x = Math.sin(t * 0.5) * 0.35 + dragOffsetX;
            renderer.render(scene, viewCamera);
            rafId = requestAnimationFrame(animate);
        };

        if ('IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !isVisible) {
                        isVisible = true;
                        clock.start();
                        animate();
                    } else if (!entry.isIntersecting && isVisible) {
                        isVisible = false;
                        if (rafId !== null) {
                            cancelAnimationFrame(rafId);
                            rafId = null;
                        }
                    }
                });
            }, { rootMargin: '100px 0px' }).observe(canvas);
        } else {
            animate(); // no IntersectionObserver support — fall back to always-on rather than never rendering
        }

        // Hold-and-rotate: click/touch-drag directly on the canvas to view the model
        // from any angle. Purely additive to the idle auto-spin (see animate() above),
        // so it never fights or overrides the ambient motion — it just steers it. Opted
        // out entirely for the footer marquee icons (interactive:false, see
        // window.initFooterGSAP's call site) — those sit inside an <a> wrapping the
        // whole marquee, and even with the stopPropagation/click-guard below, adding a
        // drag gesture on top of a link the user expects to just click was more risk
        // than the interaction was worth there. They stay auto-spinning only.
        if (!interactive) return;

        canvas.style.pointerEvents = 'auto'; // .about-accent-3d is pointer-events:none by default (purely decorative) — this one canvas opts back in since it's now interactive
        canvas.style.cursor = 'grab';

        const getPointerXY = (e) => {
            const point = e.touches ? e.touches[0] : e;
            return { x: point.clientX, y: point.clientY };
        };

        const onDragStart = (e) => {
            isDragging = true;
            velocityY = 0;
            dragMovedDistance = 0;
            canvas.style.cursor = 'grabbing';
            const p = getPointerXY(e);
            lastPointerX = p.x;
            lastPointerY = p.y;
            lastPointerTime = performance.now();
            // Some of these canvases (the footer marquee icons — see initFooterAccent3D
            // call site) sit inside an <a> wrapping the entire marquee for the "Let's
            // Chat" link. Without stopping propagation here, starting a drag on the
            // icon also starts a click-drag gesture on that anchor, and depending on
            // browser/OS a mouseup anywhere within it can still fire as a navigating
            // click — this keeps the drag gesture from ever reaching the link at all.
            e.stopPropagation();
        };
        const onDragMove = (e) => {
            if (!isDragging) return;
            const p = getPointerXY(e);
            const now = performance.now();
            const dt = Math.max(now - lastPointerTime, 1);
            const dx = p.x - lastPointerX;
            const dy = p.y - lastPointerY;
            dragMovedDistance += Math.abs(dx) + Math.abs(dy);
            dragOffsetY += dx * 0.012;
            dragOffsetX = Math.max(-1, Math.min(1, dragOffsetX + dy * 0.008)); // clamped so it can't be dragged into an upside-down/disorienting flip
            velocityY = (dx * 0.012 / dt) * 16.7; // normalized to a ~60fps-equivalent per-frame value, same as the hero carousel/marquee drag
            lastPointerX = p.x;
            lastPointerY = p.y;
            lastPointerTime = now;
        };
        const onDragEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            canvas.style.cursor = 'grab';
        };

        canvas.addEventListener('mousedown', onDragStart);
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        canvas.addEventListener('touchstart', onDragStart, { passive: true });
        window.addEventListener('touchmove', onDragMove, { passive: true });
        window.addEventListener('touchend', onDragEnd);
        // Same stuck-drag safety net as the logo marquee (initLogoMarqueeLoop) — if the
        // pointer leaves the window entirely mid-drag, no mouseup fires on window.
        window.addEventListener('blur', onDragEnd);
        // A genuine drag (moved a real distance, not just a stray sub-pixel jitter on
        // mousedown) shouldn't also register as a click on this canvas — matters when
        // the canvas sits inside an <a> (the footer marquee icons), where a click would
        // otherwise navigate right as the user was just trying to rotate the model.
        canvas.addEventListener('click', (e) => {
            if (dragMovedDistance > 4) e.stopPropagation();
        }, true);
    });
}

/**
 * Gives the hero's draggable items (photo, video preview, stickers, client logos) real
 * translateZ depth in the CSS 3D space established by .hero-playground-container's
 * `perspective`, so they read as sitting at different distances around the 3D title instead
 * of being flat cutouts pasted over a flat canvas. Depth is assigned per item (closer items
 * get a stronger mouse-parallax response, matching how nearer objects appear to move more
 * than distant ones) and layered independently of each item's own drag position — GSAP
 * tracks x/y/z/rotation as separate transform components, so this never fights with
 * Draggable's own x/y updates.
 */
function initHeroDepthParallax() {
    const items = document.querySelectorAll('.hero-drag-layer .drag-item');
    if (!items.length || typeof gsap === 'undefined') return;
    if (!window.matchMedia('(min-width: 992px)').matches) return;

    // Each item gets its own Z position (negative = further from camera/deeper into the
    // screen, positive = pulled toward it) and a scale to match — closer items rendered
    // larger, distant ones smaller, on top of what perspective already does, so the depth
    // reads immediately rather than needing mouse movement to notice. Range is large
    // relative to the 900px perspective set in CSS specifically so it's unmissable.
    // Matches the current DOM order (photo/video cards, client logo stickers, and the
    // orbit reel all removed — the hero's proof-of-work is now the full-bleed video
    // carousel below the title, see initHeroCarousel, which lives outside this
    // drag/depth system entirely): 1 sparkle (left of title), 2 sparkle (right of title).
    const DEPTH_CONFIG = [
        { z: 100, scale: 1.0, strength: 0.08 },    // sparkle — near the front
        { z: 160, scale: 1.06, strength: 0.07 },   // sparkle — near the front, stays subtle
    ];

    items.forEach((item, i) => {
        const cfg = DEPTH_CONFIG[i % DEPTH_CONFIG.length];
        gsap.set(item, { z: cfg.z, scale: cfg.scale, transformPerspective: 900 });
        item.dataset.parallaxStrength = cfg.strength;
        item.dataset.baseScale = cfg.scale;

        // Depth-consistent lighting: shadow falls down-right, matching the 3D title's key
        // light coming from the upper-left (see initHero3DTitle). Items pulled forward (z>0)
        // sit "closer to the light", so their shadow is tighter and darker; items pushed
        // back (z<0) get a softer, more diffuse, lighter shadow — the same falloff real
        // light would produce, and it doubles as an atmospheric-perspective cue (distant
        // things look hazier). Card-shaped items use box-shadow; stickers/logos with
        // irregular/transparent shapes use drop-shadow so it hugs the actual artwork.
        const depthRatio = Math.max(0, Math.min(1, (cfg.z + 320) / 540)); // 0 = furthest back, 1 = furthest forward
        const blur = 18 + (1 - depthRatio) * 40; // 18px sharp (close) up to 58px hazy (far)
        const spread = -4 + depthRatio * 4;
        const alpha = 0.12 + depthRatio * 0.18; // 0.12 hazy/far up to 0.30 grounded/close
        const offsetX = 8 + (1 - depthRatio) * 6;
        const offsetY = 14 + (1 - depthRatio) * 10;

        if (item.classList.contains('card-item')) {
            item.dataset.depthBoxShadow = `${offsetX}px ${offsetY}px ${blur}px ${spread}px rgba(0,0,0,${alpha.toFixed(2)})`;
            item.style.boxShadow = item.dataset.depthBoxShadow;
        } else {
            item.dataset.depthDropShadow = `drop-shadow(${offsetX}px ${offsetY}px ${(blur * 0.5).toFixed(0)}px rgba(0,0,0,${alpha.toFixed(2)}))`;
            item.style.filter = item.dataset.depthDropShadow;
        }
    });

    // RAF-throttled: native mousemove can fire 60-120+ times/sec on a precision mouse,
    // and the handler below creates one gsap.to() tween per item on every call — with
    // several items that's real per-event CPU/GC pressure. Coalescing to "at most once
    // per rendered frame" keeps the motion just as responsive (a frame is already the
    // smallest visible unit) while cutting the redundant work between frames.
    let pendingEvent = null;
    let rafScheduled = false;
    const applyParallax = () => {
        rafScheduled = false;
        if (!pendingEvent) return;
        const nx = (pendingEvent.clientX / window.innerWidth) * 2 - 1;
        const ny = (pendingEvent.clientY / window.innerHeight) * 2 - 1;
        items.forEach(item => {
            const strength = parseFloat(item.dataset.parallaxStrength) || 0;
            // Only rotation + z here, never x/y — Draggable/GSAP already own this item's x/y
            // for its dragged position, and nudging x/y here on top of that would fight it
            // and drift the item away from where the user actually dragged it.
            gsap.to(item, {
                rotationY: nx * strength * 60,
                rotationX: -ny * strength * 60,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: 'auto',
            });
        });
    };
    window.addEventListener('mousemove', (e) => {
        pendingEvent = e;
        if (!rafScheduled) {
            rafScheduled = true;
            requestAnimationFrame(applyParallax);
        }
    });
}

/**
 * Full-bleed video carousel: real project clips mounted on a genuine full circle, not
 * a fixed shallow arc — spinning it never "runs out" at an edge, it just keeps wrapping,
 * which is what makes it read as unlimited rather than a strip with two visible ends.
 * Item count comes from however many .hero-carousel__item elements are in the markup
 * (currently 20 — more clips than the visible-at-once count keeps the gaps between
 * cards tight at a wide/flat radius, instead of a few clips spread thin). Auto-rotates
 * slowly and continuously; dragging spins it with hand-tracked velocity that decays
 * smoothly afterward (custom momentum, not GSAP's InertiaPlugin — that plugin was
 * never loaded on this page, which is why the previous drag felt like it "snapped"
 * rather than coasting). All clips play simultaneously and muted; there's no "active
 * slide" concept, unlike a typical slider — it's meant to read as one continuous ring
 * of moving work.
 */
function initHeroCarousel() {
    try {
        const root = document.getElementById('hero-carousel');
        const track = document.getElementById('hero-carousel-track');
        if (!root || !track) return;

        const allItems = Array.from(track.querySelectorAll('.hero-carousel__item'));
        if (!allItems.length) return;

        // Detected up front (before filtering items below) so mobile/tablet can drop to
        // fewer total cards — not just a narrower visible band — since phones/mid-range
        // tablets are the devices most likely to struggle with several simultaneous video
        // decodes plus the per-frame transform/opacity writes for every mounted card.
        const isMobile = window.matchMedia('(max-width: 767px)').matches;
        const isTablet = !isMobile && window.matchMedia('(max-width: 991px)').matches;
        const isLaptop = !isMobile && !isTablet && window.matchMedia('(max-width: 1679px)').matches;
        const isWideDesktop = !isMobile && !isTablet && !isLaptop;

        // Fewer total cards on weaker-GPU tiers: every mounted card still gets a
        // transform/opacity write each animation frame even while paused/hidden past the
        // visible-band cutoff below, so trimming the DOM set itself (not just how many are
        // actively decoding) reduces main-thread work on phones and tablets specifically.
        const MAX_ITEMS = isMobile ? 18 : isTablet ? 16 : allItems.length;
        const items = allItems.slice(0, MAX_ITEMS);
        items.forEach(item => item.dataset.carouselActive = 'true');
        allItems.forEach(item => {
            if (!item.dataset.carouselActive) item.style.display = 'none';
        });

        const count = items.length;
        if (!count) return;

        // Lazily play only the videos currently visible in the arc (see the display:none
        // cutoff in render() below), instead of calling .play() on all 20 at once — that
        // was 20 simultaneous decode/play starts competing for the main thread right as
        // the preloader itself was mid-transition, which is what caused the stutter.
        // Cards rotated out of view get paused; cards rotating into view get played,
        // so at most ~7 are ever decoding at once regardless of which subset is showing.
        // skipInitialPlay lets the very first render() position everything without also
        // starting every visible video's decode pipeline in the same tick — that initial
        // batch gets played afterward, staggered a few frames apart instead.
        let skipInitialPlay = true;
        // The 20 carousel videos only ever had their <source src> set to data-src on
        // page load (see index.html) so the browser can't start fetching any of them
        // until this runs — otherwise all 20 issued a metadata request the instant the
        // DOM parsed, regardless of play/pause state. Swapping data-src -> src happens
        // once, the first time a card actually rotates into view.
        const loadIfNeeded = (item) => {
            const video = item.querySelector('video');
            const source = video?.querySelector('source[data-src]');
            if (!source) return;
            source.src = source.dataset.src;
            delete source.dataset.src;
            video.load();
        };
        const playIfNeeded = (item) => {
            if (skipInitialPlay) return;
            const video = item.querySelector('video');
            if (!video || !video.paused) return;
            loadIfNeeded(item);
            const playPromise = video.play();
            if (playPromise !== undefined) playPromise.catch(() => {});
        };
        const pauseIfNeeded = (item) => {
            const video = item.querySelector('video');
            if (video && !video.paused) video.pause();
        };

        // Start every card hidden so the first render() pass below only ever calls
        // playIfNeeded() on the subset that's actually about to become visible, instead
        // of every item transitioning from "unset" to visible in the same tick.
        items.forEach(item => { item.style.display = 'none'; });

        // Full 360° wheel: every card is spaced evenly around the whole circle
        // (360/count degrees apart), not just across a narrow visible band. Only the
        // handful of cards currently near the top of the circle are actually visible/
        // opaque at any moment — the rest sit rotated out of view below — but because
        // the full set is mounted on the complete circle, spinning brings a *different*
        // subset up into view every time instead of ever hitting a hard edge.
        const ANGLE_STEP = 360 / count;
        // Radius tuned against ANGLE_STEP so adjacent cards sit close with a small,
        // consistent visible gap — chord distance between neighbors works out to
        // ~2*RADIUS*sin(ANGLE_STEP/2). Scaled down on smaller screens to match the
        // smaller card size set in CSS at the same breakpoints (230px desktop → 130px
        // mobile), otherwise the gap between cards would balloon on phones instead of
        // staying proportional.
        // "Desktop" used to mean one fixed RADIUS (950) for every width from 992px up —
        // fine on wide monitors, but on an ordinary laptop screen (roughly 992-1439px,
        // e.g. a 13-15" display at its native resolution) that radius is too large for
        // the available width: the circle's visible top slice sits high enough to
        // overlap the 3D title above it instead of clearing it. isLaptop narrows that
        // gap with its own radius/positioning tier between tablet and true widescreen
        // desktop — see the matching .hero-carousel bottom-offset media query in
        // style.css for the vertical-position half of this fix.
        // (isMobile/isTablet/isLaptop/isWideDesktop are computed above, before the item-count trim.)
        const RADIUS = isMobile ? 540 : isTablet ? 760 : isLaptop ? 800 : isWideDesktop ? 1050 : 950;

        let rotation = 0;
        let velocity = 0; // degrees/frame, decays after a drag/flick ends
        const AUTO_SPEED = 0.02; // degrees/frame constant auto-rotate (~1.2deg/s at 60fps)
        const FRICTION = 0.94; // how quickly flick velocity decays — higher = coasts longer

        // Visible-band cutoff, tuned per tier — narrower on weaker-GPU devices so fewer
        // videos are ever decoding/playing at once (mobile tightest, since phones are the
        // most likely to stutter with several simultaneous video decodes; tablet a bit
        // more headroom; desktop/laptop widest since they have the GPU/CPU budget for it).
        const VISIBLE_CUTOFF = isMobile ? 32 : isTablet ? 40 : 45;
        const FADE_SPAN = 10; // degrees of fade-out right before the cutoff, same on every tier
        const FADE_START = VISIBLE_CUTOFF - FADE_SPAN;

        const render = () => {
            items.forEach((item, i) => {
                // Wrap each card's angle into (-180, 180] relative to the current rotation
                // so "distance from front" is always the short way around the circle.
                let angle = ((rotation + i * ANGLE_STEP + 180) % 360 + 360) % 360 - 180;
                const rad = angle * (Math.PI / 180);
                const x = Math.sin(rad) * RADIUS;
                const y = RADIUS - Math.cos(rad) * RADIUS; // 0 at the front-center, increasing toward the sides/back
                const absAngle = Math.abs(angle);

                // Cards beyond VISIBLE_CUTOFF from center have rotated past the visible top
                // slice of the circle (they're around the back/sides) — skip rendering work
                // on them entirely rather than positioning every card's worth of DOM writes
                // every frame when only some are ever on screen at once. Narrowed from a
                // flat 65° (kept fewer videos playing at once, was still causing real
                // scroll/drag lag) down further per-tier above — that's the actual fix.
                if (absAngle > VISIBLE_CUTOFF) {
                    if (item.style.display !== 'none') {
                        item.style.display = 'none';
                        pauseIfNeeded(item);
                    }
                    return;
                }
                if (item.style.display === 'none') {
                    item.style.display = '';
                    playIfNeeded(item);
                }

                // Stay fully opaque/full-scale for most of the visible band — only the
                // last FADE_SPAN degrees before a card rotates out of view fades and
                // shrinks it, so the fade reads as "this card is about to leave the edge,"
                // not a wash of dimness across the whole strip.
                const distance = Math.max(0, Math.min((absAngle - FADE_START) / FADE_SPAN, 1));
                const scale = 1 - distance * 0.25;
                const opacity = 1 - distance * 1;
                item.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${angle.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
                item.style.opacity = opacity.toFixed(2);
                item.style.zIndex = String(1000 - Math.round(absAngle * 10));
            });
        };

        // This carousel used to keep rotating (and writing transform/opacity to every
        // visible card) via gsap.ticker forever, even long after the user had scrolled
        // it completely off-screen — down at the FAQ or footer, this was still doing
        // per-frame work for zero visual benefit, which is a real contributor to a
        // phone feeling like it's under constant load the whole time the page is open,
        // not just during the first scroll. Gate the ticker callback itself behind an
        // IntersectionObserver so it's a no-op whenever the carousel isn't in view.
        let carouselIsVisible = true; // assume visible until the observer's first callback fires
        if (typeof IntersectionObserver !== 'undefined') {
            const visibilityObserver = new IntersectionObserver((entries) => {
                carouselIsVisible = entries[0].isIntersecting;
                if (!carouselIsVisible) {
                    // Stopping the ticker alone leaves whatever cards were mid-playback
                    // still decoding — pause every currently-visible card's video outright
                    // so scrolling past the hero actually frees up that decode work, not
                    // just the transform/opacity writes.
                    items.forEach(pauseIfNeeded);
                } else {
                    // render()'s own playIfNeeded() calls only fire on a display:none →
                    // '' transition, which won't happen again for cards that were already
                    // visible when we paused them above — resume those explicitly so
                    // scrolling back up doesn't leave the carousel silently frozen.
                    items.forEach((item) => {
                        if (item.style.display !== 'none') playIfNeeded(item);
                    });
                }
            }, { threshold: 0 });
            visibilityObserver.observe(root);
        }

        gsap.ticker.add(() => {
            if (!carouselIsVisible) return;
            if (Math.abs(velocity) > 0.001) {
                rotation += velocity;
                velocity *= FRICTION;
            } else {
                velocity = 0;
                rotation += AUTO_SPEED;
            }
            render();
        });

        // Pointer-based drag-to-spin: tracks real hand velocity while dragging (not a
        // single start/end delta), so a fast flick actually carries momentum into the
        // release, then decays smoothly via FRICTION above — the same "throw and coast"
        // feel as the site's Lenis-smoothed scrolling, rather than stopping dead the
        // instant the pointer lifts.
        let isPointerDown = false;
        let lastX = 0;
        let lastT = 0;

        const onPointerDown = (e) => {
            isPointerDown = true;
            velocity = 0;
            lastX = e.clientX;
            lastT = performance.now();
            root.setPointerCapture?.(e.pointerId);
        };

        const onPointerMove = (e) => {
            if (!isPointerDown) return;
            const now = performance.now();
            const dt = Math.max(now - lastT, 1);
            const dx = e.clientX - lastX;
            rotation += dx * 0.04;
            velocity = (dx * 0.04) * (16 / dt); // normalize to a ~60fps-equivalent per-frame value
            lastX = e.clientX;
            lastT = now;
        };

        const onPointerUp = () => {
            isPointerDown = false;
            // velocity already holds the last drag frame's speed — momentum continues
            // decaying via FRICTION in the ticker above, nothing else to do here.
        };

        root.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        // First reveal: position every card (cheap, no video work — playIfNeeded is a
        // no-op while skipInitialPlay is true), then stagger that first batch's actual
        // .play() calls a frame apart instead of starting every visible video's decode
        // pipeline in the same tick — the last of the "everything fires at once" spots
        // that caused the original stutter.
        render();
        skipInitialPlay = false;

        const visibleNow = items.filter(item => item.style.display !== 'none');
        visibleNow.forEach((item, i) => {
            setTimeout(() => playIfNeeded(item), i * 60);
        });
    } catch (err) {
        console.error('initHeroCarousel failed:', err);
    }
}

/**
 * Pins the hero section in place while #content-reveal (everything below it: Site Essence
 * through FAQ) scrolls up to cover it, instead of the hero scrolling away like a normal
 * section. Runs on desktop (>=992px) and phones (<=767px) — both have
 * .hero-playground-section at a fixed height with real positioning (see css/style.css,
 * the 767px breakpoint: `position: relative; height: 100dvh`), which is what
 * ScrollTrigger's pin math needs. The 768-991px tablet band in between still leaves that
 * section `position: static; height: auto`, so pinning it there fights the CSS and was
 * the original cause of the gap/stutter right at the hero-to-essence transition — that
 * band is skipped below.
 */
function initHeroRevealPin() {
    const hero = document.querySelector('.hero-playground-section');
    const reveal = document.getElementById('content-reveal');
    if (!hero || !reveal || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const isDesktop = window.matchMedia('(min-width: 992px)').matches;
    const isPhone = window.matchMedia('(max-width: 767px)').matches;
    if (!isDesktop && !isPhone) return;

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        endTrigger: reveal,
        end: 'top top',
        pin: true,
        pinType: isPhone ? 'transform' : undefined, // avoids position:fixed on phones, where address-bar show/hide otherwise fights the pin and can leave a gap
        pinSpacing: false, // reveal should scroll up over the pinned hero, not push it away
    });

    // Mobile browsers resize the viewport (dvh) as the URL bar collapses/expands on
    // scroll, which can leave ScrollTrigger's cached start/end a few pixels stale from
    // what the hero's height becomes right after — that gap is what showed up as a thin
    // sliver of the hero's background peeking above #content-reveal's rounded top edge,
    // right where the corner radius meets the flat part of the edge. Refreshing on
    // resize/orientation change keeps the pin boundary matched to the real, current height.
    let revealRefreshTimer = null;
    const scheduleRevealRefresh = () => {
        clearTimeout(revealRefreshTimer);
        revealRefreshTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    window.addEventListener('resize', scheduleRevealRefresh);
    window.addEventListener('orientationchange', scheduleRevealRefresh);
}

/**
 * Initializes the Sticky Scroll & 3D Flip Card on the About page.
 */
function initAboutStickyFlip() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const track = document.querySelector('.about-scroll-track');
    const cardInner = document.getElementById('flip-card');
    const bgText = document.getElementById('hero-bg-text');
    const steps = document.querySelectorAll('.scroll-step');

    if (!track || !cardInner) return;

    const video = cardInner.querySelector('.flip-video');

    // Buat Timeline terikat dengan Scroll
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 1, // Efek inertia smooth ala Apple
            onUpdate: (self) => {
                // Otomatis Play/Pause video saat kartu membalik (setelah 45% putaran timeline)
                if (video) {
                    if (self.progress > 0.45) {
                        if (video.paused) video.play();
                    } else {
                        if (!video.paused) video.pause();
                    }
                }
            }
        }
    });

    // 1. Teks Latar Belakang memudar & sedikit membesar
    if (bgText) {
        tl.to(bgText, { scale: 1.1, opacity: 0.05, duration: 1 }, 0);
    }

    // 2. Kartu berbalik perlahan (Y-axis 180deg)
    tl.to(cardInner, { rotationY: 180, duration: 1.5, ease: "sine.inOut" }, 0.2);

    // 3. Teks Keterangan muncul bergantian di bawah kartu
    steps.forEach((step, i) => {
        const isLast = i === steps.length - 1;
        const startTime = 0.2 + (i * 0.7); // Jeda masuk antar box teks
        
        // Fade In dari bawah
        tl.fromTo(step, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, startTime);
        
        // Fade Out ke atas (Kecuali item terakhir yang akan stay hingga section selesai)
        if (!isLast) {
            tl.to(step, { opacity: 0, y: -40, duration: 0.3, ease: "power2.in" }, startTime + 0.5);
        }
    });

}

/**
 * Homepage "Core, Proven in Portfolio" services accordion — the exact same component
 * (.services-accordion-v2 / .services-acc-row) and behavior as services.html's Rate
 * Card page accordion, so the two stay visually and behaviorally identical rather than
 * drifting into two different services UIs. Kept as a near-verbatim port of the inline
 * script in services.html (see initServicesAccordion there) rather than a shared
 * function, since that one is wired to services.html's own DOMContentLoaded/
 * preloaderDone timing which this page's runAnimations() doesn't share.
 */
function initHomeServicesAccordion() {
    if (typeof gsap === 'undefined') return;

    const rows = document.querySelectorAll('#services .services-acc-row');
    if (!rows.length) return;

    // Opening/closing a row changes the accordion's total height, which shifts every
    // section below it — without a refresh, ScrollTrigger keeps using stale positions
    // measured on load and other scroll-driven effects drift out of sync.
    const refreshScrollTrigger = () => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
    };

    const closeRow = (row) => {
        const panel = row.querySelector('.services-acc-row__panel');
        row.classList.remove('is-open');
        row.querySelector('.services-acc-row__trigger').setAttribute('aria-expanded', 'false');
        gsap.to(panel, { height: 0, opacity: 0, duration: 0.6, ease: 'power3.inOut', onComplete: refreshScrollTrigger });
    };

    const openRow = (row) => {
        const panel = row.querySelector('.services-acc-row__panel');
        const inner = row.querySelector('.services-acc-row__panel-inner');
        row.classList.add('is-open');
        row.querySelector('.services-acc-row__trigger').setAttribute('aria-expanded', 'true');
        gsap.set(panel, { height: 'auto' });
        const targetHeight = panel.offsetHeight;
        gsap.fromTo(panel, { height: 0, opacity: 0 }, { height: targetHeight, opacity: 1, duration: 0.8, ease: 'power3.inOut', onComplete: () => { panel.style.height = 'auto'; refreshScrollTrigger(); } });
        gsap.fromTo(inner, { y: 16 }, { y: 0, duration: 0.7, ease: 'power3.out', delay: 0.05 });

        // Auto-snap so the opened row's title sits a fixed comfortable distance from the
        // top of the viewport, same offset/timing as services.html's accordion.
        const OFFSET_FROM_TOP = 120;
        setTimeout(() => {
            const rect = row.getBoundingClientRect();
            const targetY = window.scrollY + rect.top - OFFSET_FROM_TOP;
            if (window.lenis) {
                window.lenis.scrollTo(targetY, { duration: 1.0 });
            } else {
                window.scrollTo({ top: targetY, behavior: 'smooth' });
            }
        }, 850);
    };

    const toggle = (targetId) => {
        rows.forEach(row => {
            const isTarget = row.dataset.target === targetId;
            const isOpen = row.classList.contains('is-open');
            if (isTarget) {
                isOpen ? closeRow(row) : openRow(row);
            } else if (isOpen) {
                closeRow(row);
            }
        });
    };

    rows.forEach(row => {
        const trigger = row.querySelector('.services-acc-row__trigger');
        trigger.addEventListener('click', () => toggle(row.dataset.target));
    });

    // The first row starts marked .is-open in the markup, but the panel's CSS default
    // is height:0 — set its real height now so it renders open instead of flashing
    // collapsed before any click happens.
    const initiallyOpen = document.querySelector('#services .services-acc-row.is-open');
    if (initiallyOpen) {
        const panel = initiallyOpen.querySelector('.services-acc-row__panel');
        gsap.set(panel, { height: 'auto', opacity: 1 });
    }

    // Staggered fade/slide-in as the section scrolls into view.
    if (typeof ScrollTrigger !== 'undefined') {
        gsap.set(rows, { opacity: 0, y: 30 });
        ScrollTrigger.create({
            trigger: '#services .services-accordion-v2',
            start: 'top 85%',
            once: true,
            onEnter: () => {
                gsap.to(rows, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1 });
            }
        });
    }

    initServicesFadeCycle();
}

/**
 * Auto-crossfades the Color & Finishing row's stacked graded stills (the same 10 images
 * used in PrestaChill's Approach [03] drag-stack) — passive, no drag, just a slow mix
 * from one frame to the next. Runs continuously regardless of whether the row is open;
 * CSS opacity on the closed panel keeps it invisible until expanded, so there's no need
 * to gate the interval on open/closed state — simpler than starting/stopping per toggle.
 */
function initServicesFadeCycle() {
    document.querySelectorAll('.services-acc-row__visual--fade-cycle').forEach((wrapper) => {
        const frames = Array.from(wrapper.querySelectorAll('img'));
        if (frames.length < 2) return;
        let current = frames.findIndex((img) => img.classList.contains('is-active'));
        if (current < 0) current = 0;

        setInterval(() => {
            const next = (current + 1) % frames.length;
            frames[current].classList.remove('is-active');
            frames[next].classList.add('is-active');
            current = next;
        }, 2600);
    });
}

/**
 * Journal article "like" button. Deliberately localStorage-only for now: the count is
 * per-browser, not a shared/global count synced across visitors — that scope limit is a
 * known next step (would need a small backend like Supabase), not an oversight. Each
 * article's like state and count are keyed off the current page path, so every journal
 * entry tracks its own independently without needing a per-page article ID in markup.
 */
function initArticleLike() {
    const btn = document.querySelector('.article-like-btn');
    if (!btn) return;

    const storageKey = `mdkg_liked_${window.location.pathname}`;
    const countKey = `mdkg_like_count_${window.location.pathname}`;
    const countEl = btn.querySelector('.article-like-count');

    // Baseline count so a fresh browser doesn't show "0" on an article that clearly
    // already has engagement — purely cosmetic, has no bearing on the real (absent)
    // global count. Deterministic per-path so it doesn't reshuffle on every reload.
    const seedFor = (path) => {
        let hash = 0;
        for (let i = 0; i < path.length; i++) hash = (hash * 31 + path.charCodeAt(i)) | 0;
        return 8 + (Math.abs(hash) % 40); // a small, plausible-looking starting count
    };

    let liked = localStorage.getItem(storageKey) === 'true';
    let count = parseInt(localStorage.getItem(countKey), 10);
    if (isNaN(count)) {
        count = seedFor(window.location.pathname) + (liked ? 1 : 0);
    }

    const render = () => {
        btn.setAttribute('aria-pressed', String(liked));
        if (countEl) countEl.textContent = count.toString();
    };
    render();

    btn.addEventListener('click', () => {
        liked = !liked;
        count += liked ? 1 : -1;
        localStorage.setItem(storageKey, String(liked));
        localStorage.setItem(countKey, String(count));
        render();
        if (liked) {
            btn.classList.add('is-liking');
            setTimeout(() => btn.classList.remove('is-liking'), 300);
        }
    });
}

//#region BITS SLIDER
// =========================================
// 6. BITS & PIECES SLIDER
// =========================================
/**
 * Initializes the Swiper slider for the Bits and Pieces section.
 */
function initBitsSlider() {
    const slider = document.querySelector('.bits-slider');
    if (!slider || typeof Swiper === 'undefined') return;

    const swiper = new Swiper('.bits-slider', {
        loop: slider.getAttribute('data-loop') !== 'false',
        slidesPerView: "auto", // Allows CSS width to control how many show
        centeredSlides: true,
        spaceBetween: 20,
        grabCursor: true,
        speed: 350, // Dipercepat dari 800 ke 350 agar responsif & 1:1 mengikuti kecepatan swipe jari user
        keyboard: { enabled: true }, // Aksesibilitas navigasi via keyboard
        pagination: {
            el: slider.querySelector(".swiper-pagination"),
            clickable: true,
        },
        navigation: {
            nextEl: slider.querySelector(".swiper-button-next"),
            prevEl: slider.querySelector(".swiper-button-prev"),
        },
        breakpoints: {
            768: {
                slidesPerView: "auto",
                spaceBetween: 30
            }
        }
    });

    // --- Tilt Effect Logic ---
    // Only applies to the active slide for a focused feel
    slider.addEventListener('mousemove', (e) => {
        const activeSlide = slider.querySelector('.swiper-slide-active');
        if (!activeSlide) return;

        const card = activeSlide.querySelector('.photo-card');
        if (!card) return;

        const rect = card.getBoundingClientRect();
        
        // Check if mouse is inside the active card
        const isOver = (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
        );

        if (isOver) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate rotation (Max 10 degrees)
            const rotateX = ((mouseY - centerY) / centerY) * -10;
            const rotateY = ((mouseX - centerX) / centerX) * 10;

            gsap.to(card, {
                rotationX: rotateX,
                rotationY: rotateY,
                scale: 1.03, // Cinematic slightly bigger zoom
                transformPerspective: 1200,
                duration: 0.6,
                ease: "power3.out"
            });
        } else {
            // Reset if hovering slider but not the card
            gsap.to(card, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.8, ease: "power3.out" });
        }
    });

    // Reset on mouse leave
    slider.addEventListener('mouseleave', () => {
        const activeSlide = slider.querySelector('.swiper-slide-active');
        if (activeSlide) {
            const card = activeSlide.querySelector('.photo-card');
            if (card) gsap.to(card, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.8, ease: "power3.out" });
        }
    });
}
//#endregion

//#region MAGNETIC BUTTONS
// =========================================
// 15b. MAGNETIC CURSOR ATTRACTION
// =========================================
/**
 * Homepage "About me" showreel card: hover only reveals the "Watch Showreel" label
 * (no scrub controls on the small card itself — those live in the fullscreen modal
 * instead, opened on click) plus a magnetic hover on the outer wrapper that nudges the
 * card toward the cursor, matching initMagneticButtons()'s pull math below but tuned
 * for a much larger element.
 */
function initAboutIntroPlayer() {
    const trigger = document.getElementById('about-intro-watch-trigger');
    if (!trigger) return;

    const sourceVideo = trigger.querySelector('.about-showreel-video');
    const videoModal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video-player');
    const watchLabel = trigger.querySelector('.about-intro-watch-label');

    trigger.addEventListener('click', () => {
        const source = sourceVideo?.querySelector('source');
        if (source && videoModal && modalVideo) {
            modalVideo.src = source.src;
            videoModal.classList.add('active');
            modalVideo.play();
            document.body.style.overflow = 'hidden';
        }
    });

    // Cursor-follow label physics only — the 3D perspective tilt this used to also
    // drive made sense on a small boxed card, but reads as excessive/disorienting on
    // a viewport-width full-bleed strip (see .about-showreel-section), so it's been
    // dropped here. canHover is kept as a guard purely so the label doesn't try to
    // track touch input, which has no persistent "hover position" to follow.
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (watchLabel && canHover) {
        let targetX = 0, targetY = 0, currentX = 0, currentY = 0, rafId = null;
        let velX = 0, velY = 0; // spring velocity, px/frame — this is what gives the label mass
        let hasPositioned = false; // true once the first mousemove has set a real target
        // Spring physics instead of a plain lerp: a lerp always moves a fixed fraction
        // of the remaining distance per frame, so it converges in a few frames no
        // matter how far the target jumps — reads as light/instant regardless of the
        // constants, which is why tuning LERP_FACTOR alone couldn't add real weight.
        // A spring instead accelerates toward the target and carries momentum past
        // it, then eases back — the overshoot-and-settle is what actually reads as
        // "something with mass," not just "something delayed."
        const STIFFNESS = 0.018; // lower = softer pull, more felt lag/distance before it catches up to the cursor
        const DAMPING = 0.88; // lower = more overshoot/bounce before settling, higher = more inertia carried each frame
        const MAX_TILT = 16; // label sway, degrees at top speed
        const MAX_SCALE_BOOST = 0.14; // label grow, +14% at top speed

        // Runs continuously for the entire time the cursor is over the trigger, not
        // just until the label "settles" — stopping the rAF loop once velocity drops
        // near zero would mean the *next* mousemove event hits a "loop not running"
        // branch and snaps currentX/Y straight to the new target instead of continuing
        // to spring from wherever the label actually was, which reads as a hard jump.
        const animate = () => {
            const dx = targetX - currentX;
            const dy = targetY - currentY;
            velX = (velX + dx * STIFFNESS) * DAMPING;
            velY = (velY + dy * STIFFNESS) * DAMPING;
            currentX += velX;
            currentY += velY;

            if (watchLabel) {
                // Offset down-right of the raw cursor position so the label never sits
                // directly under the OS cursor icon — centered-on-cursor was getting
                // visually blocked by the pointer itself.
                // Driven by the spring's own velocity (how fast the label itself is
                // currently swinging), not the raw mouse delta — this is what makes the
                // tilt/scale feel like a consequence of the label's momentum rather
                // than a 1:1 readout of cursor speed, and it's naturally already
                // smoothed since velX only changes gradually frame to frame.
                const speed = Math.min(Math.abs(velX) / 10, 1); // 0-1, needs genuine swing speed to saturate
                const tilt = Math.max(-1, Math.min(1, velX / 10)) * MAX_TILT;
                const scale = 1 + speed * MAX_SCALE_BOOST;
                // Offset down-right of the cursor, pushed well outside the cursor
                // icon's own footprint — but pulled back left/up from the very corner
                // (less right shift, less downward drop) so it doesn't sit too far off
                // to the right or too low beneath the pointer.
                watchLabel.style.left = `${currentX + 6}px`;
                watchLabel.style.top = `${currentY + 34}px`;
                watchLabel.style.setProperty('--tilt', `${tilt.toFixed(2)}deg`);
                watchLabel.style.setProperty('--scale', scale.toFixed(3));
            }

            rafId = requestAnimationFrame(animate);
        };

        trigger.addEventListener('mousemove', (e) => {
            const rect = trigger.getBoundingClientRect();
            targetX = e.clientX - rect.left;
            targetY = e.clientY - rect.top;
            if (!hasPositioned) {
                // Very first move over the trigger: snap so nothing flies in from a
                // stale 0,0 — this is the one legitimate case for a hard jump.
                currentX = targetX;
                currentY = targetY;
                velX = 0;
                velY = 0;
                hasPositioned = true;
            }
            if (rafId === null) {
                rafId = requestAnimationFrame(animate);
            }
        });

        trigger.addEventListener('mouseleave', () => {
            // Stop the loop once the cursor actually leaves — no reason to keep writing
            // transforms every frame for a label that's invisible again (opacity is
            // handled by the :hover CSS rule). hasPositioned stays true so re-entering
            // resumes lerping toward the new position instead of re-snapping.
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
        });
    }
}

/**
 * Closes the About-section showreel's fullscreen video modal — shared close triggers
 * (X button, backdrop click, Escape key), same pattern as the bento-grid video modal
 * used on case study pages.
 */
function initAboutIntroVideoModal() {
    const videoModal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video-player');
    if (!videoModal) return;

    const closeVideoModal = () => {
        videoModal.classList.remove('active');
        if (modalVideo) { modalVideo.pause(); modalVideo.src = ''; }
        document.body.style.overflow = '';
    };

    videoModal.addEventListener('click', (e) => { if (e.target === videoModal) closeVideoModal(); });
    const closeBtn = videoModal.querySelector('.video-modal-close');
    closeBtn?.addEventListener('click', closeVideoModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) closeVideoModal();
    });
}

/**
 * Full-bleed showreel "unveiling" motion: as the strip scrolls into view, its
 * clip-path opens from a narrow centered band out to the full edge-to-edge width
 * (curtains-opening effect) while the video underneath slowly scales down from a
 * slight zoom — both scrubbed to scroll position so scrolling back up reverses
 * cleanly, matching the site's other scroll-scrubbed reveals (e.g. the homepage
 * essence quote). This is the "premium motion" the section's CSS clip-path/scale
 * starting values (see .about-showreel-wrapper/.about-showreel-video) are built to
 * animate away from.
 */
function initAboutShowreelReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const section = document.querySelector('.about-showreel-section');
    const wrapper = document.querySelector('.about-showreel-wrapper');
    const video = document.querySelector('.about-showreel-video');
    if (!section || !wrapper) return;

    gsap.registerPlugin(ScrollTrigger);

    // Reduced motion: skip the scrubbed curtain-opening/parallax and just present the
    // strip fully open and settled.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(wrapper, { clipPath: 'inset(0% 0% 0% 0% round 0px)' });
        if (video) gsap.set(video, { '--showreel-parallax-scale': 1 });
        return;
    }

    // Explicit starting ("closed") state set here, in JS, right before ScrollTrigger
    // takes over — not in the stylesheet. CSS applies at first paint, well before this
    // function runs; if the closed clip-path lived there, the page would already show
    // the narrow band, and this gsap.set() plus the scrub below would then visibly
    // "restart" the animation from that same narrow point a beat later — the jump this
    // was built to fix. Setting it here means the very first frame anyone sees already
    // has GSAP in control, so there's exactly one continuous motion, not two.
    gsap.set(wrapper, { clipPath: 'inset(0% 42% 0% 42% round 18px)' });
    if (video) gsap.set(video, { '--showreel-parallax-scale': 1.08 });

    gsap.to(wrapper, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        ease: 'none',
        scrollTrigger: {
            trigger: section,
            // Starts as soon as the section's top edge enters the viewport at all, and
            // finishes well before it's scrolled past — the previous 90%→35% range was
            // too narrow relative to a normal scroll speed, so the clip-path was still
            // visibly catching up (looking "stuck" mid-open) by the time the section
            // was already prominently on screen, rather than having finished opening
            // on the way in.
            start: 'top bottom',
            end: 'top 20%',
            scrub: 0.15
        }
    });

    if (video) {
        // Driven via a CSS custom property (read by .about-showreel-video's own
        // transform: scale(var(--showreel-parallax-scale))) rather than GSAP setting
        // `transform` directly, so this composes with — instead of overwriting —
        // any other transform source on the element.
        gsap.to(video, {
            '--showreel-parallax-scale': 1,
            ease: 'none',
            scrollTrigger: {
                trigger: section,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.6
            }
        });

        // Pause decode/playback the instant the strip scrolls off-screen — this video
        // had no such gate before and kept decoding indefinitely once scrolled past,
        // same class of cost the hero carousel's ticker already guards against (see
        // initHeroCarousel's IntersectionObserver). Muted autoplay video resumes
        // automatically once back in view; no play() promise handling needed since
        // it's muted (autoplay restrictions don't apply).
        if ('IntersectionObserver' in window) {
            const videoVisibilityObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        video.play().catch(() => {});
                    } else {
                        video.pause();
                    }
                });
            }, { rootMargin: '200px 0px' });
            videoVisibilityObserver.observe(video);
        }
    }
}

function initMagneticButtons() {
    const MAX_PULL = 12; // px the button can travel toward the cursor
    const RADIUS = 80; // px from center where the pull starts

    document.querySelectorAll('.cs-share-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const dist = Math.min(Math.hypot(dx, dy), RADIUS);
            const pull = dist / RADIUS;
            btn.style.transform = `translate(${(dx * 0.3 * pull).toFixed(2)}px, ${(dy * 0.3 * pull).toFixed(2)}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}
//#endregion

//#region SHARE BUTTONS
// =========================================
// 16. WEB SHARE API
// =========================================
function initShareButtons() {
    const shareBtns = document.querySelectorAll('.cs-share-btn, .share-btn');
    
    shareBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const shareData = {
                title: document.title,
                text: 'Check out this project: ' + document.title,
                url: window.location.href
            };

            // Cek apakah browser mendukung fitur Native Share (biasanya di Mobile)
            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Share canceled or failed:', err);
                }
            } else {
                // Fallback untuk Desktop: Otomatis Copy Link ke Clipboard
                navigator.clipboard.writeText(window.location.href).then(() => {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = 'Link Copied!';
                    setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                });
            }
        });
    });
}
//#endregion

//#region AUDIO NARRATOR
// =========================================
// 15. AUDIO NARRATOR PLAYER
// =========================================
function initAudioNarrator() {
    const wrapper = document.querySelector('.audio-narrator-wrapper');
    const player = document.querySelector('.audio-player-container');
    if (!player || !wrapper) return;

    const audio = player.querySelector('audio');
    const playBtn = player.querySelector('.play-pause-btn');
    const iconPlay = playBtn.querySelector('.icon-play');
    const iconPause = playBtn.querySelector('.icon-pause');
    const progressContainer = player.querySelector('.audio-progress-container');
    const timeCurrent = player.querySelector('.audio-time-current');
    const timeTotal = player.querySelector('.audio-time-total');
    const speedBtn = player.querySelector('.speed-btn');

    // --- WEB AUDIO API VARIABLES ---
    let audioCtx, analyser, dataArray, source;
    let animationId;
    const staticHeights = []; // To store original waveform shape for pause state

    // --- WAVEFORM GENERATION ---
    // Bersihkan container lama dan siapkan mode waveform
    progressContainer.innerHTML = '';
    progressContainer.classList.add('waveform-mode');

    // [FIX] Kurangi jumlah bar di mobile agar tidak overflow/kepotong (60 desktop, 28 mobile)
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const barCount = isMobile ? 28 : 60; 
    const bars = [];
    
    // Buat batang-batang visualizer
    for (let i = 0; i < barCount; i++) {
        const bar = document.createElement('div');
        bar.classList.add('waveform-bar');
        // Random tinggi antara 25% sampai 100% untuk efek gelombang suara natural
        // Kita simpan height statis ini untuk dipakai saat pause
        const height = Math.floor(Math.random() * 60) + 20; 
        staticHeights.push(height);
        
        bar.style.height = `${height}%`;
        progressContainer.appendChild(bar);
        bars.push(bar);
    }

    // Tambahkan kembali tooltip (karena innerHTML dihapus)
    const tooltip = document.createElement('div');
    tooltip.classList.add('audio-tooltip');
    tooltip.textContent = "0:00";
    progressContainer.appendChild(tooltip);

    // Helper: Format time
    const formatTime = (s) => {
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    };

    // --- AUDIO CONTEXT SETUP (Lazy Load) ---
    const initAudioContext = () => {
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 128; // Balance between detail and performance
                
                // Create Source from HTML Audio Element
                source = audioCtx.createMediaElementSource(audio);
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                
                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        } catch (error) {
            console.warn("Web Audio API blocked by CORS/Browser policy. Playing basic audio.", error);
        }
    };

    // --- VISUALIZER LOOP ---
    const renderVisualizer = () => {
        if (audio.paused) return;
        
        animationId = requestAnimationFrame(renderVisualizer);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate sampling step to map 64 bins to 'barCount' bars
        // We focus on the lower-mid spectrum where most musical energy is
        const step = Math.ceil(dataArray.length / barCount);

        bars.forEach((bar, i) => {
            // Get frequency value
            const dataIndex = Math.min(i * step, dataArray.length - 1);
            const value = dataArray[dataIndex];
            
            // Map 0-255 to percentage height (min 15% so it's visible)
            const percent = (value / 255) * 100;
            const height = Math.max(percent, 15);
            
            bar.style.height = `${height}%`;
        });
    };

    const resetVisualizer = () => {
        cancelAnimationFrame(animationId);
        // Restore the "aesthetic" random waveform when paused
        bars.forEach((bar, i) => {
            bar.style.height = `${staticHeights[i]}%`;
        });
    };

    // Toggle Play/Pause
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            // Init Web Audio on first user interaction
            initAudioContext();
            
            // Play with Fade In
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    audio.volume = 1; // FIX: Hapus GSAP Volume fade karena memblokir audio di iOS/Desktop
                    
                    iconPlay.style.display = 'none';
                    iconPause.style.display = 'block';
                    player.classList.add('is-playing');
                    
                    updateStickyState(); // FIX: Langsung cek state sticky sesaat sesudah play
                    // Start Visualizer
                    renderVisualizer();
                }).catch((e) => {
                    console.warn("Audio play failed:", e);
                });
            }
        } else {
            // Fade Out then Pause
            iconPlay.style.display = 'block';
            iconPause.style.display = 'none';
            player.classList.remove('is-playing');
            
            resetVisualizer();
            audio.pause();
            audio.volume = 1;
            updateStickyState(); // FIX: Cek state sticky sesaat sesudah pause
        }
    });

    // Update Progress & Time
    audio.addEventListener('timeupdate', () => {
        const percent = audio.currentTime / audio.duration;
        
        // Update Active Class (Coloring) based on Time
        const activeIndex = Math.floor(percent * barCount);
        bars.forEach((bar, index) => {
            if (index <= activeIndex) {
                bar.classList.add('active');
            } else {
                bar.classList.remove('active');
            }
        });

        timeCurrent.textContent = formatTime(audio.currentTime);
    });

    // Set Duration on Load
    const setDuration = () => {
        if (!isNaN(audio.duration) && isFinite(audio.duration)) {
            timeTotal.textContent = formatTime(audio.duration);
        }
    };

    if (audio.readyState >= 1) setDuration();
    audio.addEventListener('loadedmetadata', setDuration);

    // Seek/Scrub
    progressContainer.addEventListener('click', (e) => {
        const width = progressContainer.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        audio.currentTime = (clickX / width) * duration;
    });

    // Tooltip Hover Logic
    progressContainer.addEventListener('mousemove', (e) => {
        const width = progressContainer.clientWidth;
        const hoverX = e.offsetX;
        const duration = audio.duration;
        if (!duration) return;
        
        const hoverTime = (hoverX / width) * duration;
        if (tooltip) {
            tooltip.textContent = formatTime(hoverTime);
            tooltip.style.left = `${hoverX}px`;
        }
    });

    // Speed Control
    const speeds = [1, 1.25, 1.5];
    let speedIndex = 0;
    speedBtn.addEventListener('click', () => {
        speedIndex = (speedIndex + 1) % speeds.length;
        audio.playbackRate = speeds[speedIndex];
        speedBtn.textContent = speeds[speedIndex] + 'x';
    });

    // Reset UI on End
    audio.addEventListener('ended', () => {
        iconPlay.style.display = 'block';
        iconPause.style.display = 'none';
        // Reset visual state
        resetVisualizer();
        bars.forEach(bar => bar.classList.remove('active'));
        player.classList.remove('is-playing');
        audio.volume = 1; // Reset volume for next play
        updateStickyState(); // Tambahkan ini agar sticky hilang otomatis saat lagu tamat
    });

    // [NEW] Sticky Player Logic
    // Set height wrapper agar layout tidak jumping saat player jadi fixed
    wrapper.style.minHeight = player.offsetHeight + 'px';

    let isWrapperVisible = true;

    // Helper untuk update sticky kapan saja (saat play ditekan, atau saat scroll)
    const updateStickyState = () => {
        // Syarat diubah: Muncul asalkan tidak di layar atas DAN audio sudah jalan tapi belum tamat
        if (!isWrapperVisible && audio.currentTime > 0 && !audio.ended) {
            player.classList.add('is-sticky');
        } else {
            player.classList.remove('is-sticky');
        }
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Wrapper dianggap "terlihat" jika intersect ATAU masih berada di bawah layar (belum terlewat)
            isWrapperVisible = entry.isIntersecting || entry.boundingClientRect.top > 0;
            updateStickyState();
        });
    }, { 
        threshold: 0,
        rootMargin: "0px 0px 0px 0px"
    });

    observer.observe(wrapper);
}
//#endregion

//#region DATA PARALLAX
// =========================================
// 14. DATA PARALLAX ANIMATION
// =========================================
function initDataParallax() {
    const numbers = document.querySelectorAll('.data-number');
    
    if (!numbers.length) return;

    numbers.forEach(number => {
        gsap.fromTo(number, 
            { yPercent: -15 }, // Start slightly shifted up
            {
                yPercent: 15, // Move down as user scrolls (creating "lag" behind scroll)
                ease: "none",
                scrollTrigger: {
                    trigger: number.closest('.data-validation-section') || number,
                    start: "top bottom",
                    end: "bottom top",
                    scrub: 0.5 // Smooth scrubbing
                }
            }
        );
    });
}
//#endregion

//#region DATA COUNTER
// =========================================
// 13. DATA COUNTER ANIMATION
// =========================================
function initDataCounter() {
    const counters = document.querySelectorAll('.data-number');
    
    counters.forEach(counter => {
        // Regex to split: Prefix (non-digits), Number (digits/dots/commas), Suffix (non-digits)
        // Handles formats like "+1M", "3+", "100%"
        const text = counter.innerText;
        const match = text.match(/^([^0-9]*)([0-9\.,]+)([^0-9]*)$/);
        
        if (match) {
            const prefix = match[1];
            // Remove commas for numeric parsing (e.g. 1,000 -> 1000)
            const numericString = match[2].replace(/,/g, '');
            const targetVal = parseFloat(numericString);
            const suffix = match[3];
            
            // Detect if original number had decimals
            const hasDecimals = match[2].includes('.');
            const decimals = hasDecimals ? match[2].split('.')[1].length : 0;
            
            // Initial state: Show 0 with prefix/suffix
            counter.innerText = `${prefix}0${suffix}`;
            
            const proxy = { val: 0 };
            
            // Select the corresponding label
            const label = counter.parentElement.querySelector('.data-label');
            if (label) gsap.set(label, { opacity: 0 }); // Hide initially

            gsap.to(proxy, {
                val: targetVal,
                duration: 3, // Durasi diperpanjang agar efek menghitung lebih terasa
                ease: "power2.out", // Kurva yang lebih seimbang untuk menghitung angka (tidak melompat terlalu cepat)
                scrollTrigger: {
                    trigger: counter.closest('.data-validation-section') || counter, // Menggunakan section utamanya sebagai patokan scroll
                    start: "top 75%", // Menunda animasi hingga section lebih masuk ke area pandang (viewport)
                    once: true // Animate only once
                },
                onStart: () => {
                    // Animate label fade-in with a slight delay
                    if (label) {
                        gsap.fromTo(label, 
                            { opacity: 0, y: 15 },
                            { opacity: 0.6, y: 0, duration: 1, ease: "power3.out", delay: 0.4 }
                        );
                    }
                },
                onUpdate: () => {
                    // Format current value
                    let current;
                    if (hasDecimals) {
                        current = proxy.val.toFixed(decimals);
                    } else {
                        current = Math.floor(proxy.val);
                        // Add commas back for integer display if needed
                        current = current.toLocaleString('en-US');
                    }
                    counter.innerText = `${prefix}${current}${suffix}`;
                },
                onComplete: () => {
                    // Ensure it ends exactly on the original string
                    counter.innerText = text;
                }
            });
        }
    });
}
//#endregion

//#endregion

//#region SCROLL TEXT DISTORTION
// =========================================
// WHOLE-SCREEN MOTION BLUR ON FAST SCROLL
// The entire page content blurs as a single layer (not per-headline) during fast scroll,
// for a whole-screen sense of depth/motion. (Section headlines previously also got a
// skewY tied to scroll velocity — removed per feedback, headlines now stay level.)
// =========================================
function initScrollTextDistortion() {
    // Desktop-only: mobile's touch-driven scroll velocity spikes far higher and more
    // erratically than a mouse wheel's, which pushed this effect's per-frame `filter`
    // repaints hard enough to make the whole page feel heavy/laggy from the hero down,
    // and produced visibly glitchy blur artifacts on some devices. The effect adds
    // polish on desktop where scroll velocity is gentler; on mobile it was a net loss.
    if (!window.matchMedia('(min-width: 992px)').matches) return;

    // Blur every top-level section inside the main wrapper individually (not the wrapper
    // itself) so #navbar-container — nested inside it but fixed-position and meant to stay
    // sharp/usable while scrolling fast — can be excluded. Filter on an ancestor blurs all
    // descendants including fixed ones, so there's no way to exclude it once it's the target.
    // #services is excluded too: applying `filter` directly to that section (even
    // `filter: none`, since GSAP still sets the inline property) makes it a new containing
    // block for its own descendants' `position: fixed` — which silently broke the
    // ScrollTrigger pin used by the sticky-scroll services wheel inside it (the pinned
    // element locked to the section's own box instead of the viewport, so it looked like
    // the pin wasn't firing at all).
    const main = document.querySelector('main.body-wrapper');
    const allBlurCandidates = main
        ? Array.from(main.children).filter(el => el.id !== 'navbar-container' && el.id !== 'services')
        : [document.body];
    if (!allBlurCandidates.length || typeof gsap === 'undefined') return;

    // Filter forces a new compositing layer per element and is expensive to repaint every
    // frame. Blurring every section on the page at once (most of them off-screen) was heavy
    // enough to stall the main thread mid-scroll, which is what caused the widget's
    // show/hide state (and its own scroll listener) to lag and appear to flicker — this was
    // a performance bug bleeding into an unrelated feature, not a bug in the widget itself.
    // Restricting the blur to only the section(s) currently intersecting the viewport, and
    // giving them will-change so the browser can precompute the compositing layer instead
    // of creating it mid-scroll, brings the cost down to near-zero at rest.
    let visibleSections = [];
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            entry.target.style.willChange = entry.isIntersecting ? 'filter' : '';
            if (entry.isIntersecting) {
                if (!visibleSections.includes(entry.target)) visibleSections.push(entry.target);
            } else {
                visibleSections = visibleSections.filter(el => el !== entry.target);
                gsap.set(entry.target, { filter: 'none' }); // clear blur immediately once it leaves view
            }
        });
    }, { rootMargin: '200px 0px' });
    allBlurCandidates.forEach(el => sectionObserver.observe(el));

    const MAX_BLUR = 6; // px — a bit stronger since it's now spread across the whole screen, not just text
    let lastY = window.scrollY;
    let velocity = 0;
    let lastAppliedBlur = -1;

    window.addEventListener('scroll', () => {
        const now = window.scrollY;
        velocity = now - lastY;
        lastY = now;
    }, { passive: true });

    gsap.ticker.add(() => {
        velocity *= 0.85; // decay toward 0 between scroll events
        const speed = Math.min(Math.abs(velocity), 40); // 0-40 normalized speed range
        const intensity = speed / 40; // 0-1

        const blur = intensity * MAX_BLUR;

        // Skip the write entirely when the rounded blur value hasn't actually changed —
        // avoids re-triggering a repaint every single frame while scrolling at a steady speed.
        const roundedBlur = Math.round(blur * 10);
        if (roundedBlur !== lastAppliedBlur && visibleSections.length) {
            lastAppliedBlur = roundedBlur;
            gsap.set(visibleSections, { filter: blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none' });
        }
    });
}
//#endregion

//#region BENTO SCROLL REVEAL
// =========================================
// SIMPLE FADE-UP REVEAL FOR PROJECT MEDIA
// Bento cards (project thumbnails across case studies and the services page) fade up
// into place as they scroll into view — a plain opacity + translateY reveal, matching
// the simple fade-in used by .fade-in-section elsewhere on the site instead of a
// geometric mask. One-shot per element, driven by IntersectionObserver so it only pays
// the cost for cards actually being scrolled to.
// =========================================
function initClipPathReveal() {
    const items = document.querySelectorAll('.bento-item');
    if (!items.length || typeof gsap === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    items.forEach(item => {
        gsap.set(item, { opacity: 0, y: 24 });
        // Safety net: if this item's IntersectionObserver entry never fires (observer setup
        // fails, layout never settles, etc.), it must not stay permanently invisible.
        item.dataset.clipRevealPending = 'true';
    });

    const reveal = (item) => {
        if (item.dataset.clipRevealPending !== 'true') return;
        item.dataset.clipRevealPending = 'false';
        gsap.to(item, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            clearProps: 'transform',
        });
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            reveal(entry.target);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    items.forEach(item => observer.observe(item));

    // Fallback: force-reveal anything still pending after 3s, regardless of scroll state.
    setTimeout(() => {
        items.forEach(item => {
            if (item.dataset.clipRevealPending === 'true') reveal(item);
        });
    }, 3000);
}
//#endregion

//#region TAB TITLE SWITCH
// =========================================
// 11. TAB TITLE SWITCH
// =========================================
/**
 * Changes the document title when the user switches to another tab
 * and restores it when they return.
 */
function initTabTitleSwitch() {
    const originalTitle = document.title;
    const favicon = document.getElementById('favicon');

    if (!favicon) return; // Exit if favicon element is not found

    const originalFavicon = favicon.href;
    // NOTE: You need to create this 'away' favicon image and place it in the correct path.
    const awayFavicon = 'assets/images/favicon-away.png'; 

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.title = 'Hey, come back! 👋';
            favicon.href = awayFavicon;
        } else {
            document.title = originalTitle;
            favicon.href = originalFavicon;
        }
    });
}
//#endregion

//#region LOGO MARQUEE LOOP
// =========================================
// 9b. LOGO MARQUEE — DRAGGABLE COVERFLOW LOOP
// =========================================
/**
 * Replaces the old CSS @keyframes auto-scroll with a manual drag-and-spin loop, same
 * physics pattern as the hero video carousel (initHeroCarousel): a constant auto-scroll
 * velocity, pointer drag that overrides it and tracks hand velocity, and momentum that
 * decays via friction after release — rather than GSAP's InertiaPlugin (not loaded on
 * this page; the hero carousel made the same call for the same reason: a plugin-based
 * inertia felt like it "snapped" rather than coasting).
 *
 * Every frame also writes a per-item --marquee-scale based on that item's horizontal
 * distance from the wrapper's own center — 1 at dead-center, falling off toward the
 * mask-faded edges — so the strip reads as a coverflow (center logo prominent, side
 * logos smaller) instead of a flat uniform-size scroll, per the user's request.
 *
 * The two duplicate .marquee-content sets loop the position with modulo arithmetic on
 * the measured set width (not CSS keyframes), so dragging past either end wraps
 * seamlessly in either direction — the same "never runs out" feel as the auto-scroll
 * version, just now also draggable.
 */
function initLogoMarqueeLoop() {
    const wrapper = document.getElementById('logo-marquee-wrapper');
    const track = document.getElementById('logo-marquee-track');
    if (!wrapper || !track) return;

    const items = Array.from(track.querySelectorAll('.marquee-item'));
    if (!items.length) return;

    let setWidth = 0;
    const measure = () => {
        const firstSet = track.querySelector('.marquee-content');
        if (!firstSet) return;
        const w = firstSet.getBoundingClientRect().width;
        if (w > 0) setWidth = w;
    };
    measure();
    window.addEventListener('load', measure);
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(measure, 200);
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let x = 0; // current translateX, px — always kept within [-setWidth, 0) via wrapping
    let velocity = 0; // px/frame, decays after a drag/flick ends
    const AUTO_SPEED = prefersReducedMotion ? 0 : 0.6; // px/frame constant auto-scroll
    const FRICTION = 0.94; // matches the hero carousel's own coast-down feel

    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerTime = 0;

    // Pause entirely off-screen (scrolled past) — same performance pattern as the hero
    // carousel and the About showreel video: no reason to keep writing transforms every
    // frame for a strip nobody can see.
    let isVisible = true;
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            entries.forEach(entry => { isVisible = entry.isIntersecting; });
        }, { rootMargin: '200px 0px' }).observe(wrapper);
    }

    const render = () => {
        if (!isVisible) {
            requestAnimationFrame(render);
            return;
        }
        if (!isDragging) {
            x -= (AUTO_SPEED + velocity);
            velocity *= FRICTION;
            if (Math.abs(velocity) < 0.01) velocity = 0;
        }
        // Wrap into [-setWidth, 0) so the two duplicate sets always cover the visible
        // band regardless of drag direction/distance. Only actually reassigns x when
        // it's genuinely out of range (a plain +=/-= comparison, not a modulo run every
        // single frame) — recomputing x through the modulo operator unconditionally on
        // every frame, even the vast majority where nothing needed wrapping, was
        // introducing tiny floating-point rounding drift each frame that read as a
        // faint stutter in what should have been a perfectly linear scroll.
        if (setWidth > 0) {
            if (x <= -setWidth) x += setWidth;
            else if (x > 0) x -= setWidth;
        }
        track.style.transform = `translate3d(${x}px, 0, 0)`;

        requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    const getPointerX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);

    const onPointerDown = (e) => {
        isDragging = true;
        wrapper.classList.add('is-dragging');
        lastPointerX = getPointerX(e);
        lastPointerTime = performance.now();
        velocity = 0;
    };
    const onPointerMove = (e) => {
        if (!isDragging) return;
        const pointerX = getPointerX(e);
        const now = performance.now();
        const dt = Math.max(now - lastPointerTime, 1);
        // Damped "spin" like the hero carousel's own drag (see initHeroCarousel's
        // onPointerMove: rotation += dx * 0.04), not a 1:1 "track sticks exactly to the
        // cursor" drag — the earlier version set x = trackStartX + (pointerX -
        // dragStartX) directly, which reads as the strip physically glued to the mouse.
        // Here each frame's pointer delta only nudges x by a fraction, so it feels like
        // spinning a wheel with the hand rather than dragging a slider.
        const dx = pointerX - lastPointerX;
        x += dx * 0.6;
        // Hand velocity in px/frame (assuming ~16.7ms/frame), so it composes with the
        // same FRICTION decay used for AUTO_SPEED after release.
        velocity = -((dx * 0.6) / dt) * 16.7;
        lastPointerX = pointerX;
        lastPointerTime = now;
    };
    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.classList.remove('is-dragging');
        // velocity already holds the last measured hand speed — render()'s friction
        // decay picks it up next frame and coasts it down, same as the hero carousel.
    };

    wrapper.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    wrapper.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    // Safety net: if the mouse leaves the browser window entirely mid-drag (or the tab
    // loses focus), no mouseup ever fires on window — without this, isDragging stays
    // stuck true and the strip reads as permanently "glued" until the user happens to
    // mouse back in and click again.
    window.addEventListener('blur', onPointerUp);
    document.addEventListener('mouseleave', onPointerUp);

    // Dragging shouldn't also trigger a logo's own link/hover click.
    wrapper.addEventListener('click', (e) => {
        if (Math.abs(velocity) > 0.5) e.preventDefault();
    }, true);
}
//#endregion

//#region WORK CARD CURSOR TILT
// =========================================
// 9c. FEATURED WORK CARD — CURSOR-DRIVEN TILT
// =========================================
/**
 * Both featured homepage cards (.work-card, clickable and locked/is-ongoing alike)
 * tilt toward the cursor's position inside the card rather than a fixed hover angle
 * — same "tracks the mouse" language as the About section's showreel label
 * (initAboutIntroPlayer), applied here to rotateX/rotateY instead of position.
 * canHover guards touch input, which has no persistent hover position to track.
 */
function initWorkCardTilt() {
    const cards = document.querySelectorAll('.work-card');
    if (!cards.length) return;

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!canHover) return;

    const MAX_TILT = 6; // degrees at the card's edge — subtle, not a big swing

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width; // 0-1 across the card
            const py = (e.clientY - rect.top) / rect.height;

            // Cursor right/top should tilt the card toward the viewer on that edge —
            // rotateY follows horizontal position, rotateX is inverted from vertical.
            const tiltY = (px - 0.5) * 2 * MAX_TILT;
            const tiltX = -(py - 0.5) * 2 * MAX_TILT;

            card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
            card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--tilt-x', '0deg');
            card.style.setProperty('--tilt-y', '0deg');
        });
    });
}
//#endregion

//#region CASE STUDY HERO SHOWREEL VISIBILITY GATE
// =========================================
// 9d. CASE STUDY HERO SHOWREEL — PAUSE OFF-SCREEN
// =========================================
/**
 * Every case study page (torch-x-gundam, tsukamie, andrea-bocelli, etc.) autoplays
 * one `.showreel-video` in its hero, `preload="auto"` — the heaviest possible preload
 * setting, chosen deliberately since it's the hero/LCP element. That's fine while it's
 * on-screen, but these are long scroll pages: once the user scrolls past the hero, the
 * video kept decoding/playing indefinitely with nothing gating it, unlike the homepage
 * hero carousel (see initHeroCarousel) which already pauses off-screen. Same fix here.
 */
function initCaseStudyShowreelVisibility() {
    if (!('IntersectionObserver' in window)) return;
    const videos = document.querySelectorAll('.showreel-video');
    if (!videos.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.play().catch(() => {});
            } else {
                entry.target.pause();
            }
        });
    }, { rootMargin: '200px 0px' });

    videos.forEach(v => observer.observe(v));
}
//#endregion

//#region VIDEO CARD CONTROLS
// =========================================
// 10. VIDEO CARD CONTROLS
// =========================================
/**
 * Initializes mute/unmute controls for video cards.
 */
function initVideoCards() {
     const videoCards = document.querySelectorAll('.work-card');
     
     // Check connection status (Progressive Enhancement)
     const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
     const isSaveData = connection ? connection.saveData : false;
 
     // 1. Intersection Observer for Play/Pause on Scroll
     const observer = new IntersectionObserver((entries) => {
         entries.forEach(entry => {
             const video = entry.target.querySelector('.work-card__video');
             const muteBtn = entry.target.querySelector('.work-card__mute-btn');

             if (video) { 
                 if (entry.isIntersecting) {
                    // Skip autoplay if Data Saver is on
                    if (isSaveData) return;

                    // User Request: Always start muted when entering viewport
                    video.muted = true;

                    // Update icon to show mute state
                    if (muteBtn) {
                        muteBtn.classList.add('is-muted');
                    }

                     // Play the video
                     const playPromise = video.play();
                     if (playPromise !== undefined) {
                         playPromise.catch(error => {
                         console.log("Video autoplay was prevented by browser policy:", error);
                     });
                     }
                 } else {
                     // Pause the video when it leaves the viewport
                     if (!video.paused) {
                         video.pause();
                     }
                 }
             }
         });
     }, {
         root: null, // Observe intersections relative to the viewport
         threshold: 0.2, // Trigger when 20% of the element is visible
         rootMargin: "200px 0px" // Preload slightly before element enters viewport
     });
 
     // 2. Initialize Each Card
     const allVideoContainers = document.querySelectorAll('.work-card, .video-player-wrapper, .bento-item');
     allVideoContainers.forEach(card => {
         const video = card.querySelector('video');
         const muteBtn = card.querySelector('.work-card__mute-btn');
 
         if (video) {
             // Observe the card for play/pause functionality
             observer.observe(card);
 
             // Add mute/unmute functionality if the button exists
             if (muteBtn) {
                 muteBtn.addEventListener('click', (e) => {
                     e.preventDefault(); // Prevent link navigation
                     e.stopPropagation(); // Stop event from bubbling to the card
 
                     video.muted = !video.muted;
                     // Toggle the class based on the video's muted state
                     muteBtn.classList.toggle('is-muted', video.muted);
                 });
             }
         }
     });
}
//#endregion

//#region LIGHTBOX
// =========================================
// 7. LIGHTBOX LOGIC
// =========================================
/**
 * Initializes the custom lightbox for the Bits Slider.
 * Why: Allows users to view slider images in full screen.
 */
function initLightbox() {
    const modal = document.getElementById("lightbox-modal");
    const modalImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector(".lightbox-close");
    const slider = document.querySelector('.bits-slider');

    if (!slider || !modal) return;

    // Add cursor pointer to images to indicate clickability
    const addCursor = () => {
        const images = slider.querySelectorAll('.photo-img');
        images.forEach(img => img.style.cursor = 'zoom-in');
    };
    addCursor();

    // Event Delegation: Handle clicks on images inside the slider
    slider.addEventListener('click', (e) => {
        const img = e.target.closest('.photo-img');
        if (img && img.tagName.toLowerCase() === 'img') {
            e.preventDefault();
            modal.classList.add('active');
            // Use currentSrc to get the highest quality loaded by the browser
            modalImg.src = img.currentSrc || img.src;
            document.body.style.overflow = 'hidden'; // Disable scroll
        }
    });

    // Close Logic
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Re-enable scroll
        setTimeout(() => { modalImg.src = ''; }, 300); // Clear src after fade out
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    // Close on background click or Escape key
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && modal.classList.contains('active')) closeModal(); });
}
//#endregion

//#region FAQ
// =========================================
// 8. FAQ ACCORDION
// =========================================
function initFAQ() {
    const triggers = document.querySelectorAll('.faq__trigger');

    triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
            const content = trigger.nextElementSibling;

            // Close others
            triggers.forEach(other => {
                if (other !== trigger && other.getAttribute('aria-expanded') === 'true') {
                    other.setAttribute('aria-expanded', 'false');
                    other.nextElementSibling.style.height = '0px';
                    other.nextElementSibling.setAttribute('aria-hidden', 'true');
                }
            });

            // Toggle current
            if (!isExpanded) {
                trigger.setAttribute('aria-expanded', 'true');
                content.setAttribute('aria-hidden', 'false');
                content.style.height = content.scrollHeight + 'px';
            } else {
                trigger.setAttribute('aria-expanded', 'false');
                content.setAttribute('aria-hidden', 'true');
                content.style.height = '0px';
            }
        });
    });
}
//#endregion