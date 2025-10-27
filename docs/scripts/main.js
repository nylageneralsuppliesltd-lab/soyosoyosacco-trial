// scripts/main.js - Soyosoyo Sacco Site Initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log('Soyosoyo Sacco - main.js loaded');

  // Mobile Menu Toggle
  const toggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const menuIcon = document.querySelector('.menu-icon');
  const closeIcon = document.querySelector('.close-icon');

  if (toggleBtn && navLinks && menuIcon && closeIcon) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.toggle('active');
      menuIcon.style.display = navLinks.classList.contains('active') ? 'none' : 'block';
      closeIcon.style.display = navLinks.classList.contains('active') ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        navLinks.classList.remove('active');
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        menuIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    });

    console.log('Mobile menu initialized');
  }

  console.log('Site init complete');
});
