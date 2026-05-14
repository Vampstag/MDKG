//#region CONFIGURATION
/**
 * MDKG Widget Configuration
 * KONFIGURASI WIDGET
 * Edit bagian ini untuk mengubah isi widget dengan mudah.
 */
const widgetConfig = {
    containerId: 'mdkg-widget-container', // Jangan ubah ID ini kecuali HTML berubah
    locationText: 'BANDUNG, ID',          // Teks lokasi yang muncul
    bookingLink: 'https://calendar.app.google/q8vcfvD79osZvTKa8', // Link tombol booking
    initialVolume: 0.4,                   // Volume awal (0.0 sampai 1.0)
    
    // CACHE BUSTER: Ubah angka ini (misal ke '1.1') setiap kali kamu mengganti file mp3 agar browser otomatis memuat lagu baru.
    audioVersion: '1.0',
    
    // DAFTAR LAGU (PLAYLIST)
    // Tambahkan lagu baru dengan format: { src: 'file.mp3', title: 'Judul', artist: 'Band', cover: 'gambar.jpg' },
    playlist: [
        { src: 'audio/bgmusic.mp3', title: 'Smells Like Teen Spirit', artist: 'Nirvana', cover: 'assets/images/cover-nirvana.webp' },
        { src: 'audio/bgmusic2.mp3', title: 'Come As You Are', artist: 'Nirvana', cover: 'assets/images/cover-nirvana.webp' },
        { src: 'audio/bgmusic3.mp3', title: 'Something In The Way', artist: 'Nirvana', cover: 'assets/images/cover-nirvana.webp' },
        // Lagu baru yang ke-4 ditambahkan di bawah ini (Ganti gambar dan teksnya sesuai kebutuhan)
        { src: 'audio/bgmusic4.mp3', title: 'Lithium', artist: 'Nirvana', cover: 'assets/images/cover-nirvana.webp' }
    ]
};
//#endregion

//#region WIDGET CLASS
/**
 * MDKG Widget System
 * Handles Live Status and Music Player injection and logic.
 */
class MdkgWidget {
    constructor(options = {}) {
        // -- Options Setup --
        this.containerId = options.containerId || 'mdkg-widget-container';
        this.locationText = options.locationText || 'BANDUNG, ID';
        this.bookingLink = options.bookingLink || 'https://calendar.app.google/q8vcfvD79osZvTKa8';
        
        // Volume Setup (Load from localStorage or use default)
        const savedVolume = localStorage.getItem('mdkg_volume');
        this.currentVolume = savedVolume !== null ? parseFloat(savedVolume) : (options.initialVolume !== undefined ? options.initialVolume : 0.4);
        
        // Playlist Setup
        const rawPlaylist = options.playlist || [{ src: 'audio/bgmusic.mp3' }];
        
        // [FIX] Otomatis perbaiki path audio jika dibuka dari dalam folder case-study
        const isSubPage = window.location.pathname.includes('/case-study/') || window.location.pathname.includes('/study-case/') || window.location.pathname.includes('/journal/') || window.location.pathname.includes('/portfolio/');
        const pathPrefix = isSubPage ? '../' : '';
        
        this.playlist = rawPlaylist.map(track => {
            let src = track.src;
            if (src.startsWith('/')) src = src.substring(1); // Hapus leading slash (mencegah error di GitHub Pages)
            
            let cover = track.cover || '';
            if (cover.startsWith('/')) cover = cover.substring(1);
            
            // [NEW] Tambahkan Cache Buster Parameter
            let finalSrc = src.startsWith('http') ? src : pathPrefix + src;
            finalSrc += `?v=${options.audioVersion || '1.0'}`;
            
            return { 
                src: finalSrc,
                title: track.title || 'Unknown Track',
                artist: track.artist || 'Unknown Artist',
                cover: cover ? (cover.startsWith('http') ? cover : pathPrefix + cover) : ''
            };
        });
        
        // Load last played index from localStorage
        const savedIndex = localStorage.getItem('mdkg_last_track_index');
        this.currentTrackIndex = savedIndex ? parseInt(savedIndex) : 0;
        
        // Validate index in case playlist changed
        if (this.currentTrackIndex >= this.playlist.length) this.currentTrackIndex = 0;
        
        // OPTIMIZATION: Tunda inisialisasi widget agar tidak memblokir animasi utama (Hero/Preloader)
        const runInit = () => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => this.init(), { timeout: 2000 });
            } else {
                setTimeout(() => this.init(), 1000); // Fallback delay 1 detik
            }
        };

        // Menunggu semua resource halaman utama (gambar, font) selesai dimuat terlebih dahulu
        if (document.readyState === 'complete') {
            runInit();
        } else {
            window.addEventListener('load', runInit);
        }
    }

    // --- Core Initialization ---
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return; // Container not found, do nothing

        this.render(container);
        this.initClock();
        this.initTyping();
        this.initMusicPlayer();
        this.initScrollBehavior();
        this.initMagneticButton();
    }

    // --- Ekstraksi Warna Dominan Gambar ---
    getAverageRGB(imgEl) {
        const blockSize = 5; // Hanya cek setiap 5 pixel agar ringan di performa
        const defaultRGB = { r: 255, g: 255, b: 255 }; // Default fallback (Putih)
        const canvas = document.createElement('canvas');
        const context = canvas.getContext && canvas.getContext('2d');
        let data, width, height;
        let i = -4, count = 0;
        let rgb = { r: 0, g: 0, b: 0 };

        if (!context) return defaultRGB;

        height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || 100;
        width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || 100;

        try {
            context.drawImage(imgEl, 0, 0);
            data = context.getImageData(0, 0, width, height);
        } catch(e) {
            // Fallback aman jika terkena blokir keamanan browser (CORS)
            return defaultRGB;
        }

        const length = data.data.length;
        while ((i += blockSize * 4) < length) {
            ++count;
            rgb.r += data.data[i];
            rgb.g += data.data[i+1];
            rgb.b += data.data[i+2];
        }

        rgb.r = Math.floor(rgb.r / count);
        rgb.g = Math.floor(rgb.g / count);
        rgb.b = Math.floor(rgb.b / count);
        return rgb;
    }

    // --- Render HTML ---
    render(container) {
        const currentTrack = this.playlist[this.currentTrackIndex];
        
        container.innerHTML = `
            <!-- Live Status Widget -->
            <a href="${this.bookingLink}" target="_blank" class="mdkg-widget-status hover-trigger">
                <div class="mdkg-widget-header">
                    <span class="mdkg-widget-location">${this.locationText}</span>
                    <span class="mdkg-widget-clock">00:00:00</span>
                </div>
                <div class="mdkg-widget-status-row">
                    <span class="mdkg-status-dot"></span>
                    <span class="mdkg-status-text">Open for 2 Selected Projects</span>
                </div>
                <div class="mdkg-book-btn">
                    <!-- Calendar Icon -->
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <span>Book a Call</span>
                   </div>
            </a>

            <!-- Music Player Widget -->
            <div class="mdkg-widget-player hover-trigger">
                <!-- [OPTIMIZATION] preload="none" memastikan file 3-5MB TIDAK di-load sampai user memutar lagunya (Anti-Lag) -->
                <audio class="mdkg-bg-music" preload="none"></audio>
                
                <!-- [NEW] Cover Image -->
                <div class="mdkg-player-cover">
                    <img src="" alt="Cover" class="mdkg-track-cover">
                </div>
                
                <div class="mdkg-player-icon">
                    <!-- Muted Icon -->
                    <svg class="mdkg-icon-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M23 9L17 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M17 9L23 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <!-- Playing Icon -->
                    <svg class="mdkg-icon-playing" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: none;">
                        <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M19.07 4.93C20.9447 6.80527 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <div class="mdkg-player-content">
                    <span class="mdkg-player-text">PLAY</span>
                    <!-- [NEW] Track Info (Judul & Band) -->
                    <div class="mdkg-track-info">
                        <span class="mdkg-track-title">Title</span>
                        <span class="mdkg-track-artist">Artist</span>
                    </div>
                    <div class="mdkg-visualizer">
                        <div class="mdkg-bar"></div>
                        <div class="mdkg-bar"></div>
                        <div class="mdkg-bar"></div>
                    </div>
                </div>
                <!-- Next Track Button -->
                <div class="mdkg-next-btn" title="Next Track">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 4 15 12 5 20 5 4"></polygon>
                        <line x1="19" y1="5" x2="19" y2="19"></line>
                    </svg>
                </div>
            </div>
        `;
    }

    // --- Feature: Digital Clock ---
    initClock() {
        const clockElement = document.querySelector('.mdkg-widget-clock');
        if (clockElement) {
            const updateTime = () => {
                const now = new Date();
                const options = { timeZone: 'Asia/Jakarta', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' };
                clockElement.textContent = new Intl.DateTimeFormat('en-GB', options).format(now);
            };
            updateTime();
            setInterval(updateTime, 1000);
        }
    }

    // --- Feature: Typing Effect ---
    initTyping() {
        const statusText = document.querySelector('.mdkg-status-text');
        if (!statusText) return;

        const text = statusText.textContent;
        let index = 0;
        let isDeleting = false;
        
        const type = () => {
            const currentText = text.substring(0, index);
            statusText.textContent = currentText;

            let speed = 100;

            if (isDeleting) {
                speed = 50;
                index--;
            } else {
                index++;
            }

            if (!isDeleting && index === text.length + 1) {
                isDeleting = true;
                speed = 3000;
            } else if (isDeleting && index === 0) {
                isDeleting = false;
                speed = 500;
            }

            setTimeout(type, speed);
        };
        type();
    }

    // --- Feature: Music Player ---
    initMusicPlayer() {
        const player = document.querySelector('.mdkg-widget-player');
        const audio = player ? player.querySelector('.mdkg-bg-music') : null;
        const text = player ? player.querySelector('.mdkg-player-text') : null;
        const iconMuted = player ? player.querySelector('.mdkg-icon-muted') : null;
        const iconPlaying = player ? player.querySelector('.mdkg-icon-playing') : null;
        const nextBtn = player ? player.querySelector('.mdkg-next-btn') : null;
        
        // [NEW] Element Identifiers untuk Cover & Info
        const coverContainer = player ? player.querySelector('.mdkg-player-cover') : null;
        const coverImg = player ? player.querySelector('.mdkg-track-cover') : null;
        const trackInfo = player ? player.querySelector('.mdkg-track-info') : null;
        const trackTitle = player ? player.querySelector('.mdkg-track-title') : null;
        const trackArtist = player ? player.querySelector('.mdkg-track-artist') : null;

        if (player && audio) {
            audio.volume = this.currentVolume;
            
            // Set src tanpa auto-load
            audio.src = this.playlist[this.currentTrackIndex].src;
            
            // Save volume to localStorage whenever it changes
            audio.addEventListener('volumechange', () => {
                localStorage.setItem('mdkg_volume', audio.volume);
            });
            
            const updateTrackMetadata = () => {
                const track = this.playlist[this.currentTrackIndex];
                if (trackTitle) trackTitle.innerText = track.title;
                if (trackArtist) trackArtist.innerText = track.artist;
                if (coverImg && track.cover) {
                    coverImg.crossOrigin = "Anonymous"; // Mencegah error keamanan canvas
                    
                    coverImg.onload = () => {
                        const rgb = this.getAverageRGB(coverImg);
                        // Kalkulasi kecerahan warna (Luminance formula)
                        const brightness = Math.round(((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000);
                        const isDark = brightness < 125; // Jika warna gelap, teks akan diputihkan
                        
                        // Inject CSS Variables langsung ke elemen Widget
                        player.style.setProperty('--w-bg', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.85)`);
                        player.style.setProperty('--w-text', isDark ? '#ffffff' : '#111111');
                        player.style.setProperty('--w-sub', isDark ? 'rgba(255, 255, 255, 0.7)' : '#666666');
                    };
                    coverImg.src = track.cover;
                    if (coverImg.complete) coverImg.onload(); // Panggil manual jika gambar dari cache
                }
            };
            
            // Load UI awal
            updateTrackMetadata();
            
            const updateUI = (isPlaying) => {
                const track = this.playlist[this.currentTrackIndex];
                
                if (isPlaying) {
                    player.classList.add('playing');
                    if (iconMuted) iconMuted.style.display = 'none';
                    if (iconPlaying) iconPlaying.style.display = 'block';
                } else {
                    player.classList.remove('playing');
                    if (text) { text.innerText = "PAUSED"; }
                    if (iconMuted) iconMuted.style.display = 'block';
                    if (iconPlaying) iconPlaying.style.display = 'none';
                }
            };

            // Play/Pause Toggle
            player.addEventListener('click', (e) => {
                if (e.target.closest('.mdkg-next-btn')) return; // Ignore next button clicks

                if (audio.paused) {
                    audio.preload = "auto"; // Mulai download *hanya* jika user memutar
                    audio.play().then(() => updateUI(true)).catch(e => console.error("Playback failed:", e));
                } else {
                    audio.pause();
                    updateUI(false);
                }
            });

            // Next Track Logic
            const playNext = () => {
                // Fitur Loop: Jika cuma 1 lagu, tombol Next akan me-replay lagu dari awal
                if (this.playlist.length === 1) {
                    audio.currentTime = 0;
                    audio.play().then(() => updateUI(true)).catch(e => console.error("Replay failed:", e));
                    return;
                }
                
                this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                localStorage.setItem('mdkg_last_track_index', this.currentTrackIndex); // Save to localStorage
                
                updateTrackMetadata(); // Update Teks & Gambar di UI dulu
                
                audio.src = this.playlist[this.currentTrackIndex].src;
                audio.preload = "auto"; // User sudah klik interaksi next, aman untuk diload
                audio.load(); // [FIX] Wajib dipanggil untuk Safari iOS agar src baru dikenali
                audio.play().then(() => updateUI(true)).catch(e => console.error("Next track failed:", e));
            };

            if (nextBtn) nextBtn.addEventListener('click', playNext);
            
            // Fitur Auto Loop jika 1 Lagu (Gunakan 'loop' native agar transisinya super mulus)
            if (this.playlist.length === 1) {
                audio.loop = true;
            } else {
                audio.addEventListener('ended', playNext); // Auto-advance ke lagu selanjutnya
            }
        }
    }

    // --- Feature: Scroll Hiding ---
    initScrollBehavior() {
        let lastScrollTop = 0;
        const statusWidget = document.querySelector('.mdkg-widget-status');
        const playerWidget = document.querySelector('.mdkg-widget-player');
        
        if (statusWidget || playerWidget) {
            window.addEventListener('scroll', () => {
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                if (scrollTop > lastScrollTop && scrollTop > 50) {
                    if (statusWidget) statusWidget.classList.add('widget-hidden');
                    if (playerWidget) playerWidget.classList.add('widget-hidden');
                } else {
                    if (statusWidget) statusWidget.classList.remove('widget-hidden');
                    if (playerWidget) playerWidget.classList.remove('widget-hidden');
                }
                lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
            });
        }
    }

    // --- Feature: Magnetic Button ---
    initMagneticButton() {
        const btn = document.querySelector('.mdkg-book-btn');
        // Hanya inisialisasi jika tombol ada dan GSAP sudah dimuat di website
        if (!btn || typeof gsap === 'undefined') return;

        // 1. Buat elemen cursor khusus
        let cursor = document.querySelector('.mdkg-snap-cursor');
        if (!cursor) {
            cursor = document.createElement('div');
            cursor.className = 'mdkg-snap-cursor';
            document.body.appendChild(cursor);
        }

        // Centering mutlak via GSAP
        gsap.set(cursor, { xPercent: -50, yPercent: -50 });

        let isSnapped = false;

        // 2. Track pergerakan mouse global
        window.addEventListener('mousemove', (e) => {
            if (!isSnapped) {
                // Update koordinat tanpa animasi agar siap saat mouse enter
                gsap.set(cursor, { x: e.clientX, y: e.clientY });
            }
        });

        // 3. Efek saat mouse masuk ke tombol
        btn.addEventListener('mouseenter', (e) => {
            isSnapped = true;
            const rect = btn.getBoundingClientRect();
            
            // Cursor membesar menjadi bungkus pil (pill shape) dan snap ke tombol
            gsap.to(cursor, {
                opacity: 1,
                width: rect.width + 16, // Lebar tombol + padding luar
                height: rect.height + 16,
                borderRadius: "16px",
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                duration: 0.4,
                ease: "power3.out"
            });
        });

        // 4. Efek magnetik & snapping bergerak
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            
            // Logika Magnetik Tombol
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });

            // Cursor selalu menempel persis di tengah tombol yang ikut bergeser
            gsap.to(cursor, {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                duration: 0.1, // Dibuat cepat agar terasa menempel kuat
                ease: "power2.out"
            });
        });
        
        // 5. Efek saat mouse keluar dari tombol
        btn.addEventListener('mouseleave', (e) => {
            isSnapped = false;
            
            // Tombol memantul kembali ke posisi awal
            gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
            
            // Cursor mengecil, menghilang, dan kembali ke koordinat pointer mouse
            gsap.to(cursor, {
                opacity: 0,
                width: 10,
                height: 10,
                x: e.clientX,
                y: e.clientY,
                duration: 0.3,
                ease: "power2.out"
            });
        });
    }
}
//#endregion

// Initialize automatically
new MdkgWidget(widgetConfig);