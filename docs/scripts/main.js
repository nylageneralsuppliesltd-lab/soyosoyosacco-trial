// scripts/main.js – SOYOSOYO SACCO MOBILE MENU – FIXED FOREVER (NOV 17, 2025)
// No flicker | Works on every page | No global flag issues | Mobile + Desktop perfect

(function () {
  'use strict';

  // REMOVED THE GLOBAL FLAG — This was causing issues across pages
  // Old: if (window.soyosoyoMenuInited) return; → DELETED
  // We now run fresh on every page load — safe, clean, and necessary

  let toggleBtn = null;
  let navLinks = null;
  let menuIcon = null;
  let closeIcon = null;

  const maxWait = 5000;
  const startTime = Date.now();

  const initMenu = () => {
    toggleBtn = document.getElementById('menu-toggle');
    navLinks = document.querySelector('.nav-links');

    if (!toggleBtn || !navLinks) {
      if (Date.now() - startTime < maxWait) {
        requestAnimationFrame(initMenu);
      } else {
        console.error('SOYOSOYO MENU ERROR: #menu-toggle or .nav-links not found after 5s');
      }
      return;
    }

    console.log('SOYOSOYO MOBILE MENU INITIALIZED SUCCESSFULLY');

    // Inject SVG icons (only if not already there)
    if (!toggleBtn.querySelector('svg')) {
      toggleBtn.innerHTML = `
        <svg class="menu-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg class="close-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;

      menuIcon = toggleBtn.querySelector('.menu-icon');
      closeIcon = toggleBtn.querySelector('.close-icon');
      closeIcon.style.display = 'none'; // Ensure X is hidden initially
    } else {
      menuIcon = toggleBtn.querySelector('.menu-icon');
      closeIcon = toggleBtn.querySelector('.close-icon');
    }

    // Core functions
    const openMenu = () => {
      navLinks.classList.add('show');
      if (menuIcon) menuIcon.style.display = 'none';
      if (closeIcon) closeIcon.style.display = 'block';
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      navLinks.classList.remove('show');
      if (menuIcon) menuIcon.style.display = 'block';
      if (closeIcon) closeIcon.style.display = 'none';
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    // THE FIX: Stop propagation + prevent mobile flicker
    const toggleMenu = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation(); // CRITICAL: Stops bubble → no instant close
      }
      navLinks.classList.contains('show') ? closeMenu() : openMenu();
    };

    // Remove any old listeners to prevent duplicates
    toggleBtn.replaceWith(toggleBtn.cloneNode(true));
    toggleBtn = document.getElementById('menu-toggle'); // Re-select after clone

    // Re-inject SVGs after clone (clean slate)
    toggleBtn.innerHTML = `
      <svg class="menu-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
      <svg class="close-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;

    menuIcon = toggleBtn.querySelector('.menu-icon');
    closeIcon = toggleBtn.querySelector('.close-icon');
    closeIcon.style.display = 'none';

    // Re-bind events cleanly
    toggleBtn.addEventListener('click', toggleMenu);
    toggleBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      toggleMenu(e);
    }, { passive: false });

    // Outside click — with safety delay for mobile
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('show') &&
          !navLinks.contains(e.target) &&
          !toggleBtn.contains(e.target)) {
        setTimeout(closeMenu, 10); // Tiny delay fixes synthetic tap issues
      }
    });

    // Close when clicking a nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('show')) {
          closeMenu();
        }
      });
    });

    // Close on resize (desktop)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        closeMenu();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('show')) {
        closeMenu();
      }
    });

    console.log('SOYOSOYO MENU: Events bound (flicker-proof)');
  };

  // Start initialization
  initMenu();

})();
