// scripts/main.js - Soyosoyo Sacco Site Initialization
// Amended for mobile menu toggle, header compatibility, and bloat removal
// Date: October 11, 2025

document.addEventListener('DOMContentLoaded', function() {
  console.log('Soyosoyo Sacco - main.js loaded');

  // Mobile Menu Toggle (Core Amendment)
  const toggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (toggleBtn && navLinks) {
    // Initial hamburger icon
    toggleBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;
    toggleBtn.style.cursor = 'pointer';

    function toggleMenu() {
      navLinks.classList.toggle('show');
      if (navLinks.classList.contains('show')) {
        // Close (X) icon
        toggleBtn.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        `;
      } else {
        // Hamburger icon
        toggleBtn.innerHTML = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        `;
      }
    }

    toggleBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (navLinks.classList.contains('show') && !navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        toggleMenu(); // Toggles to closed
      }
    });

    // Close on resize to desktop
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        if (navLinks.classList.contains('show')) {
          toggleMenu(); // Toggles to closed
        }
      }
    });

    console.log('Mobile menu toggle initialized');
  } else {
    console.warn('Menu elements not found - check IDs in HTML');
  }

  // Optional: Header Image (No Amendment Needed - Handled in CSS)
  // If you want JS to set background-image dynamically per page, add here:
  /*
  const hero = document.querySelector('.hero');
  if (hero) {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    let imagePath = './assets/header-image.jpg';
    if (page === 'Products.html') imagePath = './assets/products-header.jpg';
    // Add more pages
    hero.style.backgroundImage = `url('${imagePath}')`;
  }
  */

  // Bloat Cleanup: Ignore Google Sites JS (Comment out or remove if present)
  // Example: Remove or ignore [jscontroller] elements
  // document.querySelectorAll('[jscontroller]').forEach(el => el.removeAttribute('jscontroller'));

  console.log('Soyosoyo Sacco Site - Initialization complete');
});
