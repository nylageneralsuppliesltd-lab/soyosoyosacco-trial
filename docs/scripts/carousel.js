/* scripts/carousel.js – PREMIUM v56 | EYE + CHARTS + CAROUSEL */
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === DAILY UPDATABLE DATA ===
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
  const carouselData = carouselDataWithoutROA;

  const janData = {
    members: 101, loans: 283500, contributions: 331263, profit: -60056,
    bankBalance: 113742, externalLoans: externalLoansJan,
    roa: (( -60056 / (331263 + 0) ) * 100).toFixed(2)
  };

  window.saccoData = {
    jan: janData,
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

  // === PROJECTIONS ===
  function generateProjections() {
    const { jan, today } = window.saccoData;
    const years = [2025, 2026, 2027, 2028, 2029];
    const rates = {
      members: jan.members ? (today.members - jan.members) / jan.members : 0.12,
      contributions: jan.contributions ? (today.contributions - jan.contributions) / jan.contributions : 0.22,
      bank: jan.bankBalance ? (today.bankBalance - jan.bankBalance) / jan.bankBalance : 0.18,
      loans: 0.22,
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

  // === RENDER EYE ===
  function renderEye(projections) {
    const container = document.getElementById('eye-visual');
    if (!container) return;

    container.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#999;font-size:1.1rem;"><i class="fas fa-spinner fa-spin" style="margin-right:0.5rem;"></i>Loading Eye of Growth...</div>';

    if (!projections) return;

    setTimeout(() => {
      container.innerHTML = '';
      const w = 600, h = 600;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Eye of Growth');
      svg.style.width = '100%';
      svg.style.height = '100%';
      container.appendChild(svg);

      const cx = w/2, cy = h/2, maxR = 260;
      const maxVals = {};
      const kpis = ['members','loans','contributions','bankBalance','profit'];
      kpis.forEach(k => maxVals[k] = Math.max(...projections.map(p => p[k])));
      const colors = { members:'#1f77b4', loans:'#ff7f0e', contributions:'#2ca02c', bankBalance:'#d62728', profit:'#9467bd' };
      const norm = (v,m) => m && v > 0 ? (Math.log(v+1)/Math.log(m+1)) * maxR : 0;

      kpis.forEach((k,i) => {
        const r = norm(projections[projections.length-1][k], maxVals[k]);
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r',0);
        c.setAttribute('fill','none'); c.setAttribute('stroke',colors[k]);
        c.setAttribute('stroke-width','12'); c.setAttribute('stroke-linecap','round');
        svg.appendChild(c);
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        t.textContent = `${k}: KES ${projections[projections.length-1][k].toLocaleString()}`;
        c.appendChild(t);
        const a = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        a.setAttribute('attributeName','r'); a.setAttribute('from','0'); a.setAttribute('to',r);
        a.setAttribute('dur','2.2s'); a.setAttribute('fill','freeze');
        c.appendChild(a); setTimeout(() => a.beginElement(), i*120);
      });

      const pupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pupil.setAttribute('cx',cx); pupil.setAttribute('cy',cy); pupil.setAttribute('r',0); pupil.setAttribute('fill','#000');
      svg.appendChild(pupil);
      const pa = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
      pa.setAttribute('attributeName','r'); pa.setAttribute('from','0'); pa.setAttribute('to','28');
      pa.setAttribute('dur','1.6s'); pa.setAttribute('fill','freeze');
      pupil.appendChild(pa); setTimeout(() => pa.beginElement(), 400);

      projections.forEach((p,i) => {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('x',cx); txt.setAttribute('y',cy-maxR-40-i*28);
        txt.setAttribute('text-anchor','middle'); txt.setAttribute('font-size','17');
        txt.setAttribute('font-weight','bold'); txt.setAttribute('fill','#003087');
        txt.textContent = p.year;
        txt.style.cursor = 'pointer';
        txt.onclick = () => {
          kpis.forEach((k,ki) => {
            const c = svg.children[ki];
            const r = norm(projections[i][k], maxVals[k]);
            c.setAttribute('stroke-width','18');
            setTimeout(() => c.setAttribute('stroke-width','12'), 900);
          });
        };
        svg.appendChild(txt);
      });

      window.projections = projections;
    }, 100);
  }

  // === RENDER WITH FALLBACK ===
  let tries = 0;
  function tryRender() {
    const p = generateProjections();
    if (p && p.length === 5) {
      renderEye(p);
      return;
    }
    if (tries++ < 5) {
      setTimeout(tryRender, 200);
    } else {
      renderEye([
        {year:2025,members:144,loans:2057900,contributions:907015,bankBalance:243199,profit:51803},
        {year:2026,members:215,loans:3800000,contributions:1350000,bankBalance:450000,profit:180000},
        {year:2027,members:310,loans:6500000,contributions:2000000,bankBalance:800000,profit:350000},
        {year:2028,members:430,loans:9500000,contributions:2800000,bankBalance:1200000,profit:580000},
        {year:2029,members:580,loans:14000000,contributions:3900000,bankBalance:1800000,profit:920000}
      ]);
    }
  }
  setTimeout(tryRender, 150);

  // === CAROUSEL ===
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    carousel.innerHTML = carouselData.map(m => `
      <article class="carousel-item">
        <h3 class="carousel-button" data-target="${m.number}">0</h3>
        <p class="carousel-description">${m.description}</p>
      </article>
    `).join('').repeat(2);

    const format = n => isNaN(n) ? n : Math.abs(n) >= 1000 ? (Math.abs(n)/1000).toFixed(0)+'k' : Math.abs(n);
    const animate = (el, t) => {
      let s = 0; const d = 700;
      const st = performance.now();
      const step = now => {
        const p = Math.min((now-st)/d, 1);
        const v = Math.round(s + p * (t - s));
        el.textContent = format(v);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const obs = new IntersectionObserver(e => e.forEach(en => {
      const b = en.target.querySelector('.carousel-button');
      if (en.isIntersecting && b) animate(b, b.dataset.target);
      else if (b) b.textContent = '0';
    }), { threshold: 0.4 });

    document.querySelectorAll('.carousel-item').forEach(i => obs.observe(i));

    const resize = () => {
      const w = window.innerWidth;
      const iw = w <= 768 ? 240 : 320;
      const m = w <= 768 ? 25 : 45;
      const tot = carouselData.length * (iw + 2*m);
      document.documentElement.style.setProperty('--item-width', iw + 'px');
      document.documentElement.style.setProperty('--item-margin', m + 'px');
      document.documentElement.style.setProperty('--carousel-translate', `-${tot}px`);
      document.documentElement.style.setProperty('--carousel-duration', `${carouselData.length * 9}s`);
    };
    window.addEventListener('resize', resize);
    resize();
  }
});
