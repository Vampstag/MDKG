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
        this.initUISound();
    }

    // --- [NEW] Feature: Minimal UI Sound Design ---
    // Off by default (localStorage-persisted). No audio files — everything is synthesized
    // with Web Audio, but rebuilt away from a bare sine oscillator (which reads as a harsh
    // "digital beep" — a pure sine at audible UI frequencies has none of the softness real
    // tactile sound design relies on). Each tick now layers a short filtered-noise "breath"
    // under a soft sine body, low-pass filtered, with per-play randomization of pitch/timing
    // and a distinct character per element type — so it's varied and textured rather than
    // one identical blip repeated everywhere.
    initUISound() {
        const toggle = document.querySelector('.mdkg-ui-sound-toggle');
        if (!toggle) return;

        let enabled = localStorage.getItem('mdkg_ui_sound') === 'true';
        let audioCtx = null;
        let noiseBuffer = null;

        const ensureCtx = () => {
            if (!audioCtx) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) audioCtx = new Ctx();
            }
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            return audioCtx;
        };

        // A short buffer of white noise, reused across every play — filtered per-play
        // rather than regenerated, since generating fresh noise per tick is wasted work.
        const getNoiseBuffer = (ctx) => {
            if (noiseBuffer) return noiseBuffer;
            const length = ctx.sampleRate * 0.15;
            noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
            const data = noiseBuffer.getChannelData(0);
            for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
            return noiseBuffer;
        };

        // rand(a, b): small helper for per-play variation so repeated ticks of the same
        // kind never sound perfectly identical, the way a physical switch never does.
        const rand = (a, b) => a + Math.random() * (b - a);

        /**
         * Plays one soft, muffled tick — a low sine body (rounded further by a low low-pass
         * cutoff and a gentle attack) with a very quiet, dark-filtered noise breath underneath
         * for texture. No bright noise band and no fundamental above ~500Hz survives the
         * filtering, which is what keeps this from reading as a "digital beep." baseFreq/
         * noiseTone/duration/peak define the tick's character; each is nudged randomly per
         * play within a small range for natural variation.
         */
        const playTick = ({ baseFreq, noiseTone, duration, peak }) => {
            const ctx = ensureCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const freq = baseFreq * rand(0.96, 1.04);
            const dur = duration * rand(0.9, 1.1);

            // Sine body: low-pass cutoff sits just above the fundamental (not 2.2x it),
            // so only the round low end survives — no edge, no upper harmonics.
            const osc = ctx.createOscillator();
            const oscFilter = ctx.createBiquadFilter();
            const oscGain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            oscFilter.type = 'lowpass';
            oscFilter.frequency.setValueAtTime(freq * 1.15, now);
            oscFilter.Q.value = 0.3;
            oscGain.gain.setValueAtTime(0, now);
            oscGain.gain.linearRampToValueAtTime(peak, now + 0.018);
            oscGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            osc.connect(oscFilter);
            oscFilter.connect(oscGain);
            oscGain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + dur + 0.02);

            // Noise breath: a dark, heavily low-passed (not bandpassed) whisper of texture,
            // much quieter than the sine body, just enough to feel tactile rather than tonal.
            const noise = ctx.createBufferSource();
            noise.buffer = getNoiseBuffer(ctx);
            const noiseFilter = ctx.createBiquadFilter();
            const noiseGain = ctx.createGain();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(noiseTone * rand(0.9, 1.1), now);
            noiseFilter.Q.value = 0.4;
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(peak * 0.22, now + 0.01);
            noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.4);
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start(now);
            noise.stop(now + dur * 0.4 + 0.02);
        };

        // Distinct, subtle character per element type — variety instead of one tick
        // reused everywhere, but all sharing the same soft/muffled "premium" quality.
        // Frequencies pulled well down from the original (720/480/340/560Hz) into a
        // rounder, lower range, with much quieter peaks and a dark noise texture.
        const TICKS = {
            hoverLink: { baseFreq: 320, noiseTone: 900, duration: 0.06, peak: 0.012 },
            hoverCard: { baseFreq: 240, noiseTone: 700, duration: 0.08, peak: 0.014 },
            click: { baseFreq: 200, noiseTone: 600, duration: 0.1, peak: 0.02 },
            enable: { baseFreq: 260, noiseTone: 800, duration: 0.12, peak: 0.028 },
        };

        const updateToggleUI = () => {
            toggle.setAttribute('aria-pressed', String(enabled));
            toggle.classList.toggle('is-active', enabled);
        };
        updateToggleUI();

        toggle.addEventListener('click', () => {
            enabled = !enabled;
            localStorage.setItem('mdkg_ui_sound', String(enabled));
            updateToggleUI();
            if (enabled) { ensureCtx(); playTick(TICKS.enable); } // confirmation blip on enable
        });

        // Delegated so it covers content injected after this runs (case-study video players,
        // bento cards, etc) without needing a listener registered per element.
        document.addEventListener('mouseover', (e) => {
            if (!enabled) return;
            if (e.target.closest('.bento-item, .drag-item')) {
                playTick(TICKS.hoverCard);
            } else if (e.target.closest('a, button')) {
                playTick(TICKS.hoverLink);
            }
        });
        document.addEventListener('click', (e) => {
            if (!enabled) return;
            if (e.target.closest('a, button')) {
                playTick(TICKS.click);
            }
        });
    }

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
                <!-- [NEW] UI Sound Toggle: micro-sounds on hover/click across the site, off by default -->
                <button class="mdkg-ui-sound-toggle" title="Toggle interface sounds" aria-pressed="false">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>
                    </svg>
                </button>
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
            audio.addEventListener('play', startSaveInterval);
            audio.addEventListener('pause', stopSaveInterval);
            audio.addEventListener('beforeunload', savePlaybackState);
            window.addEventListener('pagehide', savePlaybackState);

            // Auto-resume: if the previous page was actively playing when it unloaded
            // (not a manual pause), continue from where it left off instead of the
            // track silently going quiet on navigation. Requires a user gesture on the
            // very first page load (browser autoplay policy) — this only fires audio
            // that was already flowing from user interaction on an earlier page, so the
            // policy is satisfied in practice once the user has pressed play once.
            if (wasPlaying) {
                isUserPaused = false;
                audio.preload = 'auto';
                audio.play().then(() => updateUI(true)).catch(() => {
                    // Autoplay blocked (e.g. very first page of the session, no prior
                    // gesture yet) — leave it paused/ready; the saved position is still
                    // there for whenever the user does press play.
                    updateUI(false);
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
                    if (text) { text.innerText = "PAUSED"; }
                    if (iconMuted) iconMuted.style.display = 'block';
                    if (iconPlaying) iconPlaying.style.display = 'none';
                }
            };

            // Play/Pause Toggle
            player.addEventListener('click', (e) => {
                if (e.target.closest('.mdkg-next-btn')) return; // Ignore next button clicks

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
                
                this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
                localStorage.setItem('mdkg_last_track_index', this.currentTrackIndex); // Save to localStorage
                
                updateTrackMetadata(); // Update Teks & Gambar di UI dulu
                
                audio.src = this.playlist[this.currentTrackIndex].src;
                audio.preload = "auto"; // User sudah klik interaksi next, aman untuk diload
                audio.load(); // [FIX] Wajib dipanggil untuk Safari iOS agar src baru dikenali
                audio.play().then(() => {
                    isUserPaused = false;
                    updateUI(true);
                }).catch(e => console.error("Next track failed:", e));
            };

            if (nextBtn) nextBtn.addEventListener('click', playNext);
            
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