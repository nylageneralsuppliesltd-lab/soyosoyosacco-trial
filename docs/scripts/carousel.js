// scripts/carousel.js – AUTO-SYNC + PERMANENT HISTORY + AUTO-SAVE IN DECEMBER
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === INITIALIZE PERMANENT HISTORY (SURVIVES FOREVER) ===
  if (!window.saccoHistory) {
    window.saccoHistory = {}; // This will hold ALL past years
  }

  // === AUTO-SAVE CURRENT YEAR DATA IN DECEMBER (OR MANUAL) ===
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0 = Jan, 11 = Dec

  // Auto-save in December OR if not saved this year yet
  if ((currentMonth === 11 || !window.saccoHistory[currentYear]) && window.saccoData?.today) {
    window.saccoHistory[currentYear] = {
      year: currentYear,
      members: window.saccoData.today.members,
      contributions: window.saccoData.today.contributions,
      loans: window.saccoData.today.loans,
      bankBalance: window.saccoData.today.bankBalance,
      profit: window.saccoData.today.profit,
      roa: window.saccoData.today.roa,
      dateSaved: today.toISOString().split('T')[0]
    };
    console.log(`SOYOSOYO SACCO ${currentYear} DATA SAVED FOREVER`);
  }

  // === LOAN TYPES FOR TODAY (UPDATE THESE DAILY) ===
  const loanTypesToday = [
    { name: 'Emergency', value: 1214900 },
    { name: 'Medicare', value: 15000 },
    { name: 'Development', value: 553000 },
    { name: 'Education', value: 275000 }
  ];

  const totalLoansToday = loanTypesToday.reduce((sum, loan) => sum + loan.value, 0);

  // === EXTERNAL LOANS ===
  const externalLoansJan = 0;
  const externalLoansToday = 66784;

  // === UPDATE THESE DAILY (YOUR NORMAL NUMBERS) ===
  const carouselDataWithoutROA = [
    { number: 144, description: "Total Members" },
    { number: 906815, description: "Member Savings" },
    { number: 242999, description: "Bank Balance" },
    { number: 105, description: "Number of Loans Given" },
    { number: totalLoansToday, description: "Value of Loans Given" },
    { number: 51803, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  // Calculate ROA
  const roaToday = ((carouselDataWithoutROA[5].number / (carouselDataWithoutROA[1].number + externalLoansToday)) * 100).toFixed(2);
  carouselDataWithoutROA.push({ number: roaToday, description: "ROA (%)" });
  const carouselData = carouselDataWithoutROA;

  window.loanTypes = loanTypesToday;

  // === JAN 2025 BASELINE (WILL BE REPLACED IN 2026) ===
  const janDataWithoutROA = {
    members: 101,
    loans: 283500,
    contributions: 331263,
    profit: -60056,
    bankBalance: 113742,
    externalLoans: externalLoansJan
  };
  const roaJan = ((janDataWithoutROA.profit / (janDataWithoutROA.contributions + janDataWithoutROA.externalLoans)) * 100).toFixed(2);

  // === FINAL SACCO DATA WITH HISTORY SUPPORT ===
  window.saccoData = {
    jan: {
      ...janDataWithoutROA,
      roa: roaJan
    },
    today: {
      members: carouselData[0].number,
      loans: totalLoansToday,
      contributions: carouselData[1].number,
      profit: carouselData[5].number,
      bankBalance: carouselData[2].number,
      externalLoans: externalLoansToday,
      roa: carouselData[7].number
    }
  };

  // === CAROUSEL RENDERING (UNCHANGED) ===
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
    const duration = 1200;
    const startTime = performance.now();
    
    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.round(progress * end);
      el.textContent = formatNumber(value);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  };

  // Animate all visible items immediately on load
  const animateVisibleItems = () => {
    document.querySelectorAll('.carousel-item').forEach(item => {
      const btn = item.querySelector('.carousel-button');
      if (btn && btn.dataset.target) {
        animateCounter(btn, btn.dataset.target);
      }
    });
  };

  // Run animation after carousel is rendered
  setTimeout(animateVisibleItems, 100);

  // Re-animate when items scroll back into view
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const btn = entry.target.querySelector('.carousel-button');
      if (entry.isIntersecting && btn && btn.textContent === '0') {
        animateCounter(btn, btn.dataset.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.carousel-item').forEach(item => observer.observe(item));
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
 // Start animations immediately
  setTimeout(() => {
    document.querySelectorAll('.carousel-item .carousel-button').forEach(btn => {
      if (btn.dataset.target) {
        animateCounter(btn, btn.dataset.target);
      }
    });
  }, 300);
});
