'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { 
  id: string; 
  username: string; 
  isAdmin: boolean; 
  isPro?: boolean; 
  email?: string | null;
  balance?: number;
  hideBalance?: boolean;
  darkMode?: boolean;
  notifications?: boolean;
  language?: string;
  emailVerified?: boolean;
  schoolId?: string | null;
  classId?: string | null;
  school?: { id: string; name: string } | null;
  class?: { id: string; name: string; school?: { id: string; name: string } | null } | null;
}

interface School { id: string; name: string; classes: { id: string; name: string }[]; }
interface Class { id: string; name: string; school: { id: string; name: string }; }

export default function InstellingenPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [exactError, setExactError] = useState('');
  
  // Balance
  const [balance, setBalance] = useState(0);
  const [hideBalance, setHideBalance] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('5');
  const [topUpMessage, setTopUpMessage] = useState('');
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  
  // Preferences
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('nl');
  
  // School/Class
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) { 
        setUser(data.user); 
        setEmail(data.user.email || '');
        setBalance(data.user.balance || 0);
        setHideBalance(data.user.hideBalance ?? true);
        setDarkMode(data.user.darkMode ?? true);
        setNotifications(data.user.notifications ?? true);
        setLanguage(data.user.language || 'nl');
        setSelectedSchoolId(data.user.schoolId || '');
        setSelectedClassId(data.user.classId || '');
        fetchBalanceInfo();
        fetchSchoolsAndClasses();
      }
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchBalanceInfo = async () => {
    try {
      const res = await fetch('/api/balance');
      const data = await res.json();
      setBalance(data.balance || 0);
      setHideBalance(data.hideBalance ?? true);
      setPendingRequests(data.pendingRequests || 0);
    } catch {}
  };

  const fetchSchoolsAndClasses = async () => {
    try {
      const [schoolsRes, classesRes] = await Promise.all([
        fetch('/api/admin/schools'),
        fetch('/api/admin/classes')
      ]);
      const schoolsData = await schoolsRes.json();
      const classesData = await classesRes.json();
      setSchools(schoolsData.schools || []);
      setClasses(classesData.classes || []);
    } catch {}
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  const handleSavePreferences = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideBalance, darkMode, notifications, language }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Voorkeuren opgeslagen!');
        if (user) setUser({ ...user, hideBalance, darkMode, notifications, language });
      } else {
        setError(data.error || 'Er is een fout opgetreden');
      }
    } catch (e: any) {
      setError('Er is een fout opgetreden: ' + e.message);
    }
    setSaving(false);
  };

  const handleSaveSchoolClass = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    setExactError('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: selectedSchoolId, classId: selectedClassId }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('School/Klas opgeslagen!');
        if (user) setUser({ 
          ...user, 
          schoolId: selectedSchoolId, 
          classId: selectedClassId,
          school: data.user.school,
          class: data.user.class
        });
      } else {
        setError(data.error || 'Er is een fout opgetreden');
        setExactError(data.exactError || JSON.stringify(data));
      }
    } catch (e: any) {
      setError('Er is een fout opgetreden: ' + e.message);
      setExactError(e.message);
    }
    setSaving(false);
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpLoading(true);
    setError('');
    setExactError('');

    try {
      const res = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(topUpAmount), message: topUpMessage }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage(data.message || 'Aanvraag verzonden!');
        setShowTopUpModal(false);
        setTopUpMessage('');
        fetchBalanceInfo();
      } else {
        setError(data.error || 'Er is een fout opgetreden');
        setExactError(data.exactError || data.details || JSON.stringify(data));
      }
    } catch (e: any) {
      setError('Er is een fout opgetreden: ' + e.message);
      setExactError(e.message);
    }
    setTopUpLoading(false);
  };

  // Filter classes by selected school
  const filteredClasses = selectedSchoolId 
    ? classes.filter(c => c.school.id === selectedSchoolId)
    : classes;

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#fff'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/cijfers', label: 'Cijfers' },
    { href: '/rooster', label: 'Rooster' },
    { href: '/chat', label: 'AI Chat' },
    { href: '/materiaal', label: 'Materiaal' },
    { href: '/instellingen', label: 'Instellingen', active: true },
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

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Instellingen</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>Beheer je account en voorkeuren</p>

        {message && <div className="badge badge-success" style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', width: '100%', textAlign: 'left', borderRadius: '12px' }}>✅ {message}</div>}
        {error && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div className="badge badge-danger" style={{ display: 'block', padding: '1rem', width: '100%', textAlign: 'left', borderRadius: '12px' }}>❌ {error}</div>
            {exactError && <pre style={{ background: 'rgba(248,113,113,0.1)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', marginTop: '0.5rem', overflow: 'auto', color: '#f87171' }}>{exactError}</pre>}
          </div>
        )}

        {/* Account Info */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span style={{ fontSize: '1.25rem' }}>👤</span>
            <h3 className="settings-section-title">Account Informatie</h3>
          </div>
          <div className="settings-section-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-label">Gebruikersnaam</div>
                  <div className="settings-item-desc">Je unieke gebruikersnaam</div>
                </div>
                <span style={{ fontWeight: 500 }}>{user.username}</span>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-label">Rol</div>
                  <div className="settings-item-desc">Je rol in het systeem</div>
                </div>
                <span style={{ fontWeight: 500 }}>{user.isAdmin ? '🛡️ Admin' : '👨‍🎓 Leerling'}</span>
              </div>
              <div className="settings-item">
                <div className="settings-item-info">
                  <div className="settings-item-label">Account type</div>
                  <div className="settings-item-desc">{user.isPro ? 'Onbeperkte AI toegang' : 'Gratis met saldo'}</div>
                </div>
                <span style={{ fontWeight: 500 }}>{user.isPro ? '⭐ Pro (Unlimited)' : '🆓 Gratis'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* School/Class Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span style={{ fontSize: '1.25rem' }}>🏫</span>
            <h3 className="settings-section-title">School & Klas</h3>
          </div>
          <div className="settings-section-body">
            <div style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">School</label>
                <select 
                  value={selectedSchoolId} 
                  onChange={(e) => {
                    setSelectedSchoolId(e.target.value);
                    setSelectedClassId(''); // Reset class when school changes
                  }}
                  className="input-field"
                >
                  <option value="">Selecteer je school...</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Klas</label>
                <select 
                  value={selectedClassId} 
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="input-field"
                  disabled={!selectedSchoolId}
                >
                  <option value="">Selecteer je klas...</option>
                  {filteredClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Show current selection */}
            {(user.school || user.class) && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(52,211,153,0.1)', borderRadius: '12px', color: '#34d399', fontSize: '0.875rem' }}>
                📍 Huidig: {user.school?.name || 'Geen school'} {user.class?.name ? `- ${user.class.name}` : ''}
              </div>
            )}
            
            <button 
              onClick={handleSaveSchoolClass} 
              disabled={saving} 
              className="btn btn-primary" 
              style={{ width: '100%' }}
            >
              {saving ? 'Opslaan...' : '💾 School & Klas Opslaan'}
            </button>
          </div>
        </div>

        {/* Balance Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span style={{ fontSize: '1.25rem' }}>💰</span>
            <h3 className="settings-section-title">Saldo & Pro</h3>
          </div>
          <div className="settings-section-body">
            {user.isPro ? (
              <div className="balance-card" style={{ background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <div>
                  <div style={{ color: '#fbbf24', fontWeight: 600 }}>⭐ Pro Lidmaatschap - Unlimited AI</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Je hebt onbeperkte toegang tot alle AI modellen!</div>
                </div>
              </div>
            ) : (
              <>
                <div className="balance-card">
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Je saldo</div>
                    <div className="balance-amount">€{balance.toFixed(2)}</div>
                  </div>
                  <button onClick={() => setShowTopUpModal(true)} className="btn btn-primary">
                    + Saldo opladen
                  </button>
                </div>
                
                {pendingRequests > 0 && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px', color: '#fbbf24', fontSize: '0.85rem' }}>
                    ⏳ Je hebt {pendingRequests} openstaande aanvraag{pendingRequests > 1 ? 'en' : ''}
                  </div>
                )}
                
                <div className="settings-item" style={{ marginTop: '1rem' }}>
                  <div className="settings-item-info">
                    <div className="settings-item-label">Saldo verbergen in navigatie</div>
                    <div className="settings-item-desc">Verberg je saldo in de header</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={hideBalance} onChange={(e) => { setHideBalance(e.target.checked); handleSavePreferences(); }} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="settings-section">
          <div className="settings-section-header">
            <span style={{ fontSize: '1.25rem' }}>🎨</span>
            <h3 className="settings-section-title">Voorkeuren</h3>
          </div>
          <div className="settings-section-body">
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Donkere modus</div>
                <div className="settings-item-desc">Gebruik donkere achtergrond</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Notificaties</div>
                <div className="settings-item-desc">Ontvang meldingen</div>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            
            <div className="settings-item">
              <div className="settings-item-info">
                <div className="settings-item-label">Taal</div>
                <div className="settings-item-desc">Interface taal</div>
              </div>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="input-field" style={{ width: 'auto', minWidth: '150px' }}>
                <option value="nl">🇳🇱 Nederlands</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
            
            <button onClick={handleSavePreferences} disabled={saving} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              {saving ? 'Opslaan...' : '💾 Voorkeuren opslaan'}
            </button>
          </div>
        </div>
      </main>

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">💰 Saldo Opladen</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
              Laad je saldo op om betaalde AI modellen te gebruiken. De admin zal je aanvraag beoordelen.
            </p>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              {['5', '10', '20', '50'].map(amount => (
                <button 
                  key={amount}
                  onClick={() => setTopUpAmount(amount)}
                  className={`btn ${topUpAmount === amount ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1 }}
                >
                  €{amount}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleTopUp}>
              <div className="form-group">
                <label className="form-label">Bedrag</label>
                <input 
                  type="number" 
                  value={topUpAmount} 
                  onChange={e => setTopUpAmount(e.target.value)} 
                  className="input-field" 
                  min="1" 
                  max="100"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Bericht aan admin (optioneel)</label>
                <textarea 
                  value={topUpMessage} 
                  onChange={e => setTopUpMessage(e.target.value)} 
                  className="input-field" 
                  rows={3}
                  placeholder="bijv. Ik heb €10 overgemaakt op rekening..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowTopUpModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Annuleren</button>
                <button type="submit" disabled={topUpLoading} className="btn btn-primary" style={{ flex: 1 }}>{topUpLoading ? 'Versturen...' : 'Aanvraag versturen'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
