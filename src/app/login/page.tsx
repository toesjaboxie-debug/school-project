'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  
  // 2FA state
  const [require2FA, setRequire2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [pendingUsername, setPendingUsername] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Login mislukt');
        setLoading(false);
        return;
      }
      
      // Check if 2FA is required
      if (data.require2FA) {
        setRequire2FA(true);
        setPendingUsername(username);
        setPendingPassword(password);
        setLoading(false);
        return;
      }
      
      router.push('/home');
    } catch (e: any) {
      setError('Er is een fout opgetreden');
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: pendingUsername, 
          password: pendingPassword,
          twoFactorCode 
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Ongeldige code');
        setLoading(false);
        return;
      }
      
      // Still require 2FA means wrong code
      if (data.require2FA) {
        setError('Ongeldige code, probeer opnieuw');
        setLoading(false);
        return;
      }
      
      router.push('/home');
    } catch (e: any) {
      setError('Er is een fout opgetreden');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regUsername, password: regPassword }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setRegError(data.error || 'Registreren mislukt');
        setLoading(false);
        return;
      }
      
      router.push('/home');
    } catch (e: any) {
      setRegError('Er is een fout opgetreden');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      
      if (res.ok) {
        setForgotSent(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Er is een fout opgetreden');
      }
    } catch (e: any) {
      setError('Er is een fout opgetreden');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-icon">📚</div>
          <h1 className="logo-title">EduLearn AI</h1>
          <p className="logo-subtitle">Jouw AI-gestuurde leerplatform</p>
        </div>

        {forgotMode ? (
          <div className="forgot-section">
            <h2 className="forgot-title">🔑 Wachtwoord vergeten?</h2>
            
            {forgotSent ? (
              <div className="forgot-success">
                <div className="success-icon">✉️</div>
                <p className="success-text">
                  Als er een account bestaat met dit email, heb je een reset link ontvangen.
                </p>
                <button onClick={() => { setForgotMode(false); setForgotSent(false); }} className="btn btn-secondary">
                  Terug naar login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="input-group">
                  <label className="input-label">Email adres</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input-field"
                    placeholder="Voer je email in"
                    required
                  />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Laden...' : 'Verstuur reset link'}
                </button>
                
                <button type="button" onClick={() => setForgotMode(false)} className="link-btn">
                  ← Terug naar login
                </button>
              </form>
            )}
          </div>
        ) : require2FA ? (
          <div className="twofa-section">
            <h2 className="twofa-title">🔐 Tweestapsverificatie</h2>
            <p className="twofa-subtitle">Voer de 6-cijferige code in uit je authenticator app</p>
            
            <form onSubmit={handle2FAVerify} className="auth-form">
              <div className="input-group">
                <label className="input-label">6-cijferige code</label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field"
                  placeholder="000000"
                  required
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button type="submit" disabled={loading || twoFactorCode.length !== 6} className="btn btn-primary">
                {loading ? 'Verifiëren...' : '✅ Verifiëren'}
              </button>
              
              <button type="button" onClick={() => { 
                setRequire2FA(false); 
                setTwoFactorCode(''); 
                setPendingUsername(''); 
                setPendingPassword(''); 
              }} className="link-btn">
                ← Terug naar login
              </button>
              
              <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem', textAlign: 'center' }}>
                💡 Je kunt ook een backup code gebruiken
              </p>
            </form>
          </div>
        ) : (
          <>
            <div className="tabs">
              <button onClick={() => setRegisterMode(false)} className={`tab ${!registerMode ? 'active' : ''}`}>
                Inloggen
              </button>
              <button onClick={() => setRegisterMode(true)} className={`tab ${registerMode ? 'active' : ''}`}>
                Registreren
              </button>
            </div>

            {!registerMode ? (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="input-group">
                  <label className="input-label">👤 Gebruikersnaam</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-field"
                    placeholder="Voer je gebruikersnaam in"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">🔒 Wachtwoord</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="Voer je wachtwoord in"
                    required
                  />
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Laden...' : '🚀 Inloggen'}
                </button>
                
                <button type="button" onClick={() => setForgotMode(true)} className="link-btn">
                  Wachtwoord vergeten? 🔑
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="auth-form">
                <div className="input-group">
                  <label className="input-label">👤 Gebruikersnaam</label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="input-field"
                    placeholder="Kies een gebruikersnaam"
                    required
                    minLength={3}
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">🔒 Wachtwoord</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="input-field"
                    placeholder="Kies een wachtwoord (min. 6 tekens)"
                    required
                    minLength={6}
                  />
                </div>
                
                {regError && <div className="error-message">{regError}</div>}
                
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Laden...' : '✨ Account aanmaken'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
