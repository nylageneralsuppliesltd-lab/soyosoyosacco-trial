// scripts/main.js - Soyosoyo Sacco Site Initialization
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    // Inject SVG icons if not present
    if (!toggleBtn.querySelector('.menu-icon')) {
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

    const menuIcon = toggleBtn.querySelector('.menu-icon');
    const closeIcon = toggleBtn.querySelector('.close-icon');

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.toggle('show');
      menuIcon.style.display = navLinks.classList.contains('show') ? 'none' : 'block';
      closeIcon.style.display = navLinks.classList.contains('show') ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('show') && !navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        navLinks.classList.remove('show');
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navLinks.classList.contains('show')) {
        navLinks.classList.remove('show');
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    });
  }
});
