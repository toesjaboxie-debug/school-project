'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User { id: string; username: string; isAdmin: boolean; classId?: string; schoolId?: string; }
interface Schedule {
  id: string;
  day: string;
  period: number;
  subject: string;
  teacherName?: string;
  teacher?: { name: string } | null;
  roomName?: string;
  room?: { name: string } | null;
  isKeuzeles: boolean;
}
interface Teacher { id: string; name: string; }
interface Room { id: string; name: string; }
interface Class { id: string; name: string; }
interface Keuzeles { id: string; name: string; day: string; period: number; teacher?: { name: string } | null; room?: { name: string } | null; }
interface TimeSlot { id: string; period: number; startTime: string; endTime: string; }
interface Subject { id: string; name: string; displayName: string; icon?: string; color?: string; }

const dayNames = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const dayNamesShort = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'];
const schoolDays = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'];
const defaultPeriods = [
  { num: 1, start: '09:00', end: '09:45' },
  { num: 2, start: '09:45', end: '10:30' },
  // Pauze 15 min
  { num: 3, start: '10:45', end: '11:30' },
  { num: 4, start: '11:30', end: '12:15' },
  // Pauze 30 min
  { num: 5, start: '12:45', end: '13:30' },
  { num: 6, start: '13:30', end: '14:15' },
  // Pauze 15 min
  { num: 7, start: '14:30', end: '15:15' },
  { num: 8, start: '15:15', end: '16:00' },
];

const subjectColors: Record<string, string> = {
  'wiskunde': '#3b82f6', 'engels': '#10b981', 'nederlands': '#f59e0b',
  'geschiedenis': '#8b5cf6', 'aardrijkskunde': '#06b6d4', 'biologie': '#22c55e',
  'natuurkunde': '#ef4444', 'scheikunde': '#f97316', 'frans': '#ec4899',
  'duits': '#6366f1', 'economie': '#14b8a6', 'lo': '#84cc16', 'ckv': '#f472b6',
  'keuzeles': '#a855f7',
};

// Helper functions for week calculations
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekDates(weekOffset: number = 0): { date: Date; dayName: string; dayNum: number; monthName: string; isToday: boolean }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get Monday of current week
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
  monday.setDate(today.getDate() + diff + (weekOffset * 7));
  
  const days: { date: Date; dayName: string; dayNum: number; monthName: string; isToday: boolean }[] = [];
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  
  for (let i = 0; i < 5; i++) { // Monday to Friday
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    
    const isToday = date.toDateString() === today.toDateString();
    
    days.push({
      date,
      dayName: dayNamesShort[date.getDay()],
      dayNum: date.getDate(),
      monthName: months[date.getMonth()],
      isToday
    });
  }
  
  return days;
}

function formatDateRange(days: { date: Date; dayNum: number; monthName: string }[]): string {
  if (days.length === 0) return '';
  const first = days[0];
  const last = days[days.length - 1];
  const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  
  if (first.monthName === last.monthName) {
    return `${first.dayNum} - ${last.dayNum} ${months[first.date.getMonth()]}`;
  }
  return `${first.dayNum} ${months[first.date.getMonth()]} - ${last.dayNum} ${months[last.date.getMonth()]}`;
}

export default function RoosterPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [keuzelessen, setKeuzelessen] = useState<Keuzeles[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingSlots, setEditingSlots] = useState<{ period: number; startTime: string; endTime: string }[]>([]);

  // Admin add/edit modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLesson, setEditLesson] = useState<Schedule | null>(null);
  const [newLesson, setNewLesson] = useState({
    day: 'Maandag',
    period: 1,
    subject: '',
    teacherId: '',
    roomId: '',
    isKeuzeles: false
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { checkAuth(); }, []);

  // Get week dates based on offset
  const weekDates = getWeekDates(weekOffset);
  const weekNumber = getWeekNumber(new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000));
  const dateRange = formatDateRange(weekDates);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setSelectedClass(data.user.classId || '');
        fetchSchedule(data.user.classId);
        fetchTimeSlots(data.user.schoolId);
        if (data.user.isAdmin) {
          fetchTeachers();
          fetchRooms();
          fetchClasses();
          fetchSubjects();
        }
        fetchKeuzelessen();
      }
      else router.push('/login');
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  };

  const fetchSchedule = async (classId?: string) => {
    try {
      const url = classId
        ? `/api/schedule?classId=${classId}&week=${weekNumber}`
        : `/api/schedule?week=${weekNumber}`;
      const res = await fetch(url);
      const data = await res.json();
      setSchedule(data.schedule || []);
    } catch {}
  };

  const fetchTimeSlots = async (schoolId?: string) => {
    try {
      const url = schoolId ? `/api/timeslots?schoolId=${schoolId}` : '/api/timeslots';
      const res = await fetch(url);
      const data = await res.json();
      if (data.timeSlots && data.timeSlots.length > 0) {
        setTimeSlots(data.timeSlots);
      } else {
        // Use default periods
        setTimeSlots(defaultPeriods.map(p => ({ id: `default-${p.num}`, period: p.num, startTime: p.start, endTime: p.end })));
      }
    } catch {
      setTimeSlots(defaultPeriods.map(p => ({ id: `default-${p.num}`, period: p.num, startTime: p.start, endTime: p.end })));
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/admin/teachers');
      const data = await res.json();
      setTeachers(data.teachers || []);
    } catch {}
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/admin/rooms');
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch {}
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      const data = await res.json();
      setClasses(data.classes || []);
    } catch {}
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      setSubjects(data.subjects || []);
    } catch {}
  };

  const fetchKeuzelessen = async () => {
    try {
      const res = await fetch('/api/admin/keuzelessen');
      const data = await res.json();
      setKeuzelessen(data.keuzelessen || []);
    } catch {}
  };

  useEffect(() => {
    if (user) fetchSchedule(selectedClass);
  }, [weekOffset, selectedClass]);

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    router.push('/login');
  };

  const getSubjectColor = (subj: string, isKeuzeles?: boolean) => {
    if (isKeuzeles) return '#a855f7';
    return subjectColors[subj?.toLowerCase()] || '#6b7280';
  };

  const getLessonForSlot = (day: string, period: number) => {
    return schedule.find(s => s.day === day && s.period === period);
  };

  const getTimeForPeriod = (period: number) => {
    const slot = timeSlots.find(t => t.period === period);
    if (slot) return { start: slot.startTime, end: slot.endTime };
    const defaultP = defaultPeriods.find(p => p.num === period);
    return defaultP ? { start: defaultP.start, end: defaultP.end } : { start: '08:30', end: '09:20' };
  };

  const goToToday = () => {
    setWeekOffset(0);
  };

  const openTimeModal = () => {
    setEditingSlots(timeSlots.map(t => ({ period: t.period, startTime: t.startTime, endTime: t.endTime })));
    setShowTimeModal(true);
  };

  const handleSaveTimeSlots = async () => {
    if (!user?.schoolId) {
      alert('Geen school gekoppeld');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/timeslots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: user.schoolId, slots: editingSlots }),
      });

      if (res.ok) {
        const data = await res.json();
        setTimeSlots(data.timeSlots || editingSlots.map((s, i) => ({ id: `slot-${i}`, ...s })));
        setShowTimeModal(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Fout bij opslaan');
      }
    } catch (e: any) {
      alert('Fout: ' + e.message);
    }
    setSaving(false);
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.subject) return;

    setSaving(true);
    try {
      const time = getTimeForPeriod(newLesson.period);
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newLesson,
          classId: selectedClass || null,
          week: weekNumber,
          startTime: time.start,
          endTime: time.end,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewLesson({ day: 'Maandag', period: 1, subject: '', teacherId: '', roomId: '', isKeuzeles: false });
        fetchSchedule(selectedClass);
      } else {
        const data = await res.json();
        alert(data.error || 'Fout bij opslaan');
      }
    } catch (e: any) {
      alert('Fout: ' + e.message);
    }
    setSaving(false);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze les wilt verwijderen?')) return;

    try {
      const res = await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchSchedule(selectedClass);
      else {
        const data = await res.json();
        alert(data.error || 'Fout bij verwijderen');
      }
    } catch (e: any) {
      alert('Fout: ' + e.message);
    }
  };

  // Get sorted periods from timeSlots
  const sortedPeriods = [...timeSlots].sort((a, b) => a.period - b.period);

  if (loading) return <div className="page-container" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'white'}}><p>Laden...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: '/home', label: 'Home' },
    { href: '/cijfers', label: 'Cijfers' },
    { href: '/rooster', label: 'Rooster', active: true },
    { href: '/agenda', label: 'Agenda' },
    { href: '/chat', label: 'AI Chat' },
    { href: '/instellingen', label: 'Instellingen' },
    ...(user.isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <div className="page-container">
      <div className="page-bg"><div className="blob blob-1"></div><div className="blob blob-2"></div><div className="blob blob-3"></div></div>

      <header className="page-header">
        <div className="header-content">
          <div className="logo"><span className="logo-icon">📚</span><span className="logo-text">EduLearn AI</span></div>
          <div className="user-info">
            {user.isAdmin && <span className="admin-badge">🛡️ Admin</span>}
            <span className="user-name">{user.username}</span>
            <button onClick={handleLogout} className="btn btn-ghost">Uitloggen</button>
          </div>
        </div>
        <nav className="page-nav">
          {navItems.map(item => <Link key={item.href} href={item.href} className={`nav-link ${item.active ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>📅 Rooster</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{dateRange}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Class selector for admin */}
            {user.isAdmin && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input-field"
                style={{ minWidth: '150px' }}
              >
                <option value="">Allemaal</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            <button onClick={() => setWeekOffset(w => w - 1)} className="btn btn-secondary">◀</button>
            <span className="card" style={{ padding: '0.5rem 1.25rem', fontWeight: '600' }}>Week {weekNumber}</span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="btn btn-secondary">▶</button>
            <button onClick={goToToday} className="btn btn-primary" style={{ background: '#3b82f6' }}>📅 Vandaag</button>
            {user.isAdmin && (
              <>
                <button onClick={openTimeModal} className="btn btn-secondary">⏰ Tijden</button>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">+ Les Toevoegen</button>
              </>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.1)', width: '80px' }}>Uur</th>
                {weekDates.map((d, i) => (
                  <th key={i} style={{ 
                    padding: '1rem', 
                    textAlign: 'center', 
                    color: 'rgba(255,255,255,0.9)', 
                    fontSize: '0.9rem', 
                    fontWeight: '600', 
                    borderBottom: d.isToday ? '3px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                    background: d.isToday ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    borderRadius: d.isToday ? '8px 8px 0 0' : '0'
                  }}>
                    <div>{d.dayName}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '400', color: 'rgba(255,255,255,0.5)' }}>{d.dayNum} {d.monthName}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPeriods.map((p) => {
                const time = getTimeForPeriod(p.period);
                return (
                  <tr key={p.period}>
                    <td style={{ padding: '0.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', whiteSpace: 'pre-line', verticalAlign: 'middle', background: 'rgba(255,255,255,0.03)' }}>
                      {p.period}e<br/>{time.start}-{time.end}
                    </td>
                    {schoolDays.map((d, dayIndex) => {
                      const lesson = getLessonForSlot(d, p.period);
                      const isToday = weekDates[dayIndex]?.isToday;
                      return (
                        <td key={d} style={{ 
                          padding: '0.25rem', 
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          background: isToday ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                          borderLeft: isToday ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
                          borderRight: isToday ? '2px solid rgba(59, 130, 246, 0.3)' : 'none',
                        }}>
                          {lesson ? (
                            <div
                              style={{
                                padding: '0.75rem',
                                background: getSubjectColor(lesson.subject, lesson.isKeuzeles) + '30',
                                borderLeft: `4px solid ${getSubjectColor(lesson.subject, lesson.isKeuzeles)}`,
                                borderRadius: '8px',
                                minHeight: '60px',
                                position: 'relative'
                              }}
                            >
                              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {lesson.isKeuzeles && '🎯 '}{lesson.subject}
                              </div>
                              {(lesson.teacher?.name || lesson.teacherName) && (
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                                  👨‍🏫 {lesson.teacher?.name || lesson.teacherName}
                                </div>
                              )}
                              {(lesson.room?.name || lesson.roomName) && (
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                                  📍 {lesson.room?.name || lesson.roomName}
                                </div>
                              )}
                              {user.isAdmin && (
                                <button
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                  style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: 'rgba(248,113,113,0.3)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    color: '#f87171'
                                  }}
                                >×</button>
                              )}
                            </div>
                          ) : (
                            <div style={{ minHeight: '60px' }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '2px' }}></span> Vandaag</span>
          <span>🎯 = Keuzeles</span>
          <span>👨‍🏫 = Docent</span>
          <span>📍 = Lokaal</span>
        </div>
      </main>

      {/* Add Lesson Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">➕ Les Toevoegen</h3>

            <form onSubmit={handleAddLesson}>
              <div className="form-group">
                <label className="form-label">Dag</label>
                <select value={newLesson.day} onChange={e => setNewLesson({...newLesson, day: e.target.value})} className="input-field">
                  {schoolDays.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Uur</label>
                <select value={newLesson.period} onChange={e => setNewLesson({...newLesson, period: parseInt(e.target.value)})} className="input-field">
                  {sortedPeriods.map(p => {
                    const time = getTimeForPeriod(p.period);
                    return <option key={p.period} value={p.period}>{p.period}e uur ({time.start}-{time.end})</option>;
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Vak</label>
                <select 
                  value={newLesson.subject} 
                  onChange={e => setNewLesson({...newLesson, subject: e.target.value})} 
                  className="input-field"
                  required
                >
                  <option value="">Selecteer een vak</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.displayName}>{s.icon} {s.displayName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Docent</label>
                <select value={newLesson.teacherId} onChange={e => setNewLesson({...newLesson, teacherId: e.target.value})} className="input-field">
                  <option value="">Geen docent</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Lokaal</label>
                <select value={newLesson.roomId} onChange={e => setNewLesson({...newLesson, roomId: e.target.value})} className="input-field">
                  <option value="">Geen lokaal</option>
                  {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newLesson.isKeuzeles}
                    onChange={e => setNewLesson({...newLesson, isKeuzeles: e.target.checked})}
                  />
                  <span>Dit is een keuzeles</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Annuleren</button>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                  {saving ? 'Opslaan...' : 'Toevoegen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Time Slots Modal */}
      {showTimeModal && (
        <div className="modal-overlay" onClick={() => setShowTimeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 className="modal-title">⏰ Uren aanpassen</h3>
            <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>
              Pas de tijden aan voor elk uur. Deze instellingen gelden voor je hele school.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
              {editingSlots.sort((a, b) => a.period - b.period).map((slot, index) => (
                <div key={slot.period} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '50px', fontWeight: 600 }}>{slot.period}e uur</span>
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={e => {
                      const newSlots = [...editingSlots];
                      newSlots[index] = { ...newSlots[index], startTime: e.target.value };
                      setEditingSlots(newSlots);
                    }}
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>tot</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={e => {
                      const newSlots = [...editingSlots];
                      newSlots[index] = { ...newSlots[index], endTime: e.target.value };
                      setEditingSlots(newSlots);
                    }}
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setShowTimeModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Annuleren</button>
              <button type="button" onClick={handleSaveTimeSlots} disabled={saving} className="btn btn-primary" style={{ flex: 1 }}>
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
