'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; }

const days = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];
const hours = ['1e uur\n8:30-9:20', '2e uur\n9:20-10:10', '3e uur\n10:30-11:20', '4e uur\n11:20-12:10', '5e uur\n12:50-13:40', '6e uur\n13:40-14:30', '7e uur\n14:45-15:35', '8e uur\n15:35-16:25'];

const subjectColors: Record<string, string> = {
  'wiskunde': '#3b82f6', 'engels': '#10b981', 'nederlands': '#f59e0b',
  'geschiedenis': '#8b5cf6', 'aardrijkskunde': '#06b6d4', 'biologie': '#22c55e',
  'natuurkunde': '#ef4444', 'scheikunde': '#f97316', 'frans': '#ec4899',
  'duits': '#6366f1', 'economie': '#14b8a6', 'lo': '#84cc16', 'ckv': '#f472b6',
};

export default function RoosterPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [week, setWeek] = useState(1);
  const [schedule, setSchedule] = useState<Record<string, string>>({});

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) setUser(data.user);
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  const getSubjectColor = (subj: string) => subjectColors[subj?.toLowerCase()] || '#6b7280';

  const handleCellChange = (key: string, value: string) => {
    setSchedule(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'white'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: '🏠 Home' },
    { href: '/cijfers', label: '📊 Cijfers' },
    { href: '/rooster', label: '📅 Rooster', active: true },
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white' }}>📅 Rooster</h1>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setWeek(w => Math.max(1, w - 1))} className="btn btn-secondary">◀</button>
            <span className="glass-card" style={{ padding: '0.5rem 1.25rem', fontWeight: '600', color: 'white' }}>Week {week}</span>
            <button onClick={() => setWeek(w => w + 1)} className="btn btn-secondary">▶</button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1rem', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.1)', width: '80px' }}>Uur</th>
                {days.map(d => (
                  <th key={d} style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', fontWeight: '600', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map((h, hi) => (
                <tr key={hi}>
                  <td style={{ padding: '0.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', whiteSpace: 'pre-line', verticalAlign: 'middle', background: 'rgba(255,255,255,0.03)' }}>{h}</td>
                  {days.map((d, di) => {
                    const key = `${week}-${d}-${hi}`;
                    const val = schedule[key] || '';
                    return (
                      <td key={di} style={{ padding: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <input
                          type="text"
                          value={val}
                          onChange={e => handleCellChange(key, e.target.value)}
                          placeholder="+"
                          style={{
                            width: '100%',
                            padding: '0.75rem 0.5rem',
                            background: val ? getSubjectColor(val) + '30' : 'transparent',
                            border: '1px solid transparent',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            color: val ? getSubjectColor(val) : 'rgba(255,255,255,0.4)',
                            fontWeight: val ? '600' : '400',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s ease',
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
          💡 Typ de naam van het vak om je rooster in te vullen. Je kunt naar andere weken navigeren.
        </div>
      </main>
    </div>
  );
}
