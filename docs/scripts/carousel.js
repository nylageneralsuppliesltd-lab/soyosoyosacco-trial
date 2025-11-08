/* --------------------------------------------------------------
   scripts/carousel.js  –  Eye of Growth + Projections + Carousel
   -------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  /* ----------------------------------------------------------------
     1. TODAY’S LOAN-TYPES (update only when the real numbers change)
     ---------------------------------------------------------------- */
  const loanTypesToday = [
    { name: 'Emergency',   value: 1214900 },
    { name: 'Medicare',    value: 15000 },
    { name: 'Development', value: 553000 },
    { name: 'Education',   value: 275000 }
  ];
  const totalLoansToday = loanTypesToday.reduce((s, l) => s + l.value, 0);
  window.loanTypes = loanTypesToday;               // for the pie chart

  const externalLoansToday = 66784;                // external loans today
  const externalLoansJan   = 0;

  /* ----------------------------------------------------------------
     2. CAROUSEL METRICS (the numbers that scroll)
     ---------------------------------------------------------------- */
  const carouselMetrics = [
    { number: 144, description: "Total Members" },
    { number: 907015, description: "Member Savings" },
    { number: 243199, description: "Bank Balance" },
    { number: 105, description: "Number of Loans Given" },
    { number: totalLoansToday, description: "Value of Loans Given" },
    { number: 51803, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  // ---- ROA (Return on Assets) -------------------------------------------------
  const roaToday = ((carouselMetrics[5].number /
                     (carouselMetrics[1].number + externalLoansToday)) * 100).toFixed(2);
  carouselMetrics.push({ number: parseFloat(roaToday), description: "ROA (%)" });

  /* ----------------------------------------------------------------
     3. JAN-2025 BASELINE (hard-coded once – change only when Jan changes)
     ---------------------------------------------------------------- */
  const janBaseline = {
    members:        101,
    loans:          283500,
    contributions:  331263,
    profit:        -60056,
    bankBalance:    113742,
    externalLoans:  externalLoansJan
  };
  const roaJan = ((janBaseline.profit /
                   (janBaseline.contributions + janBaseline.externalLoans)) * 100).toFixed(2);
  janBaseline.roa = parseFloat(roaJan);

  /* ----------------------------------------------------------------
     4. GLOBAL SACCO DATA (used by charts, eye, table)
     ---------------------------------------------------------------- */
  window.saccoData = {
    jan: janBaseline,
    today: {
      members:        carouselMetrics[0].number,
      loans:          totalLoansToday,
      contributions:  carouselMetrics[1].number,
      profit:         carouselMetrics[5].number,
      bankBalance:    carouselMetrics[2].number,
      externalLoans:  externalLoansToday,
      roa:            parseFloat(roaToday)
    }
  };

  /* ----------------------------------------------------------------
     5. PROJECTIONS (2025-2029) – compound growth from Jan → Today
     ---------------------------------------------------------------- */
  function generateProjections() {
    const { jan, today } = window.saccoData;
    const years = [2025, 2026, 2027, 2028, 2029];

    // ---- growth rates (avoid division-by-zero) --------------------------------
    const membersGrowth      = jan.members        ? (today.members - jan.members) / jan.members : 0.10;
    const contributionsGrowth= jan.contributions  ? (today.contributions - jan.contributions) / jan.contributions : 0.20;
    const bankGrowth         = jan.bankBalance    ? (today.bankBalance - jan.bankBalance) / jan.bankBalance : 0.15;
    const loansGrowth        = contributionsGrowth;               // loans grow with contributions
    const roaRate            = today.roa / 100;                   // keep today’s ROA

    const proj = [];
    let last = { ...today };

    years.forEach((y, i) => {
      if (i === 0) {
        proj.push({ year: y, ...last });
      } else {
        const members       = Math.round(last.members * (1 + membersGrowth));
        const contributions = Math.round(last.contributions * (1 + contributionsGrowth));
        const bankBalance   = Math.round(last.bankBalance * (1 + bankGrowth));
        const loans         = Math.round(last.loans * (1 + loansGrowth));
        const profit        = Math.round(roaRate * (loans + contributions + bankBalance));

        const p = { year: y, members, loans, contributions, bankBalance, profit };
        proj.push(p);
        last = p;
      }
    });
    return proj;
  }

  /* ----------------------------------------------------------------
     6. RENDER KPI LEGEND (static colours)
     ---------------------------------------------------------------- */
  function renderLegend() {
    const container = document.getElementById('kpi-legend');
    if (!container) return;
    const items = [
      {c:'#1f77b4', l:'Members'},
      {c:'#ff7f0e', l:'Loans'},
      {c:'#2ca02c', l:'Contributions'},
      {c:'#d62728', l:'Bank Balance'},
      {c:'#9467bd', l:'Profit'}
    ];
    container.innerHTML = items.map(i=>`
      <div class="legend-item">
        <div class="swatch" style="background:${i.c}"></div>
        <span>${i.l}</span>
      </div>`).join('');
  }

  /* ----------------------------------------------------------------
     7. RENDER PROJECTIONS TABLE
     ---------------------------------------------------------------- */
  function renderTable(projections) {
    const tbody = document.getElementById('projections-body');
    if (!tbody) return;
    tbody.innerHTML = projections.map(p=>`
      <tr>
        <td style="font-weight:bold;">${p.year}</td>
        <td>${p.members.toLocaleString()}</td>
        <td>KES ${p.loans.toLocaleString()}</td>
        <td>KES ${p.contributions.toLocaleString()}</td>
        <td>KES ${p.bankBalance.toLocaleString()}</td>
        <td>KES ${p.profit.toLocaleString()}</td>
      </tr>`).join('');
  }

  /* ----------------------------------------------------------------
     8. RENDER THE EYE (SVG)
     ---------------------------------------------------------------- */
  function renderEye(projections) {
    const container = document.getElementById('eye-visual');
    if (!container) return;
    container.innerHTML = '';

    const width = 600, height = 600;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Eye of Growth – KPI Projections 2025-2029');
    container.appendChild(svg);

    const cx = width / 2, cy = height / 2;
    const maxR = 250;

    // ---- find max value per KPI (used for log-scaling) -----------------------
    const maxVals = {};
    const kpis = ['members','loans','contributions','bankBalance','profit'];
    kpis.forEach(k=> maxVals[k] = Math.max(...projections.map(p=>p[k])) );

    const colors = { members:'#1f77b4', loans:'#ff7f0e', contributions:'#2ca02c',
                     bankBalance:'#d62728', profit:'#9467bd' };

    // ---- log-scale normaliser -----------------------------------------------
    const norm = (val, max) => {
      if (!max || val <= 0) return 0;
      return (Math.log(val + 1) / Math.log(max + 1)) * maxR;
    };

    // ---- draw rings for the *last* year (2029) -------------------------------
    kpis.forEach((k, i) => {
      const r = norm(projections[projections.length-1][k], maxVals[k]);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', 0);
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', colors[k]);
      circle.setAttribute('stroke-width', '8');
      circle.setAttribute('stroke-linecap', 'round');
      svg.appendChild(circle);

      // tooltip
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = `${k.charAt(0).toUpperCase()+k.slice(1)}: KES ${projections[projections.length-1][k].toLocaleString()}`;
      circle.appendChild(title);

      // animate radius
      const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      anim.setAttribute('attributeName', 'r');
      anim.setAttribute('from', '0');
      anim.setAttribute('to', r);
      anim.setAttribute('dur', '2s');
      anim.setAttribute('fill', 'freeze');
      circle.appendChild(anim);
      anim.beginElement();
    });

    // ---- pupil ---------------------------------------------------------------
    const pupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pupil.setAttribute('cx', cx);
    pupil.setAttribute('cy', cy);
    pupil.setAttribute('r', 0);
    pupil.setAttribute('fill', '#000');
    svg.appendChild(pupil);
    const pa = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    pa.setAttribute('attributeName', 'r');
    pa.setAttribute('from', '0');
    pa.setAttribute('to', '20');
    pa.setAttribute('dur', '1.5s');
    pa.setAttribute('fill', 'freeze');
    pupil.appendChild(pa);
    pa.beginElement();

    // ---- year labels (click → pulse rings for that year) --------------------
    projections.forEach((p, i) => {
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', cx);
      txt.setAttribute('y', cy - maxR - 20 - i*22);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-size', '15');
      txt.setAttribute('fill', '#111');
      txt.setAttribute('cursor', 'pointer');
      txt.textContent = p.year;
      txt.onclick = () => highlightYear(i);
      svg.appendChild(txt);
    });

    function highlightYear(idx) {
      kpis.forEach((k, ki) => {
        const circle = svg.children[ki];               // rings are first children
        const targetR = norm(projections[idx][k], maxVals[k]);
        circle.setAttribute('stroke-width', '14');
        setTimeout(()=> circle.setAttribute('stroke-width','8'), 800);
      });
    }

    // expose for other scripts (table, growth charts)
    window.projections = projections;
  }

  /* ----------------------------------------------------------------
     9. FINAL RENDER (with safe retry)
     ---------------------------------------------------------------- */
  let tries = 0;
  const maxTries = 12;
  function tryRender() {
    const proj = generateProjections();
    if (proj && proj.length === 5) {
      renderEye(proj);
      renderTable(proj);
      renderLegend();
      console.log('Eye & Projections rendered');
      return;
    }
    if (tries < maxTries) {
      tries++;
      setTimeout(tryRender, 120 * tries);
    } else {
      console.warn('Projections not ready – using fallback data');
      const fallback = [
        {year:2025,members:144,loans:2057900,contributions:907015,bankBalance:243199,profit:51803},
        {year:2026,members:205,loans:5634635,contributions:2483453,bankBalance:519999,profit:424994},
        {year:2027,members:292,loans:15427918,contributions:6799821,bankBalance:1111843,profit:1148307},
        {year:2028,members:416,loans:42242427,contributions:18618257,bankBalance:2377302,profit:3111309},
        {year:2029,members:593,loans:115661921,contributions:50977738,bankBalance:5083061,profit:8448758}
      ];
      window.projections = fallback;
      renderEye(fallback);
      renderTable(fallback);
      renderLegend();
    }
  }
  setTimeout(tryRender, 80);

  /* ----------------------------------------------------------------
     10. ORIGINAL CAROUSEL (unchanged – just a tiny tidy-up)
     ---------------------------------------------------------------- */
  const carousel = document.querySelector('.carousel');
  if (!carousel) return;

  const generateItems = () => {
    const html = carouselMetrics.map(m => `
      <article class="carousel-item" role="listitem">
        <h3 class="carousel-button" data-target="${m.number}">0</h3>
        <p class="carousel-description">${m.description}</p>
      </article>`).join('');
    carousel.innerHTML = html + html;               // duplicate for infinite loop
  };
  generateItems();

  const formatNumber = n => {
    if (isNaN(n)) return n;
    const abs = Math.abs(n);
    const k = abs >= 1000 ? (abs/1000).toFixed(0)+'k' : abs;
    return k.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const animateCounter = (el, target) => {
    const end = +target;
    let cur = 0;
    const dur = 600;
    const start = performance.now();
    const step = now => {
      const prog = Math.min((now-start)/dur, 1);
      const val = Math.round(cur + prog*(end-cur));
      el.textContent = formatNumber(val);
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const btn = e.target.querySelector('.carousel-button');
      if (!btn) return;
      if (e.isIntersecting) animateCounter(btn, btn.dataset.target);
      else btn.textContent = '0';
    });
  }, {threshold:0.3});

  document.querySelectorAll('.carousel-item').forEach(it => observer.observe(it));

  const resize = () => {
    const w = window.innerWidth;
    const iw = w<=768?220:300;
    const m  = w<=768?20:40;
    const total = carouselMetrics.length * (iw + 2*m);
    document.documentElement.style.setProperty('--item-width', iw+'px');
    document.documentElement.style.setProperty('--item-margin', m+'px');
    document.documentElement.style.setProperty('--carousel-translate', `-${total}px`);
    document.documentElement.style.setProperty('--carousel-duration', `${carouselMetrics.length*8}s`);
  };
  window.addEventListener('resize', resize);
  resize();
});
