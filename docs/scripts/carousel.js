/* scripts/carousel.js – FULL v60 PREMIUM GROWTH CONE + CAROUSEL */
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

  // === RENDER PREMIUM GROWTH CONE v60 ===
  function renderEye(projections) {
    const container = document.getElementById('growth-cone-container');
    if (!container) return;

    container.innerHTML = `
      <div class="premium-cone-wrapper">
        <div class="cone-header">
          <h3>Strategic Growth Engine: 2025–2029</h3>
          <p>Real-time projections. Click any year to explore.</p>
        </div>
        <div class="premium-cone" id="premium-cone-svg">
          <svg viewBox="0 0 700 550" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
      </div>
    `;

    const svg = container.querySelector('svg');
    const centerX = 350;
    const baseY = 500;
    const topY = 80;
    const maxWidth = 600;

    const colors = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'];

    projections.forEach((p, i) => {
      const ratio = i / (projections.length - 1);
      const width = ratio * maxWidth;
      const x1 = centerX - width / 2;
      const x2 = centerX + width / 2;
      const y = baseY - ratio * (baseY - topY);

      // === CONE BODY (GRADIENT FILL) ===
      if (i > 0) {
        const prev = projections[i - 1];
        const prevRatio = (i - 1) / (projections.length - 1);
        const prevWidth = prevRatio * maxWidth;
        const prevX1 = centerX - prevWidth / 2;
        const prevX2 = centerX + prevWidth / 2;
        const prevY = baseY - prevRatio * (baseY - topY);

        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.id = `grad-${i}`;
        gradient.setAttribute('x1', '0%'); gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%'); gradient.setAttribute('y2', '100%');
        gradient.innerHTML = `
          <stop offset="0%" stop-color="${colors[i]}" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="${colors[i]}" stop-opacity="0.3"/>
        `;
        svg.appendChild(gradient);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M${prevX1},${prevY} L${x1},${y} L${x2},${y} L${prevX2},${prevY} Z`);
        path.setAttribute('fill', `url(#grad-${i})`);
        path.setAttribute('class', 'cone-segment');
        svg.appendChild(path);

        // Glow border
        const border = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        border.setAttribute('d', `M${prevX1},${prevY} L${x1},${y} M${x2},${y} L${prevX2},${prevY}`);
        border.setAttribute('stroke', colors[i]);
        border.setAttribute('stroke-width', '3');
        border.setAttribute('fill', 'none');
        border.setAttribute('filter', 'url(#glow)');
        svg.appendChild(border);
      }

      // === YEAR BAND (GLASS CARD) ===
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'year-band');
      g.setAttribute('transform', `translate(${centerX}, ${y - 60})`);
      g.onclick = () => showYearPopup(p);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', -140); rect.setAttribute('y', -45);
      rect.setAttribute('width', 280); rect.setAttribute('height', 90);
      rect.setAttribute('rx', 16);
      rect.setAttribute('fill', 'rgba(255,255,255,0.15)');
      rect.setAttribute('stroke', colors[i]);
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('filter', 'url(#glass)');
      g.appendChild(rect);

      // Year
      const yearText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      yearText.setAttribute('x', 0); yearText.setAttribute('y', -15);
      yearText.setAttribute('text-anchor', 'middle');
      yearText.setAttribute('font-size', '22');
      yearText.setAttribute('font-weight', '900');
      yearText.setAttribute('fill', '#ffffff');
      yearText.textContent = p.year;
      g.appendChild(yearText);

      // KPIs
      const kpis = [
        { icon: 'fa-users', value: p.members, suffix: '' },
        { icon: 'fa-hand-holding-usd', value: Math.round(p.loans/1000), suffix: 'k' },
        { icon: 'fa-piggy-bank', value: Math.round(p.contributions/1000), suffix: 'k' }
      ];
      kpis.forEach((kpi, ki) => {
        const tx = -80 + ki * 80;

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', tx); icon.setAttribute('y', 15);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('font-family', 'Font Awesome 6 Free');
        icon.setAttribute('font-weight', '900');
        icon.setAttribute('font-size', '18');
        icon.setAttribute('fill', colors[i]);
        icon.textContent = kpi.icon.includes('users') ? '\uf0c0' :
                         kpi.icon.includes('hand') ? '\uf4c0' : '\uf4d3';
        g.appendChild(icon);

        const val = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        val.setAttribute('x', tx); val.setAttribute('y', 35);
        val.setAttribute('text-anchor', 'middle');
        val.setAttribute('font-size', '14');
        val.setAttribute('font-weight', 'bold');
        val.setAttribute('fill', '#ffffff');
        val.textContent = kpi.value.toLocaleString() + kpi.suffix;
        g.appendChild(val);
      });

      svg.appendChild(g);

      // TODAY BADGE
      if (i === 0) {
        const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        badge.setAttribute('cx', centerX); badge.setAttribute('cy', baseY);
        badge.setAttribute('r', 50);
        badge.setAttribute('fill', '#10B981');
        badge.setAttribute('opacity', '0.2');
        svg.appendChild(badge);

        const today = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        today.setAttribute('x', centerX); today.setAttribute('y', baseY + 8);
        today.setAttribute('text-anchor', 'middle');
        today.setAttribute('font-size', '18');
        today.setAttribute('font-weight', '900');
        today.setAttribute('fill', '#10B981');
        today.textContent = 'TODAY';
        svg.appendChild(today);
      }
    });

    // === SVG FILTERS ===
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="glass">
        <feGaussianBlur in="SourceGraphic" stdDeviation="10"/>
      </filter>
    `;
    svg.prepend(defs);
  }

  // === POPUP FUNCTION ===
  window.showYearPopup = function(p) {
    const popup = document.createElement('div');
    popup.className = 'cone-popup';
    popup.innerHTML = `
      <div class="popup-header">
        <h3>${p.year} Projection</h3>
        <button onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
      <div class="popup-grid">
        <div><i class="fas fa-users"></i> <strong>${p.members.toLocaleString()}</strong> Members</div>
        <div><i class="fas fa-hand-holding-usd"></i> <strong>KES ${p.loans.toLocaleString()}</strong> Loans</div>
        <div><i class="fas fa-piggy-bank"></i> <strong>KES ${p.contributions.toLocaleString()}</strong> Savings</div>
        <div><i class="fas fa-university"></i> <strong>KES ${p.bankBalance.toLocaleString()}</strong> Bank</div>
        <div><i class="fas fa-chart-line"></i> <strong>KES ${p.profit.toLocaleString()}</strong> Profit</div>
      </div>
    `;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
  };

  // === RENDER WITH FALLBACK ===
  let tries = 0;
  function tryRender() {
    const p = generateProjections();
    if (p && p.length === 5) {
      window.projections = p;
      renderEye(p);
      return;
    }
    if (tries++ < 5) setTimeout(tryRender, 200);
    else {
      const fallback = [
        {year:2025,members:144,loans:2057900,contributions:907015,bankBalance:243199,profit:51803},
        {year:2026,members:202,loans:3500000,contributions:1200000,bankBalance:400000,profit:150000},
        {year:2027,members:280,loans:6000000,contributions:1800000,bankBalance:700000,profit:300000},
        {year:2028,members:380,loans:9000000,contributions:2500000,bankBalance:1100000,profit:500000},
        {year:2029,members:500,loans:13000000,contributions:3500000,bankBalance:1600000,profit:800000}
      ];
      window.projections = fallback;
      renderEye(fallback);
    }
  }
  setTimeout(tryRender, 100);

  // === CAROUSEL (UNCHANGED) ===
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
