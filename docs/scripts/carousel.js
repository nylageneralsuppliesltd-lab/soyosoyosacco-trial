// scripts/carousel.js – SOYOSOYO SACCO – FULLY FIXED & COMPLETE
// Fixes: SyntaxError, pie chart error, projections fallback, event dispatch

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

// Today's real data — UPDATE THESE DAILY
let loanTypesToday = [
  { name: 'Emergency', value: 1217900 },
  { name: 'Medicare', value: 15000 },
  { name: 'Development', value: 553000 },
  { name: 'Education', value: 275000 }
];

let loansBalanceToday = 788357.66;
let bankBreakdownToday = [
  { name: 'Co-operative Bank', value: 2120.65 },
  { name: 'Chamasoft', value: 51954 },
  { name: 'Cytonn', value: 186550 }
];
let externalLoansToday = 66784;
const cumulativeLoansDisbursedSinceInception = 5000000;

// Recompute everything
const recomputeData = () => {
  const loansDisbursedThisMonth = loanTypesToday.reduce((s, l) => s + l.value, 0);
  const totalBankBalanceToday = bankBreakdownToday.reduce((s, b) => s + b.value, 0);
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

  const assets = carouselDataWithoutROA[1].number + externalLoansToday;
  const roaToday = assets > 0 ? ((51728 / assets) * 100).toFixed(2) : "0.00";
  carouselDataWithoutROA.push({ number: roaToday, description: "ROA (%)" });
  const carouselData = carouselDataWithoutROA;

  const todayData = {
    members: 144, contributions: 907515, loansDisbursed: loansDisbursedThisMonth,
    loansBalance: loansBalanceToday, profit: 51728, totalBankBalance: totalBankBalanceToday,
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

  // Save to localStorage
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

// Manual refresh function
window.refreshSoyosoyoData = () => {
  recomputeData();
  if (typeof renderGrowthCharts === 'function') renderGrowthCharts();
  console.log('Data manually refreshed');
};

console.log('carousel.js loaded successfully');
