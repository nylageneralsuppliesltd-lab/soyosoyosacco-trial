// scripts/carousel.js – SOYOSOYO SACCO – PERMANENT HISTORY + AUTO-SAVE
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === PERSISTENT HISTORY USING localStorage ===
  const getHistory = () => {
    try {
      const stored = localStorage.getItem('soyosoyoSaccoHistory');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to load history', e);
      return {};
    }
  };

  const saveHistory = (history) => {
    try {
      localStorage.setItem('soyosoyoSaccoHistory', JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history (storage full?)', e);
    }
  };

  let saccoHistory = getHistory();

  // === DAILY UPDATED VALUES (CHANGE THESE DAILY) ===
  const loanTypesToday = [
    { name: 'Emergency', value: 1217900 },
    { name: 'Medicare', value: 15000 },
    { name: 'Development', value: 553000 },
    { name: 'Education', value: 275000 }
  ];

  const totalLoansToday = loanTypesToday.reduce((sum, l) => sum + l.value, 0);
  const externalLoansToday = 66784;

  const carouselDataWithoutROA = [
    { number: 144, description: "Total Members" },
    { number: 907515, description: "Member Savings" },
    { number: 240624, description: "Bank Balance" },
    { number: 106, description: "Number of Loans Given" },
    { number: totalLoansToday, description: "Value of Loans Given" },
    { number: 51728, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  // Calculate ROA
  const assets = carouselDataWithoutROA[1].number + externalLoansToday;
  const profit = carouselDataWithoutROA[5].number;
  const roaToday = assets > 0 ? ((profit / assets) * 100).toFixed(2) : 0;

  carouselDataWithoutROA.push({ number: roaToday, description: "ROA (%)" });
  const carouselData = carouselDataWithoutROA;

  window.loanTypes = loanTypesToday;

  // === JAN 2025 BASELINE (fallback if not in history) ===
  const janFallback = {
    members: 101,
    contributions: 331263,
    loans: 283500,
    profit: -60056,
    bankBalance: 113742,
    externalLoans: 0
  };

  const janData = saccoHistory[2025]?.jan || janFallback;
  const roaJan = janData.contributions + janData.externalLoans > 0
    ? ((janData.profit / (janData.contributions + janData.externalLoans)) * 100).toFixed(2)
    : 0;

  // === FINAL DATA OBJECT ===
  const todayData = {
    members: carouselData[0].number,
    contributions: carouselData[1].number,
    loans: totalLoansToday,
    profit: carouselData[5].number,
    bankBalance: carouselData[2].number,
    externalLoans: externalLoansToday,
    roa: roaToday
  };

  window.saccoData = {
    jan: { ...janData, roa: roaJan },
    today: todayData
  };

  // === AUTO-SAVE IN DECEMBER OR IF YEAR NOT SAVED ===
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  if ((currentMonth === 11 || !saccoHistory[currentYear]) && todayData) {
    saccoHistory[currentYear] = {
      year: currentYear,
      members: todayData.members,
      contributions: todayData.contributions,
      loans: todayData.loans,
      bankBalance: todayData.bankBalance,
      profit: todayData.profit,
      roa: todayData.roa,
      dateSaved: today.toISOString().split('T')[0]
    };
    saveHistory(saccoHistory);
    console.log(`SOYOSOYO SACCO ${currentYear} DATA SAVED PERMANENTLY`);
  }

  // === CAROUSEL RENDERING (unchanged, just moved below) ===
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  const generateItems = () => {
    const itemHTML = carouselData.map(item => `
      <article class="carousel-item" role="listitem">
        <h3 class="carousel-button" data-target="${item.number}">0</h3>
        <p class="carousel-description">${item.description}</p>
      </article>
    `).join('');
    carousel.innerHTML = itemHTML + itemHTML; // duplicate for loop
  };
  generateItems();

  const formatNumber = (num) => {
    if (isNaN(num)) return num;
    const abs = Math.abs(num);
    const formatted = abs >= 1000 ? (abs / 1000).toFixed(0) + 'k' : abs;
    return formatted.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const animateCounter = (el, target) => {
    const end = +target;
    const duration = 1200;
    const startTime = performance.now();

    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = Math.round(progress * end);
      el.textContent = formatNumber(value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const animateVisible = () => {
    document.querySelectorAll('.carousel-item').forEach(item => {
      const btn = item.querySelector('.carousel-button');
      if (btn && btn.dataset.target && btn.textContent === '0') {
        animateCounter(btn, btn.dataset.target);
      }
    });
  };

  setTimeout(animateVisible, 100);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const btn = entry.target.querySelector('.carousel-button');
        if (btn && btn.textContent === '0') {
          animateCounter(btn, btn.dataset.target);
        }
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

  // Final animation trigger
  setTimeout(animateVisible, 300);
});
