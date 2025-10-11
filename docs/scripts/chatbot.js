// scripts/chatbot.js
class SoyosoyoChatWidget {
    constructor() {
        this.conversationId = null;
        this.isLoading = false;
        this.hasStarted = false;
        this.apiBaseUrl = 'https://soyosoyosacco123.onrender.com';

        // DOM elements with flexible selectors (match HTML structure)
        this.chatbotContainer = document.getElementById('chatbot-container') || document.querySelector('.chat-container');
        this.messageInput = document.getElementById('messageInput') || document.querySelector('.chat-input-field');
        this.chatMessages = document.getElementById('chatMessages') || document.querySelector('.chat-messages');
        this.sendButton = document.getElementById('sendButton') || document.querySelector('.send-button');
        this.minimizeButton = document.getElementById('minimizeButton') || document.querySelector('.minimize-button');

        if (!this.chatbotContainer || !this.messageInput || !this.chatMessages || !this.sendButton || !this.minimizeButton) {
            console.error('Chatbot initialization failed: Missing DOM elements', {
                chatbotContainer: !!this.chatbotContainer,
                messageInput: !!this.messageInput,
                chatMessages: !!this.chatMessages,
                sendButton: !!this.sendButton,
                minimizeButton: !!this.minimizeButton
            });
            this.showErrorState();
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
            console.log('Send button clicked');
            this.sendMessage();
        });

        // Toggle chatbot on minimize button
        this.minimizeButton.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Minimize button clicked');
            this.toggleChatbot();
        });

        // Start chat on first focus
        this.messageInput.addEventListener('focus', () => {
            if (!this.hasStarted) {
                console.log('Starting chat on input focus');
                this.startChat();
            }
        });

        // Ensure visibility on page navigation
        window.addEventListener('popstate', () => {
            if (this.chatbotContainer.style.display === 'flex') {
                this.ensureChatbotVisible();
            }
        });
    }

    initializeChatbot() {
        // Ensure chatbot container is properly styled for floating/mini mode
        this.chatbotContainer.style.position = 'fixed';
        this.chatbotContainer.style.bottom = '20px';
        this.chatbotContainer.style.right = '20px';
        this.chatbotContainer.style.width = 'min(90vw, 320px)';
        this.chatbotContainer.style.height = 'min(80vh, 400px)';
        this.chatbotContainer.style.zIndex = '1000';
        this.chatbotContainer.style.background = 'white';
        this.chatbotContainer.style.borderRadius = '12px';
        this.chatbotContainer.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        this.chatbotContainer.style.display = 'none'; // Start hidden
        this.chatbotContainer.style.flexDirection = 'column';
        this.chatbotContainer.style.overflow = 'hidden';

        this.chatMessages.style.overflowY = 'auto';
        this.chatMessages.style.padding = '10px';
        this.chatMessages.style.borderBottom = '1px solid #90EE90';
        this.chatMessages.style.minHeight = '200px';
        this.chatMessages.style.display = 'block';

        this.messageInput.style.display = 'block';
        this.sendButton.style.display = 'flex';
        this.minimizeButton.style.color = 'white'; // Ensure X is white
        console.log('Chatbot initialized with styles');
    }

    showErrorState() {
        const botContainer = document.getElementById('bot-container');
        if (botContainer) {
            botContainer.innerHTML += '<div class="error-message">Chatbot failed to load. Please refresh the page or contact support.</div>';
        }
    }

    toggleChatbot() {
        if (!this.chatbotContainer) {
            console.error('Cannot toggle chatbot: Container not found');
            this.showErrorState();
            return;
        }
        const isHidden = this.chatbotContainer.style.display === 'none' || !this.chatbotContainer.style.display;
        console.log('Toggling chatbot, current state: hidden=', isHidden);
        this.chatbotContainer.style.display = isHidden ? 'flex' : 'none';
        if (isHidden && !this.hasStarted) {
            console.log('Starting chat on toggle');
            this.startChat();
        }
        if (isHidden) {
            this.ensureChatbotVisible();
        }
    }

    ensureChatbotVisible() {
        // Force layout refresh
        this.chatbotContainer.style.display = 'none';
        void this.chatbotContainer.offsetWidth;
        this.chatbotContainer.style.display = 'flex';
        this.chatMessages.style.display = 'block';
        this.messageInput.style.display = 'block';
        this.sendButton.style.display = 'flex';
        this.scrollToBottom();
        console.log('Chatbot visibility ensured');
    }

    startChat() {
        this.hasStarted = true;
        this.addMessage(
            "Hello! I'm the SOYOSOYO SACCO Assistant. I can help you with information about our services, loans, savings products, and membership requirements. How can I assist you today? 🏦",
            'assistant'
        );
        console.log('Chat started with welcome message');
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) {
            console.log('Send message blocked: empty message or loading');
            return;
        }

        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.isLoading = true;

        this.addMessage(message, 'user');
        this.showTypingIndicator();

        try {
            console.log('Sending message to API:', message);
            const response = await fetch(`${this.apiBaseUrl}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversationId: this.conversationId,
                    includeContext: true,
                }),
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.hideTypingIndicator();

            if (data.response) {
                this.addMessage(data.response, 'assistant');
                this.conversationId = data.conversationId;
                console.log('API response received, conversationId:', this.conversationId);
            } else {
                throw new Error('Invalid response format from server');
            }
        } catch (error) {
            console.error('Chat error:', error);
            this.hideTypingIndicator();
            let errorMessage = "I'm having trouble connecting to the server right now. Please check your connection and try again. 🔄";
            if (error.name === 'TimeoutError') {
                errorMessage = "The server took too long to respond. Please try again later. ⏳";
            }
            this.addMessage(errorMessage, 'assistant');
        } finally {
            this.isLoading = false;
            this.messageInput.focus();
            console.log('Message sending complete, isLoading:', this.isLoading);
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
        const tableRegex = /\|(.+?)\|\n\|[\s\-\|:]+\|\n((?:\|.+?\|\n?
