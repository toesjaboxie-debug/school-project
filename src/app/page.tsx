'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BookOpen, 
  MessageSquare, 
  Upload, 
  Trash2, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Send, 
  FileText, 
  Bot,
  Eye,
  Shield,
  Menu,
  Calendar,
  GraduationCap,
  Users,
  MessageCircle,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Settings,
  Pencil,
  Bug,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Default subjects
const DEFAULT_SUBJECTS = [
  { id: '1', name: 'wiskunde', displayName: 'Wiskunde', icon: '📐' },
  { id: '2', name: 'engels', displayName: 'Engels', icon: '🇬🇧' },
  { id: '3', name: 'nederlands', displayName: 'Nederlands', icon: '🇳🇱' },
  { id: '4', name: 'geschiedenis', displayName: 'Geschiedenis', icon: '📜' },
  { id: '5', name: 'aardrijkskunde', displayName: 'Aardrijkskunde', icon: '🌍' },
  { id: '6', name: 'biologie', displayName: 'Biologie', icon: '🧬' },
  { id: '7', name: 'natuurkunde', displayName: 'Natuurkunde', icon: '⚛️' },
  { id: '8', name: 'scheikunde', displayName: 'Scheikunde', icon: '🧪' },
  { id: '9', name: 'frans', displayName: 'Frans', icon: '🇫🇷' },
  { id: '10', name: 'duits', displayName: 'Duits', icon: '🇩🇪' },
  { id: '11', name: 'economie', displayName: 'Economie', icon: '📊' },
  { id: '12', name: 'algemeen', displayName: 'Algemeen', icon: '📚' },
];

interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface FileItem {
  id: string;
  title: string;
  description: string;
  content: string;
  fileUrl: string | null;
  subject: string;
  createdAt: string;
  author: { id: string; username: string; };
}

interface Grade {
  id: string;
  subject: string;
  testName: string;
  grade: number;
  maxGrade: number;
  date: string;
  comment: string | null;
}

interface AgendaItem {
  id: string;
  title: string;
  description: string | null;
  testDate: string;
  subject: string;
  type: string;
}

interface SupportMessage {
  id: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
  user?: { id: string; username: string; };
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  reporterName: string | null;
  createdAt: string;
  user?: { id: string; username: string; } | null;
}

interface UserItem {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  _count: { grades: number; supportMessages: number; };
}

interface ChatMessage { role: 'user' | 'assistant'; content: string; }

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<string>('materials');
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadSubject, setUploadSubject] = useState('algemeen');
  
  const [viewFileDialogOpen, setViewFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  const [grades, setGrades] = useState<Grade[]>([]);
  const [addGradeDialogOpen, setAddGradeDialogOpen] = useState(false);
  const [newGradeStudentId, setNewGradeStudentId] = useState('');
  const [newGradeSubject, setNewGradeSubject] = useState('algemeen');
  const [newGradeTestName, setNewGradeTestName] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');
  const [newGradeMaxValue, setNewGradeMaxValue] = useState('10');
  const [newGradeDate, setNewGradeDate] = useState('');
  const [newGradeComment, setNewGradeComment] = useState('');
  
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [addAgendaDialogOpen, setAgendaDialogOpen] = useState(false);
  const [newAgendaTitle, setNewAgendaTitle] = useState('');
  const [newAgendaDescription, setNewAgendaDescription] = useState('');
  const [newAgendaDate, setNewAgendaDate] = useState('');
  const [newAgendaTime, setNewAgendaTime] = useState('');
  const [newAgendaSubject, setNewAgendaSubject] = useState('algemeen');
  const [newAgendaType, setNewAgendaType] = useState('toets');
  
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [newSupportMessage, setNewSupportMessage] = useState('');
  const [newSupportType, setNewSupportType] = useState('suggestie');
  
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [bugReportDialogOpen, setBugReportDialogOpen] = useState(false);
  const [newBugTitle, setNewBugTitle] = useState('');
  const [newBugDescription, setNewBugDescription] = useState('');
  const [newBugPriority, setNewBugPriority] = useState('medium');
  const [newBugReporterName, setNewBugReporterName] = useState('');
  
  const [users, setUsers] = useState<UserItem[]>([]);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState('EduLearn AI');
  const [siteLogo, setSiteLogo] = useState('/logo.svg');
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const fetchData = async () => {
    try {
      const [filesRes, gradesRes, agendaRes, supportRes, subjectsRes, settingsRes] = await Promise.all([
        fetch('/api/files').catch(() => null),
        fetch('/api/grades').catch(() => null),
        fetch('/api/agenda').catch(() => null),
        fetch('/api/support').catch(() => null),
        fetch('/api/subjects').catch(() => null),
        fetch('/api/settings').catch(() => null),
      ]);
      
      if (filesRes?.ok) { const data = await filesRes.json(); setFiles(data.files || []); }
      if (gradesRes?.ok) { const data = await gradesRes.json(); setGrades(data.grades || []); }
      if (agendaRes?.ok) { const data = await agendaRes.json(); setAgenda(data.agenda || []); }
      if (supportRes?.ok) { const data = await supportRes.json(); setSupportMessages(data.messages || []); }
      if (subjectsRes?.ok) { const data = await subjectsRes.json(); if (data.subjects?.length) setSubjects(data.subjects); }
      if (settingsRes?.ok) { const data = await settingsRes.json(); if (data.settings) { setSiteName(data.settings.siteName || 'EduLearn AI'); setSiteLogo(data.settings.logo || '/logo.svg'); } }
      
      if (user?.isAdmin) {
        const [usersRes, bugsRes] = await Promise.all([
          fetch('/api/users').catch(() => null),
          fetch('/api/bugs').catch(() => null),
        ]);
        if (usersRes?.ok) { const data = await usersRes.json(); setUsers(data.users || []); }
        if (bugsRes?.ok) { const data = await bugsRes.json(); setBugReports(data.bugReports || []); }
      }
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Inloggen mislukt');
      setUser(data.user);
      setLoginUsername('');
      setLoginPassword('');
      toast({ title: 'Succes', description: 'Succesvol ingelogd!' });
    } catch (error) {
      toast({ title: 'Fout', description: error instanceof Error ? error.message : 'Inloggen mislukt', variant: 'destructive' });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: registerUsername, password: registerPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registreren mislukt');
      setUser(data.user);
      toast({ title: 'Succes', description: 'Account aangemaakt!' });
    } catch (error) {
      toast({ title: 'Fout', description: error instanceof Error ? error.message : 'Registreren mislukt', variant: 'destructive' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setFiles([]);
    setGrades([]);
    setAgenda([]);
    toast({ title: 'Succes', description: 'Uitgelogd!' });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: uploadTitle, description: uploadDescription, content: uploadContent, fileUrl: uploadFileUrl || null, subject: uploadSubject }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFiles([data.file, ...files]);
      setUploadTitle(''); setUploadDescription(''); setUploadContent(''); setUploadFileUrl('');
      setUploadDialogOpen(false);
      toast({ title: 'Succes', description: 'Geüpload!' });
    } catch (error) {
      toast({ title: 'Fout', description: 'Uploaden mislukt', variant: 'destructive' });
    }
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/files/${id}`, { method: 'DELETE' });
    setFiles(files.filter(f => f.id !== id));
    toast({ title: 'Succes', description: 'Verwijderd!' });
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Er ging iets mis.' }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Er ging iets mis.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/grades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: newGradeStudentId, subject: newGradeSubject, testName: newGradeTestName, grade: newGradeValue, maxGrade: newGradeMaxValue, date: newGradeDate, comment: newGradeComment || null }) });
      if (!res.ok) throw new Error('Fout');
      setAddGradeDialogOpen(false);
      fetchData();
      toast({ title: 'Succes', description: 'Cijfer toegevoegd!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleAddAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateTime = newAgendaTime ? `${newAgendaDate}T${newAgendaTime}` : newAgendaDate;
      const res = await fetch('/api/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newAgendaTitle, description: newAgendaDescription || null, testDate: dateTime, subject: newAgendaSubject, type: newAgendaType }) });
      if (!res.ok) throw new Error('Fout');
      setAgendaDialogOpen(false);
      fetchData();
      toast({ title: 'Succes', description: 'Toegevoegd!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' });
    setAgenda(agenda.filter(a => a.id !== id));
    toast({ title: 'Succes', description: 'Verwijderd!' });
  };

  const handleSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: newSupportMessage, type: newSupportType }) });
      setNewSupportMessage('');
      fetchData();
      toast({ title: 'Succes', description: 'Verstuurd!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleBug = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/bugs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newBugTitle, description: newBugDescription, priority: newBugPriority, reporterName: newBugReporterName || null }) });
      setBugReportDialogOpen(false);
      if (user?.isAdmin) fetchData();
      toast({ title: 'Succes', description: 'Bug gemeld!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleUpdateBug = async (id: string, status: string) => {
    await fetch('/api/bugs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    fetchData();
  };

  const handleDeleteBug = async (id: string) => {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/bugs?id=${id}`, { method: 'DELETE' });
    setBugReports(bugReports.filter(b => b.id !== id));
  };

  const getGradeColor = (g: number, m: number) => {
    const p = (g / m) * 100;
    return p >= 80 ? 'text-green-600 bg-green-50' : p >= 60 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
  };

  const getDays = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const getSubject = (n: string) => subjects.find(s => s.name === n) || { displayName: n, icon: '📚' };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><BookOpen className="h-12 w-12 animate-bounce text-primary" /></div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center flex-col gap-4"><p className="text-red-500">{error}</p><Button onClick={() => { setError(null); checkAuth(); }}>Opnieuw proberen</Button></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Toaster />
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary">{siteName}</h1>
            <p className="text-muted-foreground">Jouw AI-gestuurde leerplatform</p>
          </div>
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle className="text-center">Welkom</CardTitle></CardHeader>
            <CardContent>
              <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')}>
                <TabsList className="grid grid-cols-2 mb-4"><TabsTrigger value="login">Inloggen</TabsTrigger><TabsTrigger value="register">Registreren</TabsTrigger></TabsList>
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Input placeholder="Gebruikersnaam" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} required />
                    <Input type="password" placeholder="Wachtwoord" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    <Button type="submit" className="w-full">Inloggen</Button>
                  </form>
                </TabsContent>
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <Input placeholder="Gebruikersnaam" value={registerUsername} onChange={(e) => setRegisterUsername(e.target.value)} required minLength={3} />
                    <Input type="password" placeholder="Wachtwoord" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required minLength={6} />
                    <Button type="submit" className="w-full">Registreren</Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          <Dialog open={bugReportDialogOpen} onOpenChange={setBugReportDialogOpen}>
            <DialogTrigger asChild><Button variant="outline" className="mt-4"><Bug className="h-4 w-4 mr-2" />Bug Melden</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Bug Melden</DialogTitle></DialogHeader>
              <form onSubmit={handleBug} className="space-y-4">
                <Input placeholder="Titel" value={newBugTitle} onChange={(e) => setNewBugTitle(e.target.value)} required />
                <Textarea placeholder="Beschrijving" value={newBugDescription} onChange={(e) => setNewBugDescription(e.target.value)} required />
                <Input placeholder="Je naam (optioneel)" value={newBugReporterName} onChange={(e) => setNewBugReporterName(e.target.value)} />
                <Button type="submit" className="w-full">Versturen</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">{siteName}</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm">Welkom, {user.username}</span>
            {user.isAdmin && <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>}
            <Dialog open={bugReportDialogOpen} onOpenChange={setBugReportDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm"><Bug className="h-4 w-4 mr-2" />Bug</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Bug Melden</DialogTitle></DialogHeader>
                <form onSubmit={handleBug} className="space-y-4">
                  <Input placeholder="Titel" value={newBugTitle} onChange={(e) => setNewBugTitle(e.target.value)} required />
                  <Textarea placeholder="Beschrijving" value={newBugDescription} onChange={(e) => setNewBugDescription(e.target.value)} required />
                  <Button type="submit" className="w-full">Versturen</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" onClick={handleLogout}><LogOut className="h-4 w-4 mr-2" />Uitloggen</Button>
          </div>
        </div>
      </header>
      
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
          {['materials', 'grades', 'agenda', 'support', ...(user.isAdmin ? ['admin'] : [])].map(tab => (
            <Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab(tab)}>
              {tab === 'materials' && <FileText className="h-4 w-4 mr-2" />}
              {tab === 'grades' && <GraduationCap className="h-4 w-4 mr-2" />}
              {tab === 'agenda' && <Calendar className="h-4 w-4 mr-2" />}
              {tab === 'support' && <MessageCircle className="h-4 w-4 mr-2" />}
              {tab === 'admin' && <Users className="h-4 w-4 mr-2" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'materials' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between">
                <select className="border rounded px-3 py-2" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)}>
                  {subjects.map(s => <option key={s.id} value={s.name}>{s.icon} {s.displayName}</option>)}
                </select>
                {user.isAdmin && (
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild><Button><Upload className="h-4 w-4 mr-2" />Upload</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Upload Lesmateriaal</DialogTitle></DialogHeader>
                      <form onSubmit={handleUpload} className="space-y-4">
                        <Input placeholder="Titel" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} required />
                        <Input placeholder="Beschrijving" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} required />
                        <Textarea placeholder="Inhoud" value={uploadContent} onChange={(e) => setUploadContent(e.target.value)} required className="min-h-[150px]" />
                        <Input placeholder="URL (optioneel)" value={uploadFileUrl} onChange={(e) => setUploadFileUrl(e.target.value)} />
                        <select className="w-full border rounded px-3 py-2" value={uploadSubject} onChange={(e) => setUploadSubject(e.target.value)}>
                          {subjects.map(s => <option key={s.id} value={s.name}>{s.icon} {s.displayName}</option>)}
                        </select>
                        <Button type="submit">Uploaden</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              {files.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Geen materialen</CardContent></Card> : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {files.map(f => (
                    <Card key={f.id}>
                      <CardHeader><CardTitle>{f.title}</CardTitle><CardDescription>{f.description}</CardDescription></CardHeader>
                      <CardContent className="text-xs text-muted-foreground">{getSubject(f.subject).icon} {getSubject(f.subject).displayName} • {f.author.username}</CardContent>
                      <CardFooter className="gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setSelectedFile(f); setViewFileDialogOpen(true); }}><Eye className="h-4 w-4 mr-1" />Bekijken</Button>
                        {user.isAdmin && <Button size="sm" variant="destructive" onClick={() => handleDeleteFile(f.id)}><Trash2 className="h-4 w-4" /></Button>}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Card className="h-[500px] flex flex-col">
                <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI Assistent</CardTitle></CardHeader>
                <ScrollArea className="flex-1 p-4">
                  {chatMessages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                      <div className={`max-w-[80%] rounded px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-muted'}`}>{m.content}</div>
                    </div>
                  ))}
                  {chatLoading && <div className="text-center text-sm text-muted-foreground">...</div>}
                  <div ref={chatEndRef} />
                </ScrollArea>
                <div className="p-4 border-t">
                  <form onSubmit={handleChat} className="flex gap-2">
                    <Input placeholder="Vraag..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1" />
                    <Button type="submit" size="icon" disabled={chatLoading}><Send className="h-4 w-4" /></Button>
                  </form>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold"><GraduationCap className="h-5 w-5 inline mr-2" />Mijn Cijfers</h2>
              {user.isAdmin && (
                <Dialog open={addGradeDialogOpen} onOpenChange={setAddGradeDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Toevoegen</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Cijfer Toevoegen</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddGrade} className="space-y-4">
                      <select className="w-full border rounded px-3 py-2" value={newGradeStudentId} onChange={(e) => setNewGradeStudentId(e.target.value)} required>
                        <option value="">Selecteer leerling</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                      </select>
                      <select className="w-full border rounded px-3 py-2" value={newGradeSubject} onChange={(e) => setNewGradeSubject(e.target.value)}>
                        {subjects.map(s => <option key={s.id} value={s.name}>{s.icon} {s.displayName}</option>)}
                      </select>
                      <Input placeholder="Toetsnaam" value={newGradeTestName} onChange={(e) => setNewGradeTestName(e.target.value)} required />
                      <div className="grid grid-cols-2 gap-4">
                        <Input type="number" step="0.1" placeholder="Cijfer" value={newGradeValue} onChange={(e) => setNewGradeValue(e.target.value)} required />
                        <Input type="number" step="0.1" placeholder="Max" value={newGradeMaxValue} onChange={(e) => setNewGradeMaxValue(e.target.value)} />
                      </div>
                      <Input type="date" value={newGradeDate} onChange={(e) => setNewGradeDate(e.target.value)} />
                      <Input placeholder="Opmerking" value={newGradeComment} onChange={(e) => setNewGradeComment(e.target.value)} />
                      <Button type="submit">Toevoegen</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {grades.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Geen cijfers</CardContent></Card> : (
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>Vak</TableHead><TableHead>Toets</TableHead><TableHead className="text-center">Cijfer</TableHead><TableHead>Datum</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {grades.map(g => (
                      <TableRow key={g.id}>
                        <TableCell>{getSubject(g.subject).icon} {getSubject(g.subject).displayName}</TableCell>
                        <TableCell>{g.testName}</TableCell>
                        <TableCell className="text-center"><span className={`px-2 py-1 rounded font-bold ${getGradeColor(g.grade, g.maxGrade)}`}>{g.grade.toFixed(1)}/{g.maxGrade}</span></TableCell>
                        <TableCell>{new Date(g.date).toLocaleDateString('nl-NL')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'agenda' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold"><Calendar className="h-5 w-5 inline mr-2" />Agenda</h2>
              {user.isAdmin && (
                <Dialog open={addAgendaDialogOpen} onOpenChange={setAgendaDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Toevoegen</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Toevoegen</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddAgenda} className="space-y-4">
                      <Input placeholder="Titel" value={newAgendaTitle} onChange={(e) => setNewAgendaTitle(e.target.value)} required />
                      <Textarea placeholder="Beschrijving" value={newAgendaDescription} onChange={(e) => setNewAgendaDescription(e.target.value)} />
                      <select className="w-full border rounded px-3 py-2" value={newAgendaSubject} onChange={(e) => setNewAgendaSubject(e.target.value)}>
                        {subjects.map(s => <option key={s.id} value={s.name}>{s.icon} {s.displayName}</option>)}
                      </select>
                      <select className="w-full border rounded px-3 py-2" value={newAgendaType} onChange={(e) => setNewAgendaType(e.target.value)}>
                        <option value="toets">Toets</option>
                        <option value="examen">Examen</option>
                        <option value="opdracht">Opdracht</option>
                      </select>
                      <div className="grid grid-cols-2 gap-4">
                        <Input type="date" value={newAgendaDate} onChange={(e) => setNewAgendaDate(e.target.value)} required />
                        <Input type="time" value={newAgendaTime} onChange={(e) => setNewAgendaTime(e.target.value)} />
                      </div>
                      <Button type="submit">Toevoegen</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {agenda.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Geen agenda items</CardContent></Card> : (
              <div className="space-y-4">
                {agenda.map(a => {
                  const days = getDays(a.testDate);
                  return (
                    <Card key={a.id} className={days > 0 && days <= 3 ? 'border-orange-300 bg-orange-50' : ''}>
                      <CardContent className="py-4 flex justify-between items-start">
                        <div>
                          <div className="flex gap-2 mb-1"><Badge>{a.type}</Badge><Badge variant="outline">{getSubject(a.subject).icon} {getSubject(a.subject).displayName}</Badge></div>
                          <h3 className="font-semibold">{a.title}</h3>
                          <p className="text-sm text-muted-foreground">{a.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">{new Date(a.testDate).toLocaleString('nl-NL')}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${days > 0 && days <= 3 ? 'text-orange-600' : 'text-primary'}`}>{days > 0 ? days : days === 0 ? 'Vandaag' : 'Voorbij'}</div>
                          <div className="text-xs text-muted-foreground">{days > 0 ? 'dagen' : ''}</div>
                        </div>
                        {user.isAdmin && <Button variant="ghost" size="icon" className="ml-2 text-red-500" onClick={() => handleDeleteAgenda(a.id)}><Trash2 className="h-4 w-4" /></Button>}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-xl font-semibold"><MessageCircle className="h-5 w-5 inline mr-2" />Ondersteuning</h2>
            <Card>
              <CardHeader><CardTitle>Bericht Sturen</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSupport} className="space-y-4">
                  <select className="w-48 border rounded px-3 py-2" value={newSupportType} onChange={(e) => setNewSupportType(e.target.value)}>
                    <option value="suggestie">💡 Suggestie</option>
                    <option value="vraag">❓ Vraag</option>
                    <option value="probleem">🐛 Probleem</option>
                  </select>
                  <Textarea placeholder="Je bericht..." value={newSupportMessage} onChange={(e) => setNewSupportMessage(e.target.value)} required />
                  <Button type="submit">Versturen</Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{user.isAdmin ? 'Alle Berichten' : 'Jouw Berichten'}</CardTitle></CardHeader>
              <CardContent>
                {supportMessages.length === 0 ? <p className="text-center text-muted-foreground py-8">Geen berichten</p> : (
                  <div className="space-y-4">
                    {supportMessages.map(m => (
                      <div key={m.id} className="border rounded p-4">
                        <div className="flex justify-between mb-2">
                          <div className="flex gap-2">
                            <Badge variant="outline">{m.type}</Badge>
                            <Badge variant={m.status === 'pending' ? 'secondary' : m.status === 'resolved' ? 'default' : 'default'}>{m.status}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString('nl-NL')}</span>
                        </div>
                        <p className="text-sm">{m.message}</p>
                        {m.user && <p className="text-xs text-muted-foreground mt-2">Van: {m.user.username}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'admin' && user.isAdmin && (
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold"><Settings className="h-5 w-5 inline mr-2" />Admin Paneel</h2>
            
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Bug className="h-5 w-5" />Bug Reports {bugReports.filter(b => b.status === 'open').length > 0 && <Badge variant="destructive">{bugReports.filter(b => b.status === 'open').length}</Badge>}</CardTitle></CardHeader>
              <CardContent>
                {bugReports.length === 0 ? <p className="text-center text-muted-foreground py-8">Geen bugs</p> : (
                  <div className="space-y-4">
                    {bugReports.map(b => (
                      <div key={b.id} className="border rounded p-4">
                        <div className="flex justify-between mb-2">
                          <div className="flex gap-2">
                            <Badge variant={b.status === 'open' ? 'destructive' : b.status === 'resolved' ? 'default' : 'secondary'}>{b.status}</Badge>
                            <Badge variant={b.priority === 'high' ? 'destructive' : 'secondary'}>{b.priority}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleString('nl-NL')}</span>
                        </div>
                        <h4 className="font-semibold">{b.title}</h4>
                        <p className="text-sm text-muted-foreground">{b.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">Door: {b.user?.username || b.reporterName || 'Anoniem'}</p>
                        <div className="flex gap-2 mt-3">
                          {b.status === 'open' && <Button size="sm" variant="outline" onClick={() => handleUpdateBug(b.id, 'in_progress')}>In Behandeling</Button>}
                          {b.status === 'in_progress' && <Button size="sm" onClick={() => handleUpdateBug(b.id, 'resolved')}>Opgelost</Button>}
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteBug(b.id)}><Trash2 className="h-4 w-4 mr-1" />Verwijderen</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle><Users className="h-5 w-5 inline mr-2" />Gebruikers</CardTitle></CardHeader>
              <CardContent>
                {users.length === 0 ? <p className="text-center text-muted-foreground py-8">Geen gebruikers</p> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Gebruikersnaam</TableHead><TableHead>Rol</TableHead><TableHead className="text-center">Cijfers</TableHead><TableHead>Geregistreerd</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell>{u.username} {u.id === user.id && <Badge variant="outline" className="ml-2">Jij</Badge>}</TableCell>
                          <TableCell>{u.isAdmin ? <Badge>Admin</Badge> : <Badge variant="secondary">Leerling</Badge>}</TableCell>
                          <TableCell className="text-center">{u._count.grades}</TableCell>
                          <TableCell>{new Date(u.createdAt).toLocaleDateString('nl-NL')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{users.length}</div><p className="text-sm text-muted-foreground">Gebruikers</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{users.filter(u => !u.isAdmin).length}</div><p className="text-sm text-muted-foreground">Leerlingen</p></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-2xl font-bold">{bugReports.filter(b => b.status === 'open').length}</div><p className="text-sm text-muted-foreground">Open Bugs</p></CardContent></Card>
            </div>
          </div>
        )}
      </main>

      <Dialog open={viewFileDialogOpen} onOpenChange={setViewFileDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{selectedFile?.title}</DialogTitle><CardDescription>{selectedFile?.description}</CardDescription></DialogHeader>
          <pre className="whitespace-pre-wrap text-sm">{selectedFile?.content}</pre>
          <DialogFooter><Button variant="secondary" onClick={() => setViewFileDialogOpen(false)}>Sluiten</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
