// scripts/chatbot.js
(function() {
    'use strict';

    class SoyosoyoChatWidget {
        constructor() {
            this.conversationId = null;
            this.isLoading = false;
            this.hasStarted = false;
            this.isOpen = false;
            this.apiUrl = 'https://soyosoyosacco123.onrender.com/api/chat';
            
            this.createWidget();
            this.init();
        }

        createWidget() {
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                #soyosoyo-float-btn {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #90EE90 0%, #228B22 100%);
                    border: none;
                    box-shadow: 0 4px 12px rgba(0, 100, 0, 0.2);
                    cursor: pointer;
                    z-index: 9998;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                #soyosoyo-float-btn:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0, 100, 0, 0.3);
                }
                #soyosoyo-float-btn img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                }
                .soyosoyo-notification-badge {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    background: #ff4444;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(255, 68, 68, 0.3);
                }
                #soyosoyo-float-btn.close {
                    background: #ff4444;
                }
                #soyosoyo-float-btn.close img {
                    display: none;
                }
                #soyosoyo-float-btn.close::after {
                    content: '✕';
                    color: white;
                    font-size: 24px;
                    font-weight: bold;
                }
                #soyosoyo-chat-widget {
                    position: fixed;
                    bottom: 90px;
                    right: 20px;
                    width: min(90vw, 360px);
                    max-height: 500px;
                    background: white;
                    border: 1px solid #90EE90;
                    border-radius: 16px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                    display: none;
                    flex-direction: column;
                    z-index: 9999;
                    animation: slideUp 0.3s ease;
                }
                #soyosoyo-chat-widget.open {
                    display: flex;
                }
                .soyosoyo-header {
                    background: linear-gradient(135deg, #90EE90 0%, #228B22 100%);
                    color: white;
                    padding: 10px 12px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky;
                    top: 0;
                    z-index: 1;
                }
                .soyosoyo-logo {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                }
                .soyosoyo-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                }
                .soyosoyo-title {
                    font-size: 16px;
                    font-weight: 600;
                    margin-left: 40px;
                    text-align: center;
                    flex-grow: 1;
                }
                .soyosoyo-close {
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                }
                .soyosoyo-close:hover {
                    background: rgba(255,255,255,0.2);
                }
                .soyosoyo-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                    background: #f9f9f9;
                    border-bottom: 1px solid #90EE90;
                }
                .soyosoyo-msg {
                    margin-bottom: 16px;
                    display: flex;
                    gap: 10px;
                }
                .soyosoyo-msg.user {
                    flex-direction: row-reverse;
                }
                .soyosoyo-bubble {
                    max-width: 75%;
                    padding: 12px 16px;
                    border-radius: 16px;
                    font-size: 14px;
                    line-height: 1.5;
                    word-wrap: break-word;
                }
                .soyosoyo-msg.user .soyosoyo-bubble {
                    background: #006400;
                    color: white;
                    border-bottom-right-radius: 4px;
                }
                .soyosoyo-msg.bot .soyosoyo-bubble {
                    background: white;
                    color: #333;
                    border: 1px solid #90EE90;
                    border-bottom-left-radius: 4px;
                }
                .soyosoyo-msg.typing .soyosoyo-bubble {
                    background: #e5e7eb;
                    color: #666;
                    font-style: italic;
                }
                .soyosoyo-bubble h1, .soyosoyo-bubble h2, .soyosoyo-bubble h3 {
                    margin: 8px 0 4px 0;
                    font-weight: 600;
                }
                .soyosoyo-bubble h1 { font-size: 18px; }
                .soyosoyo-bubble h2 { font-size: 16px; }
                .soyosoyo-bubble h3 { font-size: 14px; }
                .soyosoyo-bubble p {
                    margin: 4px 0;
                }
                .soyosoyo-bubble ul, .soyosoyo-bubble ol {
                    margin: 8px 0;
                    padding-left: 20px;
                }
                .soyosoyo-bubble li {
                    margin: 4px 0;
                }
                .soyosoyo-bubble strong {
                    font-weight: 600;
                }
                .soyosoyo-bubble em {
                    font-style: italic;
                }
                .soyosoyo-bubble code {
                    background: #f3f4f6;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                }
                .soyosoyo-bubble pre {
                    background: #f3f4f6;
                    padding: 8px;
                    border-radius: 4px;
                    overflow-x: auto;
                    margin: 8px 0;
                }
                .soyosoyo-bubble pre code {
                    background: none;
                    padding: 0;
                }
                .soyosoyo-bubble a {
                    color: #006400;
                    text-decoration: underline;
                }
                .soyosoyo-bubble a:hover {
                    color: #228B22;
                }
                .soyosoyo-bubble blockquote {
                    border-left: 3px solid #90EE90;
                    padding-left: 12px;
                    margin: 8px 0;
                    color: #6b7280;
                }
                .soyosoyo-bubble table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 8px 0;
                }
                .soyosoyo-bubble th, .soyosoyo-bubble td {
                    border: 1px solid #90EE90;
                    padding: 6px 8px;
                    text-align: left;
                }
                .soyosoyo-bubble th {
                    background: #f9f9f9;
                    font-weight: 600;
                }
                .soyosoyo-input-area {
                    padding: 16px;
                    background: white;
                    border-top: 1px solid #90EE90;
                    display: flex;
                    gap: 10px;
                }
                .soyosoyo-input {
                    flex: 1;
                    padding: 12px;
                    border: 1px solid #90EE90;
                    border-radius: 24px;
                    font-size: 14px;
                    outline: none;
                    resize: none;
                    font-family: 'Lato', Arial, sans-serif;
                    max-height: 80px;
                }
                .soyosoyo-input:focus {
                    border-color: #228B22;
                }
                .soyosoyo-send {
                    background: linear-gradient(135deg, #90EE90 0%, #228B22 100%);
                    border: none;
                    color: white;
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }
                .soyosoyo-send:hover {
                    background: linear-gradient(135deg, #228B22 0%, #006400 100%);
                }
                .soyosoyo-send:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                @media (max-width: 768px) {
                    #soyosoyo-chat-widget.open {
                        width: 100vw;
                        height: 100vh;
                        bottom: 0;
                        right: 0;
                        left: 0;
                        border-radius: 0;
                        max-height: none;
                    }
                    #soyosoyo-float-btn {
                        width: 60px;
                        height: 60px;
                        bottom: 15px;
                        right: 15px;
                    }
                    #soyosoyo-float-btn img {
                        object-position: center;
                    }
                    .soyosoyo-header {
                        padding: 8px 10px;
                    }
                    .soyosoyo-logo {
                        width: 28px;
                        height: 28px;
                        left: 10px;
                    }
                    .soyosoyo-title {
                        font-size: 14px;
                        margin-left: 36px;
                    }
                    .soyosoyo-close {
                        font-size: 20px;
                        width: 28px;
                        height: 28px;
                    }
                }
                @media (max-width: 360px) {
                    .soyosoyo-title {
                        font-size: 13px;
                    }
                }
            `;
            document.head.appendChild(style);

            // Create floating button
            this.floatBtn = document.createElement('button');
            this.floatBtn.id = 'soyosoyo-float-btn';
            this.floatBtn.innerHTML = `
                <img src="./assets/chat-avatar.jpg" alt="Chat Support Avatar" onerror="this.src='./assets/141dd3faa98da9737b591161deac509a.jpg';">
                <div class="soyosoyo-notification-badge">2</div>
            `;
            document.body.appendChild(this.floatBtn);

            // Create chat widget
            this.widget = document.createElement('div');
            this.widget.id = 'soyosoyo-chat-widget';
            this.widget.innerHTML = `
                <div class="soyosoyo-header">
                    <div class="soyosoyo-logo">
                        <img src="./assets/chat-avatar.jpg" alt="Soyosoyo Sacco Logo">
                    </div>
                    <div class="soyosoyo-title">SOYOSOYO SACCO Assistant</div>
                    <button class="soyosoyo-close">×</button>
                </div>
                <div class="soyosoyo-messages"></div>
                <div class="soyosoyo-input-area">
                    <textarea class="soyosoyo-input" placeholder="Ask about loans, savings, membership..." rows="1"></textarea>
                    <button class="soyosoyo-send">➤</button>
                </div>
            `;
            document.body.appendChild(this.widget);

            // Get elements
            this.messages = this.widget.querySelector('.soyosoyo-messages');
            this.input = this.widget.querySelector('.soyosoyo-input');
            this.sendBtn = this.widget.querySelector('.soyosoyo-send');
            this.closeBtn = this.widget.querySelector('.soyosoyo-close');
        }

        init() {
            // Float button click
            this.floatBtn.onclick = () => this.toggle();
            
            // Close button click
            this.closeBtn.onclick = () => this.toggle();
            
            // Send button click
            this.sendBtn.onclick = () => this.send();
            
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
            
            console.log('✅ SOYOSOYO SACCO Floating Chat Ready');
        }

        parseMarkdown(text) {
            // Simple markdown parser for common patterns
            let html = text;
            
            // Escape HTML to prevent XSS
            html = html.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;');
            
            // Code blocks (```)
            html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
            
            // Inline code (`)
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
            
            // Bold (**text** or __text__)
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
            
            // Italic (*text* or _text_)
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
            html = html.replace(/_(.+?)_/g, '<em>$1</em>');
            
            // Links [text](url)
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
            
            // Headers
            html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
            
            // Lists - unordered
            html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
            html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
            
            // Lists - ordered
            html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
            
            // Wrap consecutive <li> in <ul> or <ol>
            html = html.replace(/(<li>.*<\/li>\n?)+/g, function(match) {
                return '<ul>' + match + '</ul>';
            });
            
            // Blockquotes
            html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
            
            // Line breaks - convert double newlines to paragraphs
            const paragraphs = html.split(/\n\n+/);
            html = paragraphs.map(p => {
                if (p.match(/^<(h[123]|ul|ol|pre|blockquote|table)/)) {
                    return p;
                }
                return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
            }).join('');
            
            return html;
        }

        toggle() {
            this.isOpen = !this.isOpen;
            
            if (this.isOpen) {
                this.widget.classList.add('open');
                this.floatBtn.classList.add('close');
                
                if (!this.hasStarted) {
                    this.hasStarted = true;
                    this.addMessage(
                        "Hello! I'm the SOYOSOYO SACCO Assistant. I can help you with information about our services, loans, savings products, and membership requirements. How can I assist you today? 🏦",
                        'bot'
                    );
                }
                
                this.input.focus();
            } else {
                this.widget.classList.remove('open');
                this.floatBtn.classList.remove('close');
            }
        }

        addMessage(text, role, isTyping = false) {
            const id = 'msg-' + Date.now();
            const msgDiv = document.createElement('div');
            msgDiv.id = id;
            msgDiv.className = 'soyosoyo-msg ' + role + (isTyping ? ' typing' : '');
            
            const bubble = document.createElement('div');
            bubble.className = 'soyosoyo-bubble';
            
            // Parse markdown for bot messages, plain text for user/typing
            if (role === 'bot' && !isTyping) {
                bubble.innerHTML = this.parseMarkdown(text);
            } else {
                bubble.textContent = text;
            }
            
            msgDiv.appendChild(bubble);
            this.messages.appendChild(msgDiv);
            this.messages.scrollTop = this.messages.scrollHeight;
            
            return id;
        }

        async send() {
            const text = this.input.value.trim();
            if (!text || this.isLoading) return;

            this.input.value = '';
            this.input.style.height = 'auto';
            this.isLoading = true;
            this.sendBtn.disabled = true;

            this.addMessage(text, 'user');
            const typingId = this.addMessage('Typing...', 'bot', true);

            try {
                const response = await fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        conversationId: this.conversationId,
                        includeContext: true
                    })
                });

                document.getElementById(typingId)?.remove();

                if (!response.ok) {
                    throw new Error('Server error');
                }

                const data = await response.json();

                if (data.response) {
                    this.addMessage(data.response, 'bot');
                    this.conversationId = data.conversationId;
                }

            } catch (error) {
                console.error('Chat error:', error);
                document.getElementById(typingId)?.remove();
                this.addMessage("Sorry, I'm having trouble connecting. Please try again. 🔄", 'bot');
            } finally {
                this.isLoading = false;
                this.sendBtn.disabled = false;
                this.input.focus();
            }
        }
    }

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.soyosoyoChat = new SoyosoyoChatWidget();
        });
    } else {
        window.soyosoyoChat = new SoyosoyoChatWidget();
    }
})();
