// scripts/main.js - Soyosoyo Sacco Site Initialization
// Amended for mobile menu toggle, header compatibility, bloat removal, and tool integration (chatbot, loan calculator, dividends calculator)
// Tools dynamically loaded based on page for efficiency and compatibility across all HTML pages (Home.html, Products.html, Jobs.html, etc.)
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

  // Tool Integration: Dynamically load page-specific tool scripts for compatibility across all HTML pages
  // Detect current page and load only relevant tool (prevents bloat on non-tool pages like Home.html, Products.html, etc.)
  // Assumes tool pages: Chat.html (chatbot), LoanCalculator.html (calculator), DividendsCalculator.html (dividends)
  const currentPage = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';
  
  function loadToolScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) {
      console.log(`Tool script ${src} already loaded`);
      return; // Avoid duplicate loads
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => console.log(`Tool loaded: ${src}`);
    script.onerror = () => console.error(`Failed to load tool: ${src}`);
    document.head.appendChild(script);
  }

  if (currentPage.includes('chat')) {
    loadToolScript('scripts/chatbot.js');
    console.log('Chatbot tool initialized for chat page');
  } else if (currentPage.includes('loan') || currentPage.includes('calculator')) {
    loadToolScript('scripts/calculator.js');
    console.log('Loan Calculator tool initialized for calculator page');
  } else if (currentPage.includes('dividends')) {
    loadToolScript('scripts/dividendscalculator.js');
    console.log('Dividends Calculator tool initialized for dividends page');
  }

  // Optional: Site-wide Chatbot Toggle (Floating button to open embedded chat on any page)
  // Uncomment and add <div id="chatbot-container"></div> to body in HTML if desired
  /*
  const chatbotToggle = document.createElement('button');
  chatbotToggle.id = 'chatbot-toggle';
  chatbotToggle.innerHTML = '💬 Chat';
  chatbotToggle.style.position = 'fixed';
  chatbotToggle.style.bottom = '20px';
  chatbotToggle.style.right = '20px';
  chatbotToggle.style.zIndex = '1000';
  chatbotToggle.style.background = '#7dd3c0';
  chatbotToggle.style.color = 'white';
  chatbotToggle.style.border = 'none';
  chatbotToggle.style.borderRadius = '50%';
  chatbotToggle.style.width = '60px';
  chatbotToggle.style.height = '60px';
  chatbotToggle.style.cursor = 'pointer';
  document.body.appendChild(chatbotToggle);
  
  chatbotToggle.addEventListener('click', () => {
    const container = document.getElementById('chatbot-container');
    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.id = 'chatbot-container';
      newContainer.innerHTML = `<!-- Chatbot HTML structure here -->`;
      document.body.appendChild(newContainer);
      loadToolScript('scripts/chatbot.js');
    }
    // Toggle visibility logic
  });
  */

  console.log('Soyosoyo Sacco Site - Initialization complete');
});
