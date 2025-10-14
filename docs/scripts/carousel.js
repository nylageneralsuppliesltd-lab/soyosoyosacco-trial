// carousel.js - Dynamic Stats Carousel
document.addEventListener('DOMContentLoaded', () => {
    const carouselData = [
        { number: 141, description: "Total Members" },
        { number: 805000, description: "Member Savings" },
        { number: 262000, description: "Bank Balance" },
        { number: 94, description: "Number of Loans Given" },
        { number: 1670000, description: "Value of Loans Given" },
        { number: 31000, description: "Profit" },
        { number: 66, description: "Active Members" }
        // Add/remove items here—e.g., { number: 100, description: "New Stat" }
    ];

    const carousel = document.querySelector('.carousel');
    if (!carousel) return; // Exit if no carousel container

    // Generate HTML dynamically (original + duplicate for loop)
    const generateItems = () => {
        let html = '';
        carouselData.forEach(item => {
            html += `
                <div class="carousel-item">
                    <a href="#" class="carousel-button" data-target="${item.number}">${item.number}</a>
                    <div class="carousel-description">${item.description}</div>
                </div>
            `;
        });
        // Duplicate for seamless loop
        html += carouselData.map(item => `
            <div class="carousel-item">
                <a href="#" class="carousel-button" data-target="${item.number}">${item.number}</a>
                <div class="carousel-description">${item.description}</div>
            </div>
        `).join('');
        carousel.innerHTML = html;
    };

    generateItems(); // Build initial HTML

    const items = document.querySelectorAll('.carousel-item');
    const numItems = carouselData.length; // Original count for calcs

    // Function to format numbers (with 'k' for thousands)
    function formatNumber(num) {
        if (isNaN(num)) return num;
        const isNegative = num < 0;
        const absNum = Math.abs(num);
        let formatted = absNum >= 1000 ? (absNum / 1000).toFixed(0) + 'k' : absNum.toString();
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return isNegative ? '-' + formatted : formatted;
    }

    // Animate counter from 0 to target
    function animateCounter(element, targetValue) {
        const target = parseInt(targetValue, 10);
        if (isNaN(target)) {
            element.textContent = targetValue;
            return;
        }
        let start = 0;
        const duration = 600;
        let startTime = null;
        if (element._animationFrameId) cancelAnimationFrame(element._animationFrameId);

        const step = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentValue = start + (progress * (target - start));
            element.textContent = formatNumber(Math.round(currentValue));
            if (progress < 1) {
                element._animationFrameId = requestAnimationFrame(step);
            } else {
                element.textContent = formatNumber(target);
                element._animationFrameId = null;
            }
        };
        element._animationFrameId = requestAnimationFrame(step);
    }

    // Set dynamic animation duration and translateX
    function updateAnimation() {
        const itemWidth = window.innerWidth <= 600 ? (window.innerWidth <= 360 ? 140 : 180) : 300;
        const margin = window.innerWidth <= 600 ? (window.innerWidth <= 360 ? 10 : 20) : 40;
        const totalWidth = numItems * (itemWidth + (2 * margin)); // Per set
        const duration = numItems * 3 * 1000; // 3s per item
        document.documentElement.style.setProperty('--carousel-duration', `${duration}ms`);
        document.documentElement.style.setProperty('--carousel-translate', `-${totalWidth}px`);
    }

    // Intersection Observer for viewport animations
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.3 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const button = entry.target.querySelector('.carousel-button');
            if (button && button.dataset.target) {
                if (entry.isIntersecting) {
                    animateCounter(button, button.dataset.target);
                } else {
                    button.textContent = '0';
                    if (button._animationFrameId) {
                        cancelAnimationFrame(button._animationFrameId);
                        button._animationFrameId = null;
                    }
                }
            }
        });
    }, observerOptions);

    // Init: Set to 0, observe items
    items.forEach(item => {
        const button = item.querySelector('.carousel-button');
        if (button) {
            button.textContent = '0';
            observer.observe(item);
        }
    });

    // Re-animate visible items every 3s
    setInterval(() => {
        items.forEach(item => {
            const button = item.querySelector('.carousel-button');
            if (button && button.dataset.target) {
                const rect = item.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;
                if (isVisible) animateCounter(button, button.dataset.target);
            }
        });
    }, 3000);

    // Update on resize
    window.addEventListener('resize', updateAnimation);
    updateAnimation(); // Initial calc
});
