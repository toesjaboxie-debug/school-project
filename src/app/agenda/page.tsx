'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; classId?: string; }
interface AgendaItem {
  id: string;
  title: string;
  description: string | null;
  testDate: string;
  subject: string;
  type: string;
  weight: number;
  maxScore: number;
  isCompleted: boolean;
  isPublic?: boolean;
  isApproved?: boolean;
  classId?: string;
  user: { id: string; username: string; isAdmin: boolean };
  grades: { id: string; grade: number }[];
}
interface Subject { id: string; name: string; displayName: string; }

const defaultSubjects = ['Wiskunde', 'Engels', 'Nederlands', 'Geschiedenis', 'Aardrijkskunde', 'Biologie', 'Natuurkunde', 'Scheikunde', 'Frans', 'Duits', 'Economie'];
const types = [
  { value: 'toets', label: '📝 Toets', color: '#ef4444', needsGrade: true },
  { value: 'overhoring', label: '🗣️ Overhoring', color: '#f59e0b', needsGrade: true },
  { value: 'huiswerk', label: '📚 Huiswerk', color: '#3b82f6', needsGrade: false },
  { value: 'project', label: '📊 Project', color: '#8b5cf6', needsGrade: true },
];

export default function AgendaPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>(defaultSubjects);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    testDate: '',
    subject: '',
    type: 'toets',
    weight: 1,
    maxScore: 10,
    isPublic: false,
    classId: ''
  });

  // Check if current type needs grade
  const currentTypeNeedsGrade = types.find(t => t.value === newItem.type)?.needsGrade ?? true;
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) { 
        setUser(data.user); 
        setNewItem(prev => ({ ...prev, classId: data.user.classId || '' }));
        fetchAgenda();
        fetchSubjects();
        if (data.user.isAdmin) fetchClasses();
      }
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.subjects && data.subjects.length > 0) {
        setSubjects(data.subjects.map((s: Subject) => s.displayName || s.name));
      }
    } catch {}
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      setClasses(data.classes || []);
    } catch {}
  };

  const fetchAgenda = async () => {
    try {
      const res = await fetch('/api/agenda');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setAgendaItems([]);
      } else {
        setAgendaItems(data.agendaItems || []);
        setError('');
      }
    } catch (e: any) {
      setError('Kon agenda niet laden');
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.testDate || !newItem.subject) return;

    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setNewItem({ title: '', description: '', testDate: '', subject: '', type: 'toets', weight: 1, maxScore: 10, isPublic: false, classId: user?.classId || '' });
        fetchAgenda();
        if (data.message) {
          setSuccessMessage(data.message);
          setTimeout(() => setSuccessMessage(''), 5000);
        }
      } else {
        setError(data.error || 'Fout bij toevoegen');
        if (data.details) {
          console.error('Details:', data.details);
          setError(data.error + ': ' + data.details);
        }
      }
    } catch (e: any) {
      setError('Fout: ' + e.message);
    }
    setSaving(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit item wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchAgenda();
    } catch {}
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    router.push('/login');
  };

  const getTypeInfo = (type: string) => {
    return types.find(t => t.value === type) || types[0];
  };

  // Handle type change - reset weight/maxScore for homework
  const handleTypeChange = (type: string) => {
    const typeInfo = getTypeInfo(type);
    if (typeInfo.needsGrade) {
      setNewItem({ ...newItem, type, weight: 1, maxScore: 10 });
    } else {
      setNewItem({ ...newItem, type, weight: 0, maxScore: 0 });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Vandaag';
    if (date.toDateString() === tomorrow.toDateString()) return 'Morgen';

    return date.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const filteredItems = agendaItems.filter(item => {
    if (filter === 'upcoming') return getDaysUntil(item.testDate) >= 0;
    if (filter === 'completed') return item.isCompleted;
    if (filter !== 'all') return item.type === filter;
    return true;
  }).sort((a, b) => new Date(a.testDate).getTime() - new Date(b.testDate).getTime());

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'white'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/cijfers', label: 'Cijfers' },
    { href: '/rooster', label: 'Rooster' },
    { href: '/agenda', label: 'Agenda', active: true },
    { href: '/chat', label: 'AI Chat' },
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
            {user.isAdmin && <span className="admin-badge">🛡️ Admin</span>}
            <span className="user-name">{user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost">Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>📅 Agenda</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Plan je toetsen, overhoringen en huiswerk</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Toevoegen</button>
        </div>

        {error && (
          <div style={{ padding: '1rem', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', marginBottom: '1rem', color: '#f87171' }}>
            ⚠️ {error}
          </div>
        )}

        {successMessage && (
          <div style={{ padding: '1rem', background: 'rgba(52,211,153,0.1)', borderRadius: '12px', marginBottom: '1rem', color: '#34d399' }}>
            ✅ {successMessage}
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('all')} className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }}>Alles</button>
          <button onClick={() => setFilter('upcoming')} className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }}>Komend</button>
          {types.map(t => (
            <button key={t.value} onClick={() => setFilter(t.value)} className={`btn ${filter === t.value ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '0.5rem 1rem' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Pending Items Notice for Admin */}
        {user.isAdmin && agendaItems.some(item => !item.isApproved && !item.user.isAdmin) && (
          <div style={{ padding: '1rem', background: 'rgba(251,191,36,0.1)', borderRadius: '12px', marginBottom: '1rem', color: '#fbbf24' }}>
            ⏳ Er zijn agenda items die wachten op goedkeuring. Ga naar <Link href="/admin" style={{ textDecoration: 'underline' }}>Admin</Link> om te beoordelen.
          </div>
        )}

        {/* Agenda Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredItems.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <p>Nog geen items. Voeg je eerste toets of huiswerk toe!</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const typeInfo = getTypeInfo(item.type);
              const daysUntil = getDaysUntil(item.testDate);
              const isPast = daysUntil < 0;
              const isPending = !item.isApproved && !item.user.isAdmin;
              const canDelete = user.isAdmin || item.user.id === user.id;

              return (
                <div key={item.id} className="card" style={{
                  padding: '1.25rem',
                  opacity: isPast || isPending ? 0.6 : 1,
                  borderLeft: `4px solid ${isPending ? '#fbbf24' : typeInfo.color}`,
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ background: typeInfo.color + '30', color: typeInfo.color, padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500 }}>
                          {typeInfo.label}
                        </span>
                        {item.isPublic && <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500 }}>🌍 Klas</span>}
                        {isPending && <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 500 }}>⏳ Wacht op goedkeuring</span>}
                        {item.isCompleted && <span style={{ color: '#34d399', fontSize: '0.875rem' }}>✅ Afgerond</span>}
                        {item.grades.length > 0 && <span style={{ color: '#fbbf24', fontSize: '0.875rem' }}>📊 Cijfer: {item.grades[0].grade.toFixed(1)}</span>}
                        {!getTypeInfo(item.type).needsGrade && <span style={{ color: '#60a5fa', fontSize: '0.875rem' }}>📋 Geen cijfer</span>}
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{item.title}</h3>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', flexWrap: 'wrap' }}>
                        <span>📖 {item.subject}</span>
                        <span>📅 {formatDate(item.testDate)}</span>
                        {getTypeInfo(item.type).needsGrade && item.weight > 0 && <span>⚡ {item.weight}x meetelt</span>}
                        {getTypeInfo(item.type).needsGrade && item.maxScore > 0 && <span>📊 Max {item.maxScore}</span>}
                        {!item.user.isAdmin && <span>👤 Door {item.user.username}</span>}
                      </div>
                      {item.description && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>{item.description}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      {!isPast && !isPending && (
                        <span style={{
                          background: daysUntil <= 2 ? '#ef4444' : daysUntil <= 7 ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                          color: daysUntil <= 7 ? 'white' : 'rgba(255,255,255,0.7)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          {daysUntil === 0 ? 'Vandaag!' : daysUntil === 1 ? 'Morgen!' : `${daysUntil} dagen`}
                        </span>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDeleteItem(item.id)} className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>🗑️</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">➕ Toevoegen aan Agenda</h3>
            {!user?.isAdmin && (
              <p style={{ color: '#fbbf24', fontSize: '0.875rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(251,191,36,0.1)', borderRadius: '8px' }}>
                ⏳ Jouw items moeten eerst worden goedgekeurd door de admin voordat ze zichtbaar zijn voor iedereen.
              </p>
            )}
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Titel *</label>
                <input type="text" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} className="input-field" placeholder="bijv. Hoofdstuk 3 toets" required />
              </div>

              <div className="form-group">
                <label className="form-label">Type</label>
                <select value={newItem.type} onChange={e => handleTypeChange(e.target.value)} className="input-field">
                  {types.map(t => <option key={t.value} value={t.value}>{t.label}{!t.needsGrade ? ' (geen cijfer)' : ''}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vak *</label>
                <select value={newItem.subject} onChange={e => setNewItem({ ...newItem, subject: e.target.value })} className="input-field" required>
                  <option value="">Selecteer vak</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Datum *</label>
                <input type="date" value={newItem.testDate} onChange={e => setNewItem({ ...newItem, testDate: e.target.value })} className="input-field" required />
              </div>

              {/* Weight and Max Score - only for types that need grades */}
              {currentTypeNeedsGrade && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Meetelt (x)</label>
                    <input type="number" step="0.5" min="0.5" max="5" value={newItem.weight} onChange={e => setNewItem({ ...newItem, weight: parseFloat(e.target.value) || 1 })} className="input-field" />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Max Score</label>
                    <input type="number" step="0.5" value={newItem.maxScore} onChange={e => setNewItem({ ...newItem, maxScore: parseFloat(e.target.value) || 10 })} className="input-field" />
                  </div>
                </div>
              )}
              {!currentTypeNeedsGrade && (
                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)', marginBottom: '1rem' }}>
                  <p style={{ color: '#60a5fa', fontSize: '0.875rem', margin: 0 }}>💡 Huiswerk krijgt geen cijfer - het wordt niet meegerekend in je gemiddelde.</p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Beschrijving</label>
                <textarea value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} className="input-field" rows={2} placeholder="Extra info (optioneel)" />
              </div>

              {/* Admin: Public for class */}
              {user?.isAdmin && classes.length > 0 && (
                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={newItem.isPublic}
                      onChange={e => setNewItem({ ...newItem, isPublic: e.target.checked })}
                      style={{ width: '18px', height: '18px' }}
                    />
                    <span style={{ fontWeight: 500 }}>🌍 Zichtbaar voor hele klas</span>
                  </label>
                  {newItem.isPublic && (
                    <select 
                      value={newItem.classId} 
                      onChange={e => setNewItem({ ...newItem, classId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Selecteer klas</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  )}
                </div>
              )}

              {error && <div style={{ color: '#f87171', fontSize: '0.875rem' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Annuleren</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>{saving ? 'Toevoegen...' : 'Toevoegen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
