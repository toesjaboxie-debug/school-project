'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; isPro?: boolean; }
interface File { id: string; title: string; description: string; content: string; subject: string; fileUrl: string | null; author: { username: string }; createdAt: string; }

export default function MateriaalPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Admin
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [newFile, setNewFile] = useState({ title: '', description: '', content: '', subject: '', fileUrl: '' });

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) { setUser(data.user); fetchFiles(); }
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      setFiles(data.files || []);
      const uniqueSubjects = [...new Set((data.files || []).map((f: File) => f.subject))].filter(Boolean);
      setSubjects(uniqueSubjects as string[]);
    } catch {}
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  const handleAddFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile.title || !newFile.content) return;
    
    setAddLoading(true);
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFile),
      });
      const data = await res.json();
      
      if (res.ok) {
        setShowAddModal(false);
        setNewFile({ title: '', description: '', content: '', subject: '', fileUrl: '' });
        fetchFiles();
      } else {
        alert(data.error || 'Fout bij toevoegen');
      }
    } catch (e: any) {
      alert('Fout: ' + e.message);
    }
    setAddLoading(false);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Weet je zeker dat je dit materiaal wilt verwijderen?')) return;
    
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFiles();
        setSelectedFile(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Fout bij verwijderen');
      }
    } catch (e: any) {
      alert('Fout: ' + e.message);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSubject = !selectedSubject || file.subject === selectedSubject;
    const matchesSearch = !searchQuery || 
      file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#fff'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/cijfers', label: 'Cijfers' },
    { href: '/rooster', label: 'Rooster' },
    { href: '/chat', label: 'AI Chat' },
    { href: '/materiaal', label: 'Materiaal', active: true },
    { href: '/instellingen', label: 'Instellingen' },
    ...(user.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="page-container">
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className="blob blob-3"></div></div>

      <header className="page-header">
        <div className="header-content">
          <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">EduLearn AI</span></div>
          <div className="user-info">
            {user.isPro && <span className="badge badge-warning">⭐ PRO</span>}
            <span className="user-name">{user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost">Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>📖 Lesmateriaal</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>{filteredFiles.length} materialen beschikbaar</p>
          </div>
          {user.isAdmin && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ Materiaal Toevoegen</button>
          )}
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Zoeken in materialen..."
              className="input-field"
              style={{ flex: 1, minWidth: '250px' }}
            />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input-field"
              style={{ minWidth: '150px' }}
            >
              <option value="">Alle vakken</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Files Grid */}
        {filteredFiles.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3>Geen materiaal gevonden</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
              {user.isAdmin ? 'Voeg lesmateriaal toe via de knop rechtsboven.' : 'Er is nog geen lesmateriaal beschikbaar.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {filteredFiles.map(file => (
              <div 
                key={file.id} 
                className="card" 
                style={{ padding: '1.25rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                onClick={() => setSelectedFile(file)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span className="subject-tag" style={{ fontSize: '0.75rem' }}>{file.subject || 'Algemeen'}</span>
                  {file.fileUrl && <span style={{ color: '#60a5fa' }}>📎</span>}
                </div>
                <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{file.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{file.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                  <span>Door {file.author.username}</span>
                  <span>{new Date(file.createdAt).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* View File Modal */}
      {selectedFile && (
        <div className="modal-overlay" onClick={() => setSelectedFile(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="subject-tag" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>{selectedFile.subject || 'Algemeen'}</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{selectedFile.title}</h2>
              </div>
              <button onClick={() => setSelectedFile(null)} className="btn btn-ghost" style={{ fontSize: '1.5rem' }}>×</button>
            </div>
            
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>{selectedFile.description}</p>
            
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
              {selectedFile.content}
            </div>
            
            {selectedFile.fileUrl && (
              <a href={selectedFile.fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginRight: '0.5rem' }}>
                📎 Bijlage openen
              </a>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
                Door {selectedFile.author.username} • {new Date(selectedFile.createdAt).toLocaleDateString('nl-NL')}
              </span>
              {user.isAdmin && (
                <button onClick={() => handleDeleteFile(selectedFile.id)} className="btn btn-danger">🗑️ Verwijderen</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add File Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">➕ Materiaal Toevoegen</h3>
            
            <form onSubmit={handleAddFile}>
              <div className="form-group">
                <label className="form-label">Titel *</label>
                <input
                  type="text"
                  value={newFile.title}
                  onChange={(e) => setNewFile({ ...newFile, title: e.target.value })}
                  className="input-field"
                  placeholder="bijv. Hoofdstuk 3 Samenvatting"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Beschrijving</label>
                <input
                  type="text"
                  value={newFile.description}
                  onChange={(e) => setNewFile({ ...newFile, description: e.target.value })}
                  className="input-field"
                  placeholder="Korte beschrijving..."
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Vak</label>
                <input
                  type="text"
                  value={newFile.subject}
                  onChange={(e) => setNewFile({ ...newFile, subject: e.target.value })}
                  className="input-field"
                  placeholder="bijv. Wiskunde"
                  list="subjects-list"
                />
                <datalist id="subjects-list">
                  {subjects.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>
              
              <div className="form-group">
                <label className="form-label">Inhoud *</label>
                <textarea
                  value={newFile.content}
                  onChange={(e) => setNewFile({ ...newFile, content: e.target.value })}
                  className="input-field"
                  rows={8}
                  placeholder="Plak hier de inhoud van het materiaal..."
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Bestandslink (optioneel)</label>
                <input
                  type="url"
                  value={newFile.fileUrl}
                  onChange={(e) => setNewFile({ ...newFile, fileUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Annuleren</button>
                <button type="submit" disabled={addLoading} className="btn btn-primary" style={{ flex: 1 }}>
                  {addLoading ? 'Toevoegen...' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
