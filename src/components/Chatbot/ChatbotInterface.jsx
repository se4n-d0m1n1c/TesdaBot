import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, HelpCircle, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const fetcher = async (url) => {
  if (url === 'chat_sessions') {
    const { data, error } = await supabase.from('chat_sessions').select('*').order('created_at', { ascending: false }).limit(1);
    if (error) throw error;
    return data;
  }
};

const ChatbotInterface = () => {
  const { user } = useAuth();
  const { data: sessions, error, isLoading } = useSWR(user ? 'chat_sessions' : null, fetcher);
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I am TESDA-Bot. I can help you understand training regulations, review modules, and prepare for your NCII assessment. What would you like to discuss today?'
    }
  ]);
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setMessages(sessions[0].messages);
      setSessionId(sessions[0].id);
    }
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const saveSession = async (newMessages) => {
    if (!user) return;
    try {
      if (sessionId) {
        await supabase.from('chat_sessions').update({ messages: newMessages, updated_at: new Date() }).eq('id', sessionId);
      } else {
        const { data, error } = await supabase.from('chat_sessions').insert([{ user_id: user.id, messages: newMessages }]).select();
        if (!error && data && data.length > 0) {
          setSessionId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to save chat session", err);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    await saveSession(newMessages);

    // Mocking AI response - Later connect this to AI provider
    setTimeout(async () => {
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'That is a great question. In the context of Computer Systems Servicing, you should always ensure power is disconnected and proper grounding is applied before touching internal components. Do you want me to quiz you on safety procedures?'
      };
      const finalMessages = [...newMessages, botMessage];
      setMessages(finalMessages);
      setIsTyping(false);
      await saveSession(finalMessages);
    }, 1500);
  };

  const handleSuggestion = (s) => {
    setInput(s);
    // Let the effect of input change happen, but we can also just send immediately
  };

  const suggestions = [
    "Explain Subnetting",
    "Quiz me on Safety Procedures",
    "What to expect in the CSS NCII actual exam?"
  ];

  return (
    <div className="tb-card d-flex flex-column" style={{ height: '80vh' }}>
      {/* Header */}
      <div className="bg-white px-4 py-3 border-bottom d-flex align-items-center gap-3">
        <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
          <Bot size={28} style={{ color: 'var(--tb-primary)' }} />
        </div>
        <div>
          <h5 className="mb-0 fw-bold">TESDA-Bot Assistant</h5>
          <span className="text-success small d-flex align-items-center gap-1">
            <span className="bg-success rounded-circle d-inline-block" style={{ width: '8px', height: '8px' }}></span> Online
          </span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow-1 p-4 overflow-auto bg-light" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`d-flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`p-2 rounded-circle align-self-end ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white shadow-sm border'}`} style={{ minWidth: '40px', textAlign: 'center' }}>
              {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} style={{ color: 'var(--tb-primary)' }} />}
            </div>
            
            {/* Message Bubble */}
            <div 
              className={`p-3 shadow-sm ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white'}`}
              style={{
                borderRadius: 'var(--tb-radius-lg)',
                borderBottomRightRadius: msg.sender === 'user' ? '4px' : 'var(--tb-radius-lg)',
                borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : 'var(--tb-radius-lg)',
                maxWidth: '75%',
                lineHeight: '1.5'
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="d-flex gap-3">
            <div className="p-2 rounded-circle bg-white shadow-sm border align-self-end" style={{ minWidth: '40px', textAlign: 'center' }}>
              <Bot size={20} style={{ color: 'var(--tb-primary)' }} />
            </div>
            <div className="p-3 bg-white shadow-sm d-flex align-items-center gap-2" style={{ borderRadius: 'var(--tb-radius-lg)', borderBottomLeftRadius: '4px' }}>
              <Loader2 className="spinner-border spinner-border-sm text-primary" size={16} /> <span className="text-muted small">TESDA-Bot is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-top">
        {messages.length <= 1 && !isTyping && (
          <div className="d-flex gap-2 mb-3 overflow-auto pb-2" style={{ whiteSpace: 'nowrap' }}>
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                type="button"
                className="btn btn-sm btn-outline-secondary rounded-pill border-opacity-50 tb-glass"
                onClick={() => setInput(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSend} className="d-flex gap-2">
          <input
            type="text"
            className="form-control form-control-lg bg-light border-0"
            placeholder="Type your question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            style={{ borderRadius: 'var(--tb-radius-md)' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary d-flex align-items-center justify-content-center px-4" 
            disabled={!input.trim() || isTyping}
            style={{ borderRadius: 'var(--tb-radius-md)' }}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotInterface;
