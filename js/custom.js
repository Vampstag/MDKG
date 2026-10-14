//#region INITIALIZATION
document.addEventListener("DOMContentLoaded", (event) => {

    // -- Global Selectors --

    // Responsive Logic using gsap.matchMedia()
    const mm = gsap.matchMedia();
//#endregion

    //#region DESKTOP LOGIC (>= 992px)
    // =========================================
    // DESKTOP INTERACTIONS
    // =========================================
    mm.add("(min-width: 992px)", () => {
        
        // --- 2. Magnetic Effect for Buttons & Links ---
        function initMagneticElements() {
            const magneticItems = document.querySelectorAll('.button-normal-black-wrapper-2, .button-normal-white-wrapper-2, .back-to-top');

            magneticItems.forEach(item => {
                item.addEventListener('mousemove', (e) => {
                    const rect = item.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;

                    gsap.to(item, { x: x * 0.4, y: y * 0.6, duration: 0.4, ease: "power2.out" });
                });

                item.addEventListener('mouseleave', () => {
                    gsap.to(item, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.5)" });
                });
            });
        }

        // --- Initialization Sequence ---
        const startSequence = () => {
            if (document.readyState === 'complete') {
                initMagneticElements();
            } else {
                window.addEventListener('load', () => {
                    initMagneticElements();
                });
            }
        };

        if (document.body.classList.contains('preloader-active')) {
            window.addEventListener('preloaderDone', startSequence, { once: true });
        } else {
            startSequence();
        }

    });
    //#endregion

    //#region MOBILE LOGIC (< 992px)
    // =========================================
    // MOBILE INTERACTIONS
    // =========================================
    mm.add("(max-width: 991px)", () => {

        
        // DISABLED DRAGGABLE ON MOBILE/TABLET
        // DRAGGABLE DISABLED ON MOBILE/TABLET FOR BETTER SCROLL UX
    });
    //#endregion

});