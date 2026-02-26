'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface School { id: string; name: string; classes: { id: string; name: string }[]; }
interface Keuzeles { id: string; name: string; description: string; teacher: string; }

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [initError, setInitError] = useState('');
  
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [keuzelessen, setKeuzelessen] = useState<Keuzeles[]>([]);
  const [selectedKeuzelessen, setSelectedKeuzelessen] = useState<string[]>([]);
  const [grades, setGrades] = useState<{ subject: string; grade: string; testName: string }[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();
        
        if (!authData.user) {
          router.replace('/login');
          return;
        }
        
        if (authData.user.onboardingDone === true) {
          router.replace('/home');
          return;
        }
        
        try {
          const res = await fetch('/api/onboarding');
          const data = await res.json();
          setSchools(data.schools || []);
          setKeuzelessen(data.keuzelessen || []);
        } catch (e: any) {
          setInitError('Kon data niet laden: ' + e.message);
        }
      } catch (e: any) {
        setInitError('Auth check failed: ' + e.message);
      }
      setPageLoading(false);
    };
    
    init();
  }, [router]);

  const handleAddGrade = () => {
    setGrades([...grades, { subject: '', grade: '', testName: '' }]);
  };

  const handleGradeChange = (index: number, field: string, value: string) => {
    const newGrades = [...grades];
    newGrades[index] = { ...newGrades[index], [field]: value };
    setGrades(newGrades);
  };

  const handleRemoveGrade = (index: number) => {
    setGrades(grades.filter((_, i) => i !== index));
  };

  const handleKeuzelesToggle = (id: string) => {
    if (selectedKeuzelessen.includes(id)) {
      setSelectedKeuzelessen(selectedKeuzelessen.filter(k => k !== id));
    } else {
      setSelectedKeuzelessen([...selectedKeuzelessen, id]);
    }
  };

  const handleSkip = () => {
    if (step < 3) setStep(step + 1);
    else completeOnboarding();
  };

  const handleSkipAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      });
      if (res.ok) {
        router.replace('/home');
      } else {
        const data = await res.json();
        setError(data.error || 'Fout bij overslaan');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const completeOnboarding = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId: selectedSchool,
          classId: selectedClass,
          keuzelessen: selectedKeuzelessen,
          grades: grades.filter(g => g.subject && g.grade),
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        router.replace('/home');
      } else {
        setError(data.error || 'Er is iets misgegaan');
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  if (pageLoading) {
    return (
      <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
        <p style={{color:'#fff'}}>Laden...</p>
      </div>
    );
  }

  const selectedSchoolData = schools.find(s => s.id === selectedSchool);

  return (
    <div className="page-container">
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div></div>
      
      <main style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto', padding: '2rem', paddingTop: '4rem' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: '4px', background: s <= step ? '#fff' : 'rgba(255,255,255,0.2)', borderRadius: '2px' }} />
          ))}
        </div>

        {/* Skip All Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button onClick={handleSkipAll} disabled={loading} className="btn btn-ghost" style={{ fontSize: '0.85rem' }}>
            Overslaan en later doen →
          </button>
        </div>

        <div className="card" style={{ padding: '2rem' }}>
          {/* Init Error */}
          {initError && (
            <div className="badge badge-warning" style={{ marginBottom: '1rem', width: '100%', textAlign: 'left', padding: '1rem' }}>
              ⚠️ {initError}<br/>
              <span style={{fontSize:'0.75rem'}}>Je kunt doorgaan, maar sommige data mist mogelijk.</span>
            </div>
          )}

          {/* Error */}
          {error && <div className="badge badge-danger" style={{ marginBottom: '1rem', width: '100%', textAlign: 'center' }}>{error}</div>}

          {step === 1 && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welkom bij EduLearn! 🎓</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>Kies je school</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {schools.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                    <p>Geen scholen beschikbaar</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Ga verder zonder school</p>
                  </div>
                ) : (
                  schools.map(school => (
                    <button
                      key={school.id}
                      onClick={() => { setSelectedSchool(school.id); setSelectedClass(''); }}
                      className="card"
                      style={{ padding: '1rem', cursor: 'pointer', border: selectedSchool === school.id ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)', background: selectedSchool === school.id ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                    >
                      <div style={{ fontWeight: 600 }}>{school.name}</div>
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Kies je klas 📚</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>
                {selectedSchoolData?.name || 'Geen school geselecteerd'}
              </p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {selectedSchoolData?.classes && selectedSchoolData.classes.length > 0 ? (
                  selectedSchoolData.classes.map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClass(cls.id)}
                      style={{ 
                        padding: '0.75rem 1.5rem', 
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: selectedClass === cls.id ? '#fff' : 'rgba(255,255,255,0.1)', 
                        color: selectedClass === cls.id ? '#000' : '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      {cls.name}
                    </button>
                  ))
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>Geen klassen beschikbaar - ga verder zonder klas</p>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Je cijfers & keuzelessen 📊</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>Voeg je cijfers toe (optioneel)</p>
              
              <div style={{ marginBottom: '2rem' }}>
                {grades.map((grade, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <input type="text" placeholder="Vak" value={grade.subject} onChange={e => handleGradeChange(i, 'subject', e.target.value)} className="input-field" style={{ flex: '1', minWidth: '100px' }} />
                    <input type="text" placeholder="Toets" value={grade.testName} onChange={e => handleGradeChange(i, 'testName', e.target.value)} className="input-field" style={{ flex: '1', minWidth: '100px' }} />
                    <input type="number" placeholder="Cijfer" value={grade.grade} onChange={e => handleGradeChange(i, 'grade', e.target.value)} className="input-field" style={{ width: '80px' }} />
                    <button onClick={() => handleRemoveGrade(i)} className="btn btn-danger" style={{ padding: '0.75rem' }}>×</button>
                  </div>
                ))}
                <button onClick={handleAddGrade} className="btn btn-secondary" style={{ width: '100%' }}>+ Cijfer toevoegen</button>
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Keuzelessen</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {keuzelessen.length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.5)' }}>Geen keuzelessen beschikbaar</p>
                ) : (
                  keuzelessen.map(k => (
                    <label key={k.id} className="card" style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input type="checkbox" checked={selectedKeuzelessen.includes(k.id)} onChange={() => handleKeuzelesToggle(k.id)} style={{ width: '20px', height: '20px' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{k.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>{k.teacher}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
              
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  📧 <strong>Email verificatie</strong> en <strong>2FA</strong> kun je later instellen in Instellingen.
                </p>
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="btn btn-secondary" style={{ flex: 1 }}>← Terug</button>
            )}
            <button onClick={handleSkip} className="btn btn-ghost" style={{ flex: 1 }}>
              {step < 3 ? 'Overslaan →' : 'Overslaan'}
            </button>
            <button 
              onClick={step === 3 ? completeOnboarding : () => setStep(step + 1)} 
              disabled={loading}
              className="btn btn-primary" 
              style={{ flex: 1 }}
            >
              {loading ? 'Laden...' : step === 3 ? 'Afronden 🎉' : 'Volgende →'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
