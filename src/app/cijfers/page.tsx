'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; }
interface Grade { id: string; subject: string; testName: string; grade: number; maxGrade: number; date: string; comment: string | null; }

const subjects = ['wiskunde', 'engels', 'nederlands', 'geschiedenis', 'aardrijkskunde', 'biologie', 'natuurkunde', 'scheikunde', 'frans', 'duits', 'economie'];

export default function CijfersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newGrade, setNewGrade] = useState({ subject: '', testName: '', grade: '', maxGrade: '10' });

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) { setUser(data.user); fetchGrades(); }
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/grades');
      const data = await res.json();
      setGrades(data.grades || []);
    } catch {}
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user?.id, ...newGrade, grade: parseFloat(newGrade.grade), maxGrade: parseFloat(newGrade.maxGrade) }),
      });
      if (res.ok) { setShowModal(false); setNewGrade({ subject: '', testName: '', grade: '', maxGrade: '10' }); fetchGrades(); }
    } catch {}
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  const getColor = (g: number, max: number) => {
    const p = (g / max) * 100;
    if (p >= 80) return 'success';
    if (p >= 60) return 'warning';
    return 'danger';
  };

  // Calculate averages
  const averages: Record<string, {sum: number, count: number}> = {};
  grades.forEach(g => {
    if (!averages[g.subject]) averages[g.subject] = { sum: 0, count: 0 };
    averages[g.subject].sum += g.grade;
    averages[g.subject].count++;
  });

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'white'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: '🏠 Home' },
    { href: '/cijfers', label: '📊 Cijfers', active: true },
    { href: '/rooster', label: '📅 Rooster' },
    { href: '/chat', label: '🤖 AI Chat' },
    { href: '/instellingen', label: '⚙️ Instellingen' },
    ...(user.isAdmin ? [{ href: '/admin', label: '🛡️ Admin' }] : []),
  ];

  return (
    <div className="page-container">
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className="blob blob-3"></div></div>

      <header className="page-header">
        <div className="header-content">
          <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">EduLearn AI</span></div>
          <div className="user-info">
            <span className="user-name">{user.username}</span>
            {user.isAdmin && <span className="admin-badge">🛡️ Admin</span>}
            <button onClick={handleLogout} className="btn btn-secondary">🚪 Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white' }}>📊 Cijfers</h1>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Cijfer toevoegen</button>
        </div>

        {/* Averages */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          {Object.entries(averages).map(([subj, data]) => (
            <div key={subj} className="glass-card" style={{ padding: '1rem 1.5rem', textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', marginBottom: '0.25rem' }}>{subj}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: getColor(data.sum/data.count, 10) === 'success' ? '#86efac' : getColor(data.sum/data.count, 10) === 'warning' ? '#fcd34d' : '#fca5a5' }}>
                {(data.sum / data.count).toFixed(1)}
              </div>
            </div>
          ))}
        </div>

        {/* Grades Table */}
        <div className="glass-card" style={{ padding: '1.5rem', overflow: 'auto' }}>
          {grades.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <p>Nog geen cijfers. Voeg je eerste cijfer toe!</p>
            </div>
          ) : (
            <table className="glass-table">
              <thead><tr>
                <th>Vak</th><th>Toets</th><th style={{textAlign:'center'}}>Cijfer</th><th>Datum</th>
              </tr></thead>
              <tbody>
                {grades.map(g => (
                  <tr key={g.id}>
                    <td style={{textTransform:'capitalize'}}>{g.subject}</td>
                    <td>{g.testName}</td>
                    <td style={{textAlign:'center'}}><span className={`badge badge-${getColor(g.grade, g.maxGrade)}`}>{g.grade.toFixed(1)}/{g.maxGrade}</span></td>
                    <td>{new Date(g.date).toLocaleDateString('nl-NL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">➕ Cijfer toevoegen</h3>
            <form onSubmit={handleAddGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Vak</label>
                <select value={newGrade.subject} onChange={e => setNewGrade({...newGrade, subject: e.target.value})} className="input-field" required>
                  <option value="">Selecteer vak</option>
                  {subjects.map(s => <option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Toets naam</label>
                <input type="text" value={newGrade.testName} onChange={e => setNewGrade({...newGrade, testName: e.target.value})} className="input-field" placeholder="bijv. Hoofdstuk 1 toets" required />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Cijfer</label>
                  <input type="number" step="0.1" min="1" max={newGrade.maxGrade} value={newGrade.grade} onChange={e => setNewGrade({...newGrade, grade: e.target.value})} className="input-field" required />
                </div>
                <div style={{ width: '100px' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Max</label>
                  <input type="number" value={newGrade.maxGrade} onChange={e => setNewGrade({...newGrade, maxGrade: e.target.value})} className="input-field" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{flex:1}}>Annuleren</button>
                <button type="submit" className="btn btn-primary" style={{flex:1}}>Toevoegen</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
