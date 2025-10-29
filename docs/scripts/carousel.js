// scripts/carousel.js – Financial Highlights Carousel (Index Page)
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  const carouselData = [
    { number: 143, description: "Total Members" },
    { number: 86000, description: "Member Savings" },
    { number: 273000, description: "Bank Balance" },
    { number: 101, description: "Number of Loans Given" },
    { number: 1837000, description: "Value of Loans Given" },
    { number: 42000, description: "Profit" },
    { number: 69, description: "Active Members" }
  ];

  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  // Generate + Duplicate Items
  const generateItems = () => {
    const itemHTML = carouselData.map(item => `
      <article class="carousel-item" role="listitem">
        <h3 class="carousel-button" data-target="${item.number}">0</h3>
        <p class="carousel-description">${item.description}</p>
      </article>
    `).join('');

    carousel.innerHTML = itemHTML + itemHTML; // Duplicate for seamless loop
  };
  generateItems();

  // Format number (1,000 → 1k)
  const formatNumber = (num) => {
    if (isNaN(num)) return num;
    const abs = Math.abs(num);
    return (abs >= 1000 ? (abs / 1000).toFixed(0) + 'k' : abs)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Animate counter
  const animateCounter = (el, target) => {
    const end = +target;
    let start = 0, id = null;
    const duration = 600;
    const step = (now) => {
      if (!id) id = now;
      const progress = Math.min((now - id) / duration, 1);
      const value = Math.round(start + progress * (end - start));
      el.textContent = formatNumber(value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const btn = entry.target.querySelector('.carousel-button');
      if (entry.isIntersecting && btn) {
        animateCounter(btn, btn.dataset.target);
      } else if (btn) {
        btn.textContent = '0';
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.carousel-item').forEach(item => {
    const btn = item.querySelector('.carousel-button');
    if (btn) observer.observe(item);
  });

  // Responsive Animation
  const update = () => {
    const w = window.innerWidth;
    const iw = w <= 768 ? 220 : 300;
    const m = w <= 768 ? 20 : 40;
    const total = carouselData.length * (iw + 2 * m) * 2;

    document.documentElement.style.setProperty('--item-width', iw + 'px');
    document.documentElement.style.setProperty('--item-margin', m + 'px');
    document.documentElement.style.setProperty('--carousel-translate', `-${total}px`);
    document.documentElement.style.setProperty('--carousel-duration', `${carouselData.length * 8}s`);
  };

  window.addEventListener('resize', update);
  update();
});
