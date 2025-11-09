// SOYOSOYO SACCO Member Activities Carousel
(function() {
    'use strict';

    // Member activity images from assets folder
    const memberImages = [
        './assets/0065564ad0f92baf9be886b031073979.jpg',
        './assets/01acb621480e99c389cea4973abe4896.jpg',
        './assets/0574cbcc2231c7a265a8eea457fd1087.jpg',
        './assets/1bbe203c93786b35fe54438d25752261.jpg',
        './assets/1d261dc851e4dfdd3d6ea4d4daae563d.jpg',
        './assets/3161c755955816487a8b0cd796d43c29.jpg',
        './assets/3e35156d674d712be93ea4e1ee64ac02.jpg',
        './assets/4052c9e82f0cdebee637edc13017bd17.jpg',
        './assets/5117fe27816c4aa2af5ff048fb317a4a.jpg',
        './assets/53d9ca642da6adc6cb47b5491e564cad.jpg',
        './assets/552b1c434f78afb9d7d5773da6009a70.jpg',
        './assets/6102e4707fca128dc24415face92f060.jpg',
        './assets/8024e9661a5dfdd8e82999174af78fbd.jpg',
        './assets/8053495671fa13e271078ad77beff286.jpg',
        './assets/8119c4ebd64ccbe641d0563d23444c34.jpg',
        './assets/8640680b79eba02a8544ba3bbbcdd655.jpg',
        './assets/872bc4870d5da742562fab6a7c8e7d17.jpg',
        './assets/8c145fcc127b3fad7cbe25bc847f3e8c.jpg',
        './assets/9f6ef9a029c7d6708c969b43e85c0a8f.jpg',
        './assets/a018c30df33c56dd50e50e96b08dff7f.jpg'
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
