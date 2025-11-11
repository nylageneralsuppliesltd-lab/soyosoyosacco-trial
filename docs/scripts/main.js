// scripts/main.js – SOYOSOYO SACCO – MOBILE MENU FIXED FOREVER
// Works on: index.html, About.html, Products.html, Join-Us.html, ALL pages
// SVG icons + smooth animation + touch + click + outside close + resize

document.addEventListener('DOMContentLoaded', () => {
  console.log('main.js loaded – fixing mobile menu');

  const toggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  // ——— CRITICAL SAFETY CHECK ———
  if (!toggleBtn || !navLinks) {
    console.error('MENU BROKEN: #menu-toggle or .nav-links missing!', { toggleBtn, navLinks });
    return;
  }

  // ——— INJECT SVG ICONS (only if not already there) ———
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

  // ——— TOGGLE FUNCTION (Click + Touch) ———
  const openMenu = () => {
    navLinks.classList.add('show');
    menuIcon.style.display = 'none';
    closeIcon.style.display = 'block';
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
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
    if (navLinks.classList.contains('show')) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  // ——— EVENT LISTENERS ———
  toggleBtn.addEventListener('click', toggleMenu);
  toggleBtn.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent double tap zoom
    toggleMenu(e);
  }, { passive: false });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('show') && 
        !navLinks.contains(e.target) && 
        !toggleBtn.contains(e.target)) {
      closeMenu();
    }
  });

  // Close when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on resize (desktop)
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navLinks.classList.contains('show')) {
      closeMenu();
    }
  });

  // ESC key support
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('show')) {
      closeMenu();
      toggleBtn.focus();
    }
  });

  console.log('Mobile menu FIXED on this page');
});
