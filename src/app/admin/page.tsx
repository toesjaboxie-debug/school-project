'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; }
interface School { id: string; name: string; code: string; isActive: boolean; classes: { id: string; name: string }[]; _count?: { users: number }; }
interface Class { id: string; name: string; year: number; school: { name: string }; _count?: { users: number }; }
interface Teacher { id: string; name: string; email: string | null; subjects: string | null; school: { name: string } | null; schoolId: string | null; }
interface Room { id: string; name: string; building: string | null; capacity: number; school: { name: string } | null; schoolId: string | null; }
interface Keuzeles { id: string; name: string; description: string; teacher: string; maxStudents: number; school: { name: string } | null; _count?: { students: number }; }
interface Subject { id: string; name: string; displayName: string; icon: string; color: string; }
interface Grade { id: string; subject: string; testName: string; grade: number; maxGrade: number; student: { username: string }; date: string; }
interface ChatHistory { id: string; subject: string; model: string; messages: string; createdAt: string; user: { username: string }; }
interface ErrorReport { id: string; errorType: string; errorMessage: string; details: string | null; status: string; createdAt: string; reporter: { username: string }; }
interface Material { id: string; title: string; subject: string; author: { username: string }; createdAt: string; }
interface ProRequest { id: string; status: string; amount: number; message: string; user: { username: string }; createdAt: string; }
interface PendingAgenda { id: string; title: string; subject: string; type: string; testDate: string; user: { username: string }; createdAt: string; }
interface PendingFile { id: string; title: string; subject: string; description: string; author: { username: string }; createdAt: string; }

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  
  // Data
  const [users, setUsers] = useState<any[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [keuzelessen, setKeuzelessen] = useState<Keuzeles[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [errorReports, setErrorReports] = useState<ErrorReport[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [proRequests, setProRequests] = useState<ProRequest[]>([]);
  const [pendingAgenda, setPendingAgenda] = useState<PendingAgenda[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  
  // Modals
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddKeuzeles, setShowAddKeuzeles] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [showEditUser, setShowEditUser] = useState<string | null>(null);
  const [showEditGrade, setShowEditGrade] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<ChatHistory | null>(null);
  
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassSchoolId, setNewClassSchoolId] = useState('');
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', subjects: '', schoolId: '' });
  const [newRoom, setNewRoom] = useState({ name: '', building: '', capacity: 30, schoolId: '' });
  const [newKeuzelesName, setNewKeuzelesName] = useState('');
  const [newKeuzelesTeacher, setNewKeuzelesTeacher] = useState('');
  const [newKeuzelesSchoolId, setNewKeuzelesSchoolId] = useState('');
  const [newSubject, setNewSubject] = useState({ name: '', displayName: '', icon: '📚', color: '#6B7280' });
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', content: '', subject: '', fileUrl: '' });
  
  const [error, setError] = useState('');
  const [exactError, setExactError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user?.isAdmin) { setUser(data.user); fetchAll(); }
      else router.push('/home');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchAll = () => {
    fetchUsers();
    fetchSchools();
    fetchClasses();
    fetchTeachers();
    fetchRooms();
    fetchKeuzelessen();
    fetchSubjects();
    fetchGrades();
    fetchChatHistories();
    fetchErrorReports();
    fetchMaterials();
    fetchProRequests();
    fetchPendingItems();
  };

  const fetchUsers = async () => {
    try { const res = await fetch('/api/admin/users'); const data = await res.json(); setUsers(data.users || []); } catch {}
  };
  const fetchSchools = async () => {
    try { const res = await fetch('/api/admin/schools'); const data = await res.json(); setSchools(data.schools || []); } catch {}
  };
  const fetchClasses = async () => {
    try { const res = await fetch('/api/admin/classes'); const data = await res.json(); setClasses(data.classes || []); } catch {}
  };
  const fetchTeachers = async () => {
    try { const res = await fetch('/api/admin/teachers'); const data = await res.json(); setTeachers(data.teachers || []); } catch {}
  };
  const fetchRooms = async () => {
    try { const res = await fetch('/api/admin/rooms'); const data = await res.json(); setRooms(data.rooms || []); } catch {}
  };
  const fetchKeuzelessen = async () => {
    try { const res = await fetch('/api/admin/keuzelessen'); const data = await res.json(); setKeuzelessen(data.keuzelessen || []); } catch {}
  };
  const fetchSubjects = async () => {
    try { const res = await fetch('/api/subjects'); const data = await res.json(); setSubjects(data.subjects || []); } catch {}
  };
  const fetchGrades = async () => {
    try { const res = await fetch('/api/grades'); const data = await res.json(); setGrades(data.grades || []); } catch {}
  };
  const fetchChatHistories = async () => {
    try { const res = await fetch('/api/admin/chat-history'); const data = await res.json(); setChatHistories(data.chats || []); } catch {}
  };
  const fetchErrorReports = async () => {
    try { const res = await fetch('/api/errors'); const data = await res.json(); setErrorReports(data.errors || []); } catch {}
  };
  const fetchMaterials = async () => {
    try { const res = await fetch('/api/files'); const data = await res.json(); setMaterials(data.files || []); } catch {}
  };
  const fetchAgenda = async () => {
    try { const res = await fetch('/api/agenda'); const data = await res.json(); } catch {}
  };
  const fetchProRequests = async () => {
    try { const res = await fetch('/api/admin/pro-requests'); const data = await res.json(); setProRequests(data.requests || []); } catch {}
  };
  const fetchPendingItems = async () => {
    try { const res = await fetch('/api/admin/approvals'); const data = await res.json(); setPendingAgenda(data.agenda || []); setPendingFiles(data.files || []); } catch {}
  };

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };

  // Schools
  const handleAddSchool = async () => {
    if (!newSchoolName) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/schools', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSchoolName }) });
      const data = await res.json();
      if (res.ok) { setNewSchoolName(''); setShowAddSchool(false); fetchSchools(); }
      else { setError(data.error || 'Fout'); setExactError(data.details || JSON.stringify(data)); }
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze school wilt verwijderen?')) return;
    await fetch(`/api/admin/schools?id=${id}`, { method: 'DELETE' });
    fetchSchools();
  };

  // Classes
  const handleAddClass = async () => {
    if (!newClassName || !newClassSchoolId) return;
    setSaving(true);
    await fetch('/api/admin/classes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newClassName, schoolId: newClassSchoolId }) });
    setNewClassName(''); setNewClassSchoolId(''); setShowAddClass(false); fetchClasses();
    setSaving(false);
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze klas wilt verwijderen?')) return;
    await fetch(`/api/admin/classes?id=${id}`, { method: 'DELETE' });
    fetchClasses();
  };

  // Teachers
  const handleAddTeacher = async () => {
    if (!newTeacher.name) return;
    setSaving(true);
    await fetch('/api/admin/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newTeacher.name,
        email: newTeacher.email || null,
        subjects: newTeacher.subjects || null,
        schoolId: newTeacher.schoolId || null
      })
    });
    setNewTeacher({ name: '', email: '', subjects: '', schoolId: '' });
    setShowAddTeacher(false);
    fetchTeachers();
    setSaving(false);
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze docent wilt verwijderen?')) return;
    await fetch(`/api/admin/teachers?id=${id}`, { method: 'DELETE' });
    fetchTeachers();
  };

  // Rooms
  const handleAddRoom = async () => {
    if (!newRoom.name) return;
    setSaving(true);
    await fetch('/api/admin/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoom.name,
        building: newRoom.building || null,
        capacity: newRoom.capacity || 30,
        schoolId: newRoom.schoolId || null
      })
    });
    setNewRoom({ name: '', building: '', capacity: 30, schoolId: '' });
    setShowAddRoom(false);
    fetchRooms();
    setSaving(false);
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit lokaal wilt verwijderen?')) return;
    await fetch(`/api/admin/rooms?id=${id}`, { method: 'DELETE' });
    fetchRooms();
  };

  // Keuzelessen
  const handleAddKeuzeles = async () => {
    if (!newKeuzelesName) return;
    setSaving(true);
    await fetch('/api/admin/keuzelessen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newKeuzelesName, teacher: newKeuzelesTeacher, schoolId: newKeuzelesSchoolId || null }) });
    setNewKeuzelesName(''); setNewKeuzelesTeacher(''); setNewKeuzelesSchoolId(''); setShowAddKeuzeles(false); fetchKeuzelessen();
    setSaving(false);
  };

  const handleDeleteKeuzeles = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze keuzeles wilt verwijderen?')) return;
    await fetch(`/api/admin/keuzelessen?id=${id}`, { method: 'DELETE' });
    fetchKeuzelessen();
  };

  // Subjects
  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.displayName) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newSubject) });
      const data = await res.json();
      if (res.ok) { setNewSubject({ name: '', displayName: '', icon: '📚', color: '#6B7280' }); setShowAddSubject(false); fetchSubjects(); }
      else { setError(data.error || 'Fout'); setExactError(JSON.stringify(data)); }
    } catch (e: any) { setError(e.message); }
    setSaving(false);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit vak wilt verwijderen?')) return;
    await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' });
    fetchSubjects();
  };

  // User management
  const handleTogglePro = async (userId: string, isPro: boolean) => {
    await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, isPro: !isPro }) });
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;
    await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
    fetchUsers();
  };

  const handleUpdateUser = async (userId: string, data: any) => {
    await fetch('/api/admin/users', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, ...data }) });
    setShowEditUser(null);
    fetchUsers();
  };

  // Grades
  const handleUpdateGrade = async (gradeId: string, data: any) => {
    await fetch('/api/grades', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gradeId, ...data }) });
    setShowEditGrade(null);
    fetchGrades();
  };

  const handleDeleteGrade = async (gradeId: string) => {
    if (!confirm('Weet je zeker dat je dit cijfer wilt verwijderen?')) return;
    await fetch(`/api/grades?id=${gradeId}`, { method: 'DELETE' });
    fetchGrades();
  };

  // Error Reports
  const handleResolveError = async (errorId: string, action: 'resolve' | 'ignore') => {
    await fetch('/api/errors', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ errorId, action }) });
    fetchErrorReports();
  };

  // Materials
  const handleAddMaterial = async () => {
    if (!newMaterial.title || !newMaterial.content) return;
    setSaving(true);
    try {
      const res = await fetch('/api/files', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newMaterial) });
      if (res.ok) { setNewMaterial({ title: '', description: '', content: '', subject: '', fileUrl: '' }); setShowAddMaterial(false); fetchMaterials(); }
    } catch {}
    setSaving(false);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit materiaal wilt verwijderen?')) return;
    await fetch(`/api/files/${id}`, { method: 'DELETE' });
    fetchMaterials();
  };

  // Pro Requests
  const handleProRequest = async (requestId: string, action: 'approve' | 'reject') => {
    await fetch('/api/admin/pro-requests', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId, action }) });
    fetchProRequests();
    fetchUsers();
  };

  // Approvals
  const handleApproval = async (type: 'agenda' | 'file', id: string, action: 'approve' | 'reject') => {
    await fetch('/api/admin/approvals', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, id, action }) });
    fetchPendingItems();
    if (type === 'agenda') fetchAgenda(); else fetchMaterials();
  };

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'white'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/cijfers', label: 'Cijfers' },
    { href: '/rooster', label: 'Rooster' },
    { href: '/chat', label: 'AI Chat' },
    { href: '/instellingen', label: 'Instellingen' },
    { href: '/admin', label: 'Admin', active: true },
  ];

  const tabs = [
    { id: 'approvals', label: '⏳ Goedkeuringen', count: pendingAgenda.length + pendingFiles.length },
    { id: 'users', label: '👥 Gebruikers', count: users.length },
    { id: 'schools', label: '🏫 Scholen', count: schools.length },
    { id: 'classes', label: '📚 Klassen', count: classes.length },
    { id: 'teachers', label: '👨‍🏫 Docenten', count: teachers.length },
    { id: 'rooms', label: '🚪 Lokalen', count: rooms.length },
    { id: 'subjects', label: '📖 Vakken', count: subjects.length },
    { id: 'grades', label: '📊 Cijfers', count: grades.length },
    { id: 'materials', label: '📄 Materiaal', count: materials.length },
    { id: 'keuzelessen', label: '📖 Keuzelessen', count: keuzelessen.length },
    { id: 'chats', label: '💬 Chatgeschiedenis', count: chatHistories.length },
    { id: 'errors', label: '⚠️ Fouten', count: errorReports.filter(e => e.status === 'open').length },
    { id: 'pro', label: '💰 Pro Aanvragen', count: proRequests.filter(r => r.status === 'pending').length },
  ];

  return (
    <div className="page-container">
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div></div>

      <header className="page-header">
        <div className="header-content">
          <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">EduLearn AI</span></div>
          <div className="user-info">
            <span className="admin-badge">🛡️ Admin</span>
            <span className="user-name">{user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost">Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1500px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>🛡️ Admin Panel</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>Beheer alle aspecten van EduLearn AI</p>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(248,113,113,0.1)', borderRadius: '12px', border: '1px solid rgba(248,113,113,0.3)' }}>
            <div style={{ color: '#f87171' }}>❌ {error}</div>
            {exactError && <pre style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#f87171', overflow: 'auto' }}>{exactError}</pre>}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`tab ${activeTab === tab.id ? 'active' : ''}`}>
              {tab.label} {tab.count > 0 && <span style={{ opacity: 0.6 }}>({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'approvals' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>⏳ Goedkeuringen ({pendingAgenda.length + pendingFiles.length})</h3>

            {pendingAgenda.length === 0 && pendingFiles.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '2rem' }}>Geen items die wachten op goedkeuring</p>
            ) : (
              <>
                {/* Pending Agenda Items */}
                {pendingAgenda.length > 0 && (
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ marginBottom: '0.75rem', color: '#fbbf24' }}>📅 Agenda Items ({pendingAgenda.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {pendingAgenda.map(item => (
                        <div key={item.id} className="settings-item" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{item.title}</div>
                            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                              {item.subject} • {item.type} • {new Date(item.testDate).toLocaleDateString('nl-NL')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                              Door {item.user.username} • {new Date(item.createdAt).toLocaleString('nl-NL')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleApproval('agenda', item.id, 'approve')} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem' }}>✅ Goedkeuren</button>
                            <button onClick={() => handleApproval('agenda', item.id, 'reject')} className="btn btn-danger" style={{ padding: '0.25rem 0.75rem' }}>🗑️ Afkeuren</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Files */}
                {pendingFiles.length > 0 && (
                  <div>
                    <h4 style={{ marginBottom: '0.75rem', color: '#fbbf24' }}>📄 Lesmateriaal ({pendingFiles.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {pendingFiles.map(file => (
                        <div key={file.id} className="settings-item" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{file.title}</div>
                            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                              {file.subject} • {file.description?.substring(0, 50)}...
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                              Door {file.author.username} • {new Date(file.createdAt).toLocaleString('nl-NL')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleApproval('file', file.id, 'approve')} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem' }}>✅ Goedkeuren</button>
                            <button onClick={() => handleApproval('file', file.id, 'reject')} className="btn btn-danger" style={{ padding: '0.25rem 0.75rem' }}>🗑️ Afkeuren</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>👥 Gebruikers ({users.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="glass-table">
                <thead><tr><th>Gebruiker</th><th>Email</th><th>School/Klas</th><th>Pro</th><th>Saldo</th><th>Acties</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div><strong>{u.username}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{u.isAdmin ? '🛡️ Admin' : '👨‍🎓 Leerling'}</div>
                      </td>
                      <td>{u.email || '-'}</td>
                      <td>{u.school?.name || '-'} {u.class?.name || ''}</td>
                      <td><button onClick={() => handleTogglePro(u.id, u.isPro)} className={`btn ${u.isPro ? 'btn-primary' : 'btn-secondary'}`} style={{padding:'0.25rem 0.5rem',fontSize:'0.75rem'}}>{u.isPro ? '⭐ Pro' : 'Gratis'}</button></td>
                      <td>€{(u.balance || 0).toFixed(2)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setShowEditUser(u.id)} className="btn btn-secondary" style={{padding:'0.25rem 0.5rem'}}>✏️</button>
                          {!u.isAdmin && <button onClick={() => handleDeleteUser(u.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Schools Tab */}
        {activeTab === 'schools' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3>🏫 Scholen ({schools.length})</h3>
              <button onClick={() => setShowAddSchool(true)} className="btn btn-primary">+ Toevoegen</button>
            </div>
            {showAddSchool && (
              <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
                <input value={newSchoolName} onChange={e => setNewSchoolName(e.target.value)} className="input-field" placeholder="School naam" />
                <button onClick={handleAddSchool} disabled={saving} className="btn btn-primary">{saving ? '...' : 'Opslaan'}</button>
                <button onClick={() => setShowAddSchool(false)} className="btn btn-secondary">Annuleren</button>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {schools.map(s => (
                <div key={s.id} className="settings-item">
                  <div><strong>{s.name}</strong> <span style={{color:'rgba(255,255,255,0.5)'}}>({s.classes?.length || 0} klassen, {s._count?.users || 0} leerlingen)</span></div>
                  <button onClick={() => handleDeleteSchool(s.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3>📚 Klassen ({classes.length})</h3>
              <button onClick={() => setShowAddClass(true)} className="btn btn-primary">+ Toevoegen</button>
            </div>
            {showAddClass && (
              <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                <select value={newClassSchoolId} onChange={e => setNewClassSchoolId(e.target.value)} className="input-field" style={{minWidth:'200px'}}><option value="">Selecteer school</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <input value={newClassName} onChange={e => setNewClassName(e.target.value)} className="input-field" placeholder="Klas naam (bijv. 1D)" />
                <button onClick={handleAddClass} disabled={saving} className="btn btn-primary">{saving ? '...' : 'Opslaan'}</button>
                <button onClick={() => setShowAddClass(false)} className="btn btn-secondary">Annuleren</button>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {classes.map(c => (
                <div key={c.id} className="settings-item">
                  <div><strong>{c.name}</strong> <span style={{color:'rgba(255,255,255,0.5)'}}>- {c.school?.name} ({c._count?.users || 0} leerlingen)</span></div>
                  <button onClick={() => handleDeleteClass(c.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === 'teachers' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3>👨‍🏫 Docenten ({teachers.length})</h3>
              <button onClick={() => setShowAddTeacher(true)} className="btn btn-primary">+ Toevoegen</button>
            </div>
            {showAddTeacher && (
              <div style={{marginBottom:'1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="input-field" placeholder="Naam docent" style={{ flex: 1, minWidth: '200px' }} />
                    <input value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} className="input-field" placeholder="Email (optioneel)" style={{ flex: 1, minWidth: '200px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input value={newTeacher.subjects} onChange={e => setNewTeacher({...newTeacher, subjects: e.target.value})} className="input-field" placeholder="Vakken (bijv. Wiskunde, Natuurkunde)" style={{ flex: 1, minWidth: '200px' }} />
                    <select value={newTeacher.schoolId} onChange={e => setNewTeacher({...newTeacher, schoolId: e.target.value})} className="input-field" style={{ minWidth: '200px' }}>
                      <option value="">Geen school</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleAddTeacher} disabled={saving} className="btn btn-primary">{saving ? '...' : 'Toevoegen'}</button>
                    <button onClick={() => setShowAddTeacher(false)} className="btn btn-secondary">Annuleren</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {teachers.map(t => (
                <div key={t.id} className="settings-item">
                  <div>
                    <strong>{t.name}</strong>
                    {t.email && <span style={{color:'rgba(255,255,255,0.5)', marginLeft: '0.5rem'}}>({t.email})</span>}
                    {t.subjects && <span style={{color:'rgba(255,255,255,0.4)', marginLeft: '0.5rem'}}>- {t.subjects}</span>}
                    {t.school && <span style={{color:'rgba(255,255,255,0.3)', marginLeft: '0.5rem'}}>[{t.school.name}]</span>}
                  </div>
                  <button onClick={() => handleDeleteTeacher(t.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3>🚪 Lokalen ({rooms.length})</h3>
              <button onClick={() => setShowAddRoom(true)} className="btn btn-primary">+ Toevoegen</button>
            </div>
            {showAddRoom && (
              <div style={{marginBottom:'1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <input value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} className="input-field" placeholder="Lokaal naam (bijv. A101)" style={{ flex: 1, minWidth: '150px' }} />
                    <input value={newRoom.building} onChange={e => setNewRoom({...newRoom, building: e.target.value})} className="input-field" placeholder="Gebouw (optioneel)" style={{ flex: 1, minWidth: '150px' }} />
                    <input type="number" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: parseInt(e.target.value) || 30})} className="input-field" placeholder="Capaciteit" style={{ width: '120px' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select value={newRoom.schoolId} onChange={e => setNewRoom({...newRoom, schoolId: e.target.value})} className="input-field" style={{ minWidth: '200px' }}>
                      <option value="">Geen school</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <button onClick={handleAddRoom} disabled={saving} className="btn btn-primary">{saving ? '...' : 'Toevoegen'}</button>
                    <button onClick={() => setShowAddRoom(false)} className="btn btn-secondary">Annuleren</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {rooms.map(r => (
                <div key={r.id} className="settings-item">
                  <div>
                    <strong>{r.name}</strong>
                    {r.building && <span style={{color:'rgba(255,255,255,0.5)', marginLeft: '0.5rem'}}>- {r.building}</span>}
                    <span style={{color:'rgba(255,255,255,0.4)', marginLeft: '0.5rem'}}>({r.capacity} plaatsen)</span>
                    {r.school && <span style={{color:'rgba(255,255,255,0.3)', marginLeft: '0.5rem'}}>[{r.school.name}]</span>}
                  </div>
                  <button onClick={() => handleDeleteRoom(r.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3>📖 Vakken ({subjects.length})</h3>
              <button onClick={() => setShowAddSubject(true)} className="btn btn-primary">+ Toevoegen</button>
            </div>
            {showAddSubject && (
              <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                <input value={newSubject.displayName} onChange={e => setNewSubject({...newSubject, displayName: e.target.value, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="input-field" placeholder="Vak naam (bijv. Wiskunde)" />
                <input value={newSubject.icon} onChange={e => setNewSubject({...newSubject, icon: e.target.value})} className="input-field" placeholder="📚" style={{width:'60px'}} />
                <input value={newSubject.color} onChange={e => setNewSubject({...newSubject, color: e.target.value})} className="input-field" placeholder="#6B7280" style={{width:'100px'}} />
                <button onClick={handleAddSubject} disabled={saving} className="btn btn-primary">{saving ? '...' : 'Opslaan'}</button>
                <button onClick={() => setShowAddSubject(false)} className="btn btn-secondary">Annuleren</button>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {subjects.map(s => (
                <div key={s.id} className="settings-item">
                  <div><span style={{marginRight:'0.5rem'}}>{s.icon}</span><strong>{s.displayName}</strong> <span style={{color:'rgba(255,255,255,0.5)'}}>({s.name})</span></div>
                  <button onClick={() => handleDeleteSubject(s.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grades Tab */}
        {activeTab === 'grades' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>📊 Cijfers ({grades.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="glass-table">
                <thead><tr><th>Leerling</th><th>Vak</th><th>Toets</th><th>Cijfer</th><th>Datum</th><th>Acties</th></tr></thead>
                <tbody>
                  {grades.slice(0, 50).map(g => (
                    <tr key={g.id}>
                      <td>{g.student?.username || '-'}</td>
                      <td>{g.subject}</td>
                      <td>{g.testName}</td>
                      <td><span style={{ color: g.grade >= 5.5 ? '#34d399' : '#f87171', fontWeight: 600 }}>{g.grade.toFixed(1)}/{g.maxGrade}</span></td>
                      <td>{new Date(g.date).toLocaleDateString('nl-NL')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => setShowEditGrade(g.id)} className="btn btn-secondary" style={{padding:'0.25rem 0.5rem'}}>✏️</button>
                          <button onClick={() => handleDeleteGrade(g.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3>📄 Lesmateriaal ({materials.length})</h3>
              <button onClick={() => setShowAddMaterial(true)} className="btn btn-primary">+ Toevoegen</button>
            </div>
            {showAddMaterial && (
              <div style={{marginBottom:'1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input value={newMaterial.title} onChange={e => setNewMaterial({...newMaterial, title: e.target.value})} className="input-field" placeholder="Titel" />
                  <input value={newMaterial.description} onChange={e => setNewMaterial({...newMaterial, description: e.target.value})} className="input-field" placeholder="Beschrijving" />
                  <input value={newMaterial.subject} onChange={e => setNewMaterial({...newMaterial, subject: e.target.value})} className="input-field" placeholder="Vak" />
                  <textarea value={newMaterial.content} onChange={e => setNewMaterial({...newMaterial, content: e.target.value})} className="input-field" rows={4} placeholder="Inhoud" />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleAddMaterial} disabled={saving} className="btn btn-primary">{saving ? '...' : 'Toevoegen'}</button>
                    <button onClick={() => setShowAddMaterial(false)} className="btn btn-secondary">Annuleren</button>
                  </div>
                </div>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {materials.map(m => (
                <div key={m.id} className="settings-item">
                  <div><strong>{m.title}</strong> <span style={{color:'rgba(255,255,255,0.5)'}}>- {m.subject} (door {m.author?.username})</span></div>
                  <button onClick={() => handleDeleteMaterial(m.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keuzelessen Tab */}
        {activeTab === 'keuzelessen' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
              <h3>📖 Keuzelessen ({keuzelessen.length})</h3>
              <button onClick={() => setShowAddKeuzeles(true)} className="btn btn-primary">+ Toevoegen</button>
            </div>
            {showAddKeuzeles && (
              <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
                <input value={newKeuzelesName} onChange={e => setNewKeuzelesName(e.target.value)} className="input-field" placeholder="Keuzeles naam" />
                <input value={newKeuzelesTeacher} onChange={e => setNewKeuzelesTeacher(e.target.value)} className="input-field" placeholder="Docent" />
                <select value={newKeuzelesSchoolId} onChange={e => setNewKeuzelesSchoolId(e.target.value)} className="input-field"><option value="">Alle scholen</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <button onClick={handleAddKeuzeles} disabled={saving} className="btn btn-primary">{saving ? '...' : 'Opslaan'}</button>
                <button onClick={() => setShowAddKeuzeles(false)} className="btn btn-secondary">Annuleren</button>
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
              {keuzelessen.map(k => (
                <div key={k.id} className="settings-item">
                  <div><strong>{k.name}</strong> <span style={{color:'rgba(255,255,255,0.5)'}}>- {k.teacher} ({k._count?.students || 0} inschrijvingen)</span></div>
                  <button onClick={() => handleDeleteKeuzeles(k.id)} className="btn btn-danger" style={{padding:'0.25rem 0.5rem'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat History Tab */}
        {activeTab === 'chats' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>💬 Chatgeschiedenis ({chatHistories.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {chatHistories.slice(0, 30).map(chat => (
                <div key={chat.id} className="settings-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedChat(chat)}>
                  <div>
                    <strong>{chat.user?.username || 'Onbekend'}</strong>
                    <span style={{color:'rgba(255,255,255,0.5)', marginLeft: '0.5rem'}}>- {chat.subject || 'Geen vak'}</span>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                      {chat.model} • {new Date(chat.createdAt).toLocaleString('nl-NL')}
                    </div>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>→</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Reports Tab */}
        {activeTab === 'errors' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>⚠️ Foutmeldingen ({errorReports.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {errorReports.map(err => (
                <div key={err.id} className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', background: err.status === 'open' ? 'rgba(248,113,113,0.1)' : 'rgba(52,211,153,0.1)', border: `1px solid ${err.status === 'open' ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                    <div>
                      <span className={`badge ${err.status === 'open' ? 'badge-danger' : 'badge-success'}`}>{err.status}</span>
                      <span style={{ marginLeft: '0.5rem', fontWeight: 600 }}>{err.errorType}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(err.createdAt).toLocaleString('nl-NL')}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>{err.errorMessage}</div>
                  {err.details && (
                    <pre style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', width: '100%', overflow: 'auto', maxHeight: '150px' }}>{err.details}</pre>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Door: {err.reporter?.username || 'Onbekend'}</span>
                    {err.status === 'open' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleResolveError(err.id, 'resolve')} className="btn btn-primary" style={{padding:'0.25rem 0.5rem',fontSize:'0.75rem'}}>✅ Oplossen</button>
                        <button onClick={() => handleResolveError(err.id, 'ignore')} className="btn btn-secondary" style={{padding:'0.25rem 0.5rem',fontSize:'0.75rem'}}> negeren</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pro Requests Tab */}
        {activeTab === 'pro' && (
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>💰 Pro/Saldo Aanvragen ({proRequests.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {proRequests.map(req => (
                <div key={req.id} className="settings-item" style={{ flexDirection: 'column', alignItems: 'flex-start', background: req.status === 'pending' ? 'rgba(251,191,36,0.1)' : req.status === 'approved' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
                    <div>
                      <span className={`badge ${req.status === 'pending' ? 'badge-warning' : req.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>{req.status}</span>
                      <strong style={{ marginLeft: '0.5rem' }}>{req.user?.username}</strong>
                    </div>
                    <span style={{ fontWeight: 600, color: '#fbbf24' }}>€{req.amount.toFixed(2)}</span>
                  </div>
                  {req.message && <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>{req.message}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{new Date(req.createdAt).toLocaleString('nl-NL')}</span>
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => handleProRequest(req.id, 'approve')} className="btn btn-primary" style={{padding:'0.25rem 0.5rem',fontSize:'0.75rem'}}>✅ Goedkeuren</button>
                        <button onClick={() => handleProRequest(req.id, 'reject')} className="btn btn-danger" style={{padding:'0.25rem 0.5rem',fontSize:'0.75rem'}}>❌ Afkeuren</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="modal-overlay" onClick={() => setShowEditUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">✏️ Gebruiker Bewerken</h3>
            {(() => {
              const u = users.find(x => x.id === showEditUser);
              if (!u) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div><strong>Gebruikersnaam:</strong> {u.username}</div>
                  <div><strong>Email:</strong> {u.email || '-'}</div>
                  <div className="form-group">
                    <label className="form-label">School</label>
                    <select id="edit-school" className="input-field" defaultValue={u.schoolId || ''}>
                      <option value="">Geen school</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Klas</label>
                    <select id="edit-class" className="input-field" defaultValue={u.classId || ''}>
                      <option value="">Geen klas</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.school?.name})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Saldo</label>
                    <input type="number" id="edit-balance" className="input-field" defaultValue={u.balance || 0} step="0.01" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={() => {
                      const schoolId = (document.getElementById('edit-school') as HTMLSelectElement).value;
                      const classId = (document.getElementById('edit-class') as HTMLSelectElement).value;
                      const balance = parseFloat((document.getElementById('edit-balance') as HTMLInputElement).value);
                      handleUpdateUser(showEditUser, { schoolId: schoolId || null, classId: classId || null, balance });
                    }} className="btn btn-primary">Opslaan</button>
                    <button onClick={() => setShowEditUser(null)} className="btn btn-secondary">Annuleren</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Chat Detail Modal */}
      {selectedChat && (
        <div className="modal-overlay" onClick={() => setSelectedChat(null)}>
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 className="modal-title">💬 Chat Details</h3>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                  {selectedChat.user?.username} • {selectedChat.subject || 'Geen vak'} • {selectedChat.model}
                </div>
              </div>
              <button onClick={() => setSelectedChat(null)} className="btn btn-ghost" style={{ fontSize: '1.5rem' }}>×</button>
            </div>
            <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', whiteSpace: 'pre-wrap', maxHeight: '400px', overflow: 'auto', fontSize: '0.8rem' }}>
              {(() => {
                try {
                  const msgs = JSON.parse(selectedChat.messages);
                  return msgs.map((m: any, i: number) => `[${m.role}]: ${m.content}`).join('\n\n');
                } catch { return selectedChat.messages; }
              })()}
            </pre>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {showEditGrade && (
        <div className="modal-overlay" onClick={() => setShowEditGrade(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">✏️ Cijfer Bewerken</h3>
            {(() => {
              const g = grades.find(x => x.id === showEditGrade);
              if (!g) return null;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div><strong>Leerling:</strong> {g.student?.username}</div>
                  <div><strong>Vak:</strong> {g.subject}</div>
                  <div className="form-group">
                    <label className="form-label">Toetsnaam</label>
                    <input type="text" id="edit-testname" className="input-field" defaultValue={g.testName} />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Cijfer</label>
                      <input type="number" id="edit-grade" className="input-field" defaultValue={g.grade} step="0.1" min="1" max="10" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Max</label>
                      <input type="number" id="edit-maxgrade" className="input-field" defaultValue={g.maxGrade} step="0.1" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <button onClick={() => {
                      const testName = (document.getElementById('edit-testname') as HTMLInputElement).value;
                      const grade = parseFloat((document.getElementById('edit-grade') as HTMLInputElement).value);
                      const maxGrade = parseFloat((document.getElementById('edit-maxgrade') as HTMLInputElement).value);
                      handleUpdateGrade(showEditGrade, { testName, grade, maxGrade });
                    }} className="btn btn-primary">Opslaan</button>
                    <button onClick={() => setShowEditGrade(null)} className="btn btn-secondary">Annuleren</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
