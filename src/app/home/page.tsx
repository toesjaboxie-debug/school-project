'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
  email?: string | null;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      } else {
        router.push('/login');
      }
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>📚</div>
            <p>Laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { href: '/home', label: '🏠 Home', active: true },
    { href: '/cijfers', label: '📊 Cijfers', active: false },
    { href: '/rooster', label: '📅 Rooster', active: false },
    { href: '/chat', label: '🤖 AI Chat', active: false },
    { href: '/instellingen', label: '⚙️ Instellingen', active: false },
    ...(user.isAdmin ? [{ href: '/admin', label: '🛡️ Admin', active: false }] : []),
  ];

  return (
    <div className="page-container">
      {/* Background */}
      <div className="page-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">📚</span>
            <span className="logo-text">EduLearn AI</span>
          </div>
          <div className="user-info">
            <span className="user-name">Welkom, {user.username}</span>
            {user.isAdmin && <span className="admin-badge">🛡️ Admin</span>}
            <button onClick={handleLogout} className="btn btn-secondary">🚪 Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Welcome Card */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem' }}>
            Welkom terug, {user.username}! 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>
            Je persoonlijke AI-gestuurde leerplatform
          </p>
        </div>

        {/* Quick Stats */}
        <div className="cards-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="stat-value">📊</div>
            <div className="stat-label">Bekijk je cijfers</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <div className="stat-value">📅</div>
            <div className="stat-label">Je rooster</div>
          </div>
          <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="stat-value">🤖</div>
            <div className="stat-label">AI Assistent</div>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="cards-grid">
          <Link href="/cijfers" className="glass-card" style={{ padding: '1.5rem', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.3s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Cijfers</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Bekijk je cijfers, gemiddelden en voeg nieuwe toe</p>
          </Link>

          <Link href="/rooster" className="glass-card" style={{ padding: '1.5rem', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.3s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Rooster</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Bekijk en beheer je lessenrooster per week</p>
          </Link>

          <Link href="/chat" className="glass-card" style={{ padding: '1.5rem', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.3s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>AI Chat</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Stel vragen aan je AI studieassistent</p>
          </Link>

          <Link href="/instellingen" className="glass-card" style={{ padding: '1.5rem', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.3s ease' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Instellingen</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Beheer je account en email instellingen</p>
          </Link>

          {user.isAdmin && (
            <Link href="/admin" className="glass-card" style={{ padding: '1.5rem', textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.3s ease', gridColumn: 'span 2' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>Admin Panel</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Beheer gebruikers, vakken en site instellingen</p>
            </Link>
          )}
        </div>
      </main>

      <style jsx>{`
        .glass-card:hover {
          transform: translateY(-5px);
        }
      `}</style>
    </div>
  );
}
