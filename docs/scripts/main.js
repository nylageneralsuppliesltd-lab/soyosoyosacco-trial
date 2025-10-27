// scripts/main.js - Soyosoyo Sacco Site Initialization
document.addEventListener('DOMContentLoaded', function() {
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
  }

  // Basic Carousel Logic
  const carousel = document.querySelector('.carousel');
  const slides = document.querySelectorAll('.carousel .slide');
  let currentSlide = 0;

  if (carousel && slides.length > 0) {
    function showSlide(index) {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? 'block' : 'none';
      });
    }

    function nextSlide() {
      currentSlide = (currentSlide + 1) % slides.length;
      showSlide(currentSlide);
    }

    // Initialize carousel
    showSlide(currentSlide);
    setInterval(nextSlide, 5000); // Change slide every 5 seconds

    // Optional: Add navigation buttons if present
    const nextBtn = document.querySelector('.carousel-next');
    const prevBtn = document.querySelector('.carousel-prev');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
      });
    }
  }
});
