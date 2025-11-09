// scripts/carousel.js?v=63
document.addEventListener('DOMContentLoaded', () => {
  console.log('carousel.js v63 — DEBUG BUILD (verbose logging + fallback)');

  // === DATA (unchanged) ===
  const loanTypesToday = [
    { name: 'Emergency', value: 1214900 },
    { name: 'Medicare', value: 15000 },
    { name: 'Development', value: 553000 },
    { name: 'Education', value: 275000 }
  ];
  const totalLoansToday = loanTypesToday.reduce((a,b) => a + b.value, 0);
  const externalLoansToday = 66784;
  const carouselData = [
    { number: 144, desc: "Total Members" },
    { number: 907015, desc: "Member Savings" },
    { number: 243199, desc: "Bank Balance" },
    { number: 105, desc: "Number of Loans Given" },
    { number: totalLoansToday, desc: "Value of Loans Given" },
    { number: 51803, desc: "Profit" },
    { number: 71, desc: "Active Members" }
  ];
  const roaToday = ((51803 / (907015 + externalLoansToday)) * 100).toFixed(2);
  carouselData.push({ number: roaToday, desc: "ROA (%)" });

  const janData = { members: 101, loans: 283500, contributions: 331263, profit: -60056, bankBalance: 113742 };
  const roaJan = ((janData.profit / janData.contributions) * 100).toFixed(2);

  window.loanTypes = loanTypesToday;
  window.saccoData = {
    jan: { ...janData, roa: roaJan },
    today: { members: 144, loans: totalLoansToday, contributions: 907015, profit: 51803, bankBalance: 243199, roa: roaToday }
  };

  // === FINANCIAL CAROUSEL (unchanged) ===
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    carousel.innerHTML = carouselData.map(i => `
      <article class="carousel-item">
        <h3 class="carousel-button" data-target="${i.number}">0</h3>
        <p class="carousel-description">${i.desc}</p>
      </article>
    `).join('');
    const format = n => n >= 1000 ? (n/1000).toFixed(n%1000===0?0:1) + 'k' : n;
    const animate = (el, target) => {
      let start = 0;
      const step = () => {
        const progress = Math.min((Date.now() - start) / 800, 1);
        el.textContent = format(Math.round(progress * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      start = Date.now();
      requestAnimationFrame(step);
    };
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        const btn = e.target.querySelector('.carousel-button');
        if (e.isIntersecting && btn.textContent === '0') animate(btn, btn.dataset.target);
      });
    }, { threshold: 0.5 }).observe(carousel.parentElement);
  }

  // === Helpful utility logs ===
  const log = (...args) => { try { console.log.apply(console, args); } catch(e){} };
  const err = (...args) => { try { console.error.apply(console, args); } catch(e){} };

  // === Small WebGL availability test ===
  function isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // === 3D CONE (with verbose debug + fallback) ===
  (function initCone() {
    const container = document.getElementById('coneContainer');
    if (!container) {
      log('coneContainer element NOT FOUND in DOM. Aborting 3D init.');
      return;
    }
    log('coneContainer found. size:', container.clientWidth, 'x', container.clientHeight);

    // short-circuit if WebGL is not available
    if (!isWebGLAvailable()) {
      err('WebGL not available in this browser or is disabled. Showing CSS fallback cone.');
      renderFallbackCSSCone(container);
      return;
    }

    // load three.js dynamically
    const threeUrl = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js';
    log('Attempting to load three.js from', threeUrl);
    const script = document.createElement('script');
    script.src = threeUrl;
    script.onload = () => {
      try {
        if (typeof THREE === 'undefined') {
          throw new Error('three.js loaded but global THREE is undefined (CSP or bundling issue).');
        }
        log('three.js loaded successfully. Initializing scene...');

        // Create renderer, scene, camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / Math.max(1, container.clientHeight), 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0); // transparent

        // clean container and append
        container.innerHTML = '';
        container.style.position = container.style.position || 'relative';
        container.appendChild(renderer.domElement);
        log('Renderer appended. canvas size:', renderer.domElement.width, 'x', renderer.domElement.height);

        // lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(8,8,8);
        scene.add(pointLight);

        // geometry
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(1.2, 2.4, 64),
          new THREE.MeshPhongMaterial({ color: 0x10B981, shininess: 120 })
        );
        scene.add(cone);

        const base = new THREE.Mesh(
          new THREE.CircleGeometry(1.4, 64),
          new THREE.MeshPhongMaterial({ color: 0xC4B5FD })
        );
        base.rotation.x = -Math.PI/2;
        base.position.y = -1.2;
        scene.add(base);

        // labels
        const createLabel = text => {
          const canvas = document.createElement('canvas');
          canvas.width = 512; canvas.height = 128;
          const ctx = canvas.getContext('2d');
          ctx.font = 'bold 36px Lato, Arial';
          ctx.fillStyle = '#000';
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 6;
          ctx.strokeText(text, 20, 70);
          ctx.fillText(text, 20, 70);
          const texture = new THREE.CanvasTexture(canvas);
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
          sprite.scale.set(5, 1.6, 1);
          return sprite;
        };

        const d = (window.saccoData && window.saccoData.today) ? window.saccoData.today : { members:0, loans:0, contributions:0, profit:0 };
        const labels = [
          { text: `Members: ${d.members}`, pos: [2.2, 1.6, 0] },
          { text: `Loans: KES ${d.loans.toLocaleString()}`, pos: [-2.6, 1.0, 0] },
          { text: `Savings: KES ${d.contributions.toLocaleString()}`, pos: [2.2, 0.3, 0] },
          { text: `Profit: KES ${d.profit.toLocaleString()}`, pos: [-2.6, -0.5, 0] }
        ];
        labels.forEach(l => {
          const sp = createLabel(l.text);
          sp.position.set(...l.pos);
          scene.add(sp);
        });

        camera.position.set(3.5, 2.5, 4);

        window.addEventListener('resize', () => {
          camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        });

        // expose debug handle so you can inspect in console:
        window.__coneDebug = { scene, camera, renderer, cone, base, labels, container };
        log('window.__coneDebug set — inspect in console.');

        // animation loop
        const loop = () => {
          requestAnimationFrame(loop);
          cone.rotation.y += 0.006;
          renderer.render(scene, camera);
        };
        loop();

        log('3D cone initialized and rendering — if you cannot see it, check console for errors and run the checklist below.');

      } catch (e) {
        err('three.js init error:', e);
        renderFallbackCSSCone(container);
      }
    };
    script.onerror = () => {
      err('Failed to load three.js from CDN. Check network or Content Security Policy (CSP). Rendering CSS fallback.');
      renderFallbackCSSCone(container);
    };

    // Append script with async false to avoid race issues
    document.head.appendChild(script);
  })();

  // === CHARTS (unchanged) ===
  if (typeof Chart !== 'undefined') {
    const growth = (jan, today) => jan === 0 ? 0 : ((today - jan) / Math.abs(jan)) * 100;
    const createBarChart = (id, janVal, todayVal, colors, isMoney = false, isPct = false) => {
      const ctx = document.getElementById(id);
      if (!ctx) return;
      const g = growth(janVal, todayVal);
      const indicator = document.getElementById(id.replace('chart', 'growth'));
      if (indicator) {
        indicator.innerHTML = `<i class="fas fa-arrow-${g > 0 ? 'up' : 'down'}"></i> ${Math.abs(g).toFixed(1)}%`;
        indicator.className = `growth-indicator ${g > 0 ? 'positive' : 'negative'}`;
      }
      new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Jan 2025', 'Today'], datasets: [{ data: [janVal, todayVal], backgroundColor: [colors.jan, colors.today], borderRadius: 10, barThickness: 48 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            datalabels: { anchor: 'end', align: 'top', color: '#1e293b', font: { weight: 'bold', size: 13 }, formatter: v => isPct ? v.toFixed(2) + '%' : isMoney ? 'KES ' + v.toLocaleString() : v.toLocaleString(), backgroundColor: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 6 }
          },
          scales: { x: { grid: { display: false } }, y: { display: false, beginAtZero: true } }
        },
        plugins: [ChartDataLabels]
      });
    };

    try {
      const janROA = parseFloat(roaJan);
      const todayROA = parseFloat(roaToday);
      const janLiq = (janData.bankBalance / janData.contributions) * 100;
      const todayLiq = (243199 / 907015) * 100;

      createBarChart('chartMembers', janData.members, 144, { jan: '#8B5CF6', today: '#C4B5FD' });
      createBarChart('chartLoans', janData.loans, totalLoansToday, { jan: '#F59E0B', today: '#FBBF24' }, true);
      createBarChart('chartContributions', janData.contributions, 907015, { jan: '#10B981', today: '#34D399' }, true);
      createBarChart('chartProfit', janData.profit, 51803, { jan: '#EF4444', today: '#F87171' }, true);
      createBarChart('chartROA', janROA, todayROA, { jan: '#0EA5E9', today: '#7DD3FC' }, false, true);
      createBarChart('chartLiquidity', janLiq, todayLiq, { jan: '#6366F1', today: '#A5B4FC' }, false, true);

      const pie = document.getElementById('chartLoanTypes');
      if (pie) {
        new Chart(pie, {
          type: 'pie',
          data: { labels: loanTypesToday.map(l => l.name), datasets: [{ data: loanTypesToday.map(l => (l.value / totalLoansToday) * 100), backgroundColor: ['#10B981', '#F59E0B', '#8B5CF6', '#EF4444'] }] },
          options: { responsive: true, plugins: { legend: { position: 'bottom' }, datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: v => v > 8 ? v.toFixed(0) + '%' : '' } } },
          plugins: [ChartDataLabels]
        });
      }
    } catch (e) {
      err('Chart creation error:', e);
    }
  } else {
    log('Chart.js not available at carousel runtime.');
  }

  // === MEMBER CAROUSEL (unchanged) ===
  const images = [
    './assets/01acb621480e99c389cea4973abe4896.jpg','./assets/3161c755955816487a8b0cd796d43c29.jpg',
    './assets/c1cbf8720115247da59d153d3f0be3b0.jpg','./assets/b8a8a30e9531f4d1cac3ddf56c594b5a.jpg',
    './assets/8053495671fa13e271078ad77beff286.jpg','./assets/8640680b79eba02a8544ba3bbbcdd655.jpg',
    './assets/8c145fcc127b3fad7cbe25bc847f3e8c.jpg'
  ];
  let i = 0;
  const slides = document.getElementById('memberSlides');
  const dots = document.getElementById('memberDots');
  if (slides && dots) {
    slides.innerHTML = images.map(src => `<div class="slide"><img src="${src}" loading="lazy"></div>`).join('');
    dots.innerHTML = images.map((_,idx) => `<span class="dot" onclick="i=${idx};show()"></span>`).join('');
    const show = () => {
      slides.style.transform = `translateX(-${i*100}%)`;
      document.querySelectorAll('.dot').forEach((d,j) => d.classList.toggle('active', j===i));
    };
    window.changeSlide = n => { i = (i + n + images.length) % images.length; show(); };
    show();
    setInterval(() => changeSlide(1), 5000);
  }

  log('carousel.js v63 ready.');
});

/* --------------------------
   CSS fallback renderer
   Appends a simple visual if WebGL / three.js not available.
   -------------------------- */
function renderFallbackCSSCone(container) {
  try {
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'center';
    container.style.padding = '24px';
    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';
    wrapper.style.width = '320px';
    wrapper.style.maxWidth = '90%';
    // create a CSS "cone" using conic-gradient + pseudo 3D trick
    const cone = document.createElement('div');
    cone.style.width = '220px';
    cone.style.height = '220px';
    cone.style.borderRadius = '50%';
    cone.style.background = 'conic-gradient(from 0deg, #10B981, #F59E0B, #3B82F6, #10B981)';
    cone.style.transform = 'rotateX(70deg)';
    cone.style.margin = '0 auto 10px';
    cone.style.boxShadow = '0 12px 30px rgba(0,0,0,0.12)';
    wrapper.appendChild(cone);
    const txt = document.createElement('div');
    txt.innerHTML = `<div style="font-weight:900;color:#0f172a">Cone projection unavailable</div><div style="margin-top:6px;color:#374151">Showing CSS fallback (WebGL blocked)</div>`;
    wrapper.appendChild(txt);
    container.appendChild(wrapper);
    console.warn('Rendered CSS fallback cone because WebGL/three.js was not available.');
  } catch (e) {
    console.error('Fallback render error:', e);
  }
}
