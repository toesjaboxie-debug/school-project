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
  Upload, 
  Trash2, 
  LogOut, 
  Send, 
  FileText, 
  Bot,
  Eye,
  Shield,
  Calendar,
  GraduationCap,
  Users,
  MessageCircle,
  Plus,
  Settings,
  Bug,
  Clock,
  Edit,
  CheckCircle,
  X,
  Save,
  Sparkles,
  History,
  BookMarked
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

// Default subjects
const DEFAULT_SUBJECTS = [
  { id: '1', name: 'wiskunde', displayName: 'Wiskunde', icon: '📐', color: '#3B82F6' },
  { id: '2', name: 'engels', displayName: 'Engels', icon: '🇬🇧', color: '#10B981' },
  { id: '3', name: 'nederlands', displayName: 'Nederlands', icon: '🇳🇱', color: '#F59E0B' },
  { id: '4', name: 'geschiedenis', displayName: 'Geschiedenis', icon: '📜', color: '#8B5CF6' },
  { id: '5', name: 'aardrijkskunde', displayName: 'Aardrijkskunde', icon: '🌍', color: '#06B6D4' },
  { id: '6', name: 'biologie', displayName: 'Biologie', icon: '🧬', color: '#22C55E' },
  { id: '7', name: 'natuurkunde', displayName: 'Natuurkunde', icon: '⚛️', color: '#EF4444' },
  { id: '8', name: 'scheikunde', displayName: 'Scheikunde', icon: '🧪', color: '#F97316' },
  { id: '9', name: 'frans', displayName: 'Frans', icon: '🇫🇷', color: '#EC4899' },
  { id: '10', name: 'duits', displayName: 'Duits', icon: '🇩🇪', color: '#6366F1' },
  { id: '11', name: 'economie', displayName: 'Economie', icon: '📊', color: '#14B8A6' },
  { id: '12', name: 'algemeen', displayName: 'Algemeen', icon: '📚', color: '#6B7280' },
];

const DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const AI_MODELS: Record<string, string> = {
  'glm-4.5-air:free': 'GLM 4.5 Air',
  'kimi-k2-0905:free': 'Kimi K2',
  'minimax-m2:free': 'MiniMax M2',
  'gpt-oss-120b:free': 'GPT OSS 120B',
  'deepseek-r1-0528:free': 'DeepSeek R1',
  'devstral-2512:free': 'Devstral',
};

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
  isStudentAdded?: boolean;
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

interface ScheduleItem {
  id: string;
  day: string;
  period: number;
  subject: string;
  room: string | null;
  teacher: string | null;
  startTime: string;
  endTime: string;
}

interface Keuzeles {
  id: string;
  name: string;
  description: string | null;
  teacher: string | null;
  maxStudents: number;
  day: string | null;
  period: string | null;
  students?: { user: { id: string; username: string } }[];
  _count?: { students: number };
}

interface ChatHistoryItem {
  id: string;
  subject: string | null;
  model: string;
  messages: string;
  updatedAt: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [chatModel, setChatModel] = useState('glm-4.5-air:free');
  const [chatSubject, setChatSubject] = useState('algemeen');
  const [chatHistoryId, setChatHistoryId] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<ChatHistoryItem[]>([]);
  const [showChatHistory, setShowChatHistory] = useState(false);
  
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
  const [siteName, setSiteName] = useState('EduLearn AI');
  
  // Schedule state
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [addScheduleDialogOpen, setAddScheduleDialogOpen] = useState(false);
  const [editScheduleItem, setEditScheduleItem] = useState<ScheduleItem | null>(null);
  const [newScheduleDay, setNewScheduleDay] = useState('maandag');
  const [newSchedulePeriod, setNewSchedulePeriod] = useState(1);
  const [newScheduleSubject, setNewScheduleSubject] = useState('algemeen');
  const [newScheduleRoom, setNewScheduleRoom] = useState('');
  const [newScheduleTeacher, setNewScheduleTeacher] = useState('');
  const [newScheduleStartTime, setNewScheduleStartTime] = useState('08:30');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('09:20');
  
  // Keuzelessen state
  const [keuzelessen, setKeuzelessen] = useState<Keuzeles[]>([]);
  const [userKeuzelessen, setUserKeuzelessen] = useState<string[]>([]);
  const [addKeuzelesDialogOpen, setAddKeuzelesDialogOpen] = useState(false);
  const [newKeuzelesName, setNewKeuzelesName] = useState('');
  const [newKeuzelesDescription, setNewKeuzelesDescription] = useState('');
  const [newKeuzelesTeacher, setNewKeuzelesTeacher] = useState('');
  const [newKeuzelesMaxStudents, setNewKeuzelesMaxStudents] = useState('30');
  const [newKeuzelesDay, setNewKeuzelesDay] = useState('');
  const [newKeuzelesPeriod, setNewKeuzelesPeriod] = useState('');
  
  // Subject editing state
  const [editSubjectDialogOpen, setEditSubjectDialogOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<{id: string; name: string; displayName: string; icon: string; color: string} | null>(null);
  const [addSubjectDialogOpen, setAddSubjectDialogOpen] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDisplayName, setNewSubjectDisplayName] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('📚');
  
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
      const [filesRes, gradesRes, agendaRes, supportRes, subjectsRes, settingsRes, scheduleRes, keuzelessenRes, chatHistoryRes] = await Promise.all([
        fetch('/api/files').catch(() => null),
        fetch('/api/grades').catch(() => null),
        fetch('/api/agenda').catch(() => null),
        fetch('/api/support').catch(() => null),
        fetch('/api/subjects').catch(() => null),
        fetch('/api/settings').catch(() => null),
        fetch('/api/schedule').catch(() => null),
        fetch('/api/keuzelessen').catch(() => null),
        fetch('/api/chat-history').catch(() => null),
      ]);
      
      if (filesRes?.ok) { const data = await filesRes.json(); setFiles(data.files || []); }
      if (gradesRes?.ok) { const data = await gradesRes.json(); setGrades(data.grades || []); }
      if (agendaRes?.ok) { const data = await agendaRes.json(); setAgenda(data.agenda || []); }
      if (supportRes?.ok) { const data = await supportRes.json(); setSupportMessages(data.messages || []); }
      if (subjectsRes?.ok) { const data = await subjectsRes.json(); if (data.subjects?.length) setSubjects(data.subjects); }
      if (settingsRes?.ok) { const data = await settingsRes.json(); if (data.settings) { setSiteName(data.settings.siteName || 'EduLearn AI'); } }
      if (scheduleRes?.ok) { const data = await scheduleRes.json(); setSchedule(data.schedule || []); }
      if (keuzelessenRes?.ok) { const data = await keuzelessenRes.json(); setKeuzelessen(data.keuzelessen || []); setUserKeuzelessen(data.userKeuzelessen || []); }
      if (chatHistoryRes?.ok) { const data = await chatHistoryRes.json(); setChatHistories(data.histories || []); }
      
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
      const res = await fetch('/api/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          message: msg, 
          subject: chatSubject,
          model: chatModel,
          chatHistory: chatMessages,
          saveHistory: true,
          historyId: chatHistoryId
        }) 
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message || 'Er ging iets mis.' }]);
      if (data.historyId && !chatHistoryId) {
        setChatHistoryId(data.historyId);
      }
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Er ging iets mis.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const loadChatHistory = async (historyId: string) => {
    try {
      const res = await fetch(`/api/chat-history?id=${historyId}`);
      const data = await res.json();
      if (data.history) {
        const messages = JSON.parse(data.history.messages);
        setChatMessages(messages);
        setChatHistoryId(historyId);
        setChatSubject(data.history.subject || 'algemeen');
        setChatModel(data.history.model || 'glm-4.5-air:free');
        setShowChatHistory(false);
      }
    } catch {
      toast({ title: 'Fout', description: 'Kon geschiedenis niet laden', variant: 'destructive' });
    }
  };

  const deleteChatHistory = async (historyId: string) => {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/chat-history?id=${historyId}`, { method: 'DELETE' });
    setChatHistories(chatHistories.filter(h => h.id !== historyId));
    if (chatHistoryId === historyId) {
      setChatMessages([]);
      setChatHistoryId(null);
    }
    toast({ title: 'Succes', description: 'Verwijderd!' });
  };

  const startNewChat = () => {
    setChatMessages([]);
    setChatHistoryId(null);
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: Record<string, unknown> = {
        subject: newGradeSubject,
        testName: newGradeTestName,
        grade: newGradeValue,
        maxGrade: newGradeMaxValue,
        date: newGradeDate,
        comment: newGradeComment || null,
      };
      
      // Admin selects student, student adds for themselves
      if (user?.isAdmin && newGradeStudentId) {
        body.studentId = newGradeStudentId;
      }
      
      const res = await fetch('/api/grades', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      });
      if (!res.ok) throw new Error('Fout');
      setAddGradeDialogOpen(false);
      // Reset form
      setNewGradeTestName('');
      setNewGradeValue('');
      setNewGradeComment('');
      setNewGradeStudentId('');
      fetchData();
      toast({ title: 'Succes', description: 'Cijfer toegevoegd!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/grades?id=${id}`, { method: 'DELETE' });
    setGrades(grades.filter(g => g.id !== id));
    toast({ title: 'Succes', description: 'Cijfer verwijderd!' });
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

  // Schedule handlers
  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = editScheduleItem 
        ? { id: editScheduleItem.id, day: newScheduleDay, period: newSchedulePeriod, subject: newScheduleSubject, room: newScheduleRoom || null, teacher: newScheduleTeacher || null, startTime: newScheduleStartTime, endTime: newScheduleEndTime }
        : { day: newScheduleDay, period: newSchedulePeriod, subject: newScheduleSubject, room: newScheduleRoom || null, teacher: newScheduleTeacher || null, startTime: newScheduleStartTime, endTime: newScheduleEndTime };
      
      const res = await fetch('/api/schedule', {
        method: editScheduleItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Fout');
      setAddScheduleDialogOpen(false);
      setEditScheduleItem(null);
      fetchData();
      toast({ title: 'Succes', description: editScheduleItem ? 'Bijgewerkt!' : 'Toegevoegd!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' });
    setSchedule(schedule.filter(s => s.id !== id));
    toast({ title: 'Succes', description: 'Verwijderd!' });
  };

  const openEditSchedule = (item: ScheduleItem) => {
    setEditScheduleItem(item);
    setNewScheduleDay(item.day);
    setNewSchedulePeriod(item.period);
    setNewScheduleSubject(item.subject);
    setNewScheduleRoom(item.room || '');
    setNewScheduleTeacher(item.teacher || '');
    setNewScheduleStartTime(item.startTime);
    setNewScheduleEndTime(item.endTime);
    setAddScheduleDialogOpen(true);
  };

  // Keuzelessen handlers
  const handleAddKeuzeles = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/keuzelessen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeuzelesName,
          description: newKeuzelesDescription || null,
          teacher: newKeuzelesTeacher || null,
          maxStudents: parseInt(newKeuzelesMaxStudents) || 30,
          day: newKeuzelesDay || null,
          period: newKeuzelesPeriod || null,
        }),
      });
      if (!res.ok) throw new Error('Fout');
      setAddKeuzelesDialogOpen(false);
      setNewKeuzelesName('');
      setNewKeuzelesDescription('');
      setNewKeuzelesTeacher('');
      setNewKeuzelesMaxStudents('30');
      fetchData();
      toast({ title: 'Succes', description: 'Keuzeles toegevoegd!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleSelectKeuzeles = async (keuzelesId: string) => {
    try {
      const res = await fetch('/api/keuzelessen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectKeuzeles: keuzelesId }),
      });
      const data = await res.json();
      if (data.error) {
        toast({ title: 'Fout', description: data.error, variant: 'destructive' });
        return;
      }
      if (data.selected) {
        setUserKeuzelessen([...userKeuzelessen, keuzelesId]);
        toast({ title: 'Succes', description: 'Keuzeles geselecteerd!' });
      } else {
        setUserKeuzelessen(userKeuzelessen.filter(id => id !== keuzelesId));
        toast({ title: 'Succes', description: 'Keuzeles verwijderd!' });
      }
      fetchData();
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleDeleteKeuzeles = async (id: string) => {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/keuzelessen?id=${id}`, { method: 'DELETE' });
    setKeuzelessen(keuzelessen.filter(k => k.id !== id));
    toast({ title: 'Succes', description: 'Verwijderd!' });
  };

  // Subject handlers
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSubjectName,
          displayName: newSubjectDisplayName,
          icon: newSubjectIcon,
        }),
      });
      if (!res.ok) throw new Error('Fout');
      setAddSubjectDialogOpen(false);
      setNewSubjectName('');
      setNewSubjectDisplayName('');
      setNewSubjectIcon('📚');
      fetchData();
      toast({ title: 'Succes', description: 'Vak toegevoegd!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubject) return;
    try {
      const res = await fetch('/api/subjects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSubject),
      });
      if (!res.ok) throw new Error('Fout');
      setEditSubjectDialogOpen(false);
      setEditSubject(null);
      fetchData();
      toast({ title: 'Succes', description: 'Vak bijgewerkt!' });
    } catch {
      toast({ title: 'Fout', variant: 'destructive' });
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Verwijderen?')) return;
    await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' });
    setSubjects(subjects.filter(s => s.id !== id));
    toast({ title: 'Succes', description: 'Vak verwijderd!' });
  };

  const getGradeColor = (g: number, m: number) => {
    const p = (g / m) * 100;
    return p >= 80 ? 'text-green-600 bg-green-50' : p >= 60 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
  };

  const getDays = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

  const getSubject = (n: string) => subjects.find(s => s.name === n) || { displayName: n, icon: '📚' };

  const getScheduleForDayAndPeriod = (day: string, period: number) => {
    return schedule.find(s => s.day === day && s.period === period);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><BookOpen className="h-12 w-12 animate-bounce text-primary" /></div>;
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
          {['materials', 'grades', 'agenda', 'schedule', 'keuzelessen', 'support', ...(user.isAdmin ? ['admin'] : [])].map(tab => (
            <Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'} size="sm" onClick={() => setActiveTab(tab)}>
              {tab === 'materials' && <FileText className="h-4 w-4 mr-2" />}
              {tab === 'grades' && <GraduationCap className="h-4 w-4 mr-2" />}
              {tab === 'agenda' && <Calendar className="h-4 w-4 mr-2" />}
              {tab === 'schedule' && <Clock className="h-4 w-4 mr-2" />}
              {tab === 'keuzelessen' && <BookMarked className="h-4 w-4 mr-2" />}
              {tab === 'support' && <MessageCircle className="h-4 w-4 mr-2" />}
              {tab === 'admin' && <Users className="h-4 w-4 mr-2" />}
              {tab === 'materials' ? 'Lesmateriaal' : 
               tab === 'grades' ? 'Cijfers' : 
               tab === 'schedule' ? 'Rooster' :
               tab === 'keuzelessen' ? 'Keuzelessen' :
               tab.charAt(0).toUpperCase() + tab.slice(1)}
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
              {files.filter(f => f.subject === uploadSubject || uploadSubject === 'algemeen').length === 0 ? 
                <Card><CardContent className="py-12 text-center text-muted-foreground">Geen materialen</CardContent></Card> : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {files.filter(f => f.subject === uploadSubject || uploadSubject === 'algemeen').map(f => (
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
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI Assistent</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowChatHistory(!showChatHistory)}><History className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={startNewChat}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <div className="px-4 pb-2 space-y-2">
                  <div className="flex gap-2">
                    <select className="flex-1 border rounded px-2 py-1 text-sm" value={chatSubject} onChange={(e) => setChatSubject(e.target.value)}>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.icon} {s.displayName}</option>)}
                    </select>
                    <select className="flex-1 border rounded px-2 py-1 text-sm" value={chatModel} onChange={(e) => setChatModel(e.target.value)}>
                      {Object.entries(AI_MODELS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    AI scant bestanden voor {getSubject(chatSubject).displayName}
                  </p>
                </div>
                
                {showChatHistory ? (
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                      {chatHistories.length === 0 ? <p className="text-center text-muted-foreground text-sm">Geen geschiedenis</p> :
                        chatHistories.map(h => (
                          <div key={h.id} className={`border rounded p-2 cursor-pointer hover:bg-muted ${chatHistoryId === h.id ? 'bg-muted' : ''}`}>
                            <div className="flex justify-between items-start">
                              <div onClick={() => loadChatHistory(h.id)} className="flex-1">
                                <p className="font-medium text-sm">{h.subject ? getSubject(h.subject).displayName : 'Algemeen'}</p>
                                <p className="text-xs text-muted-foreground">{AI_MODELS[h.model] || h.model}</p>
                                <p className="text-xs text-muted-foreground">{new Date(h.updatedAt).toLocaleDateString('nl-NL')}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => deleteChatHistory(h.id)}><Trash2 className="h-3 w-3 text-red-500" /></Button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </ScrollArea>
                ) : (
                  <ScrollArea className="flex-1 p-4">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-2`}>
                        <div className={`max-w-[80%] rounded px-3 py-2 text-sm ${m.role === 'user' ? 'bg-primary text-white' : 'bg-muted'}`}>{m.content}</div>
                      </div>
                    ))}
                    {chatLoading && <div className="text-center text-sm text-muted-foreground">...</div>}
                    <div ref={chatEndRef} />
                  </ScrollArea>
                )}
                
                <div className="p-4 border-t">
                  <form onSubmit={handleChat} className="flex gap-2">
                    <Input placeholder="Stel een vraag over dit vak..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1" />
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
              <Dialog open={addGradeDialogOpen} onOpenChange={setAddGradeDialogOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Cijfer Toevoegen</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Cijfer Toevoegen</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddGrade} className="space-y-4">
                    {user.isAdmin && (
                      <select className="w-full border rounded px-3 py-2" value={newGradeStudentId} onChange={(e) => setNewGradeStudentId(e.target.value)}>
                        <option value="">Selecteer leerling (of laat leeg voor jezelf)</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                      </select>
                    )}
                    <select className="w-full border rounded px-3 py-2" value={newGradeSubject} onChange={(e) => setNewGradeSubject(e.target.value)}>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.icon} {s.displayName}</option>)}
                    </select>
                    <Input placeholder="Toetsnaam" value={newGradeTestName} onChange={(e) => setNewGradeTestName(e.target.value)} required />
                    <div className="grid grid-cols-2 gap-4">
                      <Input type="number" step="0.1" placeholder="Cijfer" value={newGradeValue} onChange={(e) => setNewGradeValue(e.target.value)} required />
                      <Input type="number" step="0.1" placeholder="Max" value={newGradeMaxValue} onChange={(e) => setNewGradeMaxValue(e.target.value)} />
                    </div>
                    <Input type="date" value={newGradeDate} onChange={(e) => setNewGradeDate(e.target.value)} />
                    <Input placeholder="Opmerking (optioneel)" value={newGradeComment} onChange={(e) => setNewGradeComment(e.target.value)} />
                    <Button type="submit">Toevoegen</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {grades.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Geen cijfers - Voeg je eerste cijfer toe!</CardContent></Card> : (
              <Card>
                <Table>
                  <TableHeader><TableRow><TableHead>Vak</TableHead><TableHead>Toets</TableHead><TableHead className="text-center">Cijfer</TableHead><TableHead>Datum</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {grades.map(g => (
                      <TableRow key={g.id}>
                        <TableCell>{getSubject(g.subject).icon} {getSubject(g.subject).displayName} {g.isStudentAdded && <Badge variant="outline" className="ml-1 text-xs">Zelf</Badge>}</TableCell>
                        <TableCell>{g.testName}</TableCell>
                        <TableCell className="text-center"><span className={`px-2 py-1 rounded font-bold ${getGradeColor(g.grade, g.maxGrade)}`}>{g.grade.toFixed(1)}/{g.maxGrade}</span></TableCell>
                        <TableCell>{new Date(g.date).toLocaleDateString('nl-NL')}</TableCell>
                        <TableCell>{(user.isAdmin || g.isStudentAdded) && <Button variant="ghost" size="sm" onClick={() => handleDeleteGrade(g.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>}</TableCell>
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

        {activeTab === 'schedule' && (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold"><Clock className="h-5 w-5 inline mr-2" />Rooster</h2>
              {user.isAdmin && (
                <Dialog open={addScheduleDialogOpen} onOpenChange={(open) => { setAddScheduleDialogOpen(open); if (!open) setEditScheduleItem(null); }}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Toevoegen</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>{editScheduleItem ? 'Bewerken' : 'Toevoegen'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddSchedule} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <select className="w-full border rounded px-3 py-2" value={newScheduleDay} onChange={(e) => setNewScheduleDay(e.target.value)}>
                          {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                        </select>
                        <select className="w-full border rounded px-3 py-2" value={newSchedulePeriod} onChange={(e) => setNewSchedulePeriod(parseInt(e.target.value))}>
                          {PERIODS.map(p => <option key={p} value={p}>{p}e uur</option>)}
                        </select>
                      </div>
                      <select className="w-full border rounded px-3 py-2" value={newScheduleSubject} onChange={(e) => setNewScheduleSubject(e.target.value)}>
                        {subjects.map(s => <option key={s.id} value={s.name}>{s.icon} {s.displayName}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Lokaal" value={newScheduleRoom} onChange={(e) => setNewScheduleRoom(e.target.value)} />
                        <Input placeholder="Docent" value={newScheduleTeacher} onChange={(e) => setNewScheduleTeacher(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Start</Label>
                          <Input type="time" value={newScheduleStartTime} onChange={(e) => setNewScheduleStartTime(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Einde</Label>
                          <Input type="time" value={newScheduleEndTime} onChange={(e) => setNewScheduleEndTime(e.target.value)} />
                        </div>
                      </div>
                      <Button type="submit">{editScheduleItem ? 'Bijwerken' : 'Toevoegen'}</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Uur</TableHead>
                      {DAYS.map(d => <TableHead key={d} className="text-center min-w-[120px]">{d.charAt(0).toUpperCase() + d.slice(1)}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERIODS.map(period => (
                      <TableRow key={period}>
                        <TableCell className="font-medium">{period}e</TableCell>
                        {DAYS.map(day => {
                          const item = getScheduleForDayAndPeriod(day, period);
                          return (
                            <TableCell key={`${day}-${period}`} className="text-center p-1">
                              {item ? (
                                <div className="bg-primary/10 rounded p-2 text-sm relative group">
                                  <p className="font-medium">{getSubject(item.subject).icon} {getSubject(item.subject).displayName}</p>
                                  {item.room && <p className="text-xs text-muted-foreground">{item.room}</p>}
                                  {item.teacher && <p className="text-xs text-muted-foreground">{item.teacher}</p>}
                                  {user.isAdmin && (
                                    <div className="absolute top-1 right-1 hidden group-hover:flex gap-1">
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditSchedule(item)}><Edit className="h-3 w-3" /></Button>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteSchedule(item.id)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-12"></div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'keuzelessen' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold"><BookMarked className="h-5 w-5 inline mr-2" />Keuzelessen</h2>
              {user.isAdmin && (
                <Dialog open={addKeuzelesDialogOpen} onOpenChange={setAddKeuzelesDialogOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Toevoegen</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Keuzeles Toevoegen</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddKeuzeles} className="space-y-4">
                      <Input placeholder="Naam" value={newKeuzelesName} onChange={(e) => setNewKeuzelesName(e.target.value)} required />
                      <Textarea placeholder="Beschrijving" value={newKeuzelesDescription} onChange={(e) => setNewKeuzelesDescription(e.target.value)} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Docent" value={newKeuzelesTeacher} onChange={(e) => setNewKeuzelesTeacher(e.target.value)} />
                        <Input type="number" placeholder="Max studenten" value={newKeuzelesMaxStudents} onChange={(e) => setNewKeuzelesMaxStudents(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Dag (optioneel)" value={newKeuzelesDay} onChange={(e) => setNewKeuzelesDay(e.target.value)} />
                        <Input placeholder="Tijd (optioneel)" value={newKeuzelesPeriod} onChange={(e) => setNewKeuzelesPeriod(e.target.value)} />
                      </div>
                      <Button type="submit">Toevoegen</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {keuzelessen.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Geen keuzelessen beschikbaar</CardContent></Card> : (
              <div className="grid md:grid-cols-2 gap-4">
                {keuzelessen.map(k => {
                  const isSelected = userKeuzelessen.includes(k.id);
                  const studentCount = k._count?.students || k.students?.length || 0;
                  const isFull = studentCount >= k.maxStudents;
                  return (
                    <Card key={k.id} className={isSelected ? 'border-primary bg-primary/5' : ''}>
                      <CardHeader>
                        <div className="flex justify-between">
                          <CardTitle>{k.name}</CardTitle>
                          {user.isAdmin && (
                            <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteKeuzeles(k.id)}><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </div>
                        <CardDescription>{k.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {k.teacher && <p className="text-sm"><strong>Docent:</strong> {k.teacher}</p>}
                        {(k.day || k.period) && <p className="text-sm"><strong>Wanneer:</strong> {k.day} {k.period}</p>}
                        <p className="text-sm"><strong>Deelnemers:</strong> {studentCount}/{k.maxStudents}</p>
                      </CardContent>
                      <CardFooter>
                        {!user.isAdmin ? (
                          <Button 
                            className="w-full" 
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => handleSelectKeuzeles(k.id)}
                            disabled={!isSelected && isFull}
                          >
                            {isSelected ? <><CheckCircle className="h-4 w-4 mr-2" />Geselecteerd</> : isFull ? 'Vol' : 'Selecteren'}
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {studentCount} leerlingen ingeschreven
                          </p>
                        )}
                      </CardFooter>
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
            
            {/* Vakken Beheer */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Vakken Beheren</CardTitle>
                  <Dialog open={addSubjectDialogOpen} onOpenChange={setAddSubjectDialogOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Vak Toevoegen</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Vak Toevoegen</DialogTitle></DialogHeader>
                      <form onSubmit={handleAddSubject} className="space-y-4">
                        <Input placeholder="Naam (bijv. wiskunde)" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} required />
                        <Input placeholder="Weergavenaam (bijv. Wiskunde)" value={newSubjectDisplayName} onChange={(e) => setNewSubjectDisplayName(e.target.value)} required />
                        <Input placeholder="Icon (bijv. 📐)" value={newSubjectIcon} onChange={(e) => setNewSubjectIcon(e.target.value)} />
                        <Button type="submit">Toevoegen</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {subjects.map(s => (
                    <div key={s.id} className="border rounded p-3 flex justify-between items-center group">
                      <span>{s.icon} {s.displayName}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditSubject(s); setEditSubjectDialogOpen(true); }}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteSubject(s.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Dialog open={editSubjectDialogOpen} onOpenChange={setEditSubjectDialogOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>Vak Bewerken</DialogTitle></DialogHeader>
                {editSubject && (
                  <form onSubmit={handleUpdateSubject} className="space-y-4">
                    <Input placeholder="Naam" value={editSubject.name} onChange={(e) => setEditSubject({...editSubject, name: e.target.value})} />
                    <Input placeholder="Weergavenaam" value={editSubject.displayName} onChange={(e) => setEditSubject({...editSubject, displayName: e.target.value})} />
                    <Input placeholder="Icon" value={editSubject.icon || ''} onChange={(e) => setEditSubject({...editSubject, icon: e.target.value})} />
                    <Button type="submit">Opslaan</Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>

            {/* Bug Reports */}
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

            {/* Gebruikers */}
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
          </div>
        )}
      </main>

      {/* File View Dialog */}
      <Dialog open={viewFileDialogOpen} onOpenChange={setViewFileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedFile?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">{selectedFile?.description}</p>
            <div className="bg-muted rounded p-4 whitespace-pre-wrap text-sm">{selectedFile?.content}</div>
            {selectedFile?.fileUrl && <a href={selectedFile.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Bekijk bestand</a>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
