'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; isPro?: boolean; }
interface Message { role: 'user' | 'assistant'; content: string; isError?: boolean; files?: FileAttachment[]; }
interface ModelInfo { id: string; name: string; description: string; isFree: boolean; label: string; available: boolean; supportsVision?: boolean; }
interface Grade { id: string; subject: string; testName: string; grade: number; maxGrade: number; }
interface FileAttachment { name: string; type: string; content: string; size: number; }

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isPro, setIsPro] = useState(false);
  const [balance, setBalance] = useState(0);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; preview: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { checkAuth(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) { setUser(data.user); fetchModels(); fetchGrades(); }
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchModels = async () => {
    setModelsLoading(true);
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setModels(data.models || []);
      setIsPro(data.isPro || false);
      setBalance(data.balance || 0);
      const firstFree = data.models?.find((m: ModelInfo) => m.isFree);
      if (firstFree) setSelectedModel(firstFree.id);
      
      if (data.error) {
        setMessages([{ role: 'assistant', content: `⚠️ ${data.error}`, isError: true }]);
      }
    } catch (e: any) {
      setMessages([{ role: 'assistant', content: `❌ Fout bij laden modellen: ${e.message}`, isError: true }]);
    }
    setModelsLoading(false);
  };

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/grades');
      const data = await res.json();
      setGrades(data.grades || []);
      const uniqueSubjects = [...new Set((data.grades || []).map((g: Grade) => g.subject))];
      setSubjects(uniqueSubjects);
    } catch {}
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  // Handle file selection - supports all file types
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        const content = await readFileContent(file);
        const fileAttachment: FileAttachment = {
          name: file.name,
          type: file.type || 'application/octet-stream',
          content: content,
          size: file.size
        };
        setAttachedFiles(prev => [...prev, fileAttachment]);

        // Create preview
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              setFilePreviews(prev => [...prev, { name: file.name, preview: e.target!.result as string }]);
            }
          };
          reader.readAsDataURL(file);
        } else {
          // For non-images, show file icon and name
          const icon = getFileIcon(file.type, file.name);
          setFilePreviews(prev => [...prev, { name: file.name, preview: icon }]);
        }
      } catch (err) {
        console.error('Error reading file:', err);
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          // For text files, return content directly
          resolve(result);
        } else if (result instanceof ArrayBuffer) {
          // For binary files, convert to base64
          const base64 = btoa(new Uint8Array(result).reduce((data, byte) => data + String.fromCharCode(byte), ''));
          resolve(`data:${file.type};base64,${base64}`);
        } else {
          resolve('[Bestand kon niet worden gelezen]');
        }
      };
      
      reader.onerror = () => reject(new Error('Fout bij lezen bestand'));

      // Determine how to read based on file type
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else if (
        file.type === 'application/pdf' ||
        file.type === 'application/zip' ||
        file.type.includes('office') ||
        file.type.includes('document')
      ) {
        // Binary files - read as base64
        reader.readAsArrayBuffer(file);
      } else {
        // Text files (txt, md, csv, json, js, ts, html, css, etc.)
        reader.readAsText(file);
      }
    });
  };

  const getFileIcon = (type: string, name: string): string => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type === 'application/zip' || type.includes('compressed')) return '🗜️';
    if (type === 'application/json') return '{ }';
    if (name.endsWith('.js') || name.endsWith('.ts')) return '💻';
    if (name.endsWith('.html') || name.endsWith('.css')) return '🌐';
    return '📎';
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading || !selectedModel) return;

    const userMsg = input.trim();
    const currentSubject = selectedSubject;
    const currentFiles = [...attachedFiles];
    
    setInput('');
    setAttachedFiles([]);
    setFilePreviews([]);
    
    let fullMessage = userMsg;
    if (currentSubject) {
      const subjectGrades = grades.filter(g => g.subject === currentSubject);
      if (subjectGrades.length > 0) {
        fullMessage = `[Vak: ${currentSubject}]\nMijn cijfers: ${subjectGrades.map(g => `${g.testName}: ${g.grade}/${g.maxGrade}`).join(', ')}\n\n${userMsg}`;
      } else {
        fullMessage = `[Vak: ${currentSubject}]\n\n${userMsg}`;
      }
    }

    // Add file info to message
    let fileInfo = '';
    let imageUrls: string[] = [];
    
    if (currentFiles.length > 0) {
      fileInfo = '\n\n[Bijgevoegde bestanden:';
      currentFiles.forEach((file, i) => {
        const sizeKB = (file.size / 1024).toFixed(1);
        fileInfo += `\n${i + 1}. ${file.name} (${sizeKB}KB, ${file.type || 'onbekend'})`;
        
        // For images, extract data URL
        if (file.type.startsWith('image/') && file.content.startsWith('data:')) {
          imageUrls.push(file.content);
        }
      });
      fileInfo += ']';
      
      // Add file content for text files
      const textFiles = currentFiles.filter(f => 
        !f.type.startsWith('image/') && 
        f.content.length < 10000 && // Limit content size
        !f.content.startsWith('data:') // Not base64
      );
      
      if (textFiles.length > 0) {
        fileInfo += '\n\n[Bestandsinhoud:';
        textFiles.forEach(file => {
          fileInfo += `\n--- ${file.name} ---\n${file.content.slice(0, 5000)}\n`;
        });
        fileInfo += ']';
      }
    }

    const displayMessage = currentSubject ? `📚 ${currentSubject}: ${userMsg}` : userMsg;
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: displayMessage + (currentFiles.length > 0 ? ` (${currentFiles.length} bijlage${currentFiles.length > 1 ? 'n' : ''})` : ''),
      files: currentFiles
    }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: fullMessage + fileInfo, 
          model: selectedModel, 
          chatHistory: messages.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content })),
          files: imageUrls.length > 0 ? imageUrls : undefined,
          subject: currentSubject || undefined
        }),
      });
      
      const data = await res.json();

      if (res.ok && data.message) {
        let responseContent = data.message;
        if (data.fallback && data.originalError) {
          responseContent = `⚠️ Fallback gebruikt: ${data.originalError}\n\n${data.message}`;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: responseContent }]);
      } else {
        let errorContent = `❌ ${data.error || 'Onbekende fout'}`;
        if (data.exactError) {
          errorContent += `\n\n🔍 Exacte error:\n${data.exactError}`;
        }
        if (data.details) {
          errorContent += `\n\n📋 Details:\n${data.details}`;
        }
        if (data.tip) {
          errorContent += `\n\n💡 ${data.tip}`;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: errorContent, isError: true }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Netwerk fout: ${e.message}\n\n🔍 Stack:\n${e.stack || 'Geen stack trace'}`,
        isError: true 
      }]);
    }
    setChatLoading(false);
  };

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#fff'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/cijfers', label: 'Cijfers' },
    { href: '/rooster', label: 'Rooster' },
    { href: '/chat', label: 'AI Chat', active: true },
    { href: '/materiaal', label: 'Materiaal' },
    { href: '/instellingen', label: 'Instellingen' },
    ...(user.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  const freeModels = models.filter(m => m.isFree);
  const paidModels = models.filter(m => !m.isFree);
  const selectedModelInfo = models.find(m => m.id === selectedModel);
  const supportsVision = selectedModelInfo?.supportsVision || selectedModel.includes('vision') || selectedModel.includes('gpt-4');

  return (
    <div className="page-container">
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className="blob blob-3"></div></div>

      <header className="page-header">
        <div className="header-content">
          <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">EduLearn AI</span></div>
          <div className="user-info">
            {isPro && <span className="badge badge-warning">PRO</span>}
            {!isPro && balance > 0 && <span className="badge badge-success">€{balance.toFixed(2)}</span>}
            <span className="user-name">{user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost">Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '900px', margin: '0 auto', padding: '2rem', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        {/* Model Selector */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 500, minWidth: '60px' }}>Model:</label>
              {modelsLoading ? (
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Modellen laden...</span>
              ) : models.length === 0 ? (
                <span style={{ color: '#f87171' }}>⚠️ Geen modellen - check API key in Vercel</span>
              ) : (
                <select 
                  value={selectedModel} 
                  onChange={e => setSelectedModel(e.target.value)} 
                  className="input-field" 
                  style={{ flex: 1, minWidth: '250px' }}
                >
                  <optgroup label={`🆓 Gratis (${freeModels.length})`}>
                    {freeModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name} {m.label}</option>
                    ))}
                  </optgroup>
                  {paidModels.length > 0 && (
                    <optgroup label={`⭐ Betaald (${paidModels.length})`}>
                      {paidModels.map(m => (
                        <option key={m.id} value={m.id} disabled={!m.available}>{m.name} {m.label} {!m.available ? '🔒' : ''}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              )}
              {!isPro && <Link href="/instellingen" className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}>Saldo opladen</Link>}
            </div>
            
            {/* Subject Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <label style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', fontWeight: 500 }}>Vak:</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setSelectedSubject('')} className={`subject-tag ${!selectedSubject ? 'active' : ''}`}>Allemaal</button>
                {subjects.map(subject => (
                  <button key={subject} onClick={() => setSelectedSubject(subject)} className={`subject-tag ${selectedSubject === subject ? 'active' : ''}`}>{subject}</button>
                ))}
              </div>
              {selectedSubject && <span style={{ color: '#34d399', fontSize: '0.8rem' }}>📊 {grades.filter(g => g.subject === selectedSubject).length} cijfers</span>}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="chat-messages" style={{ flex: 1, overflow: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>AI Studieassistent</h3>
                <p>Stel me een vraag over je lessen!</p>
                <p style={{ marginTop: '1rem', fontSize: '0.8rem' }}>{models.length} modellen beschikbaar ({freeModels.length} gratis)</p>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <span>📎 Voeg bestanden toe: PDF, DOC, TXT, afbeeldingen en meer</span>
                  <span>📚 Selecteer een vak voor gerichte hulp</span>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-message ${msg.role}`} style={{ 
                    whiteSpace: 'pre-wrap',
                    background: msg.isError ? 'rgba(248, 113, 113, 0.1)' : undefined,
                    border: msg.isError ? '1px solid rgba(248, 113, 113, 0.3)' : undefined
                  }}>
                    {msg.content}
                    {msg.files && msg.files.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                        📎 {msg.files.map(f => f.name).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && <div className="chat-message assistant">Aan het denken...</div>}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* File Previews */}
          {filePreviews.length > 0 && (
            <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.1)' }}>
              {filePreviews.map((fp, i) => (
                <div key={i} style={{ position: 'relative', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.5rem' }}>
                  {fp.preview.startsWith('data:image') ? (
                    <img src={fp.preview} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      {fp.preview}
                    </div>
                  )}
                  <div style={{ fontSize: '0.65rem', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.25rem' }}>
                    {fp.name}
                  </div>
                  <button 
                    onClick={() => removeFile(i)} 
                    style={{ 
                      position: 'absolute', 
                      top: '-8px', 
                      right: '-8px', 
                      background: '#f87171', 
                      border: 'none', 
                      borderRadius: '50%', 
                      width: '20px', 
                      height: '20px', 
                      cursor: 'pointer', 
                      color: 'white',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>×</button>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="chat-input-area" style={{ display: 'flex', gap: '0.75rem', padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*,.pdf,.doc,.docx,.txt,.md,.json,.csv,.js,.ts,.jsx,.tsx,.html,.css,.py,.java,.c,.cpp,.h,.xml,.yaml,.yml" 
                multiple 
                onChange={handleFileSelect} 
                style={{ display: 'none' }} 
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="btn btn-secondary" 
                style={{ padding: '0.75rem' }}
                title="Voeg bestand toe (PDF, DOC, TXT, afbeeldingen, code, etc.)"
              >📎</button>
            </>
            <input 
              type="text" 
              value={input} 
              onChange={e => setInput(e.target.value)} 
              placeholder={selectedSubject ? `Vraag over ${selectedSubject}...` : "Typ je bericht..."} 
              disabled={chatLoading} 
              className="input-field" 
              style={{ flex: 1 }} 
            />
            <button type="submit" disabled={chatLoading || !input.trim()} className="btn btn-primary">{chatLoading ? '...' : '➤'}</button>
          </form>
        </div>
      </main>
    </div>
  );
}
