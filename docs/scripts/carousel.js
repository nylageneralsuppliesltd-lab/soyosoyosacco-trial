// scripts/carousel.js?v=61
document.addEventListener('DOMContentLoaded', () => {
  console.log('carousel.js v61 — FINAL VERSION — ARROWS + NO OVERFLOW');

  // === DATA ===
  const loanTypesToday = [
    { name: 'Emergency', value: 1214900 },
    { name: 'Medicare', value: 15000 },
    { name: 'Development', value: 553000 },
    { name: 'Education', value: 275000 }
  ];
  const totalLoansToday = loanTypesToday.reduce((a, b) => a + b.value, 0);
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

  // === FINANCIAL CAROUSEL ===
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    carousel.innerHTML = carouselData.map(item => `
      <article class="carousel-item">
        <h3 class="carousel-button" data-target="${item.number}">0</h3>
        <p class="carousel-description">${item.desc}</p>
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

  // === 3D CONE ===
  const coneContainer = document.getElementById('coneContainer');
  if (coneContainer) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js';
    script.onload = () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, coneContainer.clientWidth / coneContainer.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(coneContainer.clientWidth, coneContainer.clientHeight);
      renderer.setClearColor(0x000000, 0);
      coneContainer.innerHTML = ''; coneContainer.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      scene.add(new THREE.PointLight(0xffffff, 1).position.set(8,8,8));

      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.4, 64), new THREE.MeshPhongMaterial({ color: 0x10B981, shininess: 120 }));
      scene.add(cone);
      const base = new THREE.Mesh(new THREE.CircleGeometry(1.4, 64), new THREE.MeshPhongMaterial({ color: 0xC4B5FD }));
      base.rotation.x = -Math.PI/2; base.position.y = -1.2; scene.add(base);
      camera.position.set(3.5, 2.5, 4);

      const createLabel = text => {
        const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 36px Lato'; ctx.fillStyle = '#000'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;
        ctx.strokeText(text, 20, 70); ctx.fillText(text, 20, 70);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
        sprite.scale.set(5, 1.6, 1); return sprite;
      };

      const d = window.saccoData.today;
      [
        { text: `Members: ${d.members}`, pos: [2.2, 1.6, 0] },
        { text: `Loans: KES ${d.loans.toLocaleString()}`, pos: [-2.6, 1.0, 0] },
        { text: `Savings: KES ${d.contributions.toLocaleString()}`, pos: [2.2, 0.3, 0] },
        { text: `Profit: KES ${d.profit.toLocaleString()}`, pos: [-2.6, -0.5, 0] }
      ].forEach(l => scene.add(Object.assign(createLabel(l.text), { position: new THREE.Vector3(...l.pos) })));

      window.addEventListener('resize', () => {
        camera.aspect = coneContainer.clientWidth / coneContainer.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(coneContainer.clientWidth, coneContainer.clientHeight);
      });

      const animate = () => { requestAnimationFrame(animate); cone.rotation.y += 0.006; renderer.render(scene, camera); };
      animate();
    };
    document.head.appendChild(script);
  }

  // === CHARTS — ARROWS + ORIGINAL COLORS ===
  if (typeof Chart !== 'undefined') {
    const growth = (jan, today) => jan === 0 ? 0 : ((today - jan) / Math.abs(jan)) * 100;

    const createBarChart = (id, janVal, todayVal, colors, isMoney = false, isPct = false) => {
      const ctx = document.getElementById(id);
      if (!ctx) return;
      const g = growth(janVal, todayVal);
      const indicator = document.getElementById(id.replace('chart', 'growth'));
      indicator.innerHTML = `<i class="fas fa-arrow-${g>0?'up':'down'}"></i> ${Math.abs(g).toFixed(1)}%`;
      indicator.className = `growth-indicator ${g>0?'positive':'negative'}`;

      new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Jan 2025', 'Today'], datasets: [{ data: [janVal, todayVal], backgroundColor: [colors.jan, colors.today], borderRadius: 10, barThickness: 45 }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            datalabels: {
              anchor: 'end', align: 'top', color: '#1e293b', font: { weight: 'bold', size: 13 },
              formatter: v => isPct ? v.toFixed(2)+'%' : isMoney ? 'KES '+v.toLocaleString() : v.toLocaleString(),
              backgroundColor: 'rgba(255,255,255,0.9)', padding: 6, borderRadius: 6
            }
          },
          scales: { x: { grid: { display: false } }, y: { display: false, beginAtZero: true } }
        },
        plugins: [ChartDataLabels]
      });
    };

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

    // PIE CHART
    const pie = document.getElementById('chartLoanTypes');
    if (pie) {
      new Chart(pie, {
        type: 'pie',
        data: {
          labels: loanTypesToday.map(l => l.name),
          datasets: [{ data: loanTypesToday.map(l => (l.value/totalLoansToday)*100), backgroundColor: ['#10B981','#F59E0B','#8B5CF6','#EF4444'] }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            datalabels: { color: '#fff', font: { weight: 'bold' }, formatter: v => v > 8 ? v.toFixed(0)+'%' : '' }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  }

  // === MEMBER CAROUSEL ===
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
      document.querySelectorAll('.dot').forEach((d,j)=>d.classList.toggle('active', j===i));
    };
    window.changeSlide = n => { i = (i + n + images.length) % images.length; show(); };
    show();
    setInterval(() => changeSlide(1), 5000);
  }

  console.log('SOYOSOYO SACCO — 100% PERFECT');
});
