// docs/scripts/carousel.js – SOYOSOYO SACCO – SINGLE SOURCE OF TRUTH + LOCAL DATA

// === INSTANT FALLBACK FOR CHARTS (runs even if DOM not ready) ===
const janFallback = {
  members: 101, contributions: 331263, loansDisbursed: 283500, cumulativeLoansDisbursed: 1000000,
  loansBalance: 250000, profit: -60056, totalBankBalance: 113742,
  bankBreakdown: [{ name: 'Co-operative Bank', value: 50000 }, { name: 'Chamasoft', value: 20000 }, { name: 'Cytonn', value: 43742 }],
  bookValue: 250000 + 113742, externalLoans: 0,
  // Aliases for charts in index.html
  loans: 283500,
  bankBalance: 113742,
  roa: "2.1"  // Match HTML expectation for parseFloat
};

window.saccoData = window.saccoData || {
  jan: window.SOYOSOYO?.baseline ?? janFallback,
  today: window.SOYOSOYO?.current ?? { /* todayData computed below */ }
};

// === PERSISTENT HISTORY ===
const getHistory = () => {
  try { return JSON.parse(localStorage.getItem('soyosoyoSaccoHistory') ?? '{}'); } catch { return {}; }
};
const saveHistory = (history) => { try { localStorage.setItem('soyosoyoSaccoHistory', JSON.stringify(history)); } catch {} };

let saccoHistory = getHistory();

// === TODAY'S DATA (UPDATE DAILY) – These are the hardcoded dailies you change ===
let loanTypesToday = [
  { name: 'Emergency', value: 1217900 }, { name: 'Medicare', value: 15000 },
  { name: 'Development', value: 553000 }, { name: 'Education', value: 275000 }
];
window.loanTypesToday = loanTypesToday;  // PATCH: Expose global for pie chart in charts script
let loansBalanceToday = 788357.66;
let bankBreakdownToday = [
  { name: 'Co-operative Bank', value: 2120.65 }, { name: 'Chamasoft', value: 51954 }, { name: 'Cytonn', value: 186550 }
];
let externalLoansToday = 66784;
const cumulativeLoansDisbursedSinceInception = 5000000; // Static, but can be dynamic if needed

// Function to recompute all dynamic data (for refresh)
const recomputeData = () => {
  const loansDisbursedThisMonth = loanTypesToday.reduce((sum, l) => sum + l.value, 0);
  const totalBankBalanceToday = bankBreakdownToday.reduce((sum, b) => sum + b.value, 0);
  const bookValueToday = loansBalanceToday + totalBankBalanceToday;

  const carouselDataWithoutROA = [
    { number: 144, description: "Total Members" },
    { number: 907515, description: "Member Savings" },
    { number: totalBankBalanceToday, description: "Total Bank Balance" },
    { number: 106, description: "Number of Loans Given" },
    { number: loansDisbursedThisMonth, description: "Loans Disbursed This Month" },
    { number: 51728, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  // Calc ROA
  const assets = carouselDataWithoutROA[1].number + externalLoansToday;
  const roaToday = assets > 0 ? ((carouselDataWithoutROA[5].number / assets) * 100).toFixed(2) : 0;
  carouselDataWithoutROA.push({ number: roaToday, description: "ROA (%)" });
  const carouselData = carouselDataWithoutROA;

  window.loanTypes = loanTypesToday;
  window.loanTypesToday = loanTypesToday;  // PATCH: Re-expose on recompute for updates
  window.bankBreakdown = bankBreakdownToday;

  // Current month
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthData = saccoHistory[currentPeriod] || janFallback;
  const roaCurrent = (currentMonthData.contributions + currentMonthData.externalLoans > 0)
    ? ((currentMonthData.profit / (currentMonthData.contributions + currentMonthData.externalLoans)) * 100).toFixed(2) : 0;

  // Final data
  const todayData = {
    members: carouselData[0].number, contributions: carouselData[1].number,
    loansDisbursed: loansDisbursedThisMonth, loansBalance: loansBalanceToday,
    profit: carouselData[5].number, totalBankBalance: totalBankBalanceToday,
    externalLoans: externalLoansToday, roa: roaToday,
    extraFields: { bankBreakdown: bankBreakdownToday, cumulativeLoansDisbursed: cumulativeLoansDisbursedSinceInception, bookValue: bookValueToday },
    // Aliases for charts in index.html
    loans: loansDisbursedThisMonth,
    bankBalance: totalBankBalanceToday
  };

  // Expose globals
  window.SOYOSOYO = {
    current: todayData, baseline: janFallback,
    counters: carouselData.map(item => ({ value: item.number, suffix: item.description.includes('ROA') ? '%' : '', label: item.description }))
  };
  window.saccoData = { 
    jan: { ...janFallback, roa: "2.1" },  // Ensure roa string for parseFloat
    today: { ...todayData, roa: roaToday },
    [currentPeriod]: { ...currentMonthData, roa: roaCurrent } 
  };
  localStorage.setItem('saccoDataToday', JSON.stringify(todayData));

  // === MONTHLY AUTO-SAVE (Your Original Style) ===
  if (!saccoHistory[currentPeriod]) {
    saccoHistory[currentPeriod] = {
      period: currentPeriod,
      members: todayData.members,
      contributions: todayData.contributions,
      loansDisbursed: todayData.loansDisbursed,
      loansBalance: todayData.loansBalance,
      profit: todayData.profit,
      totalBankBalance: todayData.totalBankBalance,
      bankBreakdown: todayData.extraFields.bankBreakdown,
      cumulativeLoansDisbursed: todayData.extraFields.cumulativeLoansDisbursed,
      bookValue: todayData.extraFields.bookValue,
      roa: todayData.roa,
      dateSaved: now.toISOString()
    };
    saveHistory(saccoHistory);
    console.log(`SOYOSOYO SACCO ${currentPeriod} DATA SAVED TO HISTORY`);
  } else {
    const existing = saccoHistory[currentPeriod];
    if (!existing.loansBalance) existing.loansBalance = todayData.loansBalance;
    if (!existing.profit) existing.profit = todayData.profit;
    if (!existing.bankBreakdown) existing.bankBreakdown = todayData.extraFields.bankBreakdown;
    if (!existing.cumulativeLoansDisbursed) existing.cumulativeLoansDisbursed = todayData.extraFields.cumulativeLoansDisbursed;
    if (!existing.bookValue) existing.bookValue = todayData.extraFields.bookValue;
    saveHistory(saccoHistory);
  }

  // PATCH: Trigger charts update after recompute
  window.dispatchEvent(new CustomEvent('saccoDataUpdated'));
  console.log('saccoDataUpdated event dispatched after recompute');

  return { todayData, carouselData, currentPeriod };
};

// Initial compute
const { todayData, carouselData } = recomputeData();

// === DOM-READY LOGIC ===
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === FIX FOR CHARTS: Register ChartDataLabels plugin (missing in HTML, causes blank charts) ===
  if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    console.log('ChartDataLabels registered – charts should now render with labels and arrows');
  }

  // Backward compat for charts – now with aliases
  if (window.SOYOSOYO) {
    window.saccoData = { 
      jan: window.SOYOSOYO.baseline, 
      today: window.SOYOSOYO.current 
    };
    console.log('saccoData restored for legacy charts:', window.saccoData);
  }

  // Trigger chart re-render if function exists (from inline script)
  if (typeof renderGrowthCharts === 'function') {
    renderGrowthCharts();
    console.log('Growth charts re-triggered after data fix');
  }

  // === CAROUSEL RENDER ===
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  // Generate duplicated items for infinite loop
  const itemHTML = carouselData.map(item =>
    `<article class="carousel-item" role="listitem">
      <h3 class="carousel-button" data-target="${item.number}">0</h3>
      <p class="carousel-description">${item.description}</p>
    </article>`
  ).join('');
  carousel.innerHTML = itemHTML + itemHTML;

  // === UTILS ===
  const formatNumber = (num) => {
    if (isNaN(num)) return num;
    const abs = Math.abs(num);
    return abs >= 1000 ? (abs / 1000).toFixed(0) + 'k' : abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const animateCounter = (el, target, suffix = '') => {
    const end = +target;
    const duration = 1200;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      el.textContent = formatNumber(Math.round(progress * end)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // === SINGLE OBSERVER FOR ALL ANIMATIONS (carousel + counters) ===
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const btn = entry.target.querySelector ? entry.target.querySelector('.carousel-button, .counter') : entry.target;
        if (btn && btn.textContent === '0' && btn.dataset.target) {
          const suffix = btn.dataset.suffix || '';
          animateCounter(btn, btn.dataset.target, suffix);
          observer.unobserve(entry.target); // One-time
        }
      }
    });
  }, { threshold: 0.5 });

  // Observe carousel items
  document.querySelectorAll('.carousel-item').forEach(item => observer.observe(item));

  // Setup counters (e.g., for Join-Us)
  document.querySelectorAll('.counter').forEach(el => {
    const idx = el.dataset.index;
    if (idx !== undefined && carouselData[idx]) {
      const item = carouselData[idx];
      el.dataset.target = item.number;
      el.dataset.suffix = item.description.includes('ROA') ? '%' : '';
      el.textContent = '0';
      observer.observe(el);
    }
  });

  // Fallback initial animation
  setTimeout(() => {
    document.querySelectorAll('.carousel-button, .counter').forEach(btn => {
      if (btn.textContent === '0' && btn.dataset.target) {
        const suffix = btn.dataset.suffix || '';
        animateCounter(btn, btn.dataset.target, suffix);
      }
    });
  }, 100);

  // === SMOOTH CSS TRANSITIONS SETUP ===
  const updateCarousel = () => {
    const w = window.innerWidth;
    const iw = w <= 768 ? 220 : 300;
    const m = w <= 768 ? 20 : 40;
    const total = carouselData.length * (iw + 2 * m);
    document.documentElement.style.setProperty('--item-width', `${iw}px`);
    document.documentElement.style.setProperty('--item-margin', `${m}px`);
    document.documentElement.style.setProperty('--carousel-translate', `-${total}px`);
    document.documentElement.style.setProperty('--carousel-duration', `${carouselData.length * 8}s`);
  };

  window.addEventListener('resize', updateCarousel);
  updateCarousel();

  // Expose refresh – NOW FULLY UPDATES DATA FOR PROJECTIONS
  window.updateCarouselData = () => {
    console.log('Carousel data refreshed');
    // Recompute everything (dailies, sums, ROA, history, globals)
    const refreshed = recomputeData();
    // Re-render carousel if needed (update HTML with new targets)
    if (carousel) {
      const newItemHTML = refreshed.carouselData.map(item =>
        `<article class="carousel-item" role="listitem">
          <h3 class="carousel-button" data-target="${item.number}">0</h3>
          <p class="carousel-description">${item.description}</p>
        </article>`
      ).join('');
      carousel.innerHTML = newItemHTML + newItemHTML;
      // Re-observe new items
      document.querySelectorAll('.carousel-item').forEach(item => observer.observe(item));
      updateCarousel(); // Refresh CSS vars
    }
    // Re-setup counters with new data
    document.querySelectorAll('.counter').forEach(el => {
      const idx = el.dataset.index;
      if (idx !== undefined && refreshed.carouselData[idx]) {
        const item = refreshed.carouselData[idx];
        el.dataset.target = item.number;
        el.dataset.suffix = item.description.includes('ROA') ? '%' : '';
        el.textContent = '0';
        observer.observe(el);
      }
    });
    // Update aliases in exposed data
    const refreshedTodayWithAliases = {
      ...refreshed.todayData,
      loans: refreshed.todayData.loansDisbursed,
      bankBalance: refreshed.todayData.totalBankBalance
    };
    const refreshedJanWithAliases = {
      ...janFallback,
      loans: janFallback.loansDisbursed,
      bankBalance: janFallback.totalBankBalance,
      roa: "2.1"
    };
    window.SOYOSOYO.current = refreshedTodayWithAliases;
    window.SOYOSOYO.baseline = refreshedJanWithAliases;
    window.saccoData.jan = refreshedJanWithAliases;
    window.saccoData.today = refreshedTodayWithAliases;
    window.loanTypesToday = loanTypesToday;  // PATCH: Re-expose on update
    // Re-trigger charts after update
    if (typeof renderGrowthCharts === 'function') {
      renderGrowthCharts();
    }
    console.log('Projections data updated:', refreshedTodayWithAliases);
  };
});
