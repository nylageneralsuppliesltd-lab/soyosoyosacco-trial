// scripts/main.js - Soyosoyo Sacco Site Initialization
// Includes floating chatbot on all pages, dynamic tool loading, clean nav
// Date: October 11, 2025

document.addEventListener('DOMContentLoaded', function() {
  console.log('Soyosoyo Sacco - main.js loaded');

  // Mobile Menu Toggle
  const toggleBtn = document.getElementById('menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (toggleBtn && navLinks) {
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
      const isOpen = navLinks.classList.contains('show');
      toggleBtn.innerHTML = isOpen ? `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      ` : `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      `;
    }

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      toggleMenu();
    });

    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('show') && !navLinks.contains(e.target) && !toggleBtn.contains(e.target)) {
        toggleMenu();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && navLinks.classList.contains('show')) {
        toggleMenu();
      }
    });

    console.log('Mobile menu initialized');
  }

  // Dynamic Tool Loading (Page-Specific)
  const currentPage = window.location.pathname.split('/').pop().toLowerCase();
  function loadTool(src) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => console.log(`Loaded: ${src}`);
    document.head.appendChild(script);
  }

  if (currentPage.includes('loan') || currentPage.includes('calculator')) {
    loadTool('scripts/calculator.js');
  } else if (currentPage.includes('dividends')) {
    loadTool('scripts/dividendscalculator.js');
  } else if (currentPage.includes('chat')) {
    loadTool('scripts/chatbot.js');
  }

  // Floating Hovering Chatbot (On ALL Pages)
  const chatbotToggle = document.createElement('button');
  chatbotToggle.id = 'chatbot-toggle';
  chatbotToggle.innerHTML = '💬';
  chatbotToggle.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 1000;
    background: #7dd3c0; color: white; border: none; border-radius: 50%;
    width: 60px; height: 60px; cursor: pointer; font-size: 24px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s;
  `;
  chatbotToggle.addEventListener('mouseenter', () => chatbotToggle.style.transform = 'scale(1.1)');
  chatbotToggle.addEventListener('mouseleave', () => chatbotToggle.style.transform = 'scale(1)');
  document.body.appendChild(chatbotToggle);

  let chatbotOpen = false;
  chatbotToggle.addEventListener('click', () => {
    const container = document.getElementById('chatbot-container');
    if (!chatbotOpen) {
      // Load script if not present
      loadTool('scripts/chatbot.js');
      // Embed full chat HTML (from previous response - paste the <div class="chat-container">... entire structure here)
      container.innerHTML = `
        <!-- Full Chatbot HTML from previous: <div class="chat-container"> ... entire body content up to </div> -->
        <div class="chat-container">
          <!-- Paste the full chat HTML structure here (header, messages, input) -->
          <!-- For brevity: See previous chatbot.html response -->
        </div>
      `;
      container.style.display = 'block';
      container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 999;';
      chatbotOpen = true;
      chatbotToggle.innerHTML = '❌';
    } else {
      container.style.display = 'none';
      chatbotOpen = false;
      chatbotToggle.innerHTML = '💬';
    }
  });

  // Close chatbot on outside click
  document.addEventListener('click', (e) => {
    const container = document.getElementById('chatbot-container');
    if (chatbotOpen && !chatbotToggle.contains(e.target) && !container.contains(e.target)) {
      container.style.display = 'none';
      chatbotOpen = false;
      chatbotToggle.innerHTML = '💬';
    }
  });

  console.log('Site init complete - Floating chatbot active on all pages');
});
