import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, HelpCircle, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

const fetcher = async (url, param) => {
  if (url === 'chat_sessions') {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('ncii_track', param)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data;
  }

  if (url === 'chat_messages' && param) {
    const { data, error } = await supabase.from('chat_messages').select('*').eq('session_id', param).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }
};

const ChatbotInterface = () => {
  const { user } = useAuth();
  const location = useLocation();
  const selectedModule = location.state?.module;
  const nciiTrack = user?.user_metadata?.ncii_track || 'Computer Systems Servicing NCII';

  const { data: sessions, isLoading: sessionsLoading } = useSWR(user ? ['chat_sessions', nciiTrack] : null, (args) => fetcher(args[0], args[1]));
  const [sessionId, setSessionId] = useState(null);
  const { data: dbMessages, mutate: mutateMessages, isLoading: messagesLoading } = useSWR(user && sessionId ? ['chat_messages', sessionId] : null, (args) => fetcher(args[0], args[1]));

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial welcome message if no history
  const welcomeMessage = {
    id: 'welcome',
    role: 'assistant',
    content: selectedModule
      ? `Hello! I see you want to discuss "${selectedModule}". How can I help you with this module today?`
      : 'Hello! I am TESDA-Bot. I can help you understand training regulations, review modules, and prepare for your NCII assessment. What would you like to discuss today?'
  };

  const messages = dbMessages && dbMessages.length > 0 ? dbMessages : [welcomeMessage];

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setSessionId(sessions[0].id);
    }
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getOrCreateSessionId = async () => {
    if (sessionId) return sessionId;
    const { data, error } = await supabase.from('chat_sessions').insert([{
      user_id: user.id,
      title: selectedModule || 'General Discussion',
      ncii_track: nciiTrack
    }]).select();
    if (error) throw error;
    const newId = data[0].id;
    setSessionId(newId);
    return newId;
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      const activeSessionId = await getOrCreateSessionId();

      // 1. Save user message to DB (Best Practice: Local Optimistic Update via Mutate)
      const dbUserMsg = {
        session_id: activeSessionId,
        user_id: user.id,
        role: 'user',
        content: currentInput
      };

      const { error: insertError } = await supabase.from('chat_messages').insert(dbUserMsg);
      if (insertError) throw insertError;

      const userMsg = { ...dbUserMsg, id: 'temp-' + Date.now() };
      mutateMessages([...(dbMessages || []), userMsg], false);

      // 2. Call DeepSeek via Supabase Edge Function
      const { data: aiResponse, error: functionError } = await supabase.functions.invoke('swift-api', {
        body: {
          messages: messages.map(m => ({
            role: m.role || (m.sender === 'bot' ? 'assistant' : 'user'),
            content: m.content || m.text
          })).concat({ role: 'user', content: currentInput }),
          session_id: activeSessionId,
          track: nciiTrack,
          module: selectedModule
        }
      });

      if (functionError) throw functionError;

      // 3. Optimistic Update for Bot Reply
      if (aiResponse && aiResponse.content) {
        const botMsg = {
          id: 'bot-' + Date.now(),
          session_id: activeSessionId,
          user_id: user.id,
          role: 'assistant',
          content: aiResponse.content
        };
        mutateMessages([...(dbMessages || []), userMsg, botMsg], false);
      }

      // 4. Final sync with DB
      await mutateMessages();

      // Record daily activity for streak
      await supabase.rpc('record_daily_activity');
    } catch (err) {
      console.error("Chat Error:", err);
      // Fallback message for error state
    } finally {
      setIsTyping(false);
    }
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
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`d-flex gap-3 ${msg.role === 'user' || msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`p-2 rounded-circle align-self-end ${(msg.role === 'user' || msg.sender === 'user') ? 'bg-primary text-white' : 'bg-white shadow-sm border'}`} style={{ minWidth: '40px', textAlign: 'center' }}>
              {(msg.role === 'user' || msg.sender === 'user') ? <User size={20} /> : <Bot size={20} style={{ color: 'var(--tb-primary)' }} />}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-3 shadow-sm ${(msg.role === 'user' || msg.sender === 'user') ? 'bg-primary text-white' : 'bg-white'}`}
              style={{
                borderRadius: 'var(--tb-radius-lg)',
                borderBottomRightRadius: (msg.role === 'user' || msg.sender === 'user') ? '4px' : 'var(--tb-radius-lg)',
                borderBottomLeftRadius: (msg.role === 'assistant' || msg.role === 'bot' || msg.sender === 'bot') ? '4px' : 'var(--tb-radius-lg)',
                maxWidth: '75%',
                lineHeight: '1.5'
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                  ul: ({ node, ...props }) => <ul className="mb-2 ps-3" {...props} />,
                  ol: ({ node, ...props }) => <ol className="mb-2 ps-3" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  code: ({ node, inline, ...props }) => (
                    <code className={`px-1 py-0.5 rounded bg-opacity-10 ${msg.role === 'user' || msg.sender === 'user' ? 'bg-white' : 'bg-dark text-danger'}`} {...props} />
                  ),
                  h1: ({ node, ...props }) => <h1 className="h5 fw-bold mb-2" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="h6 fw-bold mb-2" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="h6 fw-bold mb-2" {...props} />,
                }}
              >
                {msg.content || msg.text}
              </ReactMarkdown>
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
