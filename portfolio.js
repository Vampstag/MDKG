document.addEventListener("DOMContentLoaded", (event) => {
    // Wait for GSAP to be loaded
    const initPortfolioAnimations = () => {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            setTimeout(initPortfolioAnimations, 100);
            return;
        }
        
        gsap.registerPlugin(ScrollTrigger);

        // 1. Hero & UI Entry Animations
        // Fade in the headline
        gsap.to('.home-hero-headline-wrapper.page-portfolio', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.2
        });


        // 2. Portfolio Filter System (Dynamic & Optimized)
        const projectsData = [
            {
                id: 8,
                title: "Torch — Prestachill",
                year: "2026",
                category: "Video Production · Video Editing", 
                industry: "Fashion",
                roles: ["Short-Form Video", "Launch Package"], 
                link: "#", 
                clientName: "Torch",
                description: "Organic short-form video for Torch's PrestaChill campaign, content built to feel real, not like an ad.", 
                brandInfo: "Leading Indonesian outdoor and travel gear brand, focusing on innovative and practical solutions for modern travelers.",
                image: "../assets/images/project/torch-prestachill/torch-prestachill-model.webp", 
                srcset: "",
                ongoing: true
            },
            {
                id: 6,
                title: "Studio Berka",
                year: "2026",
                category: "Web Design · UX Strategy",
                industry: "Architecture",
                roles: ["Web Solutions & Support", "Brand & Visual Design"],
                link: "#",
                clientName: "Studio Berka",
                description: "Art direction and web design for an architecture studio, built to earn trust and make pricing feel transparent.",
                brandInfo: "Studio Berka is an architecture and interior design studio based in Bandung, handling everything from planning and construction to custom furniture.",
                image: "../assets/images/project/berka/cover-web-berka.webp",
                srcset: "",
                ongoing: true
            },
            {
                id: 7, // Pastikan ID unik
                title: "Torch × Gundam",
                year: "2026",
                category: "Video Production · Video Editing",
                industry: "Fashion", // [NEW] Properti Industri
                roles: ["Brand Film", "Launch Package"], // [NEW] Properti Layanan/Role (bisa lebih dari satu)
                link: "/portfolio/torch-x-gundam", // Ganti dengan link detail proyek jika ada
                clientName: "Torch",
                description: "Cinematic video production and visual execution for Torch's biggest IP collaboration, driving over 1.8M organic views.", // Ganti dengan deskripsi proyek
                brandInfo: "Leading Indonesian outdoor and travel gear brand, focusing on innovative and practical solutions for modern travelers.",
                image: "../assets/images/project/torch/torch-model-backpack.webp", // Ganti dengan URL gambar Anda
                srcset: "" // Kosongkan jika tidak ada srcset
            },
            {
                id: 5,
                title: "Tsukamie Noodle Bar",
                year: "2025",
                category: "Social Media · Digital Marketing",
                industry: "F&B",
                roles: ["Monthly Retainer", "Short-Form Video"],
                link: "/portfolio/tsukamie",
                clientName: "Tsukamie",
                description: "Social media content and digital marketing that grew an F&B brand's reach by +10,896%.",
                brandInfo: "Established in 2022, Tsukamie is a Halal-certified Asian fusion noodle bar in Bandung that positions itself as a lifestyle ecosystem rather than just an F&B brand.",
                image: "../assets/images/project/tsukamie/tsukamie1.webp",
                srcset: ""
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
        if (gridContainer) {
            gridContainer.addEventListener('click', (e) => {
                const trigger = e.target.closest('.client-accordion-trigger');
                if (trigger) {
                    e.preventDefault();
                    const content = trigger.nextElementSibling;
                    const isOpen = trigger.classList.contains('is-open');
                    
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
        
        let currentSearch = '';
        let currentIndustry = 'all'; // [NEW] State default filter industri
        let currentRole = 'all'; // [NEW] State default filter role
        let currentYear = 'all'; // State default filter tahun

        function renderProjects(animationType = 'normal') {
            // Filter data
            const filteredData = projectsData.filter(item => {
                // Pencocokan Search
                const searchMatch = item.title.toLowerCase().includes(currentSearch.toLowerCase());
                
                // Logika pencocokan filter dropdown
                const industryMatch = currentIndustry === 'all' || (item.industry && item.industry === currentIndustry);
                const roleMatch = currentRole === 'all' || (item.roles && item.roles.includes(currentRole));
                const yearMatch = currentYear === 'all' || (item.year && item.year === currentYear);
                
                return searchMatch && industryMatch && roleMatch && yearMatch;
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
                        const isClickable = !project.ongoing;
                        const WrapperTag = isClickable ? 'a' : 'div';
                        const hrefAttr = isClickable ? `href="${project.link}"` : '';
                        const badgeHTML = project.ongoing ? `<div class="ongoing-badge">ON-GOING</div>` : '';
                        const ongoingClass = project.ongoing ? 'is-ongoing' : '';
                        const categoryBadgesHTML = (project.category || '').split('·').map(cat => `<div class="portfolio-card-category-badge">${cat.trim()}</div>`).join('');

                        const itemHTML = `
                            <div class="blog-main-wrapper ${ongoingClass}">
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
                                         style="width: 100%; height: 100%; object-fit: cover;"
                                         onload="this.classList.remove('img-loading'); this.classList.add('img-loaded'); this.previousElementSibling.style.opacity='0';">
                                    ${badgeHTML}
                                    <div class="portfolio-overlay">
                                        <p class="portfolio-description">${project.description}</p>
                                        ${project.ongoing 
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
                                <div class="margin-15px right" style="flex-direction: column; align-items: stretch; gap: 10px;">
                                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                        ${categoryBadgesHTML}
                                    </div>
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                                        <${WrapperTag} ${hrefAttr} class="text-block-3 portfolio-title-link" style="font-size: clamp(1.35rem, 4vw, 1.75rem); letter-spacing: -0.03em;">${project.title}</${WrapperTag}>
                                        <div class="text-block-3" style="pointer-events: none; margin-top: 6px; flex-shrink: 0; font-size: 1rem;">${project.ongoing ? 'On-going' : project.year}</div>
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
                initCardHover(); // Initialize hover effect for new items
                initMagneticButtons(); // Initialize magnetic effect for buttons
            };

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
                            { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)", duration: 0.6, stagger: 0.05, ease: "power2.out", clearProps: "transform,clipPath" }
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

        // Reset Button Logic
        const resetBtn = document.getElementById('reset-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                // 1. Reset state (variabel JS)
                currentIndustry = 'all';
                currentRole = 'all';
                currentYear = 'all';
                currentSearch = '';
                
                // 2. Reset tampilan Dropdown HTML
                if (industryFilter) industryFilter.value = 'all';
                if (roleFilter) roleFilter.value = 'all';
                if (yearFilter) yearFilter.value = 'all';
                
                // [NEW] Sinkronisasi Reset pada UI Premium Dropdown
                document.querySelectorAll('.premium-dropdown').forEach(wrapper => {
                    const select = wrapper.previousElementSibling;
                    if(select) {
                        const text = select.options[select.selectedIndex].text;
                        wrapper.querySelector('span').textContent = text;
                        wrapper.querySelectorAll('.premium-dropdown-option').forEach(opt => {
                            if (opt.dataset.value === 'all') {
                                opt.classList.add('selected');
                            } else {
                                opt.classList.remove('selected');
                            }
                        });
                    }
                });

                // 3. Reset tampilan Search Box HTML
                if (searchInput) searchInput.value = '';
                if (searchContainer) searchContainer.classList.remove('has-text', 'active');
                
                // 4. Render ulang grid dengan animasi
                renderProjects('normal');
            });
        }

        // [NEW] Premium Dropdown Engine (Auto-convert HTML Select)
        function initPremiumDropdowns() {
            const selects = document.querySelectorAll('.custom-select');
            
            selects.forEach(select => {
                // 1. Sembunyikan elemen bawaan OS
                select.style.display = 'none';
                
                // 2. Buat pembungkus Premium
                const wrapper = document.createElement('div');
                wrapper.className = 'premium-dropdown';
                
                // 3. Buat UI Tombol Terpilih
                const selected = document.createElement('div');
                selected.className = 'premium-dropdown-selected';
                selected.innerHTML = `<span>${select.options[select.selectedIndex].text}</span>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
                
                // 4. Buat List Opsi
                const optionsBox = document.createElement('div');
                optionsBox.className = 'premium-dropdown-options';
                
                Array.from(select.options).forEach(option => {
                    const optEl = document.createElement('div');
                    optEl.className = 'premium-dropdown-option';
                    optEl.textContent = option.text;
                    optEl.dataset.value = option.value;
                    
                    if (option.value === select.value) optEl.classList.add('selected');
                    
                    optEl.addEventListener('click', () => {
                        // Update elemen HTML aslinya
                        select.value = option.value;
                        select.dispatchEvent(new Event('change')); // Trigger fungsi filter portofolio
                        
                        // Update Tampilan UI
                        selected.querySelector('span').textContent = option.text;
                        optionsBox.querySelectorAll('.premium-dropdown-option').forEach(el => el.classList.remove('selected'));
                        optEl.classList.add('selected');
                        
                        wrapper.classList.remove('open'); // Tutup menu
                    });
                    
                    optionsBox.appendChild(optEl);
                });
                
                wrapper.appendChild(selected);
                wrapper.appendChild(optionsBox);
                
                // Sisipkan ke dalam halaman
                select.parentNode.insertBefore(wrapper, select.nextSibling);
                
                // Logika Buka/Tutup
                selected.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.premium-dropdown').forEach(d => {
                        if (d !== wrapper) d.classList.remove('open');
                    });
                    wrapper.classList.toggle('open');
                });
            });
            
            // Tutup dropdown jika area luar layar diklik
            document.addEventListener('click', () => document.querySelectorAll('.premium-dropdown').forEach(d => d.classList.remove('open')));
        }
        initPremiumDropdowns();
    };
    
    // Run initialization
    initPortfolioAnimations();
});
