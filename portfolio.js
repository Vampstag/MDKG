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
                id: 7, // Pastikan ID unik
                title: "Torch x Gundam",
                year: "2026",
                category: "Commercials", // Pilih antara 'Digital Content', 'Commercials', atau '3D & Visuals'
                industry: "Fashion", // [NEW] Properti Industri
                roles: ["Video Production"], // [NEW] Properti Layanan/Role (bisa lebih dari satu)
                link: "/portfolio/torch", // Ganti dengan link detail proyek jika ada
                description: "Cinematic product launch for Torch's biggest IP collaboration.", // Ganti dengan deskripsi proyek
                brandInfo: "Leading Indonesian outdoor and travel gear brand, focusing on innovative and practical solutions for modern travelers.",
                image: "../assets/images/project/torch/torch-model-backpack.webp", // Ganti dengan URL gambar Anda
                srcset: "" // Kosongkan jika tidak ada srcset
            },
            {
                id: 6,
                title: "Studio Berka",
                year: "2025",
                category: "Web Design",
                industry: "Agency",
                roles: ["Web Solutions & Support", "Brand & Visual Design"],
                link: "/portfolio/studi-berka",
                description: "Custom UI/UX and web development powered by GSAP for a high-performance digital presence.",
                brandInfo: "Forward-thinking creative agency specializing in innovative design and brand strategy.",
                image: "../assets/images/project/studi-berka/hero-bg.webp",
                srcset: ""
            },
            {
                id: 5,
                title: "Tsukamie Noodle Bar",
                year: "2025",
                category: "Creative Content Support",
                industry: "F&B",
                roles: ["Creative Content Support"],
                link: "/portfolio/tsukamie",
                description: "Revitalizing a stagnant F&B digital presence by shifting from hard-selling content toward a more community-driven storytelling approach.",
                brandInfo: "Authentic Japanese noodle bar delivering premium taste wrapped in a modern dining experience.",
                image: "https://cdn.prod.website-files.com/6933c25a0996b0f96f5c2bc3/6933c31afde10e239b6d5532_148abd4d73a501a39005296e17b15db5_image.jpg",
                srcset: "https://cdn.prod.website-files.com/6933c25a0996b0f96f5c2bc3/6933c31afde10e239b6d5532_148abd4d73a501a39005296e17b15db5_image-p-500.jpg 500w, https://cdn.prod.website-files.com/6933c25a0996b0f96f5c2bc3/6933c31afde10e239b6d5532_148abd4d73a501a39005296e17b15db5_image-p-800.jpg 800w, https://cdn.prod.website-files.com/6933c25a0996b0f96f5c2bc3/6933c31afde10e239b6d5532_148abd4d73a501a39005296e17b15db5_image-p-1080.jpg 1080w, https://cdn.prod.website-files.com/6933c25a0996b0f96f5c2bc3/6933c31afde10e239b6d5532_148abd4d73a501a39005296e17b15db5_image.jpg 1200w"
            },
            
        ];

        const gridContainer = document.getElementById('portfolio-grid');
        const searchInput = document.getElementById('portfolio-search');
        const searchContainer = document.querySelector('.portfolio-search-container');
        
        // --- NEW: Event Delegation for Client Accordion ---
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
                        const itemHTML = `
                            <div class="blog-main-wrapper">
                                <a href="${project.link}" class="image-wrap auto full-ratio w-inline-block" style="aspect-ratio: 4/3; background-color: #f5f5f7; display: block;">
                                    <div class="button-icon-main" style="z-index: 5;">
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
                                    <div class="portfolio-overlay">
                                        <p class="portfolio-description">${project.description}</p>
                                        <div class="portfolio-cta">
                                            View Project
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                        </div>
                                    </div>
                                </a>
                                <div class="margin-15px right" style="flex-direction: column; align-items: stretch; gap: 4px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                                        <a href="${project.link}" class="text-block-3 portfolio-title-link">${project.title}</a>
                                        <div class="text-block-3" style="pointer-events: none;">${project.year}</div>
                                    </div>
                                    <div class="client-info-accordion">
                                        <div class="client-accordion-trigger">
                                            <span>About The Client</span>
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
