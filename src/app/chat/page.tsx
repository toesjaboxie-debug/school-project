'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; isPro?: boolean; }
interface Message { role: 'user' | 'assistant'; content: string; }
interface ModelInfo { id: string; name: string; description: string; isFree: boolean; label: string; available: boolean; }

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('google/gemma-3-4b-it:free');
  const [isPro, setIsPro] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) { setUser(data.user); fetchModels(); }
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchModels = async () => {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setModels(data.models || []);
      setIsPro(data.isPro || false);
    } catch {}
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, model: selectedModel, chatHistory: messages }),
      });
      const data = await res.json();

      if (res.ok && data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `${data.error}\n\n💡 ${data.tip || 'Probeer opnieuw.'}` }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Er is een fout opgetreden. Probeer het opnieuw.' }]);
    }
    setChatLoading(false);
  };

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#fff'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: '🏠 Home' },
    { href: '/cijfers', label: '📊 Cijfers' },
    { href: '/rooster', label: '📅 Rooster' },
    { href: '/chat', label: '🤖 AI Chat', active: true },
    { href: '/instellingen', label: '⚙️ Instellingen' },
    ...(user.isAdmin ? [{ href: '/admin', label: '🛡️ Admin' }] : []),
  ];

  const freeModels = models.filter(m => m.isFree);
  const paidModels = models.filter(m => !m.isFree);

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">EduLearn AI</span></div>
          <div className="user-info">
            {isPro && <span className="badge badge-warning">⭐ PRO</span>}
            <span className="user-name">{user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost">Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {/* Model Selector */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ color: '#a3a3a3', fontSize: '0.875rem', fontWeight: 500 }}>Model:</label>
            <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="input-field" style={{ flex: 1, minWidth: '200px' }}>
              <optgroup label="🆓 Gratis Modellen">
                {freeModels.map(m => <option key={m.id} value={m.id}>{m.name} {m.label}</option>)}
              </optgroup>
              <optgroup label="⭐ Pro Modellen">
                {paidModels.map(m => <option key={m.id} value={m.id} disabled={!m.available}>{m.name} {m.label} {!m.available ? '🔒' : ''}</option>)}
              </optgroup>
            </select>
            {!isPro && <Link href="/instellingen" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem' }}>Upgrade Pro €5</Link>}
          </div>
        </div>

        {/* Chat */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#737373' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>AI Studieassistent</h3>
                <p>Stel me een vraag over je lessen!</p>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`} style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                ))}
                {chatLoading && <div className="chat-message assistant">...</div>}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          <form onSubmit={handleSend} className="chat-input-area">
            <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Typ je bericht..." disabled={chatLoading} className="chat-input" />
            <button type="submit" disabled={chatLoading || !input.trim()} className="btn btn-primary">{chatLoading ? '...' : '➤'}</button>
          </form>
        </div>
      </main>
    </div>
  );
}
