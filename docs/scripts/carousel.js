/* scripts/carousel.js – EYE OF GROWTH → GROWTH CONE (v56) */
document.addEventListener('DOMContentLoaded', () => {
  // === DAILY DATA (UPDATE HERE ONLY) ===
  const loanTypesToday = [
    { name: 'Emergency', value: 1214900 },
    { name: 'Medicare', value: 15000 },
    { name: 'Development', value: 553000 },
    { name: 'Education', value: 275000 }
  ];
  const totalLoansToday = loanTypesToday.reduce((s, l) => s + l.value, 0);
  window.loanTypes = loanTypesToday;

  const externalLoansToday = 66784;
  const externalLoansJan = 0;

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

  const janData = {
    members: 101, loans: 283500, contributions: 331263, profit: -60056,
    bankBalance: 113742, externalLoans: externalLoansJan,
    roa: ((-60056 / (331263 + 0)) * 100).toFixed(2)
  };

  window.saccoData = {
    jan: janData,
    today: {
      members: carouselDataWithoutROA[0].number,
      loans: totalLoansToday,
      contributions: carouselDataWithoutROA[1].number,
      profit: carouselDataWithoutROA[5].number,
      bankBalance: carouselDataWithoutROA[2].number,
      externalLoans: externalLoansToday,
      roa: parseFloat(roaToday)
    }
  };

  // === GENERATE PROJECTIONS ===
  function generateProjections() {
    const { jan, today } = window.saccoData;
    const years = [2025, 2026, 2027, 2028, 2029];
    const rates = {
      members: jan.members ? (today.members - jan.members) / jan.members : 0.1,
      contributions: jan.contributions ? (today.contributions - jan.contributions) / jan.contributions : 0.2,
      bank: jan.bankBalance ? (today.bankBalance - jan.bankBalance) / jan.bankBalance : 0.15,
      loans: 0.2,
      roa: today.roa / 100
    };

    const proj = [];
    let last = { ...today };
    years.forEach((y, i) => {
      if (i === 0) proj.push({ year: y, ...last });
      else {
        const p = {
          year: y,
          members: Math.round(last.members * (1 + rates.members)),
          contributions: Math.round(last.contributions * (1 + rates.contributions)),
          bankBalance: Math.round(last.bankBalance * (1 + rates.bank)),
          loans: Math.round(last.loans * (1 + rates.loans)),
          profit: Math.round(rates.roa * (last.loans + last.contributions + last.bankBalance))
        };
        proj.push(p); last = p;
      }
    });
    return proj;
  }

  // === RENDER GROWTH CONE (REPLACES OLD EYE) ===
  function renderEye(projections) {
    const container = document.getElementById('growth-cone-container');
    if (!container) {
      console.warn('growth-cone-container not found');
      return;
    }

    container.innerHTML = `
      <div class="growth-cone" id="cone-svg-wrapper">
        <svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg"></svg>
      </div>
    `;

    const svg = container.querySelector('svg');
    const maxWidth = 500;
    const baseY = 450;
    const topY = 50;
    const centerX = 300;

    projections.forEach((p, i) => {
      const width = (i / (projections.length - 1)) * maxWidth;
      const x1 = centerX - width / 2;
      const x2 = centerX + width / 2;
      const y = baseY - (i * (baseY - topY) / (projections.length - 1));

      if (i > 0) {
        const prev = projections[i - 1];
        const prevWidth = ((i - 1) / (projections.length - 1)) * maxWidth;
        const prevX1 = centerX - prevWidth / 2;
        const prevX2 = centerX + prevWidth / 2;
        const prevY = baseY - ((i - 1) * (baseY - topY) / (projections.length - 1));

        ['x1', 'x2'].forEach((side, si) => {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', si === 0 ? prevX1 : prevX2);
          line.setAttribute('y1', prevY);
          line.setAttribute('x2', si === 0 ? x1 : x2);
          line.setAttribute('y2', y);
          line.setAttribute('class', 'cone-line');
          svg.appendChild(line);
        });
      }

      // Year Label
      const yearText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yearText.setAttribute('x', centerX);
      yearText.setAttribute('y', y - 25);
      yearText.setAttribute('class', 'cone-year');
      yearText.textContent = p.year;
      yearText.onclick = () => {
        alert(`${p.year}\nMembers: ${p.members}\nLoans: KES ${p.loans.toLocaleString()}\nContributions: KES ${p.contributions.toLocaleString()}\nProfit: KES ${p.profit.toLocaleString()}`);
      };
      svg.appendChild(yearText);

      // KPIs
      const kpis = [
        `${p.members} Members`,
        `KES ${(p.loans / 1000).toFixed(0)}k Loans`,
        `KES ${(p.contributions / 1000).toFixed(0)}k Contrib`
      ];
      kpis.forEach((kpi, ki) => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', centerX);
        text.setAttribute('y', y + 20 + ki * 22);
        text.setAttribute('class', 'cone-kpi');
        text.textContent = kpi;
        svg.appendChild(text);
      });
    });

    // Highlight TODAY
    const highlight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    highlight.setAttribute('cx', centerX);
    highlight.setAttribute('cy', baseY);
    highlight.setAttribute('r', 85);
    highlight.setAttribute('class', 'cone-highlight');
    svg.appendChild(highlight);

    const todayLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    todayLabel.setAttribute('x', centerX);
    todayLabel.setAttribute('y', baseY + 5);
    todayLabel.setAttribute('text-anchor', 'middle');
    todayLabel.setAttribute('font-weight', 'bold');
    todayLabel.setAttribute('font-size', '14');
    todayLabel.setAttribute('fill', '#006400');
    todayLabel.textContent = 'TODAY';
    svg.appendChild(todayLabel);
  }

  // === RENDER WITH FALLBACK (UNCHANGED) ===
  let tries = 0;
  function tryRender() {
    const p = generateProjections();
    if (p && p.length === 5) {
      renderEye(p);
      return;
    }
    if (tries++ < 5) setTimeout(tryRender, 200);
    else renderEye([
      {year:2025,members:144,loans:2057900,contributions:907015,bankBalance:243199,profit:51803},
      {year:2026,members:202,loans:3500000,contributions:1200000,bankBalance:400000,profit:150000},
      {year:2027,members:280,loans:6000000,contributions:1800000,bankBalance:700000,profit:300000},
      {year:2028,members:380,loans:9000000,contributions:2500000,bankBalance:1100000,profit:500000},
      {year:2029,members:500,loans:13000000,contributions:3500000,bankBalance:1600000,profit:800000}
    ]);
  }
  setTimeout(tryRender, 100);

  // === CAROUSEL (UNCHANGED – PRESERVED FROM ORIGINAL) ===
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const itemHTML = carouselDataWithoutROA.map(m => `
      <article class="carousel-item">
        <h3 class="carousel-button" data-target="${m.number}">0</h3>
        <p class="carousel-description">${m.description}</p>
      </article>
    `).join('');
    carousel.innerHTML = itemHTML + itemHTML;

    const format = n => isNaN(n) ? n : (Math.abs(n) >= 1000 ? (Math.abs(n)/1000).toFixed(0)+'k' : Math.abs(n));
    const animate = (el, t) => {
      let s = 0; const d = 600;
      const st = performance.now();
      const step = now => {
        const p = Math.min((now-st)/d, 1);
        el.textContent = format(Math.round(s + p * (t - s)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver(e => e.forEach(en => {
      const b = en.target.querySelector('.carousel-button');
      if (en.isIntersecting && b) animate(b, b.dataset.target);
      else if (b) b.textContent = '0';
    }), { threshold: 0.3 });

    document.querySelectorAll('.carousel-item').forEach(i => obs.observe(i));

    const resize = () => {
      const w = window.innerWidth;
      const iw = w <= 768 ? 220 : 300;
      const m = w <= 768 ? 20 : 40;
      const tot = carouselDataWithoutROA.length * (iw + 2*m);
      document.documentElement.style.setProperty('--item-width', iw + 'px');
      document.documentElement.style.setProperty('--item-margin', m + 'px');
      document.documentElement.style.setProperty('--carousel-translate', `-${tot}px`);
      document.documentElement.style.setProperty('--carousel-duration', `${carouselDataWithoutROA.length * 8}s`);
    };
    window.addEventListener('resize', resize);
    resize();
  }
});
