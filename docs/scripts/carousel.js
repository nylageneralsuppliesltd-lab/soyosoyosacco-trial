// scripts/carousel.js – SOYOSOYO SACCO – FULLY FIXED & CLEAN
// NO PLOTLY → NO ERRORS → PURE CAROUSEL + DATA ENGINE
// Works only on index.html | Safe on About.html | ROA = profit / (contributions + externalLoans)

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
  bookValue: 363742,
  externalLoans: 0,
  loans: 283500,
  bankBalance: 113742,
  roa: "2.1"
};

// Initialize globals EARLY
window.saccoData = { jan: janFallback, today: {} };
window.loanTypesToday = [];

// DYNAMIC DATA (UPDATE DAILY — ALIGNED VALUES)
let loadDynamicData = () => {
  return {
    loanTypesToday: [
      { name: 'Emergency', value: 1237900 },
      { name: 'Medicare', value: 15000 },
      { name: 'Development', value: 643000 },
      { name: 'Education', value: 275000 }
    ],
    loansBalanceToday: 876141.66,
    bankBreakdownToday: [
      { name: 'Co-operative Bank', value: 2120.65 },
      { name: 'Chamasoft', value: 6695 },
      { name: 'Cytonn', value: 146465 }
    ],
    externalLoansToday: 66784,
    cumulativeLoansDisbursedSinceInception: 5000000,
    members: 144,
    contributions: 908415,    // ALIGNED
    numberOfLoansGiven: 109,
    profit: 53268,            // ALIGNED
    activeMembers: 71
  };
};

const recomputeData = () => {
  const dynamicData = loadDynamicData();
  const {
    loanTypesToday, loansBalanceToday, bankBreakdownToday, externalLoansToday,
    cumulativeLoansDisbursedSinceInception, members, contributions,
    numberOfLoansGiven, profit, activeMembers
  } = dynamicData;

  const loansDisbursedThisMonth = loanTypesToday.reduce((s, l) => s + l.value, 0);
  const totalBankBalanceToday = bankBreakdownToday.reduce((s, b) => s + b.value, 0);
  const bookValueToday = loansBalanceToday + totalBankBalanceToday;

  // ROA = (profit / (contributions + externalLoans)) * 100
  const totalAssets = contributions + externalLoansToday;
  const roaToday = totalAssets > 0 ? ((profit / totalAssets) * 100).toFixed(2) : "0.00";

  const carouselData = [
    { number: members, description: "Total Members" },
    { number: contributions, description: "Member Savings" },
    { number: totalBankBalanceToday, description: "Total Bank Balance" },
    { number: numberOfLoansGiven, description: "Number of Loans Given" },
    { number: loansDisbursedThisMonth, description: "Loans Disbursed This Month" },
    { number: profit, description: "Profit" },
    { number: activeMembers, description: "Active Members" },
    { number: roaToday, description: "ROA (%)" }
  ];

  const todayData = {
    members, contributions, loansDisbursed: loansDisbursedThisMonth,
    loansBalance: loansBalanceToday, profit, totalBankBalance: totalBankBalanceToday,
    externalLoans: externalLoansToday, roa: roaToday,
    extraFields: {
      bankBreakdown: bankBreakdownToday,
      cumulativeLoansDisbursed: cumulativeLoansDisbursedSinceInception,
      bookValue: bookValueToday
    },
    loans: loansDisbursedThisMonth,
    bankBalance: totalBankBalanceToday
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

  localStorage.setItem('saccoDataToday', JSON.stringify(todayData));
  window.dispatchEvent(new CustomEvent('saccoDataUpdated'));
  console.log('carousel.js: Data recomputed & saccoDataUpdated dispatched');

  return { todayData, carouselData };
};

// RUN ONCE
const { carouselData } = recomputeData();

// DOM READY: RENDER CAROUSEL
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.carousel');
  if (!carousel) {
    console.log('carousel.js: No .carousel found. Skipping render.');
    return;
  }

  carousel.innerHTML = '';
  const slidesHTML = carouselData.map(item => `
    <article class="carousel-item">
      <div class="carousel-number">
        ${item.description.includes('ROA') ? item.number : item.number.toLocaleString()}
        ${item.description.includes('ROA') ? '%' : ''}
      </div>
      <div class="carousel-desc">${item.description}</div>
    </article>
  `).join('');

  carousel.innerHTML = slidesHTML + slidesHTML; // Duplicate for infinite loop

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

  // Initialize
  carousel.style.transition = 'transform 0.6s ease-in-out';
  goToSlide(total);
  setTimeout(() => goToSlide(0), 50);
  setInterval(nextSlide, 3000);

  console.log('carousel.js: Carousel rendered with', total, 'slides');
});

// MANUAL REFRESH
window.refreshSoyosoyoData = () => {
  recomputeData();
  console.log('Data manually refreshed via refreshSoyosoyoData()');
};

console.log('carousel.js loaded successfully');
