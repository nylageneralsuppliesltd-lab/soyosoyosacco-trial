class PhoneOptimizedChatWidget {
    constructor() {
        this.conversationId = null;
        this.isLoading = false;
        this.hasStarted = false;
        
        // API configuration - Update with your actual deployed URL
        this.apiBaseUrl = 'https://soyosoyosacco123.onrender.com';
        
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.standbyOverlay = document.getElementById('standbyOverlay');
        this.minimizeButton = document.getElementById('minimizeButton');
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        this.minimizeButton.addEventListener('click', () => {
            if (window.parent !== window) {
                // If embedded, hide the widget
                document.body.style.display = 'none';
            } else {
                // If standalone, just minimize to bottom
                document.body.style.transform = 'translateY(100vh)';
            }
        });
        
        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 80) + 'px';
        });

        // Focus input when user starts typing
        this.messageInput.addEventListener('focus', () => {
            if (!this.hasStarted) {
                this.startChat();
            }
        });

        // Make standby overlay clickable to start chat
        this.standbyOverlay.addEventListener('click', () => {
            this.startChat();
            this.messageInput.focus();
        });
    }

    startChat() {
        this.hasStarted = true;
        this.standbyOverlay.classList.add('hidden');
        
        // Add welcome message
        this.addMessage("Hello! I'm the SOYOSOYO SACCO Assistant. I can help you with information about our services, loans, savings products, and membership requirements. How can I assist you today? 🏦", 'assistant');
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;
        
        if (!this.hasStarted) {
            this.startChat();
        }
        
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.isLoading = true;
        this.sendButton.disabled = true;
        
        this.addMessage(message, 'user');
        this.showTypingIndicator();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversationId: this.conversationId,
                    includeContext: true 
                }),
                signal: AbortSignal.timeout(60000) // Increased timeout for longer responses
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
            this.addMessage("I'm having trouble connecting to the server right now. Please check your connection and try again. 🔄", 'assistant');
        } finally {
            this.isLoading = false;
            this.sendButton.disabled = false;
            this.messageInput.focus();
        }
    }
    
    addMessage(content, role) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.innerHTML = role === 'assistant' ? 'S' : 'U';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        
        // Enhanced markdown rendering
        if (role === 'assistant') {
            bubbleDiv.innerHTML = this.renderMarkdown(content);
        } else {
            bubbleDiv.textContent = content;
        }
        
        messageDiv.appendChild(avatarDiv);
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
        // First escape the HTML to prevent XSS
        let html = this.escapeHtml(text);
        
        // Handle tables BEFORE converting newlines to <br>
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
        
        // Handle bullet points - improved to handle multiple lists
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
        
        // Enhanced markdown rendering with proper formatting
        html = html
            // Convert headers - ### Header, ## Header, # Header
            .replace(/^### (.+)$/gm, '<h3 style="color: #1e7b85; font-size: 16px; font-weight: bold; margin: 8px 0 4px 0;">$1</h3>')
            .replace(/^## (.+)$/gm, '<h2 style="color: #1e7b85; font-size: 18px; font-weight: bold; margin: 10px 0 6px 0;">$1</h2>')
            .replace(/^# (.+)$/gm, '<h1 style="color: #1e7b85; font-size: 20px; font-weight: bold; margin: 12px 0 8px 0;">$1</h1>')
            // Convert **bold** to <strong>
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Convert *italic* to <em>
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Convert `code` to <code>
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Convert line breaks
            .replace(/\n/g, '<br>');
        
        return html.replace(/<br><ul>/g, '<ul>').replace(/<\/ul><br>/g, '</ul>');
    }
    
    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message assistant';
        typingDiv.innerHTML = `
            <div class="message-avatar">S</div>
            <div class="message-bubble">
                <div class="typing-indicator">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
            </div>
        `;
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new PhoneOptimizedChatWidget();
});
