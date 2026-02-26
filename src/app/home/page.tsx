'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; isPro?: boolean; onboardingDone?: boolean; school?: { name: string }; class?: { name: string }; }

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      
      if (!data.user) {
        router.push('/login');
        return;
      }

      // Check onboarding AFTER we have the user data
      if (!data.user.onboardingDone && !redirecting) {
        setRedirecting(true);
        router.push('/onboarding');
        return;
      }
      
      setUser(data.user);
    } catch { 
      router.push('/login'); 
    }
    finally { 
      setLoading(false); 
    }
  };

  const handleLogout = async () => { 
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {} 
    router.push('/login'); 
  };

  if (loading || redirecting) {
    return (
      <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
        <p style={{color:'#fff'}}>Laden...</p>
      </div>
    );
  }
  
  if (!user) return null;

  const navItems = [
    { href: '/home', label: 'Home', active: true },
    { href: '/cijfers', label: 'Cijfers' },
    { href: '/rooster', label: 'Rooster' },
    { href: '/chat', label: 'AI Chat' },
    { href: '/materiaal', label: 'Materiaal' },
    { href: '/instellingen', label: 'Instellingen' },
    ...(user.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="page-container">
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div></div>

      <header className="page-header">
        <div className="header-content">
          <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">EduLearn AI</span></div>
          <div className="user-info">
            {user.isPro && <span className="badge badge-warning">PRO</span>}
            <span className="user-name">{user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost">Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welkom terug, {user.username}</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>
          {user.school?.name && `${user.school.name} `}
          {user.class?.name && `- Klas ${user.class.name}`}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/cijfers" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>Cijfers</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Bekijk je cijfers</p>
          </Link>

          <Link href="/rooster" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>Rooster</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Je lessenrooster</p>
          </Link>

          <Link href="/chat" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🤖</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>AI Chat</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Stel vragen aan AI</p>
          </Link>

          <Link href="/materiaal" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📖</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>Materiaal</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Lesmateriaal bekijken</p>
          </Link>

          <Link href="/instellingen" className="card" style={{ padding: '1.5rem', textDecoration: 'none' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚙️</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>Instellingen</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Account instellingen</p>
          </Link>
        </div>

        {user.isAdmin && (
          <Link href="/admin" className="card" style={{ padding: '1.5rem', textDecoration: 'none', display: 'block' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>Admin Panel</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Beheer scholen, klassen en gebruikers</p>
          </Link>
        )}
      </main>
    </div>
  );
}
