// scripts/carousel.js – FULLY FIXED + SOYOSOYO + ALIGNED WITH ABOUT.HTML KEYS + TOTAL ASSETS = LOANS BAL + BANK BAL + ROA RECALC
document.addEventListener('DOMContentLoaded', () => {
  const janFallback = { members: 101, contributions: 331263, loansBalance: 283500, loans: 283500, profit: -60056, externalLoans: 0, bankBalance: 113742, totalBankBalance: 113742 };
  window.saccoData = { jan: janFallback, today: {} };
  window.loanTypesToday = [];

  const loadDynamicData = () => ({
    loanTypesToday: [
      { name: 'Emergency', value: 1237900 },
      { name: 'Medicare', value: 15000 },
      { name: 'Development', value: 713000 },
      { name: 'Education', value: 275000 }
    ],
    loansBalanceToday: 928677.15,  // Aligned: Added for About.html
    bankBreakdownToday: [
      { name: 'Co-operative Bank', value: 2120.65 },
      { name: 'Chamasoft', value: 6194 },
      { name: 'Cytonn', value: 111320 }
    ],
    externalLoansToday: 66784,
    members: 145,
    contributions: 923765,
    numberOfLoansGiven: 112,
    profit: 54818,
    activeMembers: 71
  });

  const recomputeData = () => {
    const d = loadDynamicData();
    const loansDisbursed = d.loanTypesToday.reduce((s, l) => s + l.value, 0);
    const bankBalance = d.bankBreakdownToday.reduce((s, b) => s + b.value, 0);
    const totalAssets = d.loansBalanceToday + bankBalance;  // Updated: Exact formula (Loans Balance + Bank Balance)
    const roa = totalAssets > 0 ? ((d.profit / totalAssets) * 100).toFixed(1) : 0;  // Recalculated: Profit / Total Assets * 100, rounded to 1 decimal (≈5.2)

    // Aligned: Set full keys expected by About.html (extraFields, loansBalance, totalBankBalance, totalAssets)
    const todayData = {
      members: d.members,
      contributions: d.contributions,
      loansDisbursed: loansDisbursed,  // Exact key for About.html
      loans: loansDisbursed,  // Keep for legacy
      loansBalance: d.loansBalanceToday,  // Exact key for About.html
      totalBankBalance: bankBalance,  // Exact key for About.html
      bankBalance: bankBalance,  // Keep for legacy
      profit: d.profit,
      externalLoans: d.externalLoansToday,
      roa: roa,  // Recalculated to match formula
      extraFields: {  // Exact structure for About.html (bankBreakdown, bookValue)
        bankBreakdown: d.bankBreakdownToday,
        bookValue: totalAssets  // Updated: Now uses the precise formula for totalAssets
      }
    };

    window.loanTypesToday = d.loanTypesToday;
    window.saccoData.today = todayData;

    if (typeof showLiveData === "function") showLiveData(); // triggers auto-save and DB sync

    // RESTORE SOYOSOYO FOR PROJECTIONS (unchanged, uses recalced roa)
    window.SOYOSOYO = {
      current: window.saccoData.today,
      baseline: janFallback,
      counters: [
        { number: d.members, description: "Total Members" },
        { number: d.contributions, description: "Member Savings" },
        { number: bankBalance, description: "Total Bank Balance" },
        { number: d.numberOfLoansGiven, description: "Number of Loans Given" },
        { number: loansDisbursed, description: "Loans Disbursed" },
        { number: d.profit, description: "Profit" },
        { number: d.activeMembers, description: "Active Members" },
        { number: roa, description: "ROA (%)" }
      ].map(item => ({
        value: item.number,
        suffix: item.description.includes('ROA') ? '%' : '',
        label: item.description
      }))
    };

    window.dispatchEvent(new CustomEvent('saccoDataUpdated'));
    return window.SOYOSOYO.counters;  // Return for carousel use
  };

  const carouselData = recomputeData();
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  const itemsHTML = carouselData.map(item => `
    <article class="carousel-item">
      <div class="carousel-button">
        <span class="counter-value" data-target="${item.value}">${item.suffix ? '0' : '0'}</span>
        ${item.suffix ? `<span>${item.suffix}</span>` : ''}
      </div>
      <p class="carousel-description">${item.label}</p>
    </article>
  `).join('');

  carousel.innerHTML = itemsHTML + itemsHTML;

  const formatNumber = n => n.toLocaleString();
  const animateCounter = (el, target) => {
    const end = +target;
    let start = 0;
    let id = null;
    const step = now => {
      if (!id) id = now;
      const progress = Math.min((now - id) / 800, 1);
      const value = Math.round(start + progress * (end - start));
      el.textContent = formatNumber(value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target.querySelector('.counter-value');
        if (counter && counter.textContent === '0') {
          animateCounter(counter, counter.dataset.target);
          observer.unobserve(entry.target);
        }
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.carousel-item').forEach(item => observer.observe(item));

  const updateVars = () => {
    const w = window.innerWidth;
    const itemWidth = w <= 600 ? 180 : w <= 360 ? 160 : 300;
    const margin = w <= 600 ? 20 : w <= 360 ? 15 : 40;
    const total = carouselData.length * (itemWidth + 2 * margin);
    document.documentElement.style.setProperty('--item-width', `${itemWidth}px`);
    document.documentElement.style.setProperty('--item-margin', `${margin}px`);
    document.documentElement.style.setProperty('--carousel-translate', `-${total}px`);
    document.documentElement.style.setProperty('--carousel-duration', `${carouselData.length * 7}s`);
  };

  window.addEventListener('resize', updateVars);
  updateVars();

  setTimeout(() => {
    document.querySelectorAll('.counter-value').forEach(c => {
      if (c.textContent === '0') animateCounter(c, c.dataset.target);
    });
  }, 500);
});
