// scripts/main.js – SOYOSOYO SACCO – MOBILE MENU FIXED FOREVER (NOV 2025)
// This version waits until the button ACTUALLY exists — no more "null" errors

(function () {
  'use strict';

  // Guard: Skip if already initialized (avoids duplicates)
  if (window.soyosoyoMenuInited) return;
  window.soyosoyoMenuInited = true;

  // Wait for the button to exist (up to 5 seconds)
  const maxWait = 5000;
  const start = Date.now();

  const initMenu = () => {
    const toggleBtn = document.getElementById('menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (!toggleBtn || !navLinks) {
      if (Date.now() - start < maxWait) {
        requestAnimationFrame(initMenu);
      } else {
        console.error('MENU FAILED: #menu-toggle or .nav-links not found after 5s');
      }
      return;
    }

    console.log('SOYOSOYO MENU ACTIVE');

    // Inject SVG icons (only once)
    if (!toggleBtn.querySelector('.menu-icon')) {
      toggleBtn.innerHTML = `
        <svg class="menu-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="2.5" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg class="close-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="2.5" stroke-linecap="round" style="display: none;">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }

    const menuIcon = toggleBtn.querySelector('.menu-icon');
    const closeIcon = toggleBtn.querySelector('.close-icon');

    const openMenu = () => {
      navLinks.classList.add('show');
      menuIcon.style.display = 'none';
      closeIcon.style.display = 'block';
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      navLinks.classList.remove('show');
      menuIcon.style.display = 'block';
      closeIcon.style.display = 'none';
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    const toggleMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.contains('show') ? closeMenu() : openMenu();
    };

    // Click + Touch (wrapped in try-catch for safety)
    try {
      toggleBtn.addEventListener('click', toggleMenu);
      toggleBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleMenu(e);
      }, { passive: false });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('show') && 
            !navLinks.contains(e.target) && 
            !toggleBtn.contains(e.target)) {
          closeMenu();
        }
      });

      // Close on link click (safe query)
      const links = navLinks.querySelectorAll('a');
      if (links.length > 0) {
        links.forEach(link => {
          link.addEventListener('click', closeMenu);
        });
        console.log(`✅ Bound ${links.length} nav links`);
      } else {
        console.warn('No nav links found for event binding');
      }

      // Resize & ESC
      window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeMenu();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMenu();
      });

      console.log('✅ Events bound successfully');
    } catch (err) {
      console.error('Event binding failed:', err);
    }
  };

  // Start checking
  initMenu();
})();
