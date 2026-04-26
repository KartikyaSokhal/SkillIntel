import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../utils/api';

/**
 * ChatbotWidget — Floating bottom-right AI career assistant.
 *
 * Features:
 *   - Floating action button (FAB) to toggle panel
 *   - Conversation memory (sends full history to backend)
 *   - Auto-scroll to latest message
 *   - Animated typing indicator
 *   - Context-aware: receives user skills, recommendations, trending data
 *
 * Styled via CSS classes in index.css (.chatbot-*)
 */
export default function ChatbotWidget({ context }) {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Hi! I\'m your AI career assistant. Ask me about skills, roadmap suggestions, or what to focus on next.' }
    ]);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loading]);

    const sendMessage = async () => {
        const message = input.trim();
        if (!message || loading) return;

        const newUserMsg = { role: 'user', text: message };
        const updatedMessages = [...messages, newUserMsg];
        setMessages(updatedMessages);
        setInput('');
        setLoading(true);

        try {
            // Send conversation history for multi-turn context
            const history = updatedMessages.map(m => ({
                role: m.role,
                content: m.text
            }));

            const response = await apiFetch('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({ message, context, history })
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                text: response?.reply || 'No response received.'
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: err?.message || 'Chat service is unavailable right now.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                type="button"
                className="chatbot-fab"
                onClick={() => setOpen(prev => !prev)}
                aria-label={open ? 'Close chat' : 'Open AI assistant'}
            >
                {open ? '✕' : '💬'}
            </button>

            {/* Chat Panel */}
            {open && (
                <div className="chatbot-panel">
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-title">
                            <span className="chatbot-header-dot" />
                            AI Career Assistant
                        </div>
                        <button
                            type="button"
                            className="chatbot-close"
                            onClick={() => setOpen(false)}
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="chatbot-messages">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`chatbot-msg ${m.role}`}>
                                {m.text}
                            </div>
                        ))}
                        {loading && (
                            <div className="chatbot-typing">
                                <span /><span /><span />
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chatbot-input-row">
                        <input
                            className="chatbot-input"
                            placeholder="Ask for guidance..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                        />
                        <button
                            type="button"
                            className="chatbot-send"
                            disabled={loading || !input.trim()}
                            onClick={sendMessage}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
