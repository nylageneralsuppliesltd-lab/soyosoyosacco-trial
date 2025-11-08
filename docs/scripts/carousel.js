// scripts/carousel.js – AUTO-SYNC 4 METRICS + LIQUIDITY USING BANK BALANCE + ENHANCED EYE
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === LOAN TYPES FOR TODAY (FILL IN ACTUAL FIGURES FOR EACH TYPE) ===
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

  // === UPDATE THESE VALUES DAILY ===
  const carouselDataWithoutROA = [
    { number: 144, description: "Total Members" },
    { number: 907015, description: "Member Savings" },
    { number: 243199, description: "Bank Balance" },
    { number: 105, description: "Number of Loans Given" },
    { number: totalLoansToday, description: "Value of Loans Given" },
    { number: 51803, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  // Calculate ROA (numeric)
  const roaToday = ((carouselDataWithoutROA[5].number / (carouselDataWithoutROA[1].number + externalLoansToday)) * 100).toFixed(2);
  carouselDataWithoutROA.push({ number: parseFloat(roaToday), description: "ROA (%)" });
  const carouselData = carouselDataWithoutROA;

  window.loanTypes = loanTypesToday;  // Expose early for charts

  // === AUTO-SYNC: Jan & Today Data (with numeric parsing) ===
  const janDataWithoutROA = {
    members: 101,
    loans: 283500,
    contributions: 331263,
    profit: -60056,
    bankBalance: 113742,
    externalLoans: externalLoansJan
  };
  const roaJan = ((janDataWithoutROA.profit / (janDataWithoutROA.contributions + janDataWithoutROA.externalLoans)) * 100).toFixed(2);

  window.saccoData = {
    jan: {
      ...janDataWithoutROA,
      roa: parseFloat(roaJan)
    },
    today: {
      members: parseInt(carouselData[0].number, 10),
      loans: parseInt(totalLoansToday, 10),
      contributions: parseInt(carouselData[1].number, 10),
      profit: parseInt(carouselData[5].number, 10),
      bankBalance: parseInt(carouselData[2].number, 10),
      externalLoans: parseInt(externalLoansToday, 10),
      roa: parseFloat(carouselData[7].number)
    }
  };

  // === ENHANCED PROJECTIONS & EYE (with retries, log scaling, animation) ===
  function generateProjections() {
    if (!window.saccoData) return null;
    const projections = [];
    const years = [2025, 2026, 2027, 2028, 2029];  // Starts from current year (Nov 2025)

    const jan = window.saccoData.jan;
    const today = window.saccoData.today;

    // Numeric growth rates (fixed bug, handle zero base)
    const membersGrowth = jan.members ? (today.members - jan.members) / jan.members : 0.1;  // Default 10% if zero
    const contributionsGrowth = jan.contributions ? (today.contributions - jan.contributions) / jan.contributions : 0.2;
    const bankGrowth = jan.bankBalance ? (today.bankBalance - jan.bankBalance) / jan.bankBalance : 0.15;
    const loansGrowth = contributionsGrowth;
    const roa = today.roa / 100;

    let last = { ...today };

    years.forEach((year, i) => {
      if (i === 0) {
        projections.push({ year, ...last });
      } else {
        const members = Math.round(last.members * (1 + membersGrowth));
        const contributions = Math.round(last.contributions * (1 + contributionsGrowth));
        const bankBalance = Math.round(last.bankBalance * (1 + bankGrowth));
        const loans = Math.round(last.loans * (1 + loansGrowth));
        const profit = Math.round(roa * (loans + contributions + bankBalance));  // Progressive ROA

        const proj = { year, members, loans, contributions, bankBalance, profit };
        projections.push(proj);
        last = proj;
      }
    });

    return projections;
  }

  function renderEye(projections) {
    const container = document.getElementById('eye-visual');
    if (!container || !projections) return;

    // Clear existing
    container.innerHTML = '';

    const svgWidth = 600, svgHeight = 600;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Eye of Growth: KPI Projections 2025-2029");
    container.appendChild(svg);

    const centerX = svgWidth / 2, centerY = svgHeight / 2;
    const maxRadius = 250;

    // Max vals across all years
    const maxVals = {};
    ["members", "loans", "contributions", "bankBalance", "profit"].forEach(kpi => {
      maxVals[kpi] = Math.max(...projections.map(d => d[kpi]));
    });

    const colors = {
      members: "#1f77b4",
      loans: "#ff7f0e",
      contributions: "#2ca02c",
      bankBalance: "#d62728",
      profit: "#9467bd"
    };

    // Improved normalize: Log scale for large values (prevents tiny rings for small KPIs)
    const normalize = (val, maxVal) => {
      if (!maxVal || val <= 0) return 0;
      const logScale = Math.log(val + 1) / Math.log(maxVal + 1);  // Log for balance
      return logScale * maxRadius;
    };

    // Draw rings for last year (with animation & tooltips)
    const kpis = ["members", "loans", "contributions", "bankBalance", "profit"];
    kpis.forEach((kpi, index) => {
      const r = normalize(projections[projections.length - 1][kpi], maxVals[kpi]);
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", centerX);
      circle.setAttribute("cy", centerY);
      circle.setAttribute("r", 0);  // Start at 0 for animation
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", colors[kpi]);
      circle.setAttribute("stroke-width", "8");
      circle.setAttribute("stroke-linecap", "round");
      circle.setAttribute("aria-label", `${kpi} projection`);
      svg.appendChild(circle);

      // Animate radius growth
      const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      animate.setAttribute("attributeName", "r");
      animate.setAttribute("from", "0");
      animate.setAttribute("to", r);
      animate.setAttribute("dur", "2s");
      animate.setAttribute("fill", "freeze");
      animate.beginElement();

      // Tooltip
      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${kpi.charAt(0).toUpperCase() + kpi.slice(1)}: KES ${projections[projections.length - 1][kpi].toLocaleString()}`;
      circle.appendChild(title);
    });

    // Pupil (animated scale-in)
    const pupil = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pupil.setAttribute("cx", centerX);
    pupil.setAttribute("cy", centerY);
    pupil.setAttribute("r", 0);
    pupil.setAttribute("fill", "#000");
    svg.appendChild(pupil);

    const pupilAnimate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    pupilAnimate.setAttribute("attributeName", "r");
    pupilAnimate.setAttribute("from", "0");
    pupilAnimate.setAttribute("to", "20");
    pupilAnimate.setAttribute("dur", "1.5s");
    pupilAnimate.setAttribute("fill", "freeze");
    pupilAnimate.beginElement();

    // Year labels (clickable to highlight rings)
    projections.forEach((d, i) => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", centerX);
      text.setAttribute("y", centerY - maxRadius - 10 - i * 20);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "14");
      text.setAttribute("fill", "#1a1a1a");
      text.setAttribute("cursor", "pointer");
      text.textContent = d.year;
      text.onclick = () => highlightYear(i);  // Pulse rings for that year
      svg.appendChild(text);
    });

    function highlightYear(yearIndex) {
      kpis.forEach((kpi, kpiIndex) => {
        const circle = svg.children[kpiIndex];  // Rings are first children
        const targetR = normalize(projections[yearIndex][kpi], maxVals[kpi]);
        circle.style.strokeWidth = "12";  // Thicken
        circle.style.stroke = colors[kpi];
        setTimeout(() => { circle.style.strokeWidth = "8"; }, 1000);  // Reset
      });
    }

    window.projections = projections;
  }

  // Retry queue for data readiness
  let retryCount = 0;
  const maxRetries = 10;
  function attemptRender() {
    const projections = generateProjections();
    if (projections && projections.length === 5) {
      renderEye(projections);
      renderProjectionsTable();  // From HTML script
      initKPILegend();  // From HTML script
      console.log('Eye & Projections rendered successfully');
      return;
    }
    if (retryCount < maxRetries) {
      retryCount++;
      setTimeout(attemptRender, 100 * retryCount);  // Exponential backoff
    } else {
      console.error('Failed to render projections after retries - using fallback');
      // Fallback sample data
      window.projections = [
        { year: 2025, members: 144, loans: 2057900, contributions: 907015, bankBalance: 243199, profit: 51803 },
        { year: 2026, members: 205, loans: 5634635, contributions: 2483453, bankBalance: 519999, profit: 424994 },
        { year: 2027, members: 292, loans: 15427918, contributions: 6799821, bankBalance: 1111843, profit: 1148307 },
        { year: 2028, members: 416, loans: 42242427, contributions: 18618257, bankBalance: 2377302, profit: 3111309 },
        { year: 2029, members: 593, loans: 115661921, contributions: 50977738, bankBalance: 5083061, profit: 8448758 }
      ];
      renderEye(window.projections);
    }
  }

  // Queue render after DOM
  setTimeout(attemptRender, 50);

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
