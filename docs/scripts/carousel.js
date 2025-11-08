// scripts/carousel.js
// -------------------------------------------------------------
// COMBINED: KPI AUTO-SYNC + DYNAMIC 3D CONE VISUALIZATION
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('js-enabled');

  // === LOAN TYPES (Update actuals here) ===
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

  // === CURRENT DAILY DATA (Update Daily) ===
  const carouselDataWithoutROA = [
    { number: 144, description: "Total Members" },
    { number: 907015, description: "Member Savings" },
    { number: 243199, description: "Bank Balance" },
    { number: 105, description: "Number of Loans Given" },
    { number: totalLoansToday, description: "Value of Loans Given" },
    { number: 51803, description: "Profit" },
    { number: 71, description: "Active Members" }
  ];

  // === ROA CALCULATION ===
  const roaToday = ((carouselDataWithoutROA[5].number / (carouselDataWithoutROA[1].number + externalLoansToday)) * 100).toFixed(2);
  carouselDataWithoutROA.push({ number: roaToday, description: "ROA (%)" });
  const carouselData = carouselDataWithoutROA;

  // === JAN 2025 BASELINE ===
  const janDataWithoutROA = {
    members: 101,
    loans: 283500,
    contributions: 331263,
    profit: -60056,
    bankBalance: 113742,
    externalLoans: externalLoansJan
  };
  const roaJan = ((janDataWithoutROA.profit / (janDataWithoutROA.contributions + janDataWithoutROA.externalLoans)) * 100).toFixed(2);

  // === EXPOSE TO WINDOW ===
  window.loanTypes = loanTypesToday;
  window.saccoData = {
    jan: { ...janDataWithoutROA, roa: roaJan },
    today: {
      members: carouselData[0].number,
      loans: totalLoansToday,
      contributions: carouselData[1].number,
      profit: carouselData[5].number,
      bankBalance: carouselData[2].number,
      externalLoans: externalLoansToday,
      roa: carouselData[7].number
    }
  };

  // -------------------------------------------------------------
  //  FINANCIAL KPI CAROUSEL
  // -------------------------------------------------------------
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const generateItems = () => {
      carousel.innerHTML = carouselData.map(item => `
        <article class="carousel-item" role="listitem">
          <h3 class="carousel-button" data-target="${item.number}">0</h3>
          <p class="carousel-description">${item.description}</p>
        </article>
      `).join('');
    };
    generateItems();

    const formatNumber = (num) => {
      if (isNaN(num)) return num;
      const sign = num < 0 ? '-' : '';
      const abs = Math.abs(num);
      let formatted = (abs >= 1000 ? (abs / 1000).toFixed(0) + 'k' : abs)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return sign + formatted;
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
        } else if (btn) btn.textContent = '0';
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
  }

  // -------------------------------------------------------------
  //  3D CONE VISUALIZATION (Independent)
  // -------------------------------------------------------------
  const container = document.getElementById('coneContainer');
  if (!container) return;

  // Load Three.js dynamically if not already available
  if (typeof THREE === 'undefined') {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js";
    script.onload = () => {
      console.log('Three.js loaded');  // Debug
      initCone();
    };
    script.onerror = () => {
      console.error('Three.js load failed; fallback to static.');
      container.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">Projection loading unavailable.</div>';
    };
    document.head.appendChild(script);
  } else {
    initCone();
  }

  function initCone() {
    console.log('Initializing cone...');  // Debug
    if (!container || container.clientWidth === 0) {
      console.warn('Cone container has no size; skipping render.');
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';  // Clear any prior content
    container.appendChild(renderer.domElement);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    const pointLight = new THREE.PointLight(0xffffff, 0.9);
    pointLight.position.set(10, 10, 10);
    scene.add(ambientLight, pointLight);

    // Cone and base
    const geometry = new THREE.ConeGeometry(1, 2, 64);
    const material = new THREE.MeshPhongMaterial({
      color: 0x10B981,
      shininess: 100,
      specular: 0xffffff
    });
    const cone = new THREE.Mesh(geometry, material);
    scene.add(cone);

    const baseGeometry = new THREE.CircleGeometry(1.2, 64);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xC4B5FD, shininess: 60 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.rotation.x = -Math.PI / 2;
    base.position.y = -1;
    scene.add(base);

    camera.position.set(3, 2, 3);

    // Text Labels (live data)
    const d = window.saccoData.today;
    const data = {
      Members: d.members,
      Loans: d.loans,
      Contributions: d.contributions,
      Profit: d.profit
    };

    const createTextSprite = (text, color = '#111') => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;   // Explicit size: wide enough for long text
      canvas.height = 64;   // Tall for font
      const ctx = canvas.getContext('2d');
      ctx.font = 'bold 28px Lato, Arial';  // Fallback font
      ctx.fillStyle = color;
      ctx.textBaseline = 'top';  // Align properly
      ctx.fillText(text, 10, 10);  // Start at (10,10) for padding
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true,
        depthWrite: false  // Prevent Z-fighting with cone
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(4, 1.5, 1);  // Scale up for visibility
      return sprite;
    };

    const labels = [
      { text: `Members: ${data.Members}`, pos: [1.8, 1.2, 0] },
      { text: `Loans: KES ${data.Loans.toLocaleString()}`, pos: [-2, 0.8, 0] },
      { text: `Contributions: KES ${data.Contributions.toLocaleString()}`, pos: [1.5, 0.2, 0] },
      { text: `Profit: KES ${data.Profit.toLocaleString()}`, pos: [-1.5, -0.4, 0] }
    ];

    labels.forEach(lbl => {
      const sprite = createTextSprite(lbl.text);
      sprite.position.set(...lbl.pos);
      scene.add(sprite);
    });

    // Responsive (throttled to avoid spam)
    let resizeTimeout;
    window.removeEventListener('resize', handleResize);  // Prevent duplicates
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (container.clientWidth > 0) {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        }
      }, 250);
    }
    window.addEventListener('resize', handleResize);

    // Animate Cone Rotation
    function animate() {
      requestAnimationFrame(animate);
      cone.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();
  }
});
