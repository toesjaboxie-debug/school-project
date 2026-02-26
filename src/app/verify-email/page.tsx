'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) {
        setStatus('error');
        setMessage('Geen verificatie token gevonden.');
        return;
      }

      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        
        if (data.success) {
          setStatus('success');
          setMessage(data.message);
          setUsername(data.username);
        } else {
          setStatus('error');
          setMessage(data.error || 'Er is iets misgegaan.');
        }
      } catch {
        setStatus('error');
        setMessage('Er is iets misgegaan bij het verifiëren.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="card" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem', position: 'relative', zIndex: 1 }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#fff' }}>E-mail Verificatie</h1>
      </div>

      {status === 'loading' && (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>E-mailadres verifiëren...</p>
        </div>
      )}

      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ color: '#34d399', marginBottom: '0.5rem' }}>Geverifieerd!</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>{message}</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>
            Welkom, <strong>{username}</strong>!
          </p>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link href="/login" className="btn btn-primary" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Naar Login
            </Link>
            <Link href="/instellingen" className="btn btn-secondary" style={{ textDecoration: 'none', textAlign: 'center' }}>
              Nieuwe verificatie sturen
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div></div>
      
      <Suspense fallback={<div style={{ color: '#fff' }}>Laden...</div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
