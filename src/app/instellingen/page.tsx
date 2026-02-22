'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; isPro?: boolean; email?: string | null; }

export default function InstellingenPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showProModal, setShowProModal] = useState(false);
  const [proMessage, setProMessage] = useState('');
  const [proLoading, setProLoading] = useState(false);
  const [proRequested, setProRequested] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) { setUser(data.user); setEmail(data.user.email || ''); }
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage('Email succesvol opgeslagen!');
        if (user) setUser({ ...user, email });
      } else {
        setError(data.error || 'Er is een fout opgetreden');
      }
    } catch (e: any) {
      setError('Er is een fout opgetreden: ' + e.message);
    }
    setSaving(false);
  };

  const handleProRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setProLoading(true);

    try {
      const res = await fetch('/api/pro/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: proMessage }),
      });
      const data = await res.json();

      if (res.ok) {
        setProRequested(true);
        setShowProModal(false);
        setMessage('Pro aanvraag verstuurd! De admin zal dit beoordelen.');
      } else {
        setError(data.error || 'Er is een fout opgetreden');
      }
    } catch (e: any) {
      setError('Er is een fout opgetreden: ' + e.message);
    }
    setProLoading(false);
  };

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#fff'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: '🏠 Home' },
    { href: '/cijfers', label: '📊 Cijfers' },
    { href: '/rooster', label: '📅 Rooster' },
    { href: '/chat', label: '🤖 AI Chat' },
    { href: '/instellingen', label: '⚙️ Instellingen', active: true },
    ...(user.isAdmin ? [{ href: '/admin', label: '🛡️ Admin' }] : []),
  ];

  return (
    <div className="page-container">
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

      <main style={{ maxWidth: '700px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem' }}>⚙️ Instellingen</h1>

        {message && <div className="badge badge-success" style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', width: '100%', textAlign: 'left' }}>✅ {message}</div>}
        {error && <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1.5rem', padding: '1rem', width: '100%', textAlign: 'left' }}>❌ {error}</div>}

        {/* Account Info */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">👤 Account Informatie</h3>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#141414', borderRadius: '8px' }}>
                <span style={{ color: '#737373' }}>Gebruikersnaam</span>
                <span style={{ fontWeight: 500 }}>{user.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#141414', borderRadius: '8px' }}>
                <span style={{ color: '#737373' }}>Rol</span>
                <span style={{ fontWeight: 500 }}>{user.isAdmin ? '🛡️ Admin' : '👨‍🎓 Leerling'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#141414', borderRadius: '8px' }}>
                <span style={{ color: '#737373' }}>Account type</span>
                <span style={{ fontWeight: 500 }}>{user.isPro ? '⭐ Pro' : '🆓 Gratis'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">📧 Email Instellingen</h3>
          </div>
          <div className="card-body">
            <form onSubmit={handleSaveEmail}>
              <div className="form-group">
                <label className="form-label">Email adres</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="jouwnaam@voorbeeld.nl" />
              </div>
              <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>{saving ? 'Opslaan...' : '💾 Opslaan'}</button>
            </form>
          </div>
        </div>

        {/* Pro Upgrade */}
        {!user.isPro && (
          <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid #eab308' }}>
            <div className="card-header" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
              <h3 className="card-title" style={{ color: '#eab308' }}>⭐ Upgrade naar Pro - €5 eenmalig</h3>
            </div>
            <div className="card-body">
              <ul style={{ color: '#a3a3a3', marginBottom: '1.5rem', paddingLeft: '1.25rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>✓ Toegang tot alle AI modellen (GPT-4, Claude, etc.)</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Geen fallback delays</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Prioriteit support</li>
                <li style={{ marginBottom: '0.5rem' }}>✓ Eenmalige betaling, geen abonnement</li>
              </ul>
              {proRequested ? (
                <div className="badge badge-warning" style={{ display: 'block', padding: '1rem', textAlign: 'center' }}>
                  ⏳ Je aanvraag wordt beoordeeld door de admin
                </div>
              ) : (
                <button onClick={() => setShowProModal(true)} className="btn btn-primary" style={{ width: '100%', background: '#eab308', color: '#000' }}>
                  ⭐ Upgrade naar Pro
                </button>
              )}
            </div>
          </div>
        )}

        {user.isPro && (
          <div className="card" style={{ marginBottom: '1.5rem', border: '1px solid #22c55e' }}>
            <div className="card-header" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <h3 className="card-title" style={{ color: '#22c55e' }}>⭐ Je hebt Pro!</h3>
            </div>
            <div className="card-body">
              <p style={{ color: '#a3a3a3' }}>Je hebt toegang tot alle AI modellen inclusief GPT-4, Claude en meer!</p>
            </div>
          </div>
        )}
      </main>

      {/* Pro Modal */}
      {showProModal && (
        <div className="modal-overlay" onClick={() => setShowProModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">⭐ Pro Upgraden - €5</h3>
            <p style={{ color: '#a3a3a3', marginBottom: '1.5rem' }}>
              Stuur een bericht naar de admin. Na betaling en goedkeuring krijg je direct Pro toegang.
            </p>
            <form onSubmit={handleProRequest}>
              <div className="form-group">
                <label className="form-label">Bericht aan admin (optioneel)</label>
                <textarea 
                  value={proMessage} 
                  onChange={e => setProMessage(e.target.value)} 
                  className="input-field" 
                  rows={3}
                  placeholder="bijv. Ik heb €5 overgemaakt op rekening..."
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowProModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Annuleren</button>
                <button type="submit" disabled={proLoading} className="btn btn-primary" style={{ flex: 1 }}>{proLoading ? 'Versturen...' : 'Verstuur aanvraag'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
