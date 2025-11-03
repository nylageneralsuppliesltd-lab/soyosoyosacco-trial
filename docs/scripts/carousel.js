// scripts/carousel.js – AUTO-SYNC 4 METRICS + LIQUIDITY USING BANK BALANCE
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === UPDATE THESE 7 VALUES DAILY ===
  const carouselData = [
    { number: 144, description: "Total Members" },
    { number: 899265, description: "Member Savings" },
    { number: 301790, description: "Bank Balance" },
    { number: 103, description: "Number of Loans Given" },
    { number: 1907900, description: "Value of Loans Given" },
    { number: 52228, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  // === AUTO-SYNC: Push 4 key values + Jan 2025 bank balance to window.saccoData ===
  window.saccoData = {
    jan: {
      members: 101,
      loans: 283500,
      contributions: 331263,
      profit: -60056,
      bankBalance: 113742  // ← JAN 2025 BANK BALANCE (AS PROVIDED)
    },
    today: {
      members: carouselData[0].number,           // Total Members
      loans: carouselData[4].number,             // Value of Loans Given
      contributions: carouselData[1].number,     // Member Savings
      profit: carouselData[5].number,            // Profit
      bankBalance: carouselData[2].number        // Bank Balance (Today)
    }
  };

  // === REST OF CAROUSEL CODE (UNCHANGED) ===
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  const generateItems = () => {
    const itemHTML = carouselData.map(item => `
      <article class="carousel-item" role="listitem">
        <h3 class="carousel-button" data-target="${item.number}">0</h3>
        <p class="carousel-description">${item.description}</p>
      </article>
    `).join('');
    carousel.innerHTML = itemHTML + itemHTML;
  };
  generateItems();

  const formatNumber = (num) => {
    if (isNaN(num)) return num;
    const abs = Math.abs(num);
    return (abs >= 1000 ? (abs / 1000).toFixed(0) + 'k' : abs)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

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

  const update = () => {
    const w = window.innerWidth;
    const iw = w <= 768 ? 220 : 300;
    const m = w <= 768 ? 20 : 40;
    const total = carouselData.length * (iw + 2 * m);

    document.documentElement.style.setProperty('--item-width', iw + 'px');
    document.documentElement.style.setProperty('--item-margin', m + 'px');
    document.documentElement.style.setProperty('--carousel-translate', `-${total}px`);
    document.documentElement.style.setProperty('--carousel-duration', `${carouselData.length * 8}s`);
  };

  window.addEventListener('resize', update);
  update();
});
