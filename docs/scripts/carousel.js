// docs/scripts/carousel.js – SOYOSOYO SACCO – SINGLE SOURCE OF TRUTH + LOCAL DATA
// FULLY FIXED: Pie chart error gone, data always ready, event dispatched reliably

// === INSTANT FALLBACK FOR CHARTS (runs even before DOM) ===
const janFallback = {
  members: 101,
  contributions: 331263,
  loansDisbursed: 283500,
  cumulativeLoansDisbursed: 1000000,
  loansBalance: 250000,
  profit: -60056,
  totalBankBalance: 113742,
  bankBreakdown: [
    { name: 'Co-operative Bank', value: 50000 },
    { name: 'Chamasoft', value: 20000 },
    { name: 'Cytonn', value: 43742 }
  ],
  bookValue: 250000 + 113742,
  externalLoans: 0,
  loans: 283500,
  bankBalance: 113742,
  roa: "2.1"
};

// === GLOBAL DATA CONTAINER (always exists) ===
window.saccoData = {
  jan: janFallback,
  today: {}
};
window.loanTypesToday = [];  // ← Critical: Define early so pie chart never sees undefined

// === PERSISTENT HISTORY ===
const getHistory = () => {
  try { return JSON.parse(localStorage.getItem('soyosoyoSaccoHistory') || '{}'); }
  catch { return {}; }
};
const saveHistory = (history) => {
  try { localStorage.setItem('soyosoyoSaccoHistory', JSON.stringify(history)); }
  catch (e) { console.warn('Failed to save history', e); }
};

let saccoHistory = getHistory();

// === TODAY'S DATA – UPDATE THESE NUMBERS DAILY ===
let loanTypesToday = [
  { name: 'Emergency', value: 1217900 },
  { name: 'Medicare', value: 15000 },
  { name: 'Development', value: 553000 },
  { name: 'Education', value: 275000 }
  // Add Api Culture here if you ever want it visible
];

let loansBalanceToday = 788357.66;
let bankBreakdownToday = [
  { name: 'Co-operative Bank', value: 2120.65 },
  { name: 'Chamasoft', value: 51954 },
  { name: 'Cytonn', value: 186550 }
];
let externalLoansToday = 66784;
const cumulativeLoansDisbursedSinceInception = 5000000;

// === RECOMPUTE ALL DYNAMIC VALUES ===
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

  // ROA = (Profit / (Savings + External Loans)) × 100
  const assets = carouselDataWithoutROA[1].number + externalLoansToday;
  const roaToday = assets > 0 ? ((carouselDataWithoutROA[5].number / assets) * 100).toFixed(2) : "0.00";
  carouselDataWithoutROA.push({ number: roaToday, description: "ROA (%)" });
  const carouselData = carouselDataWithoutROA;

  // === FINAL TODAY OBJECT ===
  const todayData = {
    members: carouselData[0].number,
    contributions: carouselData[1].number,
    loansDisbursed: loansDisbursedThisMonth,
    loansBalance: loansBalanceToday,
    profit: carouselData[5].number,
    totalBankBalance: totalBankBalanceToday,
    externalLoans: externalLoansToday,
    roa: roaToday,
    extraFields: {
      bankBreakdown: bankBreakdownToday,
      cumulativeLoansDisbursed: cumulativeLoansDisbursedSinceInception,
      bookValue: bookValueToday
    },
    loans: loansDisbursedThisMonth,
    bankBalance: totalBankBalanceToday
  };

  // === EXPOSE TO GLOBAL SCOPE (CRITICAL FOR CHARTS) ===
  window.loanTypesToday = loanTypesToday;           // Pie chart reads this
  window.saccoData.today = todayData;               // Bar charts read this
  window.SOYOSOYO = {
    current: todayData,
    baseline: janFallback,
    counters: carouselData.map(item => ({
      value: item.number,
      suffix: item.description.includes('ROA') ? '%' : '',
      label: item.description
    }))
  };

  // === MONTHLY HISTORY SAVE ===
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
    console.log(`SOYOSOYO SACCO ${currentPeriod} DATA SAVED`);
  }

  // === TRIGGER CHARTS UPDATE ===
  window.dispatchEvent(new CustomEvent('saccoDataUpdated'));
  console.log('saccoDataUpdated event dispatched – charts will refresh');

  return { todayData, carouselData, currentPeriod };
};

// === RUN IMMEDIATELY (data ready even before DOM) ===
const { todayData, carouselData } = recomputeData();

// === DOM READY: CAROUSEL + FINAL CHART REFRESH ===
document.addEventListener('DOMContentLoaded', () => {
  // Ensure ChartDataLabels is registered
  if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  // Clear existing content
  carousel.innerHTML = '';

  // Create slides (duplicate for seamless loop)
  const slidesHTML = carouselData.map(item => `
    <article class="carousel-item">
      <div class="carousel-number">${item.number.toLocaleString()}</div>
      <div class="carousel-desc">${item.description}</div>
    </article>
  `).join('');

  carousel.innerHTML = slidesHTML + slidesHTML; // Duplicate for infinite scroll

  // Auto-slide every 3 seconds
  let index = 0;
  const items = carousel.querySelectorAll('.carousel-item');
  const total = carouselData.length;

  const goToSlide = (i) => {
    carousel.style.transform = `translateX(-${i * 100}%)`;
  };

  const nextSlide = () => {
    index = (index + 1) % total;
    goToSlide(index);
    if (index === 0) {
      setTimeout(() => {
        carousel.style.transition = 'none';
        goToSlide(total);
        requestAnimationFrame(() => {
          carousel.style.transition = 'transform 0.6s ease-in-out';
          goToSlide(0);
        });
      }, 600);
    }
  };

  // Initialize position
  carousel.style.transition = 'transform 0.6s ease-in-out';
  goToSlide(total); // Start from duplicated set
  setTimeout(() => goToSlide(0), 50);

  setInterval(nextSlide, 3000);

  // === FINAL CHART REFRESH (in case inline script missed the event) ===
  if (typeof renderGrowthCharts === 'function') {
    setTimeout(renderGrowthCharts, 100); // Tiny delay ensures DOM ready
  }
});

// === MANUAL REFRESH FUNCTION (call from browser console if needed) ===
window.refreshSoyosoyoData = () => {
  Object.assign(window, { saccoData: { jan: janFallback, today: {} }, loanTypesToday: [] });
  recomputeData();
  if (typeof renderGrowthCharts === 'function') renderGrowthCharts();
  console.log('Soyosoyo data manually refreshed');
};

console.log('carousel.js loaded – loanTypesToday ready, saccoData ready, event will fire');
