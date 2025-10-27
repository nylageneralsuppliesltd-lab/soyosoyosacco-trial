document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');
  const carouselData = [
    { amount: 200, description: "Non-refundable Registration Fee" },
    { amount: 200, description: "Mandatory Monthly Contribution" },
    { amount: 50, description: "Monthly Risk Fund" },
    { amount: 3000, description: "Share Capital (Transferable)" }
  ];

  const carousel = document.querySelector('.carousel-join');
  if (!carousel) return;

  const generateItems = () => {
    const itemsHTML = carouselData.map(data => `
      <article class="carousel-join-item" role="listitem">
        <h3 class="carousel-join-button">
          <span class="prefix">KES</span>
          <span class="counter-value" data-target="${data.amount}">${data.amount}</span>
        </h3>
        <p class="carousel-join-description">${data.description}</p>
      </article>
    `).join('');
    carousel.innerHTML = itemsHTML + itemsHTML; // Duplicate for infinite loop
  };

  generateItems();

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

  const items = document.querySelectorAll('.carousel-join-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const counter = entry.target.querySelector('.counter-value');
      if (entry.isIntersecting && counter) {
        animateCounter(counter, counter.dataset.target);
      } else if (counter) {
        counter.textContent = '0';
        if (counter._animationFrameId) {
          cancelAnimationFrame(counter._animationFrameId);
          counter._animationFrameId = null;
        }
      }
    });
  }, { root: null, rootMargin: '0px', threshold: 0.3 });

  items.forEach(item => {
    const counter = item.querySelector('.counter-value');
    if (counter) {
      counter.textContent = '0';
      observer.observe(item);
    }
  });

  function updateAnimation() {
    const itemWidth = window.innerWidth <= 600 ? 200 : window.innerWidth <= 360 ? 160 : 280;
    const margin = window.innerWidth <= 600 ? 10 : window.innerWidth <= 360 ? 5 : 30;
    const totalWidth = carouselData.length * (itemWidth + 2 * margin) * 2; // Account for duplicates
    document.documentElement.style.setProperty('--item-width', `${itemWidth}px`);
    document.documentElement.style.setProperty('--item-margin', `${margin}px`);
    document.documentElement.style.setProperty('--carousel-translate', `-${totalWidth}px`);
    document.documentElement.style.setProperty('--carousel-duration', `${carouselData.length * 10 * 1000}ms`);
  }

  window.addEventListener('resize', updateAnimation);
  updateAnimation();
});
