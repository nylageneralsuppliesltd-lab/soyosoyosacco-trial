// scripts/chatbot.js
class SoyosoyoChatWidget {
  constructor() {
    this.conversationId = null;
    this.isLoading = false;
    this.hasStarted = false;
    this.apiBaseUrl = 'https://soyosoyosacco123.onrender.com';

    // DOM elements with error checking
    this.chatbotContainer = document.getElementById('chatbot-container');
    this.messageInput = document.getElementById('chatbot-input');
    this.chatMessages = document.getElementById('chatbot-messages');

    if (!this.chatbotContainer || !this.messageInput || !this.chatMessages) {
      console.error('Chatbot initialization failed: Missing DOM elements', {
        chatbotContainer: !!this.chatbotContainer,
        messageInput: !!this.messageInput,
        chatMessages: !!this.chatMessages,
      });
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Auto-resize textarea
    this.messageInput.addEventListener('input', () => {
      this.messageInput.style.height = 'auto';
      this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 80) + 'px';
    });

    // Send message on Enter key
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Start chat on first focus
    this.messageInput.addEventListener('focus', () => {
      if (!this.hasStarted) {
        this.startChat();
      }
    });

    // Ensure minimize button works
    const minimizeButton = this.chatbotContainer.querySelector('.minimize-button');
    if (minimizeButton) {
      minimizeButton.addEventListener('click', () => this.toggleChatbot());
    }
  }

  toggleChatbot() {
    if (!this.chatbotContainer) {
      console.error('Cannot toggle chatbot: Container not found');
      return;
    }
    const isHidden = this.chatbotContainer.style.display === 'none' || !this.chatbotContainer.style.display;
    this.chatbotContainer.style.display = isHidden ? 'flex' : 'none'; // Use flex for proper layout
    if (isHidden && !this.hasStarted) {
      this.startChat();
    }
  }

  startChat() {
    this.hasStarted = true;
    this.addMessage(
      "Hello! I'm the SOYOSOYO SACCO Assistant. I can help you with information about our services, loans, savings products, and membership requirements. How can I assist you today? 🏦",
      'assistant'
    );
  }

  async sendMessage() {
    const message = this.messageInput.value.trim();
    if (!message || this.isLoading) return;

    this.messageInput.value = '';
    this.messageInput.style.height = 'auto';
    this.isLoading = true;

    this.addMessage(message, 'user');
    this.showTypingIndicator();

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: this.conversationId,
          includeContext: true,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.hideTypingIndicator();

      if (data.response) {
        this.addMessage(data.response, 'assistant');
        this.conversationId = data.conversationId;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.hideTypingIndicator();
      this.addMessage(
        "I'm having trouble connecting to the server right now. Please check your connection and try again. 🔄",
        'assistant'
      );
    } finally {
      this.isLoading = false;
      this.messageInput.focus();
    }
  }

  addMessage(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';

    if (role === 'assistant') {
      bubbleDiv.innerHTML = this.renderMarkdown(content);
    } else {
      bubbleDiv.textContent = content;
    }

    messageDiv.appendChild(bubbleDiv);
    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  renderMarkdown(text) {
    let html = this.escapeHtml(text);

    // Handle tables
    const tableRegex = /\|(.+?)\|\n\|[\s\-\|:]+\|\n((?:\|.+?\|\n?)*)/g;
    html = html.replace(tableRegex, (match, header, body) => {
      const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
      const bodyRows = body.trim().split('\n').map(row =>
        row.split('|').map(cell => cell.trim()).filter(cell => cell)
      );

      let table = '<table>';
      table += '<tr>' + headerCells.map(cell => `<th>${cell}</th>`).join('') + '</tr>';
      bodyRows.forEach(row => {
        if (row.length > 0) {
          table += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
        }
      });
      table += '</table>';

      return table;
    });

    // Handle bullet points
    const lines = html.split('\n');
    let inList = false;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^- (.+)$/)) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push(`<li>${line.replace(/^- /, '')}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(line);
      }
    }
    if (inList) {
      result.push('</ul>');
    }

    html = result.join('\n');

    // Enhanced markdown rendering
    html = html
      .replace(/^### (.+)$/gm, '<h3 style="color: #1e7b85; font-size: 16px; font-weight: bold; margin: 8px 0 4px 0;">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 style="color: #1e7b85; font-size: 18px; font-weight: bold; margin: 10px 0 6px 0;">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 style="color: #1e7b85; font-size: 20px; font-weight: bold; margin: 12px 0 8px 0;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');

    return html.replace(/<br><ul>/g, '<ul>').replace(/<\/ul><br>/g, '</ul>');
  }

  showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typingIndicator';
    typingDiv.className = 'message assistant';
    typingDiv.innerHTML = `
      <div class="message-bubble">
        <div style="display: flex; gap: 3px;">
          <div style="width: 6px; height: 6px; background: #22c55e; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite both;"></div>
          <div style="width: 6px; height: 6px; background: #22c55e; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite both; animation-delay: 0.1s;"></div>
          <div style="width: 6px; height: 6px; background: #22c55e; border-radius: 50%; animation: bounce 1.4s ease-in-out infinite both; animation-delay: 0.2s;"></div>
        </div>
      </div>
      <style>
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      </style>`;
    this.chatMessages.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) typingIndicator.remove();
  }

  scrollToBottom() {
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.chatWidget = new SoyosoyoChatWidget();
  } catch (error) {
    console.error('Failed to initialize SoyosoyoChatWidget:', error);
  }
});

function toggleChatbot() {
  if (window.chatWidget) {
    window.chatWidget.toggleChatbot();
  } else {
    console.error('Chatbot widget not initialized. Please check the console for errors.');
  }
}

function sendMessage() {
  if (window.chatWidget) {
    window.chatWidget.sendMessage();
  } else {
    console.error('Chatbot widget not initialized. Cannot send message.');
  }
}
