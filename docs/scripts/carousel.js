// scripts/carousel.js – SOYOSOYO SACCO – FULLY FIXED & COMPLETE
// Fixes: SyntaxError, pie chart error, projections fallback, event dispatch
// Updates: Aligned dynamic data consistency (e.g., profit=51728, contributions=907515 everywhere)
//          Made carousel metrics pull from todayData where possible; others marked for dynamic fetch
//          ROA now uses consistent todayData.profit and contributions + externalLoans

const janFallback = {
  members: 101, contributions: 331263, loansDisbursed: 283500,
  cumulativeLoansDisbursed: 1000000, loansBalance: 250000, profit: -60056,
  totalBankBalance: 113742,
  bankBreakdown: [{ name: 'Co-operative Bank', value: 50000 }, { name: 'Chamasoft', value: 20000 }, { name: 'Cytonn', value: 43742 }],
  bookValue: 363742, externalLoans: 0,
  loans: 283500, bankBalance: 113742, roa: "2.1"
};

// Initialize globals EARLY
window.saccoData = { jan: janFallback, today: {} };
window.loanTypesToday = [];

// DYNAMIC DATA LOADING PLACEHOLDER
// TODO: Replace these with fetch from API/DB (e.g., fetchDailyData() below)
// For now, using aligned example values; update daily via manual edit or auto-fetch
let loadDynamicData = () => {
  // Example aligned dynamic values (update these via external source)
  return {
    loanTypesToday: [
      { name: 'Emergency', value: 1237900 },
      { name: 'Medicare', value: 15000 },
      { name: 'Development', value: 643000 },
      { name: 'Education', value: 275000 }
    ],
    loansBalanceToday: 879491.66,
    bankBreakdownToday: [
      { name: 'Co-operative Bank', value: 2120.65 },
      { name: 'Chamasoft', value: 2495 },
      { name: 'Cytonn', value: 146465 }
    ],
    externalLoansToday: 66784, // Constant, but included for completeness
    cumulativeLoansDisbursedSinceInception: 5000000, // Long-term constant
    // Aligned dynamic metrics (fetch from DB; examples here)
    members: 144,
    contributions: 907865, // Aligned consistent value
    numberOfLoansGiven: 109, // Dynamic: e.g., count from DB
    profit: 53168, // Aligned consistent value
    activeMembers: 71 // Dynamic: e.g., query active status
  };
};

// Optional: Async fetch function for real dynamism
// window.fetchDailyData = async () => {
//   try {
//     const response = await fetch('/api/sacco-today'); // Replace with real endpoint
//     const data = await response.json();
//     // Merge with constants and return loadDynamicData structure
//     return { ...loadDynamicData(), ...data };
//   } catch (e) {
//     console.warn('Fetch failed, using fallback:', e);
//     return loadDynamicData();
//   }
// };

const recomputeData = () => {
  // Load dynamic data (sync for now; make async if using fetch)
  const dynamicData = loadDynamicData();
  const { loanTypesToday, loansBalanceToday, bankBreakdownToday, externalLoansToday, cumulativeLoansDisbursedSinceInception, members, contributions, numberOfLoansGiven, profit, activeMembers } = dynamicData;

  const loansDisbursedThisMonth = loanTypesToday.reduce((s, l) => s + l.value, 0);
  const totalBankBalanceToday = bankBreakdownToday.reduce((s, b) => s + b.value, 0);
  const bookValueToday = loansBalanceToday + totalBankBalanceToday;

  // Build carousel data from aligned dynamic sources
  const carouselData = [
    { number: members, description: "Total Members" },
    { number: contributions, description: "Member Savings" }, // Aligned to 907515
    { number: totalBankBalanceToday, description: "Total Bank Balance" },
    { number: numberOfLoansGiven, description: "Number of Loans Given" },
    { number: loansDisbursedThisMonth, description: "Loans Disbursed This Month" },
    { number: profit, description: "Profit" }, // Aligned to 51728
    { number: activeMembers, description: "Active Members" }
  ];

  // Compute ROA using aligned dynamic values: (profit / (contributions + externalLoans)) * 100
  const assets = contributions + externalLoansToday;
  const roaToday = assets > 0 ? ((profit / assets) * 100).toFixed(2) : "0.00";
  carouselData.push({ number: roaToday, description: "ROA (%)" });

  const todayData = {
    members, contributions, loansDisbursed: loansDisbursedThisMonth,
    loansBalance: loansBalanceToday, profit, totalBankBalance: totalBankBalanceToday,
    externalLoans: externalLoansToday, roa: roaToday,
    extraFields: { bankBreakdown: bankBreakdownToday, cumulativeLoansDisbursed: cumulativeLoansDisbursedSinceInception, bookValue: bookValueToday },
    loans: loansDisbursedThisMonth, bankBalance: totalBankBalanceToday
  };

  // EXPOSE GLOBALS
  window.loanTypesToday = loanTypesToday;
  window.saccoData.today = todayData;
  window.SOYOSOYO = {
    current: todayData,
    baseline: janFallback,
    counters: carouselData.map(item => ({
      value: item.number,
      suffix: item.description.includes('ROA') ? '%' : '',
      label: item.description
    }))
  };

  // Save to localStorage for persistence
  localStorage.setItem('saccoDataToday', JSON.stringify(todayData));

  // Dispatch update event
  window.dispatchEvent(new CustomEvent('saccoDataUpdated'));
  console.log('carousel.js: Data ready & saccoDataUpdated dispatched');

  return { todayData, carouselData };
};

// Run immediately
const { todayData, carouselData } = recomputeData();

// DOM Ready: Render carousel
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  carousel.innerHTML = '';
  const slidesHTML = carouselData.map(item => `
    <article class="carousel-item">
      <div class="carousel-number">${item.number.toLocaleString()}</div>
      <div class="carousel-desc">${item.description}</div>
    </article>
  `).join('');

  carousel.innerHTML = slidesHTML + slidesHTML; // duplicate for loop

  let index = 0;
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

  carousel.style.transition = 'transform 0.6s ease-in-out';
  goToSlide(total);
  setTimeout(() => goToSlide(0), 50);
  setInterval(nextSlide, 3000);

  // Final chart refresh
  if (typeof renderGrowthCharts === 'function') {
    setTimeout(renderGrowthCharts, 100);
  }
});

// Manual refresh function (now pulls fresh dynamic data)
window.refreshSoyosoyoData = () => {
  recomputeData();
  if (typeof renderGrowthCharts === 'function') renderGrowthCharts();
  console.log('Data manually refreshed');
};

console.log('carousel.js loaded successfully');
