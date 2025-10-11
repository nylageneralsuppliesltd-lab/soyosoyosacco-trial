// docs/scripts/chatbot.js - Soyosoyo Sacco Multilingual Chat Assistant
// Integrates with openai.ts backend for GPT-4o responses
// Features: Auto-detect language, conversation history, loading states
// Date: October 11, 2025

class SoyosoyoChatbot {
  constructor(containerId = 'chatbot') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn('Chatbot container not found - check #chatbot in HTML');
      return;
    }
    this.apiUrl = '/api/chat'; // Adjust to your backend endpoint (from openai.ts)
    this.conversationId = null; // From backend response
    this.messages = []; // Local history
    this.isLoading = false;
    this.targetLanguage = null; // Optional: 'Swahili', 'English', etc.
    this.initUI();
    this.initEventListeners();
    console.log('Soyosoyo Chatbot initialized');
  }

  initUI() {
    this.container.innerHTML = `
      <div class="chat-header">
        <img src="./assets/logo.jpg" alt="Soyosoyo Sacco" class="chat-avatar" onerror="this.style.display='none'">
        <div class="chat-info">
          <h3>Soyosoyo Sacco Assistant</h3>
          <p>Available 24/7 - Ask about loans, membership, or financial advice</p>
        </div>
        <button class="minimize-btn" onclick="this.chatbot.toggleMinimize()">−</button>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="message bot-message">
          <p>Hello! I'm the Soyosoyo Sacco Assistant. How can I help with your financial needs today? (e.g., loans, savings, membership)</p>
        </div>
      </div>
      <div class="chat-input-container">
        <input type="text" id="chatInput" placeholder="Type your message... (Supports Swahili, English, etc.)" onkeypress="this.chatbot.handleKeyPress(event)">
        <button id="sendBtn" onclick="this.chatbot.sendMessage()">Send</button>
      </div>
    `;
    this.messagesEl = document.getElementById('chatMessages');
    this.inputEl = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.chatbot = this; // For inline onclick
  }

  initEventListeners() {
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.inputEl.addEventListener('keypress', (e) => this.handleKeyPress(e));
  }

  handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }

  async sendMessage() {
    const message = this.inputEl.value.trim();
    if (!message || this.isLoading) return;

    this.isLoading = true;
    this.inputEl.disabled = true;
    this.sendBtn.disabled = true;
    this.sendBtn.textContent = 'Sending...';

    // Add user message to UI
    this.addMessage(message, 'user');

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: this.conversationId,
          targetLanguage: this.targetLanguage // Optional multilingual
        })
      });

      if (!response.ok) throw new Error('Network error');

      const data = await response.json();
      const aiResponse = data.response || 'Sorry, I couldn\'t process that.';
      this.conversationId = data.conversationId;

      // Add assistant response to UI
      this.addMessage(aiResponse, 'bot');
    } catch (error) {
      console.error('Chat error:', error);
      this.addMessage('Sorry, I\'m experiencing technical difficulties. Please try again.', 'bot');
    } finally {
      this.isLoading = false;
      this.inputEl.disabled = false;
      this.sendBtn.disabled = false;
      this.sendBtn.textContent = 'Send';
      this.inputEl.value = '';
      this.inputEl.focus();
    }
  }

  addMessage(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${sender}-message`;
    messageEl.innerHTML = `<p>${text.replace(/\n/g, '<br>')}</p>`;
    this.messagesEl.appendChild(messageEl);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  toggleMinimize() {
    this.container.classList.toggle('minimized');
  }

  // Multilingual: Set target language (call from UI dropdown if needed)
  setLanguage(lang) {
    this.targetLanguage = lang;
    console.log(`Chat language set to ${lang}`);
  }
}

// Initialize chatbot if container exists
if (document.getElementById('chatbot')) {
  new SoyosoyoChatbot('chatbot');
}
