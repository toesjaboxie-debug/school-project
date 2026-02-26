'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  
  // Username forgotten mode
  const [forgotUsernameMode, setForgotUsernameMode] = useState(false);
  const [searchPassword, setSearchPassword] = useState('');
  const [foundAccounts, setFoundAccounts] = useState<{ id: string; username: string }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  
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
    setError('');
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotEmail }), // Can be username or email
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

  // Search accounts by password
  const handleSearchAccounts = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setFoundAccounts([]);
    setSelectedAccount('');
    
    try {
      const res = await fetch('/api/auth/find-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: searchPassword }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.accounts) {
        setFoundAccounts(data.accounts);
        if (data.accounts.length === 0) {
          setError('Geen accounts gevonden met dit wachtwoord');
        }
      } else {
        setError(data.error || 'Zoekopdracht mislukt');
      }
    } catch (e: any) {
      setError('Er is een fout opgetreden');
    }
    setLoading(false);
  };

  // Login with found account
  const handleLoginFoundAccount = async () => {
    if (!selectedAccount) {
      setError('Selecteer een account');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: selectedAccount, password: searchPassword }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Login mislukt');
        setLoading(false);
        return;
      }
      
      if (data.require2FA) {
        setRequire2FA(true);
        setPendingUsername(selectedAccount);
        setPendingPassword(searchPassword);
        setLoading(false);
        return;
      }
      
      router.push('/home');
    } catch (e: any) {
      setError('Er is een fout opgetreden');
      setLoading(false);
    }
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
                  Als er een account bestaat met deze gebruikersnaam én een geregistreerd e-mailadres, heb je een reset link ontvangen.
                </p>
                <button onClick={() => { setForgotMode(false); setForgotSent(false); }} className="btn btn-secondary">
                  Terug naar login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="input-group">
                  <label className="input-label">👤 Gebruikersnaam of E-mail</label>
                  <input
                    type="text"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input-field"
                    placeholder="Voer je gebruikersnaam of e-mail in"
                    required
                  />
                </div>
                
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
                  💡 Je ontvangt een reset link op je geregistreerde e-mailadres
                </p>
                
                {error && <div className="error-message">{error}</div>}
                
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Laden...' : 'Verstuur reset link'}
                </button>
                
                <button type="button" onClick={() => { setForgotMode(false); setError(''); }} className="link-btn">
                  ← Terug naar login
                </button>
              </form>
            )}
          </div>
        ) : forgotUsernameMode ? (
          <div className="forgot-section">
            <h2 className="forgot-title">🔍 Gebruikersnaam vergeten?</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Voer je wachtwoord in om je account te zoeken
            </p>
            
            {foundAccounts.length === 0 ? (
              <form onSubmit={handleSearchAccounts} className="auth-form">
                <div className="input-group">
                  <label className="input-label">🔒 Wachtwoord</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={searchPassword}
                      onChange={(e) => setSearchPassword(e.target.value)}
                      className="input-field"
                      placeholder="Voer je wachtwoord in"
                      required
                      minLength={6}
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '5px',
                        color: 'rgba(255,255,255,0.6)'
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button type="submit" disabled={loading || searchPassword.length < 6} className="btn btn-primary">
                  {loading ? 'Zoeken...' : '🔍 Zoek account'}
                </button>
                
                <button type="button" onClick={() => { setForgotUsernameMode(false); setSearchPassword(''); setFoundAccounts([]); setError(''); }} className="link-btn">
                  ← Terug naar login
                </button>
              </form>
            ) : (
              <div className="auth-form">
                <p style={{ color: '#34d399', marginBottom: '1rem', textAlign: 'center' }}>
                  ✅ {foundAccounts.length} account(s) gevonden!
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {foundAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setSelectedAccount(account.username)}
                      className="input-field"
                      style={{
                        textAlign: 'left',
                        cursor: 'pointer',
                        background: selectedAccount === account.username ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)',
                        border: selectedAccount === account.username ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.2s'
                      }}
                    >
                      👤 {account.username}
                    </button>
                  ))}
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button 
                  type="button" 
                  onClick={handleLoginFoundAccount} 
                  disabled={loading || !selectedAccount} 
                  className="btn btn-primary"
                >
                  {loading ? 'Inloggen...' : `🚀 Inloggen als ${selectedAccount || '...'}`}
                </button>
                
                <button type="button" onClick={() => { setFoundAccounts([]); setSelectedAccount(''); }} className="link-btn">
                  ← Opnieuw zoeken
                </button>
                
                <button type="button" onClick={() => { setForgotUsernameMode(false); setSearchPassword(''); setFoundAccounts([]); setError(''); }} className="link-btn">
                  ← Terug naar login
                </button>
              </div>
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      placeholder="Voer je wachtwoord in"
                      required
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '5px',
                        color: 'rgba(255,255,255,0.6)'
                      }}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                
                {error && <div className="error-message">{error}</div>}
                
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Laden...' : '🚀 Inloggen'}
                </button>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setForgotMode(true)} className="link-btn">
                    Wachtwoord vergeten? 🔑
                  </button>
                  <button type="button" onClick={() => setForgotUsernameMode(true)} className="link-btn">
                    Gebruikersnaam vergeten? 🔍
                  </button>
                </div>
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
                  <div style={{ position: 'relative' }}>
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="input-field"
                      placeholder="Kies een wachtwoord (min. 6 tekens)"
                      required
                      minLength={6}
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.25rem',
                        padding: '5px',
                        color: 'rgba(255,255,255,0.6)'
                      }}
                    >
                      {regShowPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
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
