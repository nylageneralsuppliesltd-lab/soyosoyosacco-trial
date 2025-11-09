// scripts/carousel.js
// FINAL WORKING VERSION - CONE + CHARTS + CAROUSEL
document.addEventListener('DOMContentLoaded', () => {
  console.log('carousel.js loaded');

  // === DATA SETUP ===
  const loanTypesToday = [
    { name: 'Emergency', value: 1214900 },
    { name: 'Medicare', value: 15000 },
    { name: 'Development', value: 553000 },
    { name: 'Education', value: 275000 }
  ];
  const totalLoansToday = loanTypesToday.reduce((sum, loan) => sum + loan.value, 0);
  const externalLoansToday = 66784;

  const carouselData = [
    { number: 144, description: "Total Members" },
    { number: 907015, description: "Member Savings" },
    { number: 243199, description: "Bank Balance" },
    { number: 105, description: "Number of Loans Given" },
    { number: totalLoansToday, description: "Value of Loans Given" },
    { number: 51803, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  const roaToday = ((51803 / (907015 + externalLoansToday)) * 100).toFixed(2);
  carouselData.push({ number: roaToday, description: "ROA (%)" });

  const janData = {
    members: 101, loans: 283500, contributions: 331263,
    profit: -60056, bankBalance: 113742, externalLoans: 0
  };
  const roaJan = ((janData.profit / (janData.contributions + janData.externalLoans)) * 100).toFixed(2);

  window.loanTypes = loanTypesToday;
  window.saccoData = {
    jan: { ...janData, roa: roaJan },
    today: {
      members: 144, loans: totalLoansToday, contributions: 907015,
      profit: 51803, bankBalance: 243199, externalLoans: externalLoansToday,
      roa: roaToday
    }
  };

  // === KPI CAROUSEL ===
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    carousel.innerHTML = carouselData.map(item => `
      <article class="carousel-item">
        <h3 class="carousel-button" data-target="${item.number}">0</h3>
        <p class="carousel-description">${item.description}</p>
      </article>
    `).join('');

    const formatNumber = n => n >= 1000 ? (n/1000).toFixed(0)+'k' : n;
    const animate = (el, target) => {
      let start = 0;
      const step = () => {
        const progress = Math.min((Date.now() - start) / 600, 1);
        el.textContent = formatNumber(Math.round(progress * target));
        if (progress < 1) requestAnimationFrame(step);
      };
      start = Date.now();
      requestAnimationFrame(step);
    };

    new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const btn = e.target.querySelector('.carousel-button');
        if (e.isIntersecting) animate(btn, btn.dataset.target);
        else btn.textContent = '0';
      });
    }, { threshold: 0.3 }).observe(carousel.parentElement);

    const update = () => {
      const w = window.innerWidth;
      const iw = w <= 768 ? 220 : 300;
      const m = w <= 768 ? 20 : 40;
      document.documentElement.style.setProperty('--item-width', iw + 'px');
      document.documentElement.style.setProperty('--item-margin', m + 'px');
      document.documentElement.style.setProperty('--carousel-translate', `-${carouselData.length * (iw + 2*m)}px`);
      document.documentElement.style.setProperty('--carousel-duration', `${carouselData.length * 8}s`);
    };
    window.addEventListener('resize', update);
    update();
  }

  // === 3D CONE ===
  const container = document.getElementById('coneContainer');
  if (container) {
    container.style.cssText = 'width:100%; height:480px; background:#f8fafc; border-radius:16px; overflow:hidden;';

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js';
    script.onload = () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      scene.add(new THREE.PointLight(0xffffff, 1).position.set(10,10,10));

      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(1, 2, 64),
        new THREE.MeshPhongMaterial({ color: 0x10B981, shininess: 100 })
      );
      scene.add(cone);

      const base = new THREE.Mesh(
        new THREE.CircleGeometry(1.2, 64),
        new THREE.MeshPhongMaterial({ color: 0xC4B5FD })
      );
      base.rotation.x = -Math.PI/2;
      base.position.y = -1;
      scene.add(base);

      camera.position.set(3, 2, 3);

      const createLabel = (text) => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 36px Lato';
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 6;
        ctx.strokeText(text, 20, 70);
        ctx.fillText(text, 20, 70);
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.scale.set(5, 1.8, 1);
        return sprite;
      };

      const d = window.saccoData.today;
      [
        { text: `Members: ${d.members}`, pos: [2, 1.4, 0] },
        { text: `Loans: KES ${d.loans.toLocaleString()}`, pos: [-2.4, 0.9, 0] },
        { text: `Savings: KES ${d.contributions.toLocaleString()}`, pos: [2, 0.2, 0] },
        { text: `Profit: KES ${d.profit.toLocaleString()}`, pos: [-2.2, -0.5, 0] }
      ].forEach(l => {
        const s = createLabel(l.text);
        s.position.set(...l.pos);
        scene.add(s);
      });

      window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      });

      const animate = () => {
        requestAnimationFrame(animate);
        cone.rotation.y += 0.008;
        renderer.render(scene, camera);
      };
      animate();
      console.log('Cone rendered');
    };
    document.head.appendChild(script);
  }

  // === MEMBER CAROUSEL ===
  const memberImages = [
    './assets/01acb621480e99c389cea4973abe4896.jpg',
    './assets/3161c755955816487a8b0cd796d43c29.jpg',
    './assets/c1cbf8720115247da59d153d3f0be3b0.jpg',
    './assets/b8a8a30e9531f4d1cac3ddf56c594b5a.jpg',
    './assets/8053495671fa13e271078ad77beff286.jpg',
    './assets/8640680b79eba02a8544ba3bbbcdd655.jpg',
    './assets/8c145fcc127b3fad7cbe25bc847f3e8c.jpg'
  ];

  let currentSlide = 0;
  const slides = document.getElementById('memberSlides');
  const dots = document.getElementById('memberDots');

  if (slides && dots) {
    slides.innerHTML = memberImages.map(src => `
      <div class="slide"><img src="${src}" alt="" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+'"></div>
    `).join('');

    dots.innerHTML = memberImages.map((_, i) => `<span class="dot" onclick="currentSlide=${i}; showSlide()"></span>`).join('');

    window.changeSlide = (dir) => {
      currentSlide = (currentSlide + dir + memberImages.length) % memberImages.length;
      showSlide();
    };

    const showSlide = () => {
      slides.style.transform = `translateX(-${currentSlide * 100}%)`;
      document.querySelectorAll('.dot').forEach((d, i) => d.className = i === currentSlide ? 'dot active' : 'dot');
    };

    showSlide();
    setInterval(() => window.changeSlide(1), 5000);
  }

  // === CHARTS - NOW GUARANTEED TO RUN AFTER DATA ===
  if (typeof Chart !== 'undefined') {
    const colors = {
      members: { jan: '#8B5CF6', today: '#C4B5FD' },
      loans: { jan: '#F59E0B', today: '#FBBF24' },
      contributions: { jan: '#10B981', today: '#34D399' },
      profit: { jan: '#EF4444', today: '#F87171' },
      roa: { jan: '#0EA5E9', today: '#7DD3FC' },
      liquidity: { jan: '#6366F1', today: '#A5B4FC' }
    };

    const growth = (j, t) => j === 0 ? 0 : ((t - j) / Math.abs(j)) * 100;

    const createChart = (id, janVal, todayVal, label, color, isMoney = false, isPercent = false) => {
      const ctx = document.getElementById(id);
      if (!ctx) return;
      const g = growth(janVal, todayVal);
      document.getElementById(growthId(id)).innerHTML = `<i class="fas fa-arrow-${g>0?'up':'down'}"></i> ${Math.abs(g).toFixed(1)}%`;
      document.getElementById(growthId(id)).className = `growth-indicator ${g>0?'positive':'negative'}`;

      new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Jan 2025', 'Today'], datasets: [{ data: [janVal, todayVal], backgroundColor: [color.jan, color.today], borderRadius: 10 }] },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            datalabels: {
              anchor: 'end', align: 'top', color: '#1a1a1a', font: { weight: '900', size: 14 },
              formatter: v => isPercent ? v.toFixed(2)+'%' : isMoney ? 'KES '+v.toLocaleString() : v.toLocaleString(),
              backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 6, padding: 7
            }
          },
          scales: { x: { grid: { display: false } }, y: { display: false } }
        },
        plugins: [ChartDataLabels]
      });
    };

    const growthId = id => id.replace('chart', 'growth');

    const janROA = parseFloat(roaJan);
    const todayROA = parseFloat(roaToday);
    const janLiq = janData.contributions > 0 ? (janData.bankBalance / janData.contributions) * 100 : 0;
    const todayLiq = window.saccoData.today.contributions > 0 ? (window.saccoData.today.bankBalance / window.saccoData.today.contributions) * 100 : 0;

    createChart('chartMembers', janData.members, 144, 'Members', colors.members);
    createChart('chartLoans', janData.loans, totalLoansToday, 'Loans', colors.loans, true);
    createChart('chartContributions', janData.contributions, 907015, 'Contributions', colors.contributions, true);
    createChart('chartProfit', janData.profit, 51803, 'Profit', colors.profit, true);
    createChart('chartROA', janROA, todayROA, 'ROA', colors.roa, false, true);
    createChart('chartLiquidity', janLiq, todayLiq, 'Liquidity', colors.liquidity, false, true);

    // Pie chart
    if (window.loanTypes) {
      const total = window.loanTypes.reduce((s, l) => s + l.value, 0);
      const data = window.loanTypes.map(l => (l.value / total) * 100);
      new Chart(document.getElementById('chartLoanTypes'), {
        type: 'pie',
        data: { labels: window.loanTypes.map(l => l.name), datasets: [{ data, backgroundColor: ['#FF6384','#36A2EB','#FFCE56','#4BC0C0'] }] },
        options: { plugins: { legend: { position: 'bottom' }, datalabels: { formatter: v => v > 5 ? v.toFixed(1)+'%' : '', color: '#fff', font: { weight: 'bold' } } } },
        plugins: [ChartDataLabels]
      });
    }
  }

  console.log('ALL SYSTEMS GO - carousel.js complete');
});
