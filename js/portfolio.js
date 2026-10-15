document.addEventListener("DOMContentLoaded", (event) => {
    // Wait for GSAP to be loaded
    const initPortfolioAnimations = () => {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            setTimeout(initPortfolioAnimations, 100);
            return;
        }
        
        gsap.registerPlugin(ScrollTrigger);

        // 1. Hero & UI Entry Animations
        // House clip-path wipe (see Entrance Motion Standard in css/style.css). The
        // wrapper is opacity:0 inline in the markup, so this is what reveals it at all,
        // which is why reduced motion sets the end state instead of skipping the tween.
        const heroRevealed = { opacity: 1, y: 0, clipPath: 'inset(0% 0 0 0)' };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            gsap.set('.home-hero-headline-wrapper.page-portfolio', heroRevealed);
        } else {
            gsap.fromTo('.home-hero-headline-wrapper.page-portfolio',
                { opacity: 0, y: 28, clipPath: 'inset(100% 0 0 0)' },
                { ...heroRevealed, duration: 0.7, ease: "power2.out", delay: 0.2, clearProps: 'clipPath' }
            );
        }


        // 2. Portfolio Filter System (Dynamic & Optimized)
        const projectsData = [
            {
                id: 16,
                title: "Royale Heritage",
                year: "2026",
                category: "Motion Design",
                industry: "Beauty",
                roles: ["Motion Design"],
                link: "",
                clientName: "PT Royale Heritage Innv",
                description: "A month of social motion across four brands, turning existing static designs into 40 animated pieces with a distinct motion language for each brand.",
                brandInfo: "PT Royale Heritage Innv is a dynamic Indonesian beauty and lifestyle company managing a fast-growing brand portfolio that includes Pink Roulette (skincare), Noomi Matcha (matcha treatments), Gelluna (fragrances), and Kerys (hair care).",
                // One photo per brand (Gelluna, Noomi Matcha, Kerys, Pink Roulette). The card cross-fades
                // through them (see `images` handling in the card template + the cycle timer below);
                // `image` is the first frame and the fallback when motion is reduced.
                image: "../assets/images/project/royale-heritage/card-gelluna.jpg",
                images: [
                    { src: "../assets/images/project/royale-heritage/card-gelluna.jpg", position: "center 35%" },
                    { src: "../assets/images/project/royale-heritage/card-noomi-matcha.jpg", position: "center" },
                    { src: "../assets/images/project/royale-heritage/card-kerys.jpg", position: "center 0%" },
                    { src: "../assets/images/project/royale-heritage/card-pink-roulette.jpg", position: "center 30%" }
                ],
                srcset: "",
                ongoing: true
            },
            {
                id: 15,
                title: "Asritektur Website",
                year: "2026",
                category: "Art Direction · Web Design",
                industry: "Architecture",
                roles: ["Art Direction", "Web Design"],
                link: "",
                clientName: "Asritektur",
                description: "Rebuilding the website’s direction, structure, and user experience to better communicate Asritektur’s services, showcase its projects, and support ongoing brand growth.",
                brandInfo: "Indonesian architecture & interior design studio, offering flexible, remote-friendly design services nationwide.",
                image: "../assets/images/project/asritektur/web/cover-web-asritektur.png",
                srcset: "",
                ongoing: true
            },
            {
                id: 14,
                title: "Asritektur",
                year: "2026",
                category: "Art Direction · Content Strategy · Social Content",
                industry: "Architecture",
                roles: ["Art Direction", "Content Strategy", "Social Content"],
                link: "",
                clientName: "Asritektur",
                description: "Building a more premium voice for an architecture studio from its own design archive. Still in progress.",
                brandInfo: "Indonesian architecture & interior design studio, offering flexible, remote-friendly design services nationwide.",
                image: "../assets/images/project/asritektur/home-ibu-niluh.webp",
                // Source photo is a tall portrait crop with mostly empty sky up top and the
                // house itself concentrated in the bottom half — the card's 4:3 center-crop
                // was cutting the house off. Bias the crop toward the bottom instead.
                imagePosition: "center 100%",
                srcset: "",
                ongoing: true
            },
            {
                id: 13,
                title: "Torch Main Cantik",
                year: "2026",
                category: "Post Production",
                industry: "Fashion",
                roles: ["Post Production"],
                link: "/portfolio/torch-main-cantik",
                clientName: "Torch",
                description: "Shaping the edit and visual tone of Torch's “Main Cantik” women's collection campaign.",
                brandInfo: "Torch is a local Indonesian brand founded in Bandung, specializing in durable and stylish bags, apparel, and accessories designed for everyday use and travel.",
                image: "../assets/images/project/torch-main-cantik/model-card-cover.webp",
                srcset: ""
            },
            {
                id: 12,
                title: "Ciara Brosnan for Pink Roulette",
                year: "2026",
                category: "Photo Production · Post Production",
                industry: "Beauty",
                roles: ["Photo Production", "Post Production"],
                link: "/portfolio/pink-roulette",
                clientName: "Pink Roulette",
                description: "Photography and motion introducing Pink Roulette’s new face, Ciara Brosnan, alongside its latest products.",
                brandInfo: "A local beauty and lifestyle brand established in 2018, offering a variety of skincare and makeup products in Indonesia.",
                image: "../assets/images/project/pink-roulette/card-pink-roulette.jpg",
                imagePosition: "center 30%",
                srcset: ""
            },
            // Hidden for now — Dunkin Donuts (id 11) card, per request.
            // {
            //     id: 11,
            //     title: "Dunkin Donuts",
            //     year: "2026",
            //     category: "Video Production · Post Production",
            //     industry: "F&B",
            //     roles: ["Video Production", "Post Production"],
            //     link: "",
            //     clientName: "Dunkin Donuts",
            //     description: "Video production and editing for Dunkin Donuts' social media presence.",
            //     brandInfo: "Dunkin Donuts.",
            //     image: "../assets/images/project/pink-roulette/logo-pink-roulette.webp",
            //     srcset: ""
            // },
            // Hidden for now — Ngaliwet Raos (id 10) card, per request.
            // {
            //     id: 10,
            //     title: "Ngaliwet Raos",
            //     year: "2026",
            //     category: "Video Production · Photo Production · Post Production",
            //     industry: "F&B",
            //     roles: ["Video Production", "Photo Production", "Post Production"],
            //     link: "",
            //     clientName: "Ngaliwet Raos",
            //     description: "Organic social content for Ngaliwet Raos, creating photography and video for its Instagram presence.",
            //     brandInfo: "A Sundanese dining and catering brand bringing culture and togetherness to a new generation.",
            //     image: "../assets/images/project/ngaliwet-raos/ngaliwet-main-hero.webp",
            //     srcset: "",
            //     ongoing: true
            // },
            {
                id: 9,
                title: "Andrea Bocelli World Tour",
                year: "2026",
                category: "Post Production",
                industry: "Live Event",
                roles: ["Post Production"],
                link: "/portfolio/andrea-bocelli-romanza-indonesia",
                clientName: "Andrea Bocelli",
                description: "Post-production across video editing and motion design for Andrea Bocelli’s Romanza 30th Anniversary World Tour in Indonesia.",
                brandInfo: "Andrea Bocelli is set to return to Indonesia for two special concerts in Borobudur and JIExpo, Jakarta, as part of his worldwide tour celebrating 30 years of Romanza, the landmark album that helped establish his global career.",
                image: "../assets/images/project/andrea-bocelli/romanza-main-hero.webp",
                srcset: "",
                ongoing: true
            },
            {
                id: 8,
                title: "Torch Prestachill",
                year: "2026",
                category: "Video Production · Post Production",
                industry: "Fashion",
                roles: ["Video Production", "Post Production"],
                link: "/portfolio/torch-prestachill",
                clientName: "Torch",
                description: "Organic short-form video for Torch's PrestaChill campaign. A reminder to students to celebrate their small wins.",
                brandInfo: "Torch is a local Indonesian brand founded in Bandung, specializing in durable and stylish bags, apparel, and accessories designed for everyday use and travel.",
                image: "../assets/images/project/torch-prestachill/prestachill-main-model.webp",
                srcset: "",
                ongoing: false
            },
            {
                id: 7, // Pastikan ID unik
                title: "Torch x Gundam",
                year: "2026",
                category: "Video Production · Post Production",
                industry: "Fashion", // [NEW] Properti Industri
                roles: ["Video Production", "Post Production"], // [NEW] Properti Layanan/Role (bisa lebih dari satu)
                link: "/portfolio/torch-x-gundam", // Ganti dengan link detail proyek jika ada
                clientName: "Torch",
                description: "Cinematic video production and visual execution for Torch's biggest IP collaboration, collectively driving over 1.82M organic views.", // Ganti dengan deskripsi proyek
                brandInfo: "Torch is a local Indonesian brand founded in Bandung, specializing in durable and stylish bags, apparel, and accessories designed for everyday use and travel.",
                image: "../assets/images/project/torch/torch-model-backpack.webp", // Ganti dengan URL gambar Anda
                srcset: "" // Kosongkan jika tidak ada srcset
            },
            {
                id: 5,
                title: "Tsukamie Noodle Bar",
                year: "2025",
                category: "Video Production · Photo Production · Post Production · Social Content",
                industry: "F&B",
                roles: ["Video Production", "Photo Production", "Post Production", "Social Content"],
                link: "/portfolio/tsukamie",
                clientName: "Tsukamie",
                description: "Social media content and digital marketing that grew an F&B brand's reach by +10,896%.",
                brandInfo: "Established in 2022, Tsukamie is a Halal-certified Asian fusion noodle bar in Bandung that positions itself as a lifestyle ecosystem rather than just an F&B brand.",
                image: "../assets/images/project/tsukamie/tsukamie1.webp",
                srcset: ""
            },
            {
                id: 6,
                title: "Studio Berka Website",
                year: "2026",
                category: "Web Design",
                industry: "Architecture",
                roles: ["Web Design"],
                link: "",
                clientName: "Studio Berka",
                description: "Web design and UX strategy for an architecture studio. Built to earn trust and make pricing feel transparent.",
                brandInfo: "Studio Berka is an architecture and interior design studio based in Bandung, handling everything from planning and construction to custom furniture.",
                image: "../assets/images/project/berka/cover-web-berka.webp",
                srcset: "",
                ongoing: true
            },
            
        ];

        const gridContainer = document.getElementById('portfolio-grid');
        const searchInput = document.getElementById('portfolio-search');
        const searchContainer = document.querySelector('.portfolio-search-container');
        
        // --- NEW: Web Audio API untuk efek suara gembok (tanpa file mp3) ---
        const playLockFeedback = () => {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (!AudioContext) return;
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sawtooth'; // Tekstur kasar untuk bass error
                osc.frequency.setValueAtTime(65, ctx.currentTime); // Frekuensi sangat rendah (Bass)
                osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15); // Turun ke sub-bass
                gain.gain.setValueAtTime(0.2, ctx.currentTime); // Sedikit lebih keras karena frekuensi rendah
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } catch (e) { console.log(e); }
        };

        // --- NEW: Event Delegation for Client Accordion & Shake Animation ---
        // Closes any other open "About [Client]" accordion — only one stays open at a
        // time, whether that's because the user opened a different card's accordion or
        // clicked anywhere else on the page.
        const closeOtherAccordions = (exceptTrigger) => {
            document.querySelectorAll('.client-accordion-trigger.is-open').forEach(openTrigger => {
                if (openTrigger === exceptTrigger) return;
                openTrigger.classList.remove('is-open');
                const openContent = openTrigger.nextElementSibling;
                if (openContent) openContent.style.height = '0px';
            });
        };

        if (gridContainer) {
            gridContainer.addEventListener('click', (e) => {
                const trigger = e.target.closest('.client-accordion-trigger');
                if (trigger) {
                    e.preventDefault();
                    const content = trigger.nextElementSibling;
                    const isOpen = trigger.classList.contains('is-open');

                    closeOtherAccordions(trigger);

                    if (isOpen) {
                        trigger.classList.remove('is-open');
                        content.style.height = '0px';
                    } else {
                        trigger.classList.add('is-open');
                        content.style.height = content.scrollHeight + 'px';
                    }

                    // Optional: Refresh ScrollTrigger after animation so page physics don't break
                    setTimeout(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 400);
                }

                // [NEW] Animasi goyang (shake) gembok jika card on-going diklik
                const ongoingCard = e.target.closest('.is-ongoing');
                if (ongoingCard && !trigger) {
                    e.preventDefault();
                    const ctaBtn = ongoingCard.querySelector('.is-ongoing-cta');
                    if (ctaBtn) {
                        // Matikan transisi CSS sementara agar tidak menahan animasi
                        ctaBtn.style.transition = "none";
                        
                        // Animasikan goyang dan warna merah pakai GSAP
                        gsap.killTweensOf(ctaBtn);
                        gsap.to(ctaBtn, {
                            keyframes: [
                                { x: -6, backgroundColor: "rgba(220, 38, 38, 0.9)", borderColor: "rgba(239, 68, 68, 0.6)", duration: 0.08 },
                                { x: 6, duration: 0.08 },
                                { x: -6, duration: 0.08 },
                                { x: 6, duration: 0.08 },
                                { x: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", borderColor: "rgba(255, 255, 255, 0.2)", duration: 0.08 }
                            ],
                            clearProps: "x,backgroundColor,borderColor", // Bersihkan properti setelah selesai agar kembali normal
                            onComplete: () => { ctaBtn.style.transition = ""; } // Kembalikan efek transisi CSS semula
                        });

                        // Mainkan efek suara penolakan (Synthesized)
                        playLockFeedback();
                    }
                }
            });
        }

        // Clicking anywhere outside an open accordion (another card, a filter, the
        // page background) closes it too — not just clicking its own trigger again.
        document.addEventListener('click', (e) => {
            if (e.target.closest('.client-info-accordion')) return;
            closeOtherAccordions(null);
        });

        let currentSearch = '';
        let currentIndustry = 'all'; // [NEW] State default filter industri
        let currentRole = 'all'; // [NEW] State default filter role
        let currentYear = 'all'; // State default filter tahun
        let currentSort = 'latest'; // [NEW] State default urutan: latest, oldest, az

        function renderProjects(animationType = 'normal') {
            // Filter data
            const filteredData = projectsData.filter(item => {
                // Pencocokan Search
                // Search covers the project title, the brand/client, and its services/badges (category, roles, industry)
                const searchHaystack = [item.title, item.clientName, item.industry, item.category, ...(item.roles || [])]
                    .filter(Boolean).join(' ').toLowerCase();
                const searchMatch = searchHaystack.includes(currentSearch.toLowerCase());

                // Logika pencocokan filter dropdown
                const industryMatch = currentIndustry === 'all' || (item.industry && item.industry === currentIndustry);
                const roleMatch = currentRole === 'all' || (item.roles && item.roles.includes(currentRole));
                const yearMatch = currentYear === 'all' || (item.year && item.year === currentYear);

                return searchMatch && industryMatch && roleMatch && yearMatch;
            });

            // [NEW] Urutkan hasil sesuai pilihan sort
            filteredData.sort((a, b) => {
                // Cards a visitor can open lead; locked on-going ones (no `openable`) always sit at the
                // bottom, regardless of sort mode (latest/oldest/A-Z). Within each group the chosen
                // sort applies below. An on-going project with `openable: true` counts as open.
                const isLocked = (p) => !!p.ongoing && !p.openable;
                const ongoingDiff = (isLocked(a) ? 1 : 0) - (isLocked(b) ? 1 : 0);
                if (ongoingDiff !== 0) return ongoingDiff;

                if (currentSort === 'az') {
                    return a.title.localeCompare(b.title);
                }
                const yearDiff = parseInt(b.year || 0, 10) - parseInt(a.year || 0, 10);
                if (yearDiff !== 0) {
                    return currentSort === 'oldest' ? -yearDiff : yearDiff;
                }
                // Tie-break pakai id (dianggap urutan penambahan proyek)
                return currentSort === 'oldest' ? a.id - b.id : b.id - a.id;
            });

            // [NEW] Update Text Counter "X Projects Found"
            const resultCountEl = document.getElementById('portfolio-results-count');
            if (resultCountEl) {
                resultCountEl.innerText = `${filteredData.length} Project${filteredData.length === 1 ? '' : 's'} Found`;
            }

            // [NEW] Tampilkan / Sembunyikan Tombol Reset
            const resetBtn = document.getElementById('reset-filters');
            if (resetBtn) {
                if (currentSearch !== '' || currentIndustry !== 'all' || currentRole !== 'all' || currentYear !== 'all') {
                    resetBtn.classList.add('active'); // Munculkan tombol
                } else {
                    resetBtn.classList.remove('active'); // Sembunyikan tombol
                }
            }

            const updateContent = () => {
                // CLEANUP: Matikan semua proses GSAP pada elemen lama sebelum dihancurkan agar tidak menjadi Zombie Memory
                if (gridContainer.children.length > 0 && typeof gsap !== 'undefined') {
                    gsap.killTweensOf(gridContainer.querySelectorAll('.paralax-image, .portfolio-cta'));
                }
                
                gridContainer.innerHTML = '';
                
                if (filteredData.length === 0) {
                    gridContainer.innerHTML = '<div class="no-results">No projects found matching your criteria.</div>';
                } else {
                    filteredData.forEach(project => {
                        // An on-going project is locked unless it opts in with `openable: true` (a case study page exists
                        // while the work continues): it then keeps the ON-GOING badge but opens like any other card.
                        const isClickable = !project.ongoing || !!project.openable;
                        const WrapperTag = isClickable ? 'a' : 'div';
                        const hrefAttr = isClickable ? `href="${project.link}"` : '';
                        const badgeHTML = project.ongoing ? `<div class="ongoing-badge">ON-GOING</div>` : '';
                        const ongoingClass = (project.ongoing && !project.openable) ? 'is-ongoing' : '';
                        const categoryBadgesHTML = (project.category || '').split('·').map(cat => `<div class="portfolio-card-category-badge">${cat.trim()}</div>`).join('');

                        // Multi-image cards (project.images): the main <img> below is frame 1, these are the
                        // rest, stacked on top and faded in turn by the cycle timer.
                        const cycleImages = project.images || [];
                        const cycleImagesHTML = cycleImages.slice(1).map(img => `
                                    <img src="${img.src}" alt="" loading="lazy" decoding="async" width="800" height="600"
                                         class="paralax-image portfolio-cycle-img" aria-hidden="true"
                                         style="object-position: ${img.position || 'center'};">`).join('');
                        const mainPosition = cycleImages.length ? (cycleImages[0].position || 'center') : (project.imagePosition || 'center');

                        const itemHTML = `
                            <div class="blog-main-wrapper ${ongoingClass}" ${cycleImages.length > 1 ? 'data-cycle="true"' : ''}>
                                <${WrapperTag} ${hrefAttr} class="image-wrap auto full-ratio w-inline-block" style="aspect-ratio: 4/3; background-color: #f5f5f7; display: block;">
                                    <div class="button-icon-main" style="z-index: 5; ${!isClickable ? 'display: none;' : ''}">
                                        <div class="buton-icon-svg w-embed">
                                            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                                        </div>
                                        <div class="buton-icon-svg is-absolute w-embed">
                                            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
                                        </div>
                                    </div>
                                    <div class="skeleton-loader"></div>
                                    <img src="${project.image}" 
                                         srcset="${project.srcset}" 
                                         sizes="(max-width: 767px) 100vw, (max-width: 991px) 95vw, 940px"
                                         alt="${project.title}" 
                                         loading="lazy" 
                                         decoding="async" 
                                         width="800"
                                         height="600"
                                         class="paralax-image main img-loading"
                                         style="width: 100%; height: 100%; object-fit: cover; object-position: ${mainPosition};"
                                         onload="this.classList.remove('img-loading'); this.classList.add('img-loaded'); this.previousElementSibling.style.opacity='0';">
                                    ${cycleImagesHTML}
                                    ${badgeHTML}
                                    <div class="portfolio-overlay">
                                        <p class="portfolio-description">${project.description}</p>
                                        ${(project.ongoing && !project.openable)
                                            ? `<div class="portfolio-cta is-ongoing-cta">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                On-going Project
                                               </div>` 
                                            : `<div class="portfolio-cta">
                                                View Project
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                               </div>`
                                        }
                                    </div>
                                </${WrapperTag}>
                                <div class="margin-15px right">
                                    <div class="portfolio-card-head">
                                        <${WrapperTag} ${hrefAttr} class="text-block-3 portfolio-title-link">${project.title}</${WrapperTag}>
                                        <div class="text-block-3 portfolio-card-year">${project.ongoing ? 'On-going' : project.year}</div>
                                    </div>
                                    <div class="portfolio-card-badges">
                                        ${categoryBadgesHTML}
                                    </div>
                                    <div class="client-info-accordion">
                                        <div class="client-accordion-trigger">
                                            <span>About ${project.clientName || "The Client"}</span>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                                        </div>
                                        <div class="client-accordion-content">
                                            <p>${project.brandInfo || "A forward-thinking brand I had the pleasure to collaborate with."}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        gridContainer.insertAdjacentHTML('beforeend', itemHTML);
                    });
                }

                // Re-init parallax for new items
                ScrollTrigger.refresh();
                initMagneticButtons(); // Initialize magnetic effect for buttons
            };

            // Reduced motion: swap content with no exit/entrance tween at all. Checked
            // here rather than per-branch so the 'fast' search path is covered too.
            if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                updateContent();
                return;
            }

            if (animationType === 'normal') {
                // Premium Exit Animation
                gsap.to(gridContainer.children, { 
                    opacity: 0,
                    y: -30,
                    scale: 0.95,
                    duration: 0.3, 
                    stagger: 0.03, 
                    ease: "power3.inOut",
                    onComplete: () => {
                        updateContent();
                        // Premium Entrance Animation (Clip-Path Reveal)
                        gsap.fromTo(gridContainer.children, 
                            { opacity: 0, y: 30, clipPath: "inset(100% 0 0 0)" },
                            { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)", duration: 0.7, stagger: 0.05, ease: "power2.out", clearProps: "transform,clipPath" }
                        );
                    }
                });
            } else if (animationType === 'fast') {
                // Micro-animation crossfade khusus untuk efek typing/search agar sangat snappy
                gsap.to(gridContainer.children, { 
                    opacity: 0, 
                    scale: 0.98, 
                    duration: 0.15, 
                    ease: "power2.inOut",
                    onComplete: () => {
                        updateContent();
                        gsap.fromTo(gridContainer.children, 
                            { opacity: 0, scale: 0.98 },
                            { opacity: 1, scale: 1, duration: 0.2, ease: "power2.out" }
                        );
                    }
                });
            } else {
                updateContent();
            }
        }

        // Initialize with default category
        renderProjects('normal');

        // Cross-fade cycle for multi-image cards. One shared timer walks every [data-cycle] card
        // (so re-rendering the grid never leaves stray intervals behind): frame 0 is the main
        // <img>, frames 1+ are the .portfolio-cycle-img layers, shown via .is-active.
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const CYCLE_MS = 3000;
            setInterval(() => {
                if (document.hidden) return;
                document.querySelectorAll('[data-cycle]').forEach(card => {
                    const rect = card.getBoundingClientRect();
                    if (rect.bottom < 0 || rect.top > window.innerHeight) return; // off-screen: don't advance
                    const layers = card.querySelectorAll('.portfolio-cycle-img');
                    if (!layers.length) return;
                    const current = Array.from(layers).findIndex(l => l.classList.contains('is-active')); // -1 = main image showing
                    layers.forEach(l => l.classList.remove('is-active'));
                    const next = current + 1; // wraps back to -1 (main image) after the last layer
                    if (next < layers.length) layers[next].classList.add('is-active');
                });
            }, CYCLE_MS);
        }

        // Debounce helper function
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Search Input Logic
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                currentSearch = e.target.value.trim();
                
                // Toggle Clear Button
                if (currentSearch.length > 0) {
                    searchContainer.classList.add('has-text');
                } else {
                    searchContainer.classList.remove('has-text');
                }
                
                renderProjects('fast'); // Micro-animation fade untuk search
            }, 250)); // Tunggu 250ms setelah user selesai mengetik
        }

        // Clear Button Logic
        const clearBtn = document.querySelector('.clear-icon');
        if (clearBtn && searchInput) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent search container click (expand) logic
                searchInput.value = '';
                currentSearch = '';
                searchContainer.classList.remove('has-text');
                renderProjects('fast');
                searchInput.focus();
            });
        }

        // Search Bar Expand Logic
        
        if (searchContainer && searchInput) {
            searchContainer.addEventListener('click', () => {
                searchContainer.classList.add('active');
                searchInput.focus();
            });

            searchInput.addEventListener('blur', () => {
                if (searchInput.value.trim() === '') {
                    searchContainer.classList.remove('active');
                }
            });
        }

        // Filter Dropdowns Logic (Industry & Role)
        const industryFilter = document.getElementById('filter-industry');
        const roleFilter = document.getElementById('filter-role');
        const yearFilter = document.getElementById('filter-year');

        if (industryFilter) {
            industryFilter.addEventListener('change', (e) => {
                currentIndustry = e.target.value;
                renderProjects('normal'); // Panggil render dengan animasi
            });
        }

        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                currentRole = e.target.value;
                renderProjects('normal'); // Panggil render dengan animasi
            });
        }

        if (yearFilter) {
            yearFilter.addEventListener('change', (e) => {
                currentYear = e.target.value;
                renderProjects('normal'); // Panggil render dengan animasi
            });
        }

        const sortFilter = document.getElementById('sort-projects');
        if (sortFilter) {
            sortFilter.addEventListener('change', (e) => {
                currentSort = e.target.value;
                renderProjects('normal'); // Panggil render dengan animasi
            });
        }

        // Reset Button Logic
        const resetBtn = document.getElementById('reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                // 1. Reset state (variabel JS)
                currentIndustry = 'all';
                currentRole = 'all';
                currentYear = 'all';
                currentSearch = '';
                currentSort = 'latest';

                // 2. Reset tampilan Dropdown HTML
                if (industryFilter) industryFilter.value = 'all';
                if (roleFilter) roleFilter.value = 'all';
                if (yearFilter) yearFilter.value = 'all';
                if (sortFilter) sortFilter.value = 'latest';

                // Sinkronisasi chip + badge jumlah pada dropdown Filter
                syncFilterUI();

                // 3. Reset tampilan Search Box HTML
                if (searchInput) searchInput.value = '';
                if (searchContainer) searchContainer.classList.remove('has-text', 'active');
                
                // 4. Render ulang grid dengan animasi
                renderProjects('normal');
            });
        }

        // Filter drawer: the "Filter" button shows/hides (accordion) the row of dropdowns. The original
        // <select>s stay in the DOM, hidden, as the source of truth for the change handlers and reset.
        let syncFilterUI = () => {};

        function initFilterDrawer() {
            const trigger = document.getElementById('filter-toggle');
            const drawer = document.getElementById('portfolio-filter-drawer');
            if (!trigger || !drawer) return;

            const selects = Array.from(document.querySelectorAll('.custom-select'));
            const countEl = trigger.querySelector('.filter-count');

            // --- Premium dropdowns (auto-converted from the <select>s) ---
            selects.forEach(select => {
                select.style.display = 'none';

                const wrapper = document.createElement('div');
                wrapper.className = 'premium-dropdown';

                const selected = document.createElement('div');
                selected.className = 'premium-dropdown-selected';
                selected.innerHTML = `<span>${select.options[select.selectedIndex].text}</span>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;

                const optionsBox = document.createElement('div');
                optionsBox.className = 'premium-dropdown-options';

                Array.from(select.options).forEach(option => {
                    const optEl = document.createElement('div');
                    optEl.className = 'premium-dropdown-option';
                    optEl.textContent = option.text;
                    optEl.dataset.value = option.value;
                    if (option.value === select.value) optEl.classList.add('selected');

                    optEl.addEventListener('click', () => {
                        select.value = option.value;
                        select.dispatchEvent(new Event('change')); // Triggers the portfolio filter
                        syncFilterUI();
                        wrapper.classList.remove('open');
                    });
                    optionsBox.appendChild(optEl);
                });

                wrapper.appendChild(selected);
                wrapper.appendChild(optionsBox);
                select.parentNode.insertBefore(wrapper, select.nextSibling);

                selected.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.premium-dropdown').forEach(d => {
                        if (d !== wrapper) d.classList.remove('open');
                    });
                    wrapper.classList.toggle('open');
                });
            });
            document.addEventListener('click', () => document.querySelectorAll('.premium-dropdown').forEach(d => d.classList.remove('open')));

            // Re-reads every <select> into its dropdown (label + selected option) and the Filter badge.
            // Also used by the Reset button after it has put the <select>s back to their defaults.
            syncFilterUI = () => {
                let activeCount = 0;
                selects.forEach(select => {
                    const wrapper = select.nextElementSibling;
                    if (wrapper && wrapper.classList.contains('premium-dropdown')) {
                        wrapper.querySelector('.premium-dropdown-selected span').textContent = select.options[select.selectedIndex].text;
                        wrapper.querySelectorAll('.premium-dropdown-option').forEach(opt => {
                            opt.classList.toggle('selected', opt.dataset.value === select.value);
                        });
                    }
                    // Sort is an ordering, not a filter, so it doesn't count toward the badge.
                    if (select.id !== 'sort-projects' && select.value !== 'all') activeCount++;
                });
                if (countEl) {
                    const changed = countEl.textContent !== String(activeCount);
                    countEl.textContent = activeCount;
                    countEl.hidden = activeCount === 0;
                    if (changed && activeCount > 0) {
                        countEl.classList.remove('pop');
                        void countEl.offsetWidth; // restart the animation
                        countEl.classList.add('pop');
                    }
                }
            };
            syncFilterUI();

            // --- Accordion show / hide ---
            const setOpen = (open) => {
                trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (open) {
                    drawer.classList.add('is-open');
                    // Let the height finish animating before the dropdown lists are allowed to overflow.
                    setTimeout(() => { if (drawer.classList.contains('is-open')) drawer.classList.add('is-settled'); }, 620);
                } else {
                    drawer.classList.remove('is-settled', 'is-open');
                    document.querySelectorAll('.premium-dropdown').forEach(d => d.classList.remove('open'));
                }
                setTimeout(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 480);
            };
            trigger.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'));
        }
        initFilterDrawer();

        // Grid / list view toggle (icon-only). Pure CSS switch via .is-list on the grid, so no re-render;
        // the choice is remembered per browser. In list view the image is not shown in the row: a preview
        // follows the cursor while a row is hovered (touch devices get a small thumbnail via CSS instead).
        (function initViewToggle() {
            const toggle = document.querySelector('.view-toggle');
            if (!toggle || !gridContainer) return;
            const buttons = toggle.querySelectorAll('.view-btn');
            const KEY = 'mdkg-portfolio-view';
            const canHover = window.matchMedia('(hover: hover)').matches;

            const preview = document.createElement('div');
            preview.className = 'list-preview';
            preview.setAttribute('aria-hidden', 'true');
            // Two stacked layers so a multi-frame card (project.images) can cross-fade while its row is hovered.
            const previewLayers = [document.createElement('img'), document.createElement('img')];
            previewLayers.forEach(l => { l.alt = ''; preview.appendChild(l); });
            document.body.appendChild(preview);

            const PREVIEW_CYCLE_MS = 1500; // faster than the grid card's 3s: a hover is brief
            let cycleTimer = null;
            let activeLayer = 0;
            const stopCycle = () => { clearInterval(cycleTimer); cycleTimer = null; };
            const showFrame = (frame, instant) => {
                const next = instant ? 0 : activeLayer ^ 1;
                const layer = previewLayers[next];
                layer.src = frame.src;
                layer.style.objectPosition = frame.position || 'center';
                if (instant) previewLayers[1].classList.remove('is-on');
                else previewLayers[activeLayer].classList.remove('is-on');
                layer.classList.add('is-on');
                activeLayer = next;
            };
            // Frame 0 is the card's main <img>; frames 1+ are its .portfolio-cycle-img layers (same order as project.images).
            const rowFrames = (row) => {
                const main = row.querySelector('img.paralax-image:not(.portfolio-cycle-img)');
                if (!main) return [];
                const frames = [{ src: main.currentSrc || main.src, position: main.style.objectPosition }];
                row.querySelectorAll('.portfolio-cycle-img').forEach(i => frames.push({ src: i.currentSrc || i.src, position: i.style.objectPosition }));
                return frames;
            };

            let hoveredRow = null;
            let targetX = 0, targetY = 0, curX = 0, curY = 0, rafId = null;

            const place = () => {
                const w = preview.offsetWidth, h = preview.offsetHeight;
                // Sits to the right of the cursor, flipping left near the viewport edge, and stays on screen vertically.
                const x = (targetX + 28 + w > window.innerWidth - 12) ? targetX - 28 - w : targetX + 28;
                const y = Math.min(Math.max(targetY - h / 2, 12), window.innerHeight - h - 12);
                return { x, y };
            };
            const tick = () => {
                const { x, y } = place();
                curX += (x - curX) * 0.18;
                curY += (y - curY) * 0.18;
                preview.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
                rafId = hoveredRow ? requestAnimationFrame(tick) : null;
            };
            const hidePreview = () => {
                hoveredRow = null;
                stopCycle();
                preview.classList.remove('is-visible');
            };

            gridContainer.addEventListener('mouseover', (e) => {
                if (!canHover || !gridContainer.classList.contains('is-list')) return;
                const row = e.target.closest('.blog-main-wrapper');
                if (!row || row === hoveredRow) return;
                const frames = rowFrames(row);
                if (!frames.length) return;
                hoveredRow = row;
                stopCycle();
                showFrame(frames[0], true);
                if (frames.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    let i = 0;
                    cycleTimer = setInterval(() => { i = (i + 1) % frames.length; showFrame(frames[i], false); }, PREVIEW_CYCLE_MS);
                }
                // First frame snaps to the cursor so the preview doesn't fly in from the previous row.
                if (!preview.classList.contains('is-visible')) {
                    const { x, y } = place();
                    curX = x; curY = y;
                }
                preview.classList.add('is-visible');
                if (!rafId) rafId = requestAnimationFrame(tick);
            });
            gridContainer.addEventListener('mousemove', (e) => { targetX = e.clientX; targetY = e.clientY; });
            gridContainer.addEventListener('mouseleave', hidePreview);
            window.addEventListener('scroll', () => { if (hoveredRow && !hoveredRow.matches(':hover')) hidePreview(); }, { passive: true });

            const applyView = (view) => {
                gridContainer.classList.toggle('is-list', view === 'list');
                if (view !== 'list') hidePreview();
                buttons.forEach(btn => {
                    const on = btn.dataset.view === view;
                    btn.classList.toggle('selected', on);
                    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
            };

            let saved = 'grid';
            try { saved = localStorage.getItem(KEY) === 'list' ? 'list' : 'grid'; } catch (e) {}
            applyView(saved);

            // Grid and list are different layouts, so the cards can't be tweened between them. Instead the
            // current items fade out, the class flips while nothing is visible, and the new layout staggers in.
            let currentView = saved;
            let switchToken = 0;
            const switchView = (view) => {
                if (view === currentView) return;
                currentView = view;
                try { localStorage.setItem(KEY, view); } catch (e) {}
                hidePreview();

                const finish = () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); };
                const items = Array.from(gridContainer.children);
                const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                if (reduceMotion || typeof gsap === 'undefined' || items.length === 0) {
                    applyView(view);
                    finish();
                    return;
                }

                const token = ++switchToken;
                // Buttons respond immediately; only the grid content waits for the exit tween.
                buttons.forEach(btn => {
                    const on = btn.dataset.view === view;
                    btn.classList.toggle('selected', on);
                    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
                gsap.killTweensOf(items);
                // The cards' own CSS transform transition (hover lift) would lag behind the tween, so pause it.
                items.forEach(el => { el.style.transition = 'none'; });
                gsap.to(items, {
                    opacity: 0,
                    y: -12,
                    duration: 0.22,
                    stagger: 0.015,
                    ease: 'power2.in',
                    onComplete: () => {
                        if (token !== switchToken) return;
                        applyView(view);
                        const next = Array.from(gridContainer.children);
                        next.forEach(el => { el.style.transition = 'none'; });
                        gsap.fromTo(next,
                            { opacity: 0, y: view === 'list' ? 14 : 28 },
                            {
                                opacity: 1,
                                y: 0,
                                duration: 0.55,
                                stagger: view === 'list' ? 0.03 : 0.05,
                                ease: 'power3.out',
                                clearProps: 'opacity,transform',
                                onComplete: () => {
                                    next.forEach(el => { el.style.transition = ''; });
                                    finish();
                                }
                            }
                        );
                    }
                });
            };

            buttons.forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
        })();
    };
    
    // Run initialization
    initPortfolioAnimations();
});
