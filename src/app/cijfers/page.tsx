'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; }
interface Grade {
  id: string;
  subject: string;
  testName: string;
  grade: number;
  maxGrade: number;
  weight: number;
  date: string;
  comment: string | null;
  isStudentAdded?: boolean;
  agenda?: { id: string; title: string; type: string; weight: number } | null;
}
interface AgendaItem {
  id: string;
  title: string;
  subject: string;
  type: string;
  weight: number;
  maxScore: number;
  testDate: string;
  isCompleted: boolean;
}

const subjects = ['Wiskunde', 'Engels', 'Nederlands', 'Geschiedenis', 'Aardrijkskunde', 'Biologie', 'Natuurkunde', 'Scheikunde', 'Frans', 'Duits', 'Economie'];

export default function CijfersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAgendaId, setSelectedAgendaId] = useState('');
  const [newGrade, setNewGrade] = useState({ subject: '', testName: '', grade: '', maxGrade: '10', weight: '1' });
  const [adding, setAdding] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'overview'>('overview');

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) { setUser(data.user); fetchGrades(); fetchAgenda(); }
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

  const fetchAgenda = async () => {
    try {
      const res = await fetch('/api/agenda?upcoming=true');
      const data = await res.json();
      setAgendaItems(data.agendaItems || []);
    } catch {}
  };

  // Filter agenda items by selected subject
  const filteredAgendaItems = agendaItems.filter(item =>
    item.subject.toLowerCase() === selectedSubject.toLowerCase() && !item.isCompleted
  );

  // Handle agenda selection
  const handleAgendaSelect = (agendaId: string) => {
    setSelectedAgendaId(agendaId);
    if (agendaId) {
      const item = agendaItems.find(a => a.id === agendaId);
      if (item) {
        setNewGrade(prev => ({
          ...prev,
          testName: item.title,
          maxGrade: item.maxScore.toString(),
          weight: item.weight.toString()
        }));
      }
    } else {
      setNewGrade(prev => ({ ...prev, testName: '', maxGrade: '10', weight: '1' }));
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: newGrade.subject,
          testName: newGrade.testName,
          grade: parseFloat(newGrade.grade),
          maxGrade: parseFloat(newGrade.maxGrade),
          weight: parseFloat(newGrade.weight),
          agendaId: selectedAgendaId || null
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setNewGrade({ subject: '', testName: '', grade: '', maxGrade: '10', weight: '1' });
        setSelectedAgendaId('');
        fetchGrades();
        fetchAgenda();
      } else {
        alert(data.error || 'Fout bij toevoegen');
      }
    } catch (e: any) {
      alert('Fout: ' + e.message);
    }
    setAdding(false);
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  const getColor = (g: number, max: number) => {
    const p = (g / max) * 100;
    if (p >= 55) return 'success';
    if (p >= 45) return 'warning';
    return 'danger';
  };

  // Calculate weighted averages per subject
  const calculateWeightedAverage = (subjectGrades: Grade[]) => {
    let totalWeightedGrade = 0;
    let totalWeight = 0;

    subjectGrades.forEach(g => {
      const normalizedGrade = (g.grade / g.maxGrade) * 10; // Normalize to 10-point scale
      totalWeightedGrade += normalizedGrade * g.weight;
      totalWeight += g.weight;
    });

    return totalWeight > 0 ? totalWeightedGrade / totalWeight : 0;
  };

  // Group grades by subject
  const gradesBySubject: Record<string, Grade[]> = {};
  grades.forEach(g => {
    const subj = g.subject.toLowerCase();
    if (!gradesBySubject[subj]) gradesBySubject[subj] = [];
    gradesBySubject[subj].push(g);
  });

  // Calculate all averages
  const subjectAverages: Record<string, { average: number; count: number; totalWeight: number }> = {};
  Object.entries(gradesBySubject).forEach(([subj, subjGrades]) => {
    subjectAverages[subj] = {
      average: calculateWeightedAverage(subjGrades),
      count: subjGrades.length,
      totalWeight: subjGrades.reduce((sum, g) => sum + g.weight, 0)
    };
  });

  // Calculate overall average
  const overallAverage = Object.values(subjectAverages).length > 0
    ? Object.values(subjectAverages).reduce((sum, s) => sum + s.average, 0) / Object.values(subjectAverages).length
    : 0;

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'white'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/cijfers', label: 'Cijfers', active: true },
    { href: '/rooster', label: 'Rooster' },
    { href: '/agenda', label: 'Agenda' },
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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>📊 Mijn Cijfers</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Jouw cijfers zijn privé - alleen jij en de admin kunnen ze zien</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setViewMode('overview')} className={`btn ${viewMode === 'overview' ? 'btn-primary' : 'btn-secondary'}`}>📈 Overzicht</button>
            <button onClick={() => setViewMode('list')} className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}>📋 Lijst</button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Cijfer toevoegen</button>
          </div>
        </div>

        {/* Overall Average */}
        {grades.length > 0 && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>Gemiddeld eindcijfer</div>
            <div style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: overallAverage >= 5.5 ? '#34d399' : overallAverage >= 4.5 ? '#fbbf24' : '#f87171'
            }}>
              {overallAverage.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
              Gebaseerd op {grades.length} cijfers in {Object.keys(subjectAverages).length} vakken (gewogen gemiddelde)
            </div>
          </div>
        )}

        {/* Subject Averages Grid */}
        {viewMode === 'overview' && Object.keys(subjectAverages).length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>📈 Gemiddelde per vak</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {Object.entries(subjectAverages)
                .sort(([, a], [, b]) => b.average - a.average)
                .map(([subj, data]) => (
                  <div key={subj} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', textTransform: 'capitalize', marginBottom: '0.5rem' }}>{subj}</div>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: data.average >= 5.5 ? '#34d399' : data.average >= 4.5 ? '#fbbf24' : '#f87171',
                      marginBottom: '0.25rem'
                    }}>
                      {data.average.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                      {data.count} cijfer{data.count !== 1 ? 's' : ''} • {data.totalWeight.toFixed(1)}x gewicht
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Grades Table */}
        {viewMode === 'list' && (
          <div className="card" style={{ padding: '1.5rem', overflow: 'auto' }}>
            {grades.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                <p>Nog geen cijfers. Voeg je eerste cijfer toe!</p>
              </div>
            ) : (
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Vak</th>
                    <th>Toets</th>
                    <th style={{ textAlign: 'center' }}>Cijfer</th>
                    <th style={{ textAlign: 'center' }}>Gewicht</th>
                    <th>Datum</th>
                    <th>Toegevoegd door</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map(g => (
                    <tr key={g.id}>
                      <td style={{ textTransform: 'capitalize' }}>{g.subject}</td>
                      <td>
                        <div>{g.testName}</div>
                        {g.agenda && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>📋 {g.agenda.type}</div>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge badge-${getColor(g.grade, g.maxGrade)}`}>
                          {g.grade.toFixed(1)}/{g.maxGrade}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>{g.weight}x</span>
                      </td>
                      <td>{new Date(g.date).toLocaleDateString('nl-NL')}</td>
                      <td>{g.isStudentAdded ? '👨‍🎓 Jij' : '👨‍🏫 Docent'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Empty state for overview */}
        {viewMode === 'overview' && grades.length === 0 && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
            <p>Nog geen cijfers. Voeg je eerste cijfer toe!</p>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">➕ Cijfer toevoegen</h3>
            <form onSubmit={handleAddGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Vak *</label>
                <select
                  value={newGrade.subject}
                  onChange={(e) => {
                    setNewGrade({ ...newGrade, subject: e.target.value });
                    setSelectedSubject(e.target.value);
                    setSelectedAgendaId('');
                  }}
                  className="input-field"
                  required
                >
                  <option value="">Selecteer vak</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Koppel aan agenda item (optioneel)</label>
                <select
                  value={selectedAgendaId}
                  onChange={(e) => handleAgendaSelect(e.target.value)}
                  className="input-field"
                  disabled={!newGrade.subject}
                >
                  <option value="">Niet koppelen / Andere toets</option>
                  {filteredAgendaItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title} ({item.type}, {item.weight}x)
                    </option>
                  ))}
                </select>
                {filteredAgendaItems.length === 0 && newGrade.subject && (
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                    Geen openstaande items voor dit vak in je agenda
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Toets naam *</label>
                <input
                  type="text"
                  value={newGrade.testName}
                  onChange={e => setNewGrade({ ...newGrade, testName: e.target.value })}
                  className="input-field"
                  placeholder="bijv. Hoofdstuk 1 toets"
                  required
                  disabled={!!selectedAgendaId}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Cijfer *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max={newGrade.maxGrade}
                    value={newGrade.grade}
                    onChange={e => setNewGrade({ ...newGrade, grade: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-group" style={{ width: '100px' }}>
                  <label className="form-label">Max</label>
                  <input
                    type="number"
                    value={newGrade.maxGrade}
                    onChange={e => setNewGrade({ ...newGrade, maxGrade: e.target.value })}
                    className="input-field"
                    disabled={!!selectedAgendaId}
                  />
                </div>
                <div className="form-group" style={{ width: '80px' }}>
                  <label className="form-label">Gewicht</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="5"
                    value={newGrade.weight}
                    onChange={e => setNewGrade({ ...newGrade, weight: e.target.value })}
                    className="input-field"
                    disabled={!!selectedAgendaId}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Annuleren</button>
                <button type="submit" disabled={adding} className="btn btn-primary" style={{ flex: 1 }}>{adding ? 'Toevoegen...' : 'Toevoegen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
