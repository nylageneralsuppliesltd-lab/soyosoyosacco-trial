// SOYOSOYO SACCO Chatbot - Complete Working Version
class SoyosoyoChatWidget {
    constructor() {
        this.conversationId = null;
        this.isLoading = false;
        this.hasStarted = false;
        this.apiUrl = 'https://soyosoyosacco123.onrender.com/api/chat';

        // Get DOM elements
        this.container = document.getElementById('chatbot-container');
        this.messages = document.getElementById('chatMessages');
        this.input = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendButton');
        this.closeBtn = document.getElementById('minimizeButton');

        // Check if all elements exist
        if (!this.container || !this.messages || !this.input || !this.sendBtn || !this.closeBtn) {
            console.error('Chatbot failed: Missing elements');
            return;
        }

        this.init();
    }

    init() {
        // Hide chatbot initially
        this.container.style.display = 'none';
        
        // Send button click
        this.sendBtn.onclick = () => this.send();
        
        // Close button click
        this.closeBtn.onclick = () => this.toggle();
        
        // Enter key to send
        this.input.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        };
        
        // Auto-resize textarea
        this.input.oninput = () => {
            this.input.style.height = 'auto';
            this.input.style.height = Math.min(this.input.scrollHeight, 80) + 'px';
        };
        
        console.log('✅ Chatbot initialized successfully');
    }

    toggle() {
        const isHidden = this.container.style.display === 'none';
        this.container.style.display = isHidden ? 'flex' : 'none';
        
        if (isHidden && !this.hasStarted) {
            this.welcome();
        }
        
        if (isHidden) {
            this.input.focus();
        }
    }

    welcome() {
        this.hasStarted = true;
        this.addMsg(
            "Hello! I'm the SOYOSOYO SACCO Assistant. I can help you with loans, savings, and membership. How can I assist you? 🏦",
            'assistant'
        );
    }

    async send() {
        const text = this.input.value.trim();
        if (!text || this.isLoading) return;

        this.input.value = '';
        this.input.style.height = 'auto';
        this.isLoading = true;

        this.addMsg(text, 'user');
        this.typing(true);

        try {
            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    conversationId: this.conversationId,
                    includeContext: true
                })
            });

            if (!res.ok) throw new Error('Server error');

            const data = await res.json();
            this.typing(false);

            if (data.response) {
                this.addMsg(data.response, 'assistant');
                this.conversationId = data.conversationId;
            }
        } catch (err) {
            console.error('Chat error:', err);
            this.typing(false);
            this.addMsg("Sorry, I'm having trouble connecting. Please try again. 🔄", 'assistant');
        } finally {
            this.isLoading = false;
            this.input.focus();
        }
    }

    addMsg(text, role) {
        const msg = document.createElement('div');
        msg.className = `message ${role}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'message-bubble';
        bubble.textContent = text;
        
        msg.appendChild(bubble);
        this.messages.appendChild(msg);
        this.scroll();
    }

    typing(show) {
        const existing = document.getElementById('typing');
        if (existing) existing.remove();

        if (show) {
            const typing = document.createElement('div');
            typing.id = 'typing';
            typing.className = 'message assistant';
            typing.innerHTML = '<div class="message-bubble">Typing...</div>';
            this.messages.appendChild(typing);
            this.scroll();
        }
    }

    scroll() {
        this.messages.scrollTop = this.messages.scrollHeight;
    }
}

// Make it global
window.SoyosoyoChatWidget = SoyosoyoChatWidget;
