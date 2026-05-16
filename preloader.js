document.addEventListener("DOMContentLoaded", () => {
    const preloader = document.getElementById('preloader');
    const counter = document.getElementById('counter');
    const bar = document.getElementById('bar');
    
    let count = 0;
    const duration = 800; // Optimized load time
    const intervalTime = 15;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
        count += increment;
        
        if (count >= 100) {
            count = 100;
            clearInterval(timer);
            finishPreloader();
        }

        // Update UI
        if (counter) counter.textContent = Math.floor(count) + "%";
        if (bar) bar.style.transform = `scaleX(${count / 100})`;

    }, intervalTime);

    function finishPreloader() {
        // Add class to body to enable scroll if hidden
        document.body.classList.remove('preloader-active');
        
        // Animate out
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('finished');
            }, 500);
        }
    }
});