document.addEventListener('DOMContentLoaded', function () {
    // Utility function to format time (e.g., 61 seconds -> "1:01")
    const formatTime = (timeInSeconds) => {
        const result = new Date(timeInSeconds * 1000).toISOString().slice(14, 19);
        return result.startsWith('0') ? result.slice(1) : result;
    };

    // --- Intersection Observer for fade-in animations ---
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up').forEach(el => {
        fadeInObserver.observe(el);
    });

    // --- Swiper Slider & Video Logic ---
    const swiperInterval = setInterval(() => {
        if (typeof Swiper !== 'undefined') {
            clearInterval(swiperInterval); // Stop checking once Swiper is loaded

            const worksSliderEl = document.querySelector('.works-slider');
            if (!worksSliderEl) return;

            // Store original slides for filtering
            const allSlidesHTML = Array.from(worksSliderEl.querySelectorAll('.swiper-slide')).map(slide => slide.outerHTML);

            const worksSlider = new Swiper(worksSliderEl, {
                loop: false, // Loop is complex with dynamic slides, better to disable
                centeredSlides: true,
                slidesPerView: 'auto',
                grabCursor: true,
                speed: 600,
                spaceBetween: 20,

                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },

                on: {
                    init: function () {
                        setupVideo(this.slides[this.activeIndex]);
                        playVideoInSlide(this.slides[this.activeIndex]);
                    },
                    slideChangeTransitionStart: function () {
                        this.slides.forEach(slide => pauseVideoInSlide(slide));
                    },
                    slideChangeTransitionEnd: function () {
                        setupVideo(this.slides[this.activeIndex]);
                        playVideoInSlide(this.slides[this.activeIndex]);
                    }
                }
            });

            function playVideoInSlide(slide) {
                const video = slide?.querySelector('.video-element');
                if (video) {
                    video.play().catch(error => console.log("Autoplay prevented by browser.", error));
                }
            }

            function pauseVideoInSlide(slide) {
                const video = slide?.querySelector('.video-element');
                if (video) video.pause();
            }

            // --- Video Controls Setup ---
            function setupVideo(slide) {
                if (!slide || slide.dataset.videoSetup) return;

                const video = slide.querySelector('.video-element');
                const playPauseBtn = slide.querySelector('.video-play-pause-btn');
                const timeline = slide.querySelector('.video-timeline');
                const currentTimeEl = slide.querySelector('.video-time-current');
                const durationEl = slide.querySelector('.video-time-duration');
                const muteBtn = slide.querySelector('.video-mute-btn');
                const fullscreenBtn = slide.querySelector('.video-fullscreen-btn');

                if (!video || !playPauseBtn || !timeline) return;

                // Play/Pause
                const togglePlay = () => {
                    if (video.paused) video.play();
                    else video.pause();
                };
                playPauseBtn.addEventListener('click', togglePlay);
                video.addEventListener('click', togglePlay); // Also toggle on video click

                video.addEventListener('play', () => playPauseBtn.classList.add('is-playing'));
                video.addEventListener('pause', () => playPauseBtn.classList.remove('is-playing'));

                // Mute/Unmute
                muteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    video.muted = !video.muted;
                    muteBtn.classList.toggle('is-muted', video.muted);
                });

                // Timeline
                video.addEventListener('loadedmetadata', () => {
                    if (durationEl) durationEl.textContent = formatTime(video.duration);
                    timeline.max = video.duration;
                });

                video.addEventListener('timeupdate', () => {
                    if (currentTimeEl) currentTimeEl.textContent = formatTime(video.currentTime);
                    timeline.value = video.currentTime;
                });

                timeline.addEventListener('input', () => {
                    video.currentTime = timeline.value;
                });

                // Fullscreen
                fullscreenBtn.addEventListener('click', () => {
                    if (!document.fullscreenElement) {
                        slide.querySelector('.vg-item').requestFullscreen();
                    } else {
                        document.exitFullscreen();
                    }
                });

                slide.dataset.videoSetup = 'true';
            }

            // Initial setup for all videos in the slider
            worksSlider.slides.forEach(slide => setupVideo(slide));

            // --- Tab Filtering Logic ---
            const tabButtons = document.querySelectorAll('.portfolio-menu .tab-btn');
            tabButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Update active button state
                    tabButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filter = btn.dataset.filter;

                    // Filter the original slides
                    const filteredSlidesHTML = allSlidesHTML.filter(slideHTML => {
                        if (filter === 'all') return true;
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = slideHTML;
                        const categories = tempDiv.firstElementChild.dataset.category;
                        return categories && categories.split(' ').includes(filter);
                    });

                    // Pause all current videos before removing slides
                    worksSlider.slides.forEach(slide => pauseVideoInSlide(slide));

                    // Update Swiper
                    worksSlider.removeAllSlides();
                    worksSlider.appendSlide(filteredSlidesHTML);
                    worksSlider.update();
                    worksSlider.slideTo(0, 0); // Go to the first slide of the new set without animation

                    // Setup and play the new active slide
                    setTimeout(() => {
                        worksSlider.slides.forEach(slide => setupVideo(slide));
                        playVideoInSlide(worksSlider.slides[worksSlider.activeIndex]);
                    }, 100);
                });
            });

        }
    }, 100);
});