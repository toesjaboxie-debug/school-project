'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Geen reset token gevonden.');
        return;
      }

      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await res.json();
        
        if (data.valid) {
          setStatus('form');
          setUsername(data.username);
        } else {
          setStatus('error');
          setMessage(data.error || 'Ongeldige of verlopen link.');
        }
      } catch {
        setStatus('error');
        setMessage('Er is iets misgegaan.');
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('Wachtwoorden komen niet overeen.');
      return;
    }

    if (password.length < 6) {
      setMessage('Wachtwoord moet minimaal 6 karakters lang zijn.');
      return;
    }

    setLoading(true);
    setMessage('');

    const token = searchParams.get('token');
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
      } else {
        setMessage(data.error || 'Er is iets misgegaan.');
      }
    } catch {
      setMessage('Er is iets misgegaan.');
    }

    setLoading(false);
  };

  return (
    <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff' }}>Wachtwoord Resetten</h1>
      </div>

      {status === 'loading' && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Token verifiëren...</p>
        </div>
      )}

      {status === 'form' && (
        <form onSubmit={handleSubmit}>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Hallo, <strong>{username}</strong>! Voer je nieuwe wachtwoord in.
          </p>

          <div className="form-group">
            <label className="form-label">Nieuw Wachtwoord</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Minimaal 6 karakters"
                required
                minLength={6}
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Bevestig Wachtwoord</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="Herhaal wachtwoord"
              required
            />
          </div>

          {message && (
            <div style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.875rem' }}
          >
            {loading ? 'Opslaan...' : 'Wachtwoord Opslaan'}
          </button>
        </form>
      )}

      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Gelukt!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>{message}</p>
          <button 
            onClick={() => router.push('/login')} 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.875rem' }}
          >
            Inloggen →
          </button>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
          <h2 style={{ color: '#f87171', marginBottom: '0.5rem' }}>Mislukt</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '2rem' }}>{message}</p>
          <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            Naar Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div></div>
      
      <Suspense fallback={<div style={{ color: '#fff' }}>Laden...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
