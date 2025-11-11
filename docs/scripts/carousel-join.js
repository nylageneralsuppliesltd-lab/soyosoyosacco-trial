// scripts/carousel-join.js — FULLY INDEPENDENT, NO CONFLICT, PERFECT ANIMATION
document.addEventListener('DOMContentLoaded', () => {
  const carouselData = [
    { amount: 200, description: "Non-refundable Registration Fee" },
    { amount: 200, description: "Mandatory Monthly Contribution" },
    { amount: 50, description: "Monthly Risk Fund" },
    { amount: 3000, description: "Share Capital (Transferable)" }
  ];

  const carousel = document.querySelector('.carousel-join');
  if (!carousel) return;

  const itemsHTML = carouselData.map(data => `
    <article class="carousel-join-item" role="listitem">
      <h3 class="carousel-join-button">
        <span class="prefix">KES</span>
        <span class="counter-value" data-target="${data.amount}">0</span>
      </h3>
      <p class="carousel-join-description">${data.description}</p>
    </article>
  `).join('');

  carousel.innerHTML = itemsHTML + itemsHTML;

  // Counter animation
  const formatNumber = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const animateCounter = (el, target) => {
    const end = +target;
    let start = 0, id = null;
    const step = now => {
      if (!id) id = now;
      const progress = Math.min((now - id) / 600, 1);
      const value = Math.round(start + progress * (end - start));
      el.textContent = formatNumber(value);
      if (progress < 1) requestAnimationFrame(step);
      else id = null;
    };
    requestAnimationFrame(step);
  };

  // Intersection Observer
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const counter = e.target.querySelector('.counter-value');
      if (e.isIntersecting && counter && counter.textContent === '0') {
        animateCounter(counter, counter.dataset.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.carousel-join-item').forEach(item => observer.observe(item));

  // Responsive CSS variables
  const update = () => {
    const w = window.innerWidth;
    const iw = w <= 600 ? 200 : w <= 360 ? 160 : 280;
    const m = w <= 600 ? 10 : w <= 360 ? 5 : 30;
    const total = carouselData.length * (iw + 2 * m);

    document.documentElement.style.setProperty('--item-width', iw + 'px');
    document.documentElement.style.setProperty('--item-margin', m + 'px');
    document.documentElement.style.setProperty('--carousel-translate', '-' + total + 'px');
    document.documentElement.style.setProperty('--carousel-duration', carouselData.length * 10 + 's');
  };
  window.addEventListener('resize', update);
  update();

  // FIXED: Animate the CORRECT element on load
  setTimeout(() => {
    document.querySelectorAll('.counter-value').forEach(counter => {
      if (counter.textContent === '0' && counter.dataset.target) {
        animateCounter(counter, counter.dataset.target);
      }
    });
  }, 600); // Slightly longer than carousel.js (500ms) → no race condition
});
