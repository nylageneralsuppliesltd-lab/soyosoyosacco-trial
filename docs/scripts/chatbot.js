// scripts/chatbot.js
class SoyosoyoChatWidget {
    constructor() {
        this.conversationId = null;
        this.isLoading = false;
        this.hasStarted = false;
        this.apiBaseUrl = 'https://soyosoyosacco123.onrender.com';

        // DOM elements with flexible selectors
        this.chatbotContainer = document.getElementById('chatbot-container');
        this.messageInput = document.getElementById('messageInput');
        this.chatMessages = document.getElementById('chatMessages');
        this.sendButton = document.getElementById('sendButton');
        this.minimizeButton = document.getElementById('minimizeButton');

        if (!this.chatbotContainer || !this.messageInput || !this.chatMessages || !this.sendButton || !this.minimizeButton) {
            console.error('Chatbot initialization failed: Missing DOM elements', {
                chatbotContainer: !!this.chatbotContainer,
                messageInput: !!this.messageInput,
                chatMessages: !!this.chatMessages,
                sendButton: !!this.sendButton,
                minimizeButton: !!this.minimizeButton
            });
            return;
        }

        this.setupEventListeners();
        this.initializeChatbot();
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

        // Send message on button click
        this.sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.sendMessage();
        });

        // Toggle chatbot on minimize button
        this.minimizeButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleChatbot();
        });

        // Start chat on first focus
        this.messageInput.addEventListener('focus', () => {
            if (!this.hasStarted) {
                this.startChat();
            }
        });
    }

    initializeChatbot() {
        this.chatbotContainer.style.display = 'none';
        console.log('Chatbot initialized');
    }

    toggleChatbot() {
        const isHidden = this.chatbotContainer.style.display === 'none';
        this.chatbotContainer.style.display = isHidden ? 'flex' : 'none';
        
        if (isHidden && !this.hasStarted) {
            this.startChat();
        }
        
        if (isHidden) {
            this.messageInput.focus();
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
        if (!message || this.isLoading) {
            return;
        }

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
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            this.addMessage(
                "I'm having trouble connecting to the server. Please try again later. 🔄",
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
        bubbleDiv.textContent = content;

        messageDiv.appendChild(bubbleDiv);
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message assistant typing-indicator';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = '<div class="message-bubble">Typing...</div>';
        this.chatMessages.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Export for use in other scripts
window.SoyosoyoChatWidget = SoyosoyoChatWidget;
