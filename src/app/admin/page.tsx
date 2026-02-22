'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; }
interface UserItem { id: string; username: string; isAdmin: boolean; createdAt: string; }

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user && data.user.isAdmin) { setUser(data.user); fetchUsers(); }
      else router.push('/home');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {}
  };

  const handleLogout = async () => { try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} router.push('/login'); };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;
    try {
      await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch {}
  };

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'white'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: '🏠 Home' },
    { href: '/cijfers', label: '📊 Cijfers' },
    { href: '/rooster', label: '📅 Rooster' },
    { href: '/chat', label: '🤖 AI Chat' },
    { href: '/instellingen', label: '⚙️ Instellingen' },
    { href: '/admin', label: '🛡️ Admin', active: true },
  ];

  return (
    <div className="page-container">
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className="blob blob-3"></div></div>

      <header className="page-header">
        <div className="header-content">
          <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">EduLearn AI</span></div>
          <div className="user-info">
            <span className="admin-badge">🛡️ Admin</span>
            <span className="user-name">{user.username}</span>
            <button onClick={handleLogout} className="btn btn-secondary">🚪 Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '1.5rem' }}>🛡️ Admin Panel</h1>

        {/* Stats */}
        <div className="cards-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="stat-value">{users.length}</div>
            <div className="stat-label">Gebruikers</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <div className="stat-value">{users.filter(u => u.isAdmin).length}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="stat-value">{users.filter(u => !u.isAdmin).length}</div>
            <div className="stat-label">Leerlingen</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>👥 Gebruikers</h3>
          {users.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '2rem' }}>Geen gebruikers gevonden</div>
          ) : (
            <table className="glass-table">
              <thead><tr>
                <th>Gebruikersnaam</th>
                <th style={{textAlign:'center'}}>Rol</th>
                <th>Aangemaakt</th>
                <th style={{textAlign:'center'}}>Acties</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>{u.username}</td>
                    <td style={{textAlign:'center'}}>{u.isAdmin ? <span className="badge badge-warning">Admin</span> : <span className="badge badge-info">Leerling</span>}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString('nl-NL')}</td>
                    <td style={{textAlign:'center'}}>
                      {!u.isAdmin && <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger" style={{padding:'0.25rem 0.75rem',fontSize:'0.75rem'}}>🗑️</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
