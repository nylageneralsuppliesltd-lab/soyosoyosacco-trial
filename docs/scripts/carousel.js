// scripts/carousel.js – SOYOSOYO SACCO – MONTHLY HISTORY + AUTO-SAVE + BREAKDOWNS
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

  const totalLoansDisbursedToday = loanTypesToday.reduce((sum, l) => sum + l.value, 0); // Monthly disbursed

  const cumulativeLoansDisbursedToday = 5000000; // Since inception (hidden, not displayed)

  const loanBalanceToday = 1800000; // Outstanding loan balance (hidden)

  const bankBreakdownToday = [
    { name: 'Co-operative Bank', value: 2120.65 },
    { name: 'Chamasoft', value: 51954 },
    { name: 'Cytonn', value: 186550 }
  ];

  const totalBankBalanceToday = bankBreakdownToday.reduce((sum, b) => sum + b.value, 0);

  const bookValueToday = loanBalanceToday + totalBankBalanceToday; // Total assets/book value (hidden)

  const externalLoansToday = 66784;

  const carouselDataWithoutROA = [
    { number: 144, description: "Total Members" },
    { number: 907515, description: "Member Savings" },
    { number: totalBankBalanceToday, description: "Total Bank Balance" }, // Updated title, total only (breakdown hidden)
    { number: 106, description: "Number of Loans Given" },
    { number: totalLoansDisbursedToday, description: "Loans Disbursed This Month" }, // Clarified as monthly
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
  window.bankBreakdown = bankBreakdownToday; // For editing, like loanTypes

  // === JAN 2025 BASELINE (fallback if not in history) ===
  const janFallback = {
    members: 101,
    contributions: 331263,
    loansDisbursed: 283500,
    loansBalance: 250000, // Example baseline
    profit: -60056,
    totalBankBalance: 113742,
    bankBreakdown: [{ name: 'Co-operative Bank', value: 50000 }, { name: 'Chamasoft', value: 20000 }, { name: 'Cytonn', value: 43742 }],
    bookValue: 250000 + 113742,
    externalLoans: 0,
    cumulativeLoansDisbursed: 1000000 // Example
  };

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentPeriod = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const currentMonthData = saccoHistory[currentPeriod] || janFallback; // Use jan as fallback for first month
  const roaCurrent = (currentMonthData.contributions + currentMonthData.externalLoans > 0)
    ? ((currentMonthData.profit / (currentMonthData.contributions + currentMonthData.externalLoans)) * 100).toFixed(2)
    : 0;

  // === FINAL DATA OBJECT ===
  const todayData = {
    members: carouselData[0].number,
    contributions: carouselData[1].number, // Member Savings
    loansDisbursed: totalLoansDisbursedToday, // Monthly
    loansBalance: loanBalanceToday,
    profit: carouselData[5].number,
    totalBankBalance: totalBankBalanceToday,
    externalLoans: externalLoansToday,
    roa: roaToday,
    extraFields: { // Hidden fields for history/About (not in carousel display)
      bankBreakdown: bankBreakdownToday,
      bookValue: bookValueToday,
      cumulativeLoansDisbursed: cumulativeLoansDisbursedToday
    }
  };

  window.saccoData = {
    [currentPeriod]: { ...currentMonthData, roa: roaCurrent },
    today: todayData
  };

  // Persist current data for About page fetch
  localStorage.setItem('saccoDataToday', JSON.stringify(todayData));

  // === MONTHLY AUTO-SAVE IF NOT EXISTS ===
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
      bookValue: todayData.extraFields.bookValue,
      cumulativeLoansDisbursed: todayData.extraFields.cumulativeLoansDisbursed,
      roa: todayData.roa,
      dateSaved: currentDate.toISOString()
    };
    saveHistory(saccoHistory);
    console.log(`SOYOSOYO SACCO ${currentPeriod} DATA SAVED TO HISTORY`);
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

  // Expose for About page (if loaded separately)
  if (typeof window.updateCarouselData === 'function') {
    window.updateCarouselData = () => { /* Refresh logic if needed */ };
  }
});
