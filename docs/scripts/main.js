// scripts/main.js - Soyosoyo Sacco Site Initialization
document.addEventListener('DOMContentDOMContentLoaded', function() {
  // Mobile Menu Toggle
  const toggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const menuIcon = document.querySelector('.menu-icon');
  const closeIcon = document.querySelector('.close-icon');

  if (toggleBtn && navLinks) {
    // Inject SVG icons (only if not already present)
    if (!menuIcon || !closeIcon) {
      toggleBtn.innerHTML = `
        <svg class="menu-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
        <svg class="close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#006400" stroke-width="2" style="display: none;">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    }

    // Re-select after injection
    const menuIconFinal = toggleBtn.querySelector('.menu-icon');
    const closeIconFinal = toggleBtn.querySelector('.close-icon');

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.toggle('show');
      menuIconFinal.style.display = navLinks.classList.contains('show') ? 'none' : 'block';
      closeIconFinal.style.display = navLinks.classList.contains('show') ? 'block' : 'none';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('show') && !navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        navLinks.classList.remove('show');
        menuIconFinal.style.display = 'block';
        closeIconFinal.style.display = 'none';
      }
    });

    // Close on resize (desktop)
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        menuIconFinal.style.display = 'block';
        closeIconFinal.style.display = 'none';
      }
    });
  }
});
