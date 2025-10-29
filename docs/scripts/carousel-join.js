// scripts/carousel.js - Works for BOTH carousels
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // ===== 1. JOIN-US CAROUSEL (Membership Fees) =====
  const carouselData = [
    { amount: 200, description: "Non-refundable Registration Fee" },
    { amount: 200, description: "Mandatory Monthly Contribution" },
    { amount: 50, description: "Monthly Risk Fund" },
    { amount: 3000, description: "Share Capital (Transferable)" }
  ];

  const joinCarousel = document.querySelector('.carousel-join');
  if (joinCarousel) {
    const generateItems = () => {
      const itemsHTML = carouselData.map(data => `
        <article class="carousel-join-item" role="listitem">
          <h3 class="carousel-join-button">
            <span class="prefix">KES</span>
            <span class="counter-value" data-target="${data.amount}">0</span>
          </h3>
          <p class="carousel-join-description">${data.description}</p>
        </article>
      `).join('');
      joinCarousel.innerHTML = itemsHTML + itemsHTML; // Duplicate for loop
    };
    generateItems();

    // Counter Animation
    function formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    function animateCounter(element, target) {
      const targetNum = parseInt(target, 10);
      let start = 0;
      const duration = 600;
      let startTime = null;
      if (element._animationFrameId) cancelAnimationFrame(element._animationFrameId);

      const step = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const currentValue = start + (progress * (targetNum - start));
        element.textContent = formatNumber(Math.round(currentValue));
        if (progress < 1) {
          element._animationFrameId = requestAnimationFrame(step);
        } else {
          element.textContent = formatNumber(targetNum);
          element._animationFrameId = null;
        }
      };
      element._animationFrameId = requestAnimationFrame(step);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const counter = entry.target.querySelector('.counter-value');
        if (entry.isIntersecting && counter) {
          animateCounter(counter, counter.dataset.target);
        } else if (counter) {
          counter.textContent = '0';
          if (counter._animationFrameId) cancelAnimationFrame(counter._animationFrameId);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.carousel-join-item').forEach(item => {
      const counter = item.querySelector('.counter-value');
      if (counter) observer.observe(item);
    });

    // Responsive Animation
    function updateAnimation() {
      const width = window.innerWidth;
      const itemWidth = width <= 600 ? 200 : width <= 360 ? 160 : 280;
      const margin = width <= 600 ? 10 : width <= 360 ? 5 : 30;
      const totalWidth = carouselData.length * (itemWidth + 2 * margin) * 2;
      document.documentElement.style.setProperty('--item-width', `${itemWidth}px`);
      document.documentElement.style.setProperty('--item-margin', `${margin}px`);
      document.documentElement.style.setProperty('--carousel-translate', `-${totalWidth}px`);
      document.documentElement.style.setProperty('--carousel-duration', `${carouselData.length * 10 * 1000}ms`);
    }
    window.addEventListener('resize', updateAnimation);
    updateAnimation();
  }

  // ===== 2. INDEX FINANCIAL HIGHLIGHTS CAROUSEL =====
  const financialCarousel = document.querySelector('.carousel-static');
  if (financialCarousel) {
    // Duplicate items for seamless loop
    financialCarousel.innerHTML += financialCarousel.innerHTML;

    // Pause on hover
    const container = financialCarousel.closest('.carousel-container');
    if (container) {
      container.addEventListener('mouseenter', () => {
        financialCarousel.style.animationPlayState = 'paused';
      });
      container.addEventListener('mouseleave', () => {
        financialCarousel.style.animationPlayState = 'running';
      });
    }
  }
});
