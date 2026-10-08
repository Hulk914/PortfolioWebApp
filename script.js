document.addEventListener("DOMContentLoaded", () => {
    // 1. Intersection Observer for Guitar Hero Notes
    const timelineItems = document.querySelectorAll(".timeline-item");

    const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.6
    };

    const noteHitObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("hit");
            } else {
                entry.target.classList.remove("hit");
            }
        });
    }, observerOptions);

    timelineItems.forEach(item => {
        noteHitObserver.observe(item);
    });

    // 2. Cinematic Auto-Scroll
    let isAutoScrolling = true;
    const scrollSpeed = 0.6; // Pixels per frame. Lower = slower.

    function autoScroll() {
        if (!isAutoScrolling) return;
        
        window.scrollBy(0, scrollSpeed);
        
        // Stop scrolling when reaching the absolute bottom
        if (Math.ceil(window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            isAutoScrolling = false;
        } else {
            requestAnimationFrame(autoScroll);
        }
    }

    // Start auto-scroll after a 3-second delay 
    setTimeout(() => {
        if (isAutoScrolling) {
            requestAnimationFrame(autoScroll);
        }
    }, 3000);

    // Cancel auto-scroll the moment the user interacts with the page
    ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
        window.addEventListener(evt, () => {
            isAutoScrolling = false;
        });
    });
});