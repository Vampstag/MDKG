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
    audioVersion: '1.2',
    
    // DAFTAR LAGU (PLAYLIST)
    // Tambahkan lagu baru dengan format: { src: 'file.mp3', title: 'Judul', artist: 'Band', cover: 'gambar.jpg' },
    playlist: [
        { src: 'audio/bgmusic.mp3', title: 'Smells Like Teen Spirit', artist: 'Nirvana', cover: 'assets/images/cover-nirvana.webp' },
        { src: 'audio/bgmusic2.mp3', title: 'Come As You Are', artist: 'Nirvana', cover: 'assets/images/cover-nirvana.webp' },
        { src: 'audio/bgmusic3.mp3', title: 'Something In The Way', artist: 'Nirvana', cover: 'assets/images/cover-nirvana.webp' },
        { src: 'audio/bgmusic4.mp3', title: 'Lithium', artist: 'Nirvana', cover: 'assets/images/cover-nirvana.webp' },
        { src: 'audio/Tarot.mp3', title: 'Tarot', artist: '.Feast', cover: 'assets/images/cover-feast.webp' },
        { src: 'audio/Arteri.mp3', title: 'Arteri', artist: '.Feast', cover: 'assets/images/cover-feast.webp' },
        { src: 'audio/o,Tuan.mp3', title: 'O, Tuan', artist: '.Feast', cover: 'assets/images/cover-feast.webp' }
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
        
        // Load last played index from localStorage — first-ever visit (nothing saved yet)
        // picks a random track instead of always starting on track 0, so repeat visitors
        // (who do have a saved index) don't hear the same opening track every time either.
        const savedIndex = localStorage.getItem('mdkg_last_track_index');
        this.currentTrackIndex = savedIndex !== null ? parseInt(savedIndex, 10) : Math.floor(Math.random() * this.playlist.length);
        
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

    // NOTE: the old initUISound() (synthesized hover/click tick sounds, toggle button)
    // has been removed per explicit request — the feature and its toggle button are gone,
    // not just disabled.

    // --- [NEW] Fungsi Lightbox Cover ---
    showLightbox(src) {
        let lightbox = document.getElementById('mdkg-widget-lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'mdkg-widget-lightbox';
            lightbox.innerHTML = `
                <div class="mdkg-lightbox-overlay"></div>
                <button class="mdkg-lightbox-close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="mdkg-lightbox-content">
                    <img src="" alt="Cover Besar">
                </div>
            `;
            document.body.appendChild(lightbox);
            
            const closeLightbox = () => { lightbox.classList.remove('active'); setTimeout(() => { if(lightbox) lightbox.style.display = 'none'; }, 400); };
            lightbox.querySelector('.mdkg-lightbox-overlay').addEventListener('click', closeLightbox);
            lightbox.querySelector('.mdkg-lightbox-close').addEventListener('click', closeLightbox);
        }
        lightbox.style.display = 'flex';
        lightbox.offsetHeight; // Force reflow
        lightbox.querySelector('img').src = src;
        lightbox.classList.add('active');
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
                    <span class="mdkg-status-text">Open for 1 Selected Project</span>
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
                <!-- [NEW] Hover Tooltip -->
                <div class="mdkg-cover-tooltip">Now Playing</div>
                
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
                    <span class="mdkg-player-text"></span>
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
                <!-- [NEW] Playlist Toggle: back in the player (moved out to the navbar and
                     back per feedback). Uses the same .nav-playlist-btn/.nav-playlist-panel
                     classes as before the move — initMusicPlayer() in this file already
                     handles multiple instances of these (it used to support a desktop nav
                     button + a mobile nav button), so this is just a third instance, no JS
                     changes needed. -->
                <div class="mdkg-player-playlist-wrapper">
                    <button type="button" class="nav-playlist-btn" title="Playlist" aria-expanded="false" aria-haspopup="listbox">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                    </button>
                    <div class="nav-playlist-panel nav-playlist-panel--player" role="listbox" aria-label="Playlist"></div>
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
        
        const textToType = "Open for 1 Selected Project";
        let i = 0;
        let isDeleting = false;

        const typeWriter = () => {
            const currentText = textToType.substring(0, i);
            statusText.innerHTML = currentText + '<span class="mdkg-typing-cursor">|</span>';

            let typeSpeed = isDeleting ? 30 : 80;

            if (!isDeleting && i === textToType.length) {
                typeSpeed = 4000; // Jeda lama saat teks sudah lengkap
                isDeleting = true;
            } else if (isDeleting && i === 0) {
                isDeleting = false;
                typeSpeed = 1000; // Jeda sebelum mengetik ulang
            }

            i += isDeleting ? -1 : 1;
            setTimeout(typeWriter, typeSpeed);
        };
        
        typeWriter();
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
            // [NEW] State Management untuk Auto-Resume Pintar
            let isUserPaused = true;
            let isFooterIntersecting = false;

            const evaluatePlayback = () => {
                if (isUserPaused) return; // Jika user sengaja pause secara manual, jangan di-resume otomatis
                
                // Cek apakah ada video yang sedang diputar DAN tidak di-mute (bersuara)
                const anyVideoPlaying = Array.from(document.querySelectorAll('video')).some(v => !v.paused && !v.muted && v.volume > 0);
                const anyAudioPlaying = Array.from(document.querySelectorAll('audio:not(.mdkg-bg-music)')).some(a => !a.paused && !a.muted && a.volume > 0);
                const shouldPause = isFooterIntersecting || anyVideoPlaying || anyAudioPlaying;

                if (shouldPause && !audio.paused) {
                    audio.pause(); updateUI(false);
                } else if (!shouldPause && audio.paused) {
                    audio.play().then(() => updateUI(true)).catch(e => console.error("Auto-resume failed:", e));
                }
            };
            
            audio.volume = this.currentVolume;

            // Set src tanpa auto-load
            audio.src = this.playlist[this.currentTrackIndex].src;

            // Save volume to localStorage whenever it changes
            audio.addEventListener('volumechange', () => {
                localStorage.setItem('mdkg_volume', audio.volume);
            });

            // [NEW] Continue across page navigations: every full page load rebuilds this
            // <audio> element from scratch (this is a multi-page site, not an SPA), so
            // without persisting playback position/state, moving to another page always
            // silently restarted the track from 0:00 and dropped whether it was playing.
            // Position is saved on a light interval (not every timeupdate — that fires
            // many times a second and localStorage writes aren't free) plus on the
            // events that actually change state, then restored here before playback
            // starts on the new page.
            const wasPlaying = localStorage.getItem('mdkg_was_playing') === 'true';
            const savedTime = parseFloat(localStorage.getItem('mdkg_playback_time') || '0');
            const savedTrackIndexAtSave = localStorage.getItem('mdkg_track_index_at_save');
            // Only trust the saved position if it was saved for the SAME track we're
            // about to load — otherwise (e.g. track advanced via 'ended' on the last
            // page, or the saved index was for a different song entirely) seeking to a
            // stale timestamp would jump into the middle of the wrong song.
            const positionIsForCurrentTrack = savedTrackIndexAtSave !== null && parseInt(savedTrackIndexAtSave, 10) === this.currentTrackIndex;

            const savePlaybackState = () => {
                localStorage.setItem('mdkg_playback_time', audio.currentTime.toString());
                localStorage.setItem('mdkg_track_index_at_save', this.currentTrackIndex.toString());
                localStorage.setItem('mdkg_was_playing', (!audio.paused).toString());
            };
            let saveInterval = null;
            const startSaveInterval = () => {
                if (saveInterval) return;
                saveInterval = setInterval(savePlaybackState, 2000);
            };
            const stopSaveInterval = () => {
                clearInterval(saveInterval);
                saveInterval = null;
                savePlaybackState(); // capture the final state right as playback stops
            };

            if (positionIsForCurrentTrack && savedTime > 0) {
                audio.addEventListener('loadedmetadata', () => {
                    // Guard against a stale timestamp beyond the (now current) track's
                    // actual duration.
                    if (savedTime < audio.duration) audio.currentTime = savedTime;
                }, { once: true });
            }
            
            const updateTrackMetadata = () => {
                const track = this.playlist[this.currentTrackIndex];
                if (trackTitle) {
                    trackTitle.innerText = track.title;
                    trackTitle.title = track.title; // [NEW] Memunculkan full judul saat di-hover
                }
                if (trackArtist) {
                    trackArtist.innerText = track.artist;
                    trackArtist.title = track.artist; // [NEW] Memunculkan full band saat di-hover
                }
                if (coverImg && track.cover) {
                    coverImg.src = track.cover;
                }
            };

            // Load UI awal
            updateTrackMetadata();

            // Keep the saved position/state in sync with actual playback, and auto-resume
            // below only reads a stable snapshot of what the LAST page left behind.
            // NOTE: 'beforeunload' is a window/document event, not one an <audio> element
            // ever fires — attaching it to `audio` (as this used to) silently never ran.
            // 'pagehide' (window-level, below) is the one that actually saves state on
            // navigation; visibilitychange is a second, earlier-firing safety net since
            // 'pagehide' fires later in the unload sequence and some mobile browsers can
            // skip straight to page-discard without a clean pagehide.
            audio.addEventListener('play', startSaveInterval);
            audio.addEventListener('pause', stopSaveInterval);
            window.addEventListener('pagehide', savePlaybackState);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) savePlaybackState();
            });

            // Auto-resume: if the previous page was actively playing when it unloaded
            // (not a manual pause), continue from where it left off instead of the
            // track silently going quiet on navigation. This IS a fresh page load with
            // no direct user gesture of its own — browsers can and do block audio.play()
            // here under their autoplay policy regardless of gestures on a *previous*
            // page, so failure here is expected in some browsers, not a bug on its own.
            // On failure, the UI shows PLAY (not silently "stuck") and one click resumes
            // from the saved position, which loadedmetadata above already restored.
            if (wasPlaying) {
                isUserPaused = false;
                audio.preload = 'auto';
                audio.muted = false;
                const attemptResume = () => audio.play().then(() => updateUI(true)).catch(() => updateUI(false));
                attemptResume();
                // If the browser blocked it, the very next real interaction anywhere on
                // the page counts as a user gesture — retry once then, instead of making
                // the visitor specifically find and click the tiny player to un-stick it.
                const retryOnFirstInteraction = () => {
                    if (!audio.paused) return; // already resumed (e.g. the attempt above actually succeeded)
                    attemptResume();
                };
                ['pointerdown', 'keydown'].forEach((evt) => {
                    document.addEventListener(evt, retryOnFirstInteraction, { once: true, passive: true });
                });
            }

            const updateUI = (isPlaying) => {
                const track = this.playlist[this.currentTrackIndex];
                
                if (isPlaying) {
                    player.classList.add('playing');
                    if (iconMuted) iconMuted.style.display = 'none';
                    if (iconPlaying) iconPlaying.style.display = 'block';
                } else {
                    player.classList.remove('playing');
                    if (text) { text.innerText = ""; }
                    if (iconMuted) iconMuted.style.display = 'block';
                    if (iconPlaying) iconPlaying.style.display = 'none';
                }
            };

            // Play/Pause Toggle
            player.addEventListener('click', (e) => {
                if (e.target.closest('.mdkg-next-btn')) return; // Ignore next button clicks
                if (e.target.closest('.nav-playlist-btn') || e.target.closest('.nav-playlist-panel')) return; // Ignore playlist toggle/panel clicks

                // [NEW] Jika piringan diklik, buka Lightbox (bukan play/pause)
                if (e.target.closest('.mdkg-player-cover') && !audio.paused) {
                    this.showLightbox(this.playlist[this.currentTrackIndex].cover);
                    return;
                }

                if (audio.paused) {
                    isUserPaused = false; // [UPDATE] Tandai bahwa user menekan play
                    audio.preload = "auto"; // Mulai download *hanya* jika user memutar
                    audio.play().then(() => updateUI(true)).catch(e => console.error("Playback failed:", e));
                } else {
                    isUserPaused = true; // [UPDATE] Tandai bahwa user menekan pause
                    audio.pause();
                    updateUI(false);
                }
            });

            // [NEW] Jump to an arbitrary track (used by both the playlist panel and, as
            // its (index+1)%length case, the Next button below) instead of only ever
            // stepping forward one at a time.
            const selectTrack = (index) => {
                this.currentTrackIndex = index;
                localStorage.setItem('mdkg_last_track_index', this.currentTrackIndex); // Save to localStorage

                updateTrackMetadata(); // Update Teks & Gambar di UI dulu
                renderPlaylistPanel(); // Refresh highlight ke lagu yang baru aktif

                audio.src = this.playlist[this.currentTrackIndex].src;
                audio.preload = "auto"; // User sudah berinteraksi, aman untuk diload
                audio.load(); // [FIX] Wajib dipanggil untuk Safari iOS agar src baru dikenali
                audio.play().then(() => {
                    isUserPaused = false;
                    updateUI(true);
                }).catch(e => console.error("Track switch failed:", e));
            };

            // Next Track Logic
            const playNext = () => {
                // Fitur Loop: Jika cuma 1 lagu, tombol Next akan me-replay lagu dari awal
                if (this.playlist.length === 1) {
                    audio.currentTime = 0;
                    audio.play().then(() => {
                        isUserPaused = false;
                        updateUI(true);
                    }).catch(e => console.error("Replay failed:", e));
                    return;
                }

                selectTrack((this.currentTrackIndex + 1) % this.playlist.length);
            };

            if (nextBtn) nextBtn.addEventListener('click', playNext);

            // --- Playlist Panel ---
            // [NEW] Lives in the navbar (see navbar.html, .nav-playlist-btn/.nav-playlist-panel),
            // not inside the floating player — moved out so the player itself stays compact.
            // Two instances exist in the DOM (desktop CTA row + mobile menu overlay, same
            // pattern as the two "Let's Talk" buttons) since only one is visible at a given
            // viewport width via CSS breakpoints, not JS — so every operation here targets
            // ALL matches, not just the first. The navbar itself is also injected async
            // (loadNavbar() in script.js, separate from this widget's own init), so these
            // queries can legitimately return nothing if it hasn't landed yet.
            const getPlaylistPanels = () => document.querySelectorAll('.nav-playlist-panel');
            const getPlaylistBtns = () => document.querySelectorAll('.nav-playlist-btn');

            const renderPlaylistPanel = () => {
                const itemsHtml = this.playlist.map((track, index) => `
                    <button type="button" class="nav-playlist-item${index === this.currentTrackIndex ? ' is-active' : ''}" data-index="${index}" role="option" aria-selected="${index === this.currentTrackIndex}">
                        <span class="nav-playlist-item-title">${track.title}</span>
                        <span class="nav-playlist-item-artist">${track.artist}</span>
                    </button>
                `).join('');
                getPlaylistPanels().forEach((panel) => { panel.innerHTML = itemsHtml; });
            };
            renderPlaylistPanel();

            const closeAllPlaylistPanels = () => {
                getPlaylistPanels().forEach((panel) => panel.classList.remove('is-open'));
                getPlaylistBtns().forEach((btn) => btn.setAttribute('aria-expanded', 'false'));
            };

            document.addEventListener('click', (e) => {
                // Toggle open/closed when a playlist button is clicked — close any other
                // open instance first so desktop/mobile panels never both show at once.
                const clickedBtn = e.target.closest('.nav-playlist-btn');
                if (clickedBtn) {
                    e.stopPropagation();
                    // The button and its panel are siblings inside the same wrapper/overlay.
                    const panel = clickedBtn.parentElement ? clickedBtn.parentElement.querySelector('.nav-playlist-panel') : null;
                    const wasOpen = panel ? panel.classList.contains('is-open') : false;
                    closeAllPlaylistPanels();
                    if (panel && !wasOpen) {
                        panel.classList.add('is-open');
                        clickedBtn.setAttribute('aria-expanded', 'true');
                    }
                    return;
                }

                // Pick a track when a playlist item is clicked
                const item = e.target.closest('.nav-playlist-item');
                if (item) {
                    e.stopPropagation();
                    const index = parseInt(item.dataset.index, 10);
                    if (index !== this.currentTrackIndex) selectTrack(index);
                    closeAllPlaylistPanels();
                    return;
                }

                // Click anywhere else closes any open panel
                if (!e.target.closest('.nav-playlist-panel')) {
                    closeAllPlaylistPanels();
                }
            });

            // Fitur Auto Loop jika 1 Lagu (Gunakan 'loop' native agar transisinya super mulus)
            if (this.playlist.length === 1) {
                audio.loop = true;
            } else {
                audio.addEventListener('ended', playNext); // Auto-advance ke lagu selanjutnya
            }

            // [NEW] Fitur Auto-pause saat mencapai footer
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer && audio) {
                const footerObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        isFooterIntersecting = entry.isIntersecting;
                        evaluatePlayback(); // Kalkulasi ulang state musik
                    });
                }, { threshold: 0.1 }); // Aktif ketika 10% elemen footer muncul di layar
                footerObserver.observe(footerContainer);
            }

            // [NEW] Pause when the tab/window loses focus (backgrounded, minimized,
            // switched away from) — resume automatically when it regains focus, but only
            // if the user hadn't manually paused it themselves before backgrounding.
            // isBackgroundPaused (distinct from isUserPaused) tracks specifically whether
            // THIS listener is the one that paused it, so it never overrides — or gets
            // confused with — an explicit user pause.
            let isBackgroundPaused = false;
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    if (!audio.paused) {
                        isBackgroundPaused = true;
                        audio.pause();
                        updateUI(false);
                    }
                } else if (isBackgroundPaused && !isUserPaused) {
                    isBackgroundPaused = false;
                    audio.play().then(() => updateUI(true)).catch(() => {});
                }
            });

            // [NEW] Global Media Listeners: Menangkap aksi play/pause/mute pada SEMUA media bersuara di website
            const handleMediaPlayback = (e) => {
                if (e.target.tagName === 'VIDEO' || (e.target.tagName === 'AUDIO' && !e.target.classList.contains('mdkg-bg-music'))) {
                    evaluatePlayback();
                }
            };
            document.addEventListener('play', handleMediaPlayback, true);
            document.addEventListener('pause', handleMediaPlayback, true);
            document.addEventListener('volumechange', handleMediaPlayback, true);
        }
    }

    // --- Feature: Scroll Hiding ---
    initScrollBehavior() {
        // The site runs Lenis smooth-scroll, which virtualizes scrolling with its own
        // easing/momentum — window.scrollY under Lenis can overshoot and settle back on
        // its way to a stop, so comparing raw scrollY on the native `scroll` event (even
        // with a jitter threshold) still misreads direction and flickers. Lenis emits its
        // own `scroll` event with an authoritative `direction` field (1 down, -1 up) that
        // matches what the rest of the site's scroll-linked effects use — read that instead
        // of recomputing direction from position. Falls back to the old position-based
        // listener only if Lenis isn't present for any reason.
        const statusWidget = document.querySelector('.mdkg-widget-status');
        const playerWidget = document.querySelector('.mdkg-widget-player');
        if (!statusWidget && !playerWidget) return;

        const applyState = (isHidden) => {
            if (statusWidget) statusWidget.classList.toggle('widget-hidden', isHidden);
            if (playerWidget) playerWidget.classList.toggle('widget-hidden', isHidden);
        };

        const attachToLenis = () => {
            if (!window.lenis || typeof window.lenis.on !== 'function') return false;
            window.lenis.on('scroll', ({ scroll, direction }) => {
                applyState(direction > 0 && scroll > 50);
            });
            return true;
        };

        if (attachToLenis()) return;

        // Lenis not ready yet (this widget can init before script.js's DOMContentLoaded
        // handler creates it) — poll briefly, then fall back to the plain scrollY listener.
        let attempts = 0;
        const retry = setInterval(() => {
            attempts++;
            if (attachToLenis() || attempts > 20) clearInterval(retry); // ~2s max wait
        }, 100);

        let lastScrollTop = window.scrollY || document.documentElement.scrollTop;
        let ticking = false;
        const MIN_DELTA = 6;
        window.addEventListener('scroll', () => {
            if (window.lenis) return; // Lenis attached in the meantime, stop double-handling
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                ticking = false;
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const delta = scrollTop - lastScrollTop;
                if (Math.abs(delta) < MIN_DELTA) return;
                applyState(delta > 0 && scrollTop > 50);
                lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
            });
        }, { passive: true });
    }

    // --- Feature: Magnetic Button ---
    // Pulls the button itself toward the cursor on hover — no custom cursor replacement,
    // the native pointer stays visible throughout.
    initMagneticButton() {
        const btn = document.querySelector('.mdkg-book-btn');
        if (!btn || typeof gsap === 'undefined') return;

        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            gsap.to(btn, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
        });

        btn.addEventListener('mouseleave', () => {
            gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" });
        });
    }
}
//#endregion

// Initialize automatically
new MdkgWidget(widgetConfig);