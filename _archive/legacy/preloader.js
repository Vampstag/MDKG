document.addEventListener("DOMContentLoaded", () => {
    const preloader = document.getElementById('preloader');
    const counter = document.getElementById('counter');
    const bar = document.getElementById('bar');
    
    let count = 0;
    const duration = 300; // Ultra-fast load time
    const intervalTime = 15;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
        count += increment;
        
        if (count >= 100) {
            count = 100;
            clearInterval(timer);
            
            // Tunggu render halaman tapi maskimal 1 detik
            const hidePreloader = () => {
                finishPreloader();
            };
            
            if (document.readyState === 'complete') {
                hidePreloader();
            } else {
                const fallbackTimer = setTimeout(hidePreloader, 1000);
                window.addEventListener('load', () => {
                    clearTimeout(fallbackTimer);
                    hidePreloader();
                });
            }
        }

        // Update UI
        if (counter) counter.textContent = Math.floor(count) + "%";
        if (bar) bar.style.transform = `scaleX(${count / 100})`;

    }, intervalTime);

    function finishPreloader() {
        document.body.classList.remove('preloader-active');
        window.dispatchEvent(new CustomEvent('preloaderDone')); // Trigger elemen JS lainnya
        
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('finished');
            }, 100);
        }
    }
});