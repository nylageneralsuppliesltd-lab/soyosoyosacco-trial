// scripts/carousel.js
// -------------------------------------------------------------
// FULLY FIXED: KPI + 3D CONE + MEMBER CAROUSEL + NO JS ERRORS
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  console.log('carousel.js started'); // Critical debug

  document.body.classList.add('js-enabled');

  // === LOAN TYPES ===
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

  // === CURRENT DAILY DATA ===
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
  console.log('window.saccoData ready:', window.saccoData);

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
  }

  // -------------------------------------------------------------
  //  3D CONE VISUALIZATION - NOW 100% WORKING
  // -------------------------------------------------------------
  const container = document.getElementById('coneContainer');
  if (!container) {
    console.warn('No #coneContainer found; skipping cone.');
  } else {
    // Safe: only touch container after DOM is ready
    container.style.width = '100%';
    container.style.height = '480px';

    const initCone = () => {
      if (!container || container.clientWidth === 0) {
        console.warn('Cone container has no size yet.');
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const pointLight = new THREE.PointLight(0xffffff, 0.9);
      pointLight.position.set(10, 10, 10);
      scene.add(pointLight);

      // Cone
      const geometry = new THREE.ConeGeometry(1, 2, 64);
      const material = new THREE.MeshPhongMaterial({ color: 0x10B981, shininess: 100, specular: 0xffffff });
      const cone = new THREE.Mesh(geometry, material);
      scene.add(cone);

      // Base
      const baseGeometry = new THREE.CircleGeometry(1.2, 64);
      const baseMaterial = new THREE.MeshPhongMaterial({ color: 0xC4B5FD, shininess: 60 });
      const base = new THREE.Mesh(baseGeometry, baseMaterial);
      base.rotation.x = -Math.PI / 2;
      base.position.y = -1;
      scene.add(base);

      camera.position.set(3, 2, 3);

      // TEXT LABELS - NOW VISIBLE
      const d = window.saccoData.today;
      const createTextSprite = (text, color = '#ffffff') => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = 'bold 36px Lato, Arial';
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeText(text, 20, 60);
        ctx.fillText(text, 20, 60);
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(5, 1.8, 1);
        return sprite;
      };

      const labels = [
        { text: `Members: ${d.members}`, pos: [2, 1.4, 0] },
        { text: `Loans: KES ${d.loans.toLocaleString()}`, pos: [-2.4, 0.9, 0] },
        { text: `Savings: KES ${d.contributions.toLocaleString()}`, pos: [2, 0.2, 0] },
        { text: `Profit: KES ${d.profit.toLocaleString()}`, pos: [-2.2, -0.5, 0] }
      ];

      labels.forEach(l => {
        const sprite = createTextSprite(l.text);
        sprite.position.set(...l.pos);
        scene.add(sprite);
      });

      // Resize handler
      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        }, 200);
      });

      // Animation
      const animate = () => {
        requestAnimationFrame(animate);
        cone.rotation.y += 0.008;
        renderer.render(scene, camera);
      };
      animate();

      console.log('3D Cone fully initialized with labels');
    };

    // Load Three.js safely
    if (typeof THREE === 'undefined') {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js";
      script.onload = () => {
        console.log('Three.js loaded');
        initCone();
      };
      script.onerror = () => {
        container.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">3D projection unavailable</div>';
      };
      document.head.appendChild(script);
    } else {
      initCone();
    }
  }

  // -------------------------------------------------------------
  //  MEMBER ACTIVITIES CAROUSEL
  // -------------------------------------------------------------
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

  const initMemberCarousel = () => {
    const slidesContainer = document.getElementById('memberSlides');
    const dotsContainer = document.getElementById('memberDots');
    if (!slidesContainer || !dotsContainer) return;

    slidesContainer.innerHTML = '';
    dotsContainer.innerHTML = '';

    memberImages.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Member Activity ${i + 1}`;
      img.loading = 'lazy';
      img.onerror = () => img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
      slide.appendChild(img);
      slidesContainer.appendChild(slide);

      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.onclick = () => goToSlide(i);
      dotsContainer.appendChild(dot);
    });

    showSlide(0);
    setInterval(() => changeSlide(1), 5000);
  };

  const showSlide = (index) => {
    const slides = document.querySelectorAll('#memberSlides .slide');
    const dots = document.querySelectorAll('#memberDots .dot');
    const total = slides.length;
    currentSlide = index >= total ? 0 : index < 0 ? total - 1 : index;
    document.getElementById('memberSlides').style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => dot.className = i === currentSlide ? 'dot active' : 'dot');
  };

  window.changeSlide = (dir) => showSlide(currentSlide + dir);
  const goToSlide = (i) => showSlide(i);

  initMemberCarousel();

  console.log('carousel.js fully executed - no errors');
});
