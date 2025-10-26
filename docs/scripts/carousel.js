document.addEventListener('DOMContentLoaded', () => {
    const carouselData = [
        { number: 141, description: "Total Members" },
        { number: 864000, description: "Member Savings" },
        { number: 254000, description: "Bank Balance" },
        { number: 100, description: "Number of Loans Given" },
        { number: 1827000, description: "Value of Loans Given" },
        { number: 40000, description: "Profit" },
        { number: 67, description: "Active Members" }
    ];

    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

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
        html += carouselData.map(item => `
            <div class="carousel-item">
                <a href="#" class="carousel-button" data-target="${item.number}">${item.number}</a>
                <div class="carousel-description">${item.description}</div>
            </div>
        `).join('');
        carousel.innerHTML = html;
    };

    generateItems();

    const items = document.querySelectorAll('.carousel-item');
    const numItems = carouselData.length;

    function formatNumber(num) {
        if (isNaN(num)) return num;
        const isNegative = num < 0;
        const absNum = Math.abs(num);
        let formatted = absNum >= 1000 ? (absNum / 1000).toFixed(0) + 'k' : absNum.toString();
        formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return isNegative ? '-' + formatted : formatted;
    }

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

    function updateAnimation() {
        const itemWidth = window.innerWidth <= 768 ? 250 : 350; // Adjusted for mobile
        const margin = window.innerWidth <= 768 ? 30 : 60;
        const totalWidth = numItems * (itemWidth + (2 * margin));
        const duration = numItems * 3 * 1000;
        document.documentElement.style.setProperty('--carousel-duration', `${duration}ms`);
        document.documentElement.style.setProperty('--carousel-translate', `-${totalWidth}px`);
        document.documentElement.style.setProperty('--item-width', `${itemWidth}px`);
        document.documentElement.style.setProperty('--item-margin', `${margin}px`);
    }

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

    items.forEach(item => {
        const button = item.querySelector('.carousel-button');
        if (button) {
            button.textContent = '0';
            observer.observe(item);
        }
    });

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

    window.addEventListener('resize', updateAnimation);
    updateAnimation();
});
