// scripts/carousel-join.js
document.addEventListener('DOMContentLoaded', () => {
    // Define carousel data
    const carouselData = [
        {
            amount: 200,
            description: 'Non-refundable registration fee contributed once or during reactivation after stopping contributions for 6 months consecutively'
        },
        {
            amount: 200,
            description: 'Mandatory minimum monthly contribution'
        },
        {
            amount: 50,
            description: 'Mandatory non-refundable monthly Risk Fund'
        },
        {
            amount: 3000,
            description: 'Share capital which is non-refundable but transferable'
        }
    ];

    // Get carousel container
    const carousel = document.querySelector('.carousel-join');
    if (!carousel) return;

    // Duplicate items to create seamless loop (8 items total)
    const itemsHTML = carouselData.map(data => `
        <div class="carousel-join-item">
            <a href="#" class="carousel-join-button">
                <span class="prefix">Sh.</span>
                <span class="counter-value" data-target="${data.amount}"></span>
            </a>
            <div class="carousel-join-description">${data.description}</div>
        </div>
    `).join('');

    // Append items twice for looping effect
    carousel.innerHTML = itemsHTML + itemsHTML;

    const items = document.querySelectorAll('.carousel-join-item');

    // Format numbers with commas (e.g., 3000 -> 3,000)
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Animate counter from 0 to target
    function animateCounter(element, targetValue) {
        const target = parseInt(targetValue, 10);
        if (isNaN(target)) {
            element.textContent = targetValue;
            return;
        }

        let start = 0;
        const duration = 600; // 0.6s for snappy animation
        let startTime = null;

        if (element._animationFrameId) {
            cancelAnimationFrame(element._animationFrameId);
        }

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

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.3
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const counterSpan = entry.target.querySelector('.counter-value');
            if (counterSpan && counterSpan.dataset.target) {
                if (entry.isIntersecting) {
                    animateCounter(counterSpan, counterSpan.dataset.target);
                } else {
                    counterSpan.textContent = '0';
                    if (counterSpan._animationFrameId) {
                        cancelAnimationFrame(counterSpan._animationFrameId);
                        counterSpan._animationFrameId = null;
                    }
                }
            }
        });
    }, observerOptions);

    // Initialize counters to 0
    items.forEach(item => {
        const counterSpan = item.querySelector('.counter-value');
        if (counterSpan && counterSpan.dataset.target) {
            counterSpan.textContent = '0';
        }
    });

    // Observe carousel items
    items.forEach(item => observer.observe(item));

    // Re-animate visible items every 5s
    setInterval(() => {
        items.forEach(item => {
            const counterSpan = item.querySelector('.counter-value');
            if (counterSpan && counterSpan.dataset.target) {
                const rect = item.getBoundingClientRect();
                const isVisible = (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
                if (isVisible) {
                    animateCounter(counterSpan, counterSpan.dataset.target);
                }
            }
        });
    }, 5000);
});
