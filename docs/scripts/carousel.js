// scripts/carousel.js – AUTO-SYNC 4 METRICS + LIQUIDITY USING BANK BALANCE
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === LOAN TYPES FOR TODAY (FILL IN ACTUAL FIGURES FOR EACH TYPE) ===
  // Provide the amounts for each loan type; their sum will be used for "Value of Loans Given"
  const loanTypesToday = [
    { name: 'Emergency', value: 1214900 },   // ← Replace with actual Emergency loan figure
    { name: 'Medicare', value: 15000 },    // ← Replace with actual Medicare loan figure
    { name: 'Development', value: 553000 }, // ← Replace with actual Development loan figure
    { name: 'Education', value: 275000 }    // ← Replace with actual Education loan figure
  ];

  // Calculate total loans given from sum of loan types
  const totalLoansToday = loanTypesToday.reduce((sum, loan) => sum + loan.value, 0);

  // === EXTERNAL LOANS ===
  const externalLoansJan = 0;  // Jan 2025 external loan figure
  const externalLoansToday = 66784;  // Today external loan figure

  // === UPDATE THESE VALUES DAILY (ADJUSTED FOR LOANS AND ROA) ===
  const carouselDataWithoutROA = [
    { number: 144, description: "Total Members" },
    { number: 907015, description: "Member Savings" },
    { number: 243199, description: "Bank Balance" },
    { number: 105, description: "Number of Loans Given" },
    { number: totalLoansToday, description: "Value of Loans Given" },  // Dynamically generated from loan types sum
    { number: 51803, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  // Dynamically calculate ROA using profit and member savings from carouselDataWithoutROA
  const roaToday = ((carouselDataWithoutROA[5].number / (carouselDataWithoutROA[1].number + externalLoansToday)) * 100).toFixed(2);
  carouselDataWithoutROA.push({ number: roaToday, description: "ROA (%)" });  // ROA = (Profit / (Member Contributions + External Loans)) * 100
  const carouselData = carouselDataWithoutROA;

  // Expose loan types globally for use in HTML graph (e.g., for percentages)
  window.loanTypes = loanTypesToday;

  // === AUTO-SYNC: Push 4 key values + Jan 2025 bank balance + external loans + ROA to window.saccoData ===
  // Jan 2025 data without ROA
  const janDataWithoutROA = {
    members: 101,
    loans: 283500,
    contributions: 331263,
    profit: -60056,
    bankBalance: 113742,  // ← JAN 2025 BANK BALANCE (AS PROVIDED)
    externalLoans: externalLoansJan
  };
  // Dynamically calculate ROA for Jan using profit and contributions from janDataWithoutROA
  const roaJan = ((janDataWithoutROA.profit / (janDataWithoutROA.contributions + janDataWithoutROA.externalLoans)) * 100).toFixed(2);

  window.saccoData = {
    jan: {
      ...janDataWithoutROA,
      roa: roaJan  // ROA for Jan
    },
    today: {
      members: carouselData[0].number,           // Total Members
      loans: totalLoansToday,                    // Value of Loans Given (from loan types sum)
      contributions: carouselData[1].number,     // Member Savings
      profit: carouselData[5].number,            // Profit
      bankBalance: carouselData[2].number,       // Bank Balance (Today)
      externalLoans: externalLoansToday,
      roa: carouselData[7].number                // ROA for today
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
