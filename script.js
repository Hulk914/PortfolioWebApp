document.addEventListener("DOMContentLoaded", () => {
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

    let isAutoScrolling = true;
    
    // Dynamically set scroll speed: faster for mobile (<1300px), standard for desktop
    const scrollSpeed = window.innerWidth <= 1300 ? 1.2 : 0.6; 

    function autoScroll() {
        if (!isAutoScrolling) return;
        
        window.scrollBy(0, scrollSpeed);
        
        if (Math.ceil(window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            isAutoScrolling = false;
        } else {
            requestAnimationFrame(autoScroll);
        }
    }

    setTimeout(() => {
        if (isAutoScrolling) {
            requestAnimationFrame(autoScroll);
        }
    }, 3000);

    ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
        window.addEventListener(evt, () => {
            isAutoScrolling = false;
        });
    });
});