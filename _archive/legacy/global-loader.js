//#region INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    loadNavbar();
});
//#endregion

//#region NAVBAR LOADER
/**
 * Fetches the navbar component and injects it into the page.
 * Why: Allows for a single source of truth for the navigation across all pages.
 */
function loadNavbar() {
    // -- Selectors --
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;

    fetch('components/navbar.html')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load navbar');
            return response.text();
        })
        .then(html => {
            placeholder.innerHTML = html;
            initNavbarInteractions();
        })
        .catch(err => console.error('Navbar loading error:', err));
}
//#endregion

//#region NAVBAR INTERACTIONS
/**
 * Initializes interactions (Scroll, Mobile Menu, Active State)
 * strictly AFTER the navbar is injected.
 */
function initNavbarInteractions() {
    // -- Selectors --
    const navbar = document.querySelector('.navbar-3');
    
    // --- 1. Scroll Logic (Shrink on Scroll) ---
    if (navbar) {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                navbar.classList.add('is-scrolled');
            } else {
                navbar.classList.remove('is-scrolled');
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Check initial state
    }

    // --- 2. Mobile Menu Logic ---
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const mobileOverlay = document.querySelector('.mobile-menu-overlay');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    if (menuBtn && mobileOverlay) {
        menuBtn.addEventListener('click', () => {
            const isActive = mobileOverlay.classList.toggle('is-active');
            menuBtn.classList.toggle('is-active');
            
            // Use GSAP if available for smooth animation, otherwise CSS transition handles it
            if (typeof gsap !== 'undefined') {
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
            }
        });
    }

    // --- 3. Active State Logic ---
    // Normalize path: Handle root '/' as 'index.html' and strip query params
    let path = window.location.pathname;
    path = path.substring(path.lastIndexOf('/') + 1);
    const currentPage = (path === '' || path === '/') ? 'index.html' : path;

    const navLinks = document.querySelectorAll('.navigation-link, .mobile-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        // Compare filename parts
        if (href.split('/').pop() === currentPage) {
            link.classList.add('w--current'); // Webflow active class
            link.classList.add('active');     // Custom active class
            link.setAttribute('aria-current', 'page');
        } else {
            link.classList.remove('w--current', 'active');
            link.removeAttribute('aria-current');
        }
    });
}
//#endregion