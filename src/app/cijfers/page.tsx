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
  user?: { username: string; isAdmin: boolean };
}

const defaultSubjects: string[] = []; // Empty - only use subjects from database/agenda

export default function CijfersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>(defaultSubjects);
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
      if (data.user) { 
        setUser(data.user); 
        await Promise.all([fetchGrades(), fetchAgenda(), fetchSubjects()]);
      }
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
      const res = await fetch('/api/agenda');
      const data = await res.json();
      const items = data.agendaItems || [];
      setAgendaItems(items);
      
      // Extract unique subjects from agenda
      const agendaSubjects = [...new Set(items.map((a: AgendaItem) => a.subject).filter(Boolean))];
      setSubjects(prev => {
        const allSubjects = [...new Set([...prev, ...agendaSubjects])];
        return allSubjects.sort((a, b) => a.localeCompare(b, 'nl'));
      });
    } catch {}
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.subjects && data.subjects.length > 0) {
        const dbSubjects = data.subjects.map((s: { displayName: string; name: string }) => s.displayName || s.name);
        setSubjects(prev => {
          const allSubjects = [...new Set([...prev, ...dbSubjects])];
          return allSubjects.sort((a, b) => a.localeCompare(b, 'nl'));
        });
      }
    } catch {}
  };

  // Combine subjects from database and agenda only (not from grades - those might be manually entered)

  // Get unique subjects from agenda items (for the subject dropdown)
  const agendaSubjects = [...new Set(agendaItems.map(a => a.subject).filter(Boolean))];

  // Filter agenda items by selected subject
  const filteredAgendaItems = selectedSubject 
    ? agendaItems.filter(item => item.subject.toLowerCase() === selectedSubject.toLowerCase())
    : agendaItems;

  // Handle subject change
  const handleSubjectChange = (subject: string) => {
    setNewGrade({ ...newGrade, subject });
    setSelectedSubject(subject);
    setSelectedAgendaId('');
    setNewGrade(prev => ({ ...prev, testName: '', maxGrade: '10', weight: '1' }));
  };

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
        setSelectedSubject('');
        setSelectedAgendaId('');
        fetchGrades();
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
      const normalizedGrade = (g.grade / g.maxGrade) * 10;
      totalWeightedGrade += normalizedGrade * g.weight;
      totalWeight += g.weight;
    });

    return totalWeight > 0 ? totalWeightedGrade / totalWeight : 0;
  };

  // Group grades by subject
  const gradesBySubject: Record<string, Grade[]> = {};
  grades.forEach(g => {
    const subj = g.subject;
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

  // Calculate status based on grades
  const calculateStatus = (): { status: 'goedgekeurd' | 'bespreekzone' | 'geweigerd'; color: string; reason: string } => {
    if (grades.length === 0) return { status: 'goedgekeurd', color: '#34d399', reason: 'Nog geen cijfers' };
    
    // Normalize all grades to 1-10 scale
    const normalizedGrades = grades.map(g => (g.grade / g.maxGrade) * 10);
    
    // Count grades below 4, fives (4.5-5.4), and fours (4.0-4.9)
    const belowFour = normalizedGrades.filter(g => g < 4).length;
    const fives = normalizedGrades.filter(g => g >= 4.5 && g < 5.5).length;
    const fours = normalizedGrades.filter(g => g >= 4 && g < 4.5).length;
    const foursAndFives = normalizedGrades.filter(g => g >= 4 && g < 5.5).length;
    
    // GEWEIGERD: 1 grade below 4 OR more than 3 fives (4+) OR (2 fives AND 1 four)
    if (belowFour >= 1) {
      return { 
        status: 'geweigerd', 
        color: '#f87171', 
        reason: `${belowFour} cijfer${belowFour > 1 ? 's' : ''} onder de 4` 
      };
    }
    if (fives >= 4) {
      return { 
        status: 'geweigerd', 
        color: '#f87171', 
        reason: `${fives} vijven (meer dan 3)` 
      };
    }
    if (fives >= 2 && fours >= 1) {
      return { 
        status: 'geweigerd', 
        color: '#f87171', 
        reason: `${fives} vijf${fives > 1 ? 'ven' : ''} en ${fours} vier${fours > 1 ? 'en' : ''}` 
      };
    }
    
    // BESPREEKZONE: 3 fives OR 1 four OR (2 fives)
    if (fives >= 3) {
      return { 
        status: 'bespreekzone', 
        color: '#fbbf24', 
        reason: `${fives} vijf${fives > 1 ? 'ven' : ''}` 
      };
    }
    if (fours >= 1) {
      return { 
        status: 'bespreekzone', 
        color: '#fbbf24', 
        reason: `${fours} vier${fours > 1 ? 'en' : ''}` 
      };
    }
    if (fives >= 2) {
      return { 
        status: 'bespreekzone', 
        color: '#fbbf24', 
        reason: `${fives} vijf${fives > 1 ? 'ven' : ''}` 
      };
    }
    
    // GOEDGEKEURD: 2 fives or less and no grades below 4
    return { 
      status: 'goedgekeurd', 
      color: '#34d399', 
      reason: fives > 0 ? `${fives} vijf${fives > 1 ? 'ven' : ''} (≤ 2)` : 'Alle cijfers voldoende' 
    };
  };

  const statusInfo = calculateStatus();

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
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              {agendaSubjects.length > 0 && `📚 ${agendaSubjects.length} vakken in agenda • `}
              {grades.length} cijfers geregistreerd
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setViewMode('overview')} className={`btn ${viewMode === 'overview' ? 'btn-primary' : 'btn-secondary'}`}>📈 Overzicht</button>
            <button onClick={() => setViewMode('list')} className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}>📋 Lijst</button>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">+ Cijfer toevoegen</button>
          </div>
        </div>

        {/* Pending Agenda Items */}
        {agendaItems.length > 0 && grades.length === 0 && (
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <h3 style={{ color: '#fbbf24', marginBottom: '0.5rem' }}>📋 Openstaande toetsen uit je agenda</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              Je hebt toetsen in je agenda waar nog geen cijfer voor is ingevuld. Klik op "Cijfer toevoegen" om ze in te vullen!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              {agendaSubjects.slice(0, 6).map(subject => (
                <span key={subject} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem' }}>
                  {subject}
                </span>
              ))}
              {agendaSubjects.length > 6 && (
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                  +{agendaSubjects.length - 6} meer
                </span>
              )}
            </div>
          </div>
        )}

        {/* Overall Average and Status */}
        {grades.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Average Card */}
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>Gemiddeld eindcijfer</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: overallAverage >= 5.5 ? '#34d399' : overallAverage >= 4.5 ? '#fbbf24' : '#f87171'
              }}>
                {overallAverage.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                Gebaseerd op {grades.length} cijfers in {Object.keys(subjectAverages).length} vakken
              </div>
            </div>

            {/* Status Card */}
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', background: `linear-gradient(135deg, ${statusInfo.color}20, ${statusInfo.color}10)`, borderLeft: `4px solid ${statusInfo.color}` }}>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>📊 Status</div>
              <div style={{
                fontSize: '1.75rem',
                fontWeight: '700',
                color: statusInfo.color,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {statusInfo.status === 'goedgekeurd' && '✅ Goedgekeurd'}
                {statusInfo.status === 'bespreekzone' && '⚠️ Bespreekzone'}
                {statusInfo.status === 'geweigerd' && '❌ Geweigerd'}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
                {statusInfo.reason}
              </div>
            </div>
          </div>
        )}

        {/* Status Legend - always visible when there are grades */}
        {grades.length > 0 && (
          <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#f87171', fontWeight: '600' }}>❌ Geweigerd:</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>1× onder 4, 4+ vijven, of 2 vijven + 1 vier</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#fbbf24', fontWeight: '600' }}>⚠️ Bespreekzone:</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>3 vijven, 1 vier, of 2 vijven</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: '#34d399', fontWeight: '600' }}>✅ Goedgekeurd:</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Max 2 vijven, geen onvoldoendes</span>
              </div>
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
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{subj}</div>
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
                      <td>{g.subject}</td>
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
            
            {/* Show available tests from agenda */}
            {agendaItems.length > 0 && !selectedSubject && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <p style={{ fontSize: '0.875rem', color: '#60a5fa', margin: 0 }}>
                  💡 Selecteer eerst een vak om toetsen uit je agenda te zien
                </p>
              </div>
            )}

            <form onSubmit={handleAddGrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Vak *</label>
                <select
                  value={newGrade.subject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Selecteer vak</option>
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {selectedSubject && filteredAgendaItems.length > 0 && (
                <div className="form-group">
                  <label className="form-label">📋 Toetsen uit agenda ({filteredAgendaItems.length})</label>
                  <select
                    value={selectedAgendaId}
                    onChange={(e) => handleAgendaSelect(e.target.value)}
                    className="input-field"
                  >
                    <option value="">Selecteer een toets of voer handmatig in...</option>
                    {filteredAgendaItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.type}, {item.weight}x, {new Date(item.testDate).toLocaleDateString('nl-NL')})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Toets naam *</label>
                <input
                  type="text"
                  value={newGrade.testName}
                  onChange={e => setNewGrade({ ...newGrade, testName: e.target.value })}
                  className="input-field"
                  placeholder={selectedAgendaId ? "Geselecteerd uit agenda" : "bijv. Hoofdstuk 1 toets"}
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
                    placeholder="bijv. 7.5"
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
