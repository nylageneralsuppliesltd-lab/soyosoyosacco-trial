/* scripts/carousel.js – FULLY WORKING EYE + PROJECTIONS + CAROUSEL */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === LOAN TYPES TODAY ===
  const loanTypesToday = [
    { name: 'Emergency', value: 1214900 },
    { name: 'Medicare', value: 15000 },
    { name: 'Development', value: 553000 },
    { name: 'Education', value: 275000 }
  ];
  const totalLoansToday = loanTypesToday.reduce((sum, loan) => sum + loan.value, 0);
  window.loanTypes = loanTypesToday;

  const externalLoansToday = 66784;
  const externalLoansJan = 0;

  // === CAROUSEL DATA ===
  const carouselDataWithoutROA = [
    { number: 144, description: "Total Members" },
    { number: 907015, description: "Member Savings" },
    { number: 243199, description: "Bank Balance" },
    { number: 105, description: "Number of Loans Given" },
    { number: totalLoansToday, description: "Value of Loans Given" },
    { number: 51803, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  const roaToday = ((carouselDataWithoutROA[5].number / (carouselDataWithoutROA[1].number + externalLoansToday)) * 100).toFixed(2);
  carouselDataWithoutROA.push({ number: parseFloat(roaToday), description: "ROA (%)" });
  const carouselData = carouselDataWithoutROA;

  // === JAN 2025 BASELINE ===
  const janDataWithoutROA = {
    members: 101, loans: 283500, contributions: 331263, profit: -60056,
    bankBalance: 113742, externalLoans: externalLoansJan
  };
  const roaJan = ((janDataWithoutROA.profit / (janDataWithoutROA.contributions + janDataWithoutROA.externalLoans)) * 100).toFixed(2);
  window.saccoData = {
    jan: { ...janDataWithoutROA, roa: parseFloat(roaJan) },
    today: {
      members: carouselData[0].number,
      loans: totalLoansToday,
      contributions: carouselData[1].number,
      profit: carouselData[5].number,
      bankBalance: carouselData[2].number,
      externalLoans: externalLoansToday,
      roa: parseFloat(roaToday)
    }
  };

  // === GENERATE PROJECTIONS ===
  function generateProjections() {
    const { jan, today } = window.saccoData;
    const years = [2025, 2026, 2027, 2028, 2029];
    const membersGrowth = jan.members ? (today.members - jan.members) / jan.members : 0.1;
    const contributionsGrowth = jan.contributions ? (today.contributions - jan.contributions) / jan.contributions : 0.2;
    const bankGrowth = jan.bankBalance ? (today.bankBalance - jan.bankBalance) / jan.bankBalance : 0.15;
    const loansGrowth = contributionsGrowth;
    const roa = today.roa / 100;

    const projections = [];
    let last = { ...today };

    years.forEach((year, i) => {
      if (i === 0) projections.push({ year, ...last });
      else {
        const members = Math.round(last.members * (1 + membersGrowth));
        const contributions = Math.round(last.contributions * (1 + contributionsGrowth));
        const bankBalance = Math.round(last.bankBalance * (1 + bankGrowth));
        const loans = Math.round(last.loans * (1 + loansGrowth));
        const profit = Math.round(roa * (loans + contributions + bankBalance));
        const proj = { year, members, loans, contributions, bankBalance, profit };
        projections.push(proj);
        last = proj;
      }
    });
    return projections;
  }

  // === RENDER EYE ===
  function renderEye(projections) {
    const container = document.getElementById('eye-visual');
    if (!container || !projections) return;
    container.innerHTML = '';

    const width = 600, height = 600;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Eye of Growth: KPI Projections 2025-2029");
    container.appendChild(svg);

    const cx = width / 2, cy = height / 2, maxR = 250;
    const maxVals = {};
    const kpis = ["members", "loans", "contributions", "bankBalance", "profit"];
    kpis.forEach(k => maxVals[k] = Math.max(...projections.map(d => d[k])));

    const colors = { members: "#1f77b4", loans: "#ff7f0e", contributions: "#2ca02c", bankBalance: "#d62728", profit: "#9467bd" };
    const normalize = (val, max) => !max || val <= 0 ? 0 : (Math.log(val + 1) / Math.log(max + 1)) * maxR;

    kpis.forEach((kpi, i) => {
      const r = normalize(projections[projections.length - 1][kpi], maxVals[kpi]);
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", cx); circle.setAttribute("cy", cy); circle.setAttribute("r", 0);
      circle.setAttribute("fill", "none"); circle.setAttribute("stroke", colors[kpi]);
      circle.setAttribute("stroke-width", "8"); circle.setAttribute("stroke-linecap", "round");
      svg.appendChild(circle);

      const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = `${kpi.charAt(0).toUpperCase() + kpi.slice(1)}: KES ${projections[projections.length - 1][kpi].toLocaleString()}`;
      circle.appendChild(title);

      const anim = document.createElementNS("http://www.w3.org/2000/svg", "animate");
      anim.setAttribute("attributeName", "r"); anim.setAttribute("from", "0"); anim.setAttribute("to", r);
      anim.setAttribute("dur", "2s"); anim.setAttribute("fill", "freeze");
      circle.appendChild(anim); anim.beginElement();
    });

    const pupil = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pupil.setAttribute("cx", cx); pupil.setAttribute("cy", cy); pupil.setAttribute("r", 0); pupil.setAttribute("fill", "#000");
    svg.appendChild(pupil);
    const pa = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    pa.setAttribute("attributeName", "r"); pa.setAttribute("from", "0"); pa.setAttribute("to", "20");
    pa.setAttribute("dur", "1.5s"); pa.setAttribute("fill", "freeze");
    pupil.appendChild(pa); pa.beginElement();

    projections.forEach((d, i) => {
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", cx); text.setAttribute("y", cy - maxR - 10 - i * 20);
      text.setAttribute("text-anchor", "middle"); text.setAttribute("font-size", "14");
      text.setAttribute("fill", "#1a1a1a"); text.setAttribute("cursor", "pointer");
      text.textContent = d.year;
      text.onclick = () => {
        kpis.forEach((k, ki) => {
          const c = svg.children[ki];
          const r = normalize(projections[i][k], maxVals[k]);
          c.setAttribute("stroke-width", "12");
          setTimeout(() => c.setAttribute("stroke-width", "8"), 1000);
        });
      };
      svg.appendChild(text);
    });

    window.projections = projections;
  }

  // === RENDER WITH RETRY ===
  let retry = 0;
  function tryRender() {
    const proj = generateProjections();
    if (proj && proj.length === 5) {
      renderEye(proj);
      return;
    }
    if (retry++ < 10) setTimeout(tryRender, 100 * retry);
  }
  setTimeout(tryRender, 50);

  // === CAROUSEL (unchanged) ===
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
    return (abs >= 1000 ? (abs / 1000).toFixed(0) + 'k' : abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
      if (entry.isIntersecting && btn) animateCounter(btn, btn.dataset.target);
      else if (btn) btn.textContent = '0';
    });
  }, { threshold: 0.3 });

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
});
