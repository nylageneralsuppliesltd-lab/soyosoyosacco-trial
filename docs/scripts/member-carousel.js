// SOYOSOYO SACCO Member Activities Carousel
(function() {
    'use strict';

    // Member activity images from assets folder
    const memberImages = [
      './assets/01acb621480e99c389cea4973abe4896.jpg',
        './assets/3161c755955816487a8b0cd796d43c29.jpg',
        './assets/c1cbf8720115247da59d153d3f0be3b0.jpg',
        './assets/b8a8a30e9531f4d1cac3ddf56c594b5a.jpg',
        './assets/8053495671fa13e271078ad77beff286.jpg',
        './assets/8640680b79eba02a8544ba3bbbcdd655.jpg',
        './assets/8c145fcc127b3fad7cbe25bc847f3e8c.jpg'
    ];

    let currentSlide = 0;

    function initMemberCarousel() {
        const slidesContainer = document.getElementById('memberSlides');
        const dotsContainer = document.getElementById('memberDots');

        if (!slidesContainer || !dotsContainer) {
            console.warn('⚠️ Member carousel elements not found');
            return;
        }

        // Clear existing content
        slidesContainer.innerHTML = '';
        dotsContainer.innerHTML = '';

        // Create slides
        memberImages.forEach((imgSrc, index) => {
            const slide = document.createElement('div');
            slide.className = 'slide';
            slide.innerHTML = `<img src="${imgSrc}" alt="Member Activity ${index + 1}" loading="lazy" style="width:100%; height:100%; object-fit:contain; object-position:center;">`;
            slidesContainer.appendChild(slide);

            // Create dots
            const dot = document.createElement('div');
            dot.className = index === 0 ? 'dot active' : 'dot';
            dot.onclick = () => goToSlide(index);
            dotsContainer.appendChild(dot);
        });

        // Show first slide
        showSlide(0);
        
        // Auto-advance every 5 seconds
        setInterval(() => changeSlide(1), 5000);
        
        console.log('✅ Member Activities Carousel Initialized');
    }

    function showSlide(index) {
        const slides = document.querySelectorAll('#memberSlides .slide');
        const dots = document.querySelectorAll('#memberDots .dot');
        const totalSlides = slides.length;

        if (totalSlides === 0) return;

        if (index >= totalSlides) currentSlide = 0;
        else if (index < 0) currentSlide = totalSlides - 1;
        else currentSlide = index;

        const slidesContainer = document.getElementById('memberSlides');
        if (slidesContainer) {
            slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        }

        dots.forEach((dot, i) => {
            dot.className = i === currentSlide ? 'dot active' : 'dot';
        });
    }

    function changeSlide(direction) {
        showSlide(currentSlide + direction);
    }

    function goToSlide(index) {
        showSlide(index);
    }

    // Expose functions globally for HTML onclick handlers
    window.changeSlide = changeSlide;
    window.goToSlide = goToSlide;

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMemberCarousel);
    } else {
        initMemberCarousel();
    }
})();
