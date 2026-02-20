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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  author: {
    id: string;
    username: string;
  };
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
  user?: {
    id: string;
    username: string;
  };
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  reporterName: string | null;
  createdAt: string;
  user?: {
    id: string;
    username: string;
  } | null;
}

interface UserItem {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  _count: {
    grades: number;
    supportMessages: number;
  };
}

interface Subject {
  id: string;
  name: string;
  displayName: string;
  icon: string | null;
  color: string | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SiteSettings {
  logo?: string;
  siteName?: string;
}

// Default subjects - ALWAYS available as fallback
const DEFAULT_SUBJECTS: Subject[] = [
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

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'materials' | 'grades' | 'agenda' | 'support' | 'admin'>('materials');
  
  // Site settings - with defaults
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ logo: '/logo.svg', siteName: 'EduLearn AI' });
  
  // Auth form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  // Admin upload states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadFileUrl, setUploadFileUrl] = useState('');
  const [uploadSubject, setUploadSubject] = useState('algemeen');
  
  // File viewer states
  const [viewFileDialogOpen, setViewFileDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatSubject, setChatSubject] = useState<string>('');
  const [chatFileId, setChatFileId] = useState<string>('');
  const [chatAgendaId, setChatAgendaId] = useState<string>('');
  
  // Grades states
  const [grades, setGrades] = useState<Grade[]>([]);
  const [addGradeDialogOpen, setAddGradeDialogOpen] = useState(false);
  const [newGradeStudentId, setNewGradeStudentId] = useState('');
  const [newGradeSubject, setNewGradeSubject] = useState('');
  const [newGradeTestName, setNewGradeTestName] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');
  const [newGradeMaxValue, setNewGradeMaxValue] = useState('10');
  const [newGradeDate, setNewGradeDate] = useState('');
  const [newGradeComment, setNewGradeComment] = useState('');
  
  // Agenda states
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [addAgendaDialogOpen, setAddAgendaDialogOpen] = useState(false);
  const [newAgendaTitle, setNewAgendaTitle] = useState('');
  const [newAgendaDescription, setNewAgendaDescription] = useState('');
  const [newAgendaDate, setNewAgendaDate] = useState('');
  const [newAgendaTime, setNewAgendaTime] = useState('');
  const [newAgendaSubject, setNewAgendaSubject] = useState('');
  const [newAgendaType, setNewAgendaType] = useState('toets');
  
  // Support states
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [newSupportMessage, setNewSupportMessage] = useState('');
  const [newSupportType, setNewSupportType] = useState('suggestie');
  
  // Bug report states
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [bugReportDialogOpen, setBugReportDialogOpen] = useState(false);
  const [newBugTitle, setNewBugTitle] = useState('');
  const [newBugDescription, setNewBugDescription] = useState('');
  const [newBugPriority, setNewBugPriority] = useState('medium');
  const [newBugReporterName, setNewBugReporterName] = useState('');
  
  // Admin states
  const [users, setUsers] = useState<UserItem[]>([]);
  
  // Subject management states - always use default subjects as fallback
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDisplayName, setNewSubjectDisplayName] = useState('');
  const [newSubjectIcon, setNewSubjectIcon] = useState('📚');
  const [newSubjectColor, setNewSubjectColor] = useState('#6B7280');
  
  // Logo settings
  const [logoDialogOpen, setLogoDialogOpen] = useState(false);
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newSiteName, setNewSiteName] = useState('');
  
  // Material filter
  const [materialFilter, setMaterialFilter] = useState<string>('');
  
  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch data when user logs in
  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchGrades();
      fetchAgenda();
      fetchSupportMessages();
      fetchSubjects();
      fetchSiteSettings();
      if (user.isAdmin) {
        fetchUsers();
        fetchBugReports();
      }
    }
  }, [user]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      setFiles(data.files || []);
    } catch {
      // Silent fail
    }
  };

  const fetchGrades = async () => {
    try {
      const res = await fetch('/api/grades');
      const data = await res.json();
      setGrades(data.grades || []);
    } catch {
      // Silent fail
    }
  };

  const fetchAgenda = async () => {
    try {
      const res = await fetch('/api/agenda');
      const data = await res.json();
      setAgenda(data.agenda || []);
    } catch {
      // Silent fail
    }
  };

  const fetchSupportMessages = async () => {
    try {
      const res = await fetch('/api/support');
      const data = await res.json();
      setSupportMessages(data.messages || []);
    } catch {
      // Silent fail
    }
  };

  const fetchBugReports = async () => {
    try {
      const res = await fetch('/api/bugs');
      const data = await res.json();
      setBugReports(data.bugReports || []);
    } catch {
      // Silent fail
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      // Silent fail
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.subjects && data.subjects.length > 0) {
        setSubjects(data.subjects);
      } else {
        setSubjects(DEFAULT_SUBJECTS);
      }
    } catch {
      setSubjects(DEFAULT_SUBJECTS);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSiteSettings({
          logo: data.settings.logo || '/logo.svg',
          siteName: data.settings.siteName || 'EduLearn AI',
        });
      }
    } catch {
      // Use defaults
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
      
      if (!res.ok) {
        throw new Error(data.error || 'Inloggen mislukt');
      }
      
      setUser(data.user);
      setLoginUsername('');
      setLoginPassword('');
      toast({ title: 'Succes', description: 'Succesvol ingelogd!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Inloggen mislukt',
        variant: 'destructive',
      });
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
      
      if (!res.ok) {
        throw new Error(data.error || 'Registreren mislukt');
      }
      
      setUser(data.user);
      setRegisterUsername('');
      setRegisterPassword('');
      toast({ title: 'Succes', description: 'Account succesvol aangemaakt!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Registreren mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setFiles([]);
      setChatMessages([]);
      setGrades([]);
      setAgenda([]);
      setSupportMessages([]);
      setUsers([]);
      setBugReports([]);
      toast({ title: 'Succes', description: 'Succesvol uitgelogd!' });
    } catch {
      toast({ title: 'Fout', description: 'Uitloggen mislukt', variant: 'destructive' });
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: uploadTitle,
          description: uploadDescription,
          content: uploadContent,
          fileUrl: uploadFileUrl || null,
          subject: uploadSubject,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Uploaden mislukt');
      
      setFiles([data.file, ...files]);
      setUploadTitle('');
      setUploadDescription('');
      setUploadContent('');
      setUploadFileUrl('');
      setUploadSubject('algemeen');
      setUploadDialogOpen(false);
      toast({ title: 'Succes', description: 'Bestand succesvol geüpload!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Uploaden mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Weet je zeker dat je dit bestand wilt verwijderen?')) return;
    
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Verwijderen mislukt');
      
      setFiles(files.filter(f => f.id !== fileId));
      toast({ title: 'Succes', description: 'Bestand succesvol verwijderd!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Verwijderen mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleViewFile = (file: FileItem) => {
    setSelectedFile(file);
    setViewFileDialogOpen(true);
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          subject: chatSubject || undefined,
          fileId: chatFileId || undefined,
          agendaId: chatAgendaId || undefined,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Chat mislukt');
      
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, er is een fout opgetreden. Probeer het opnieuw.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: newGradeStudentId,
          subject: newGradeSubject,
          testName: newGradeTestName,
          grade: newGradeValue,
          maxGrade: newGradeMaxValue,
          date: newGradeDate,
          comment: newGradeComment || null,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Cijfer toevoegen mislukt');
      
      setNewGradeStudentId('');
      setNewGradeSubject('');
      setNewGradeTestName('');
      setNewGradeValue('');
      setNewGradeMaxValue('10');
      setNewGradeDate('');
      setNewGradeComment('');
      setAddGradeDialogOpen(false);
      fetchGrades();
      toast({ title: 'Succes', description: 'Cijfer succesvol toegevoegd!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Cijfer toevoegen mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleAddAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateTime = newAgendaTime ? `${newAgendaDate}T${newAgendaTime}` : newAgendaDate;

      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newAgendaTitle,
          description: newAgendaDescription || null,
          testDate: dateTime,
          subject: newAgendaSubject,
          type: newAgendaType,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Agenda item toevoegen mislukt');
      
      setNewAgendaTitle('');
      setNewAgendaDescription('');
      setNewAgendaDate('');
      setNewAgendaTime('');
      setNewAgendaSubject('');
      setNewAgendaType('toets');
      setAddAgendaDialogOpen(false);
      fetchAgenda();
      toast({ title: 'Succes', description: 'Agenda item succesvol toegevoegd!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Agenda item toevoegen mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAgenda = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit agenda item wilt verwijderen?')) return;
    
    try {
      const res = await fetch(`/api/agenda?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Verwijderen mislukt');
      
      setAgenda(agenda.filter(a => a.id !== id));
      toast({ title: 'Succes', description: 'Agenda item succesvol verwijderd!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Verwijderen mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleSendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupportMessage.trim()) return;
    
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newSupportMessage,
          type: newSupportType,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Bericht versturen mislukt');
      
      setNewSupportMessage('');
      fetchSupportMessages();
      toast({ title: 'Succes', description: 'Bericht succesvol verstuurd!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Bericht versturen mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSupportStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Status bijwerken mislukt');
      
      fetchSupportMessages();
      toast({ title: 'Succes', description: 'Status succesvol bijgewerkt!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Status bijwerken mislukt',
        variant: 'destructive',
      });
    }
  };

  // Bug report handlers
  const handleSubmitBugReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBugTitle,
          description: newBugDescription,
          priority: newBugPriority,
          reporterName: newBugReporterName || null,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Bug report versturen mislukt');
      
      setNewBugTitle('');
      setNewBugDescription('');
      setNewBugPriority('medium');
      setNewBugReporterName('');
      setBugReportDialogOpen(false);
      
      if (user?.isAdmin) {
        fetchBugReports();
      }
      
      toast({ title: 'Succes', description: 'Bug report succesvol verstuurd! Bedankt voor je feedback.' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Bug report versturen mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateBugStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/bugs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Status bijwerken mislukt');
      
      fetchBugReports();
      toast({ title: 'Succes', description: 'Status succesvol bijgewerkt!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Status bijwerken mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBugReport = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze bug report wilt verwijderen?')) return;
    
    try {
      const res = await fetch(`/api/bugs?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Verwijderen mislukt');
      
      setBugReports(bugReports.filter(b => b.id !== id));
      toast({ title: 'Succes', description: 'Bug report succesvol verwijderd!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Verwijderen mislukt',
        variant: 'destructive',
      });
    }
  };

  // Subject management handlers
  const handleOpenSubjectDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setNewSubjectName(subject.name);
      setNewSubjectDisplayName(subject.displayName);
      setNewSubjectIcon(subject.icon || '📚');
      setNewSubjectColor(subject.color || '#6B7280');
    } else {
      setEditingSubject(null);
      setNewSubjectName('');
      setNewSubjectDisplayName('');
      setNewSubjectIcon('📚');
      setNewSubjectColor('#6B7280');
    }
    setSubjectDialogOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        const res = await fetch('/api/subjects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSubject.id,
            name: newSubjectName,
            displayName: newSubjectDisplayName,
            icon: newSubjectIcon,
            color: newSubjectColor,
          }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Vak bijwerken mislukt');
        
        toast({ title: 'Succes', description: 'Vak succesvol bijgewerkt!' });
      } else {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newSubjectName,
            displayName: newSubjectDisplayName,
            icon: newSubjectIcon,
            color: newSubjectColor,
          }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Vak aanmaken mislukt');
        
        toast({ title: 'Succes', description: 'Vak succesvol toegevoegd!' });
      }
      
      setSubjectDialogOpen(false);
      fetchSubjects();
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Actie mislukt',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Weet je zeker dat je dit vak wilt verwijderen?')) return;
    
    try {
      const res = await fetch(`/api/subjects?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Verwijderen mislukt');
      
      fetchSubjects();
      toast({ title: 'Succes', description: 'Vak succesvol verwijderd!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Verwijderen mislukt',
        variant: 'destructive',
      });
    }
  };

  // Logo settings handlers
  const handleOpenLogoDialog = () => {
    setNewLogoUrl(siteSettings.logo || '');
    setNewSiteName(siteSettings.siteName || '');
    setLogoDialogOpen(true);
  };

  const handleSaveLogo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (newLogoUrl) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'logo', value: newLogoUrl }),
        });
      }
      
      if (newSiteName) {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'siteName', value: newSiteName }),
        });
      }
      
      setSiteSettings({
        logo: newLogoUrl || siteSettings.logo,
        siteName: newSiteName || siteSettings.siteName,
      });
      setLogoDialogOpen(false);
      
      toast({ title: 'Succes', description: 'Instellingen succesvol opgeslagen!' });
    } catch (error) {
      toast({
        title: 'Fout',
        description: 'Opslaan mislukt',
        variant: 'destructive',
      });
    }
  };

  const getGradeColor = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 80) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />In afwachting</Badge>;
      case 'reviewed':
        return <Badge variant="default" className="gap-1"><AlertCircle className="h-3 w-3" />Bekeken</Badge>;
      case 'resolved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Opgelost</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getBugStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Open</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="gap-1 bg-yellow-500"><Clock className="h-3 w-3" />In Behandeling</Badge>;
      case 'resolved':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Opgelost</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Hoog</Badge>;
      case 'medium':
        return <Badge variant="secondary">Gemiddeld</Badge>;
      case 'low':
        return <Badge variant="outline">Laag</Badge>;
      default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };

  const getSubjectInfo = (subjectName: string) => {
    const found = subjects.find(s => s.name === subjectName);
    return found || { displayName: subjectName, icon: '📚' };
  };

  const filteredFiles = materialFilter 
    ? files.filter(f => f.subject === materialFilter)
    : files;

  const filteredAgendaForChat = chatSubject
    ? agenda.filter(a => a.subject === chatSubject)
    : agenda;

  const filteredFilesForChat = chatSubject
    ? files.filter(f => f.subject === chatSubject)
    : files;

  // Render safe subjects select
  const renderSubjectsSelect = (value: string, onChange: (v: string) => void, placeholder: string, includeAll?: boolean) => {
    const safeSubjects = subjects.length > 0 ? subjects : DEFAULT_SUBJECTS;
    
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeAll && <SelectItem value="">Alle vakken</SelectItem>}
          {safeSubjects.map((s) => (
            <SelectItem key={s.id} value={s.name}>
              {s.icon} {s.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <BookOpen className="h-12 w-12 text-primary animate-bounce" />
          <p className="text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show login/register
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Toaster />
        <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              {siteSettings.logo && (
                <img src={siteSettings.logo} alt="Logo" className="h-10 w-10 object-contain" />
              )}
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {siteSettings.siteName}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Jouw AI-gestuurde leerplatform
            </p>
          </div>
          
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-center">Welkom</CardTitle>
              <CardDescription className="text-center">
                Log in om toegang te krijgen tot studiematerialen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Inloggen</TabsTrigger>
                  <TabsTrigger value="register">Registreren</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Gebruikersnaam</Label>
                      <Input
                        id="login-username"
                        placeholder="Voer je gebruikersnaam in"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Wachtwoord</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Voer je wachtwoord in"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <LogIn className="h-4 w-4 mr-2" />
                      Inloggen
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Gebruikersnaam</Label>
                      <Input
                        id="register-username"
                        placeholder="Kies een gebruikersnaam"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        required
                        minLength={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Wachtwoord</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Kies een wachtwoord"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Account aanmaken
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Bug Report for non-users */}
          <div className="mt-6">
            <Dialog open={bugReportDialogOpen} onOpenChange={setBugReportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bug className="h-4 w-4 mr-2" />
                  Meld een Bug
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bug Melden</DialogTitle>
                  <DialogDescription>
                    Heb je een probleem gevonden? Laat het ons weten!
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmitBugReport} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bug-title">Titel</Label>
                    <Input
                      id="bug-title"
                      placeholder="Korte beschrijving van het probleem"
                      value={newBugTitle}
                      onChange={(e) => setNewBugTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bug-description">Beschrijving</Label>
                    <Textarea
                      id="bug-description"
                      placeholder="Beschrijf het probleem in detail..."
                      value={newBugDescription}
                      onChange={(e) => setNewBugDescription(e.target.value)}
                      required
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Prioriteit</Label>
                    <Select value={newBugPriority} onValueChange={setNewBugPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Laag</SelectItem>
                        <SelectItem value="medium">Gemiddeld</SelectItem>
                        <SelectItem value="high">Hoog</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bug-reporter">Je naam (optioneel)</Label>
                    <Input
                      id="bug-reporter"
                      placeholder="Je naam"
                      value={newBugReporterName}
                      onChange={(e) => setNewBugReporterName(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Versturen</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Registreer gratis om toegang te krijgen tot alle studiematerialen
          </p>
        </div>
      </div>
    );
  }

  // Authenticated - show main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {siteSettings.logo && (
                <img src={siteSettings.logo} alt="Logo" className="h-8 w-8 object-contain" />
              )}
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {siteSettings.siteName}
              </h1>
            </div>
            
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Welkom, {user.username}</span>
                {user.isAdmin && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              
              {/* Bug Report Button */}
              <Dialog open={bugReportDialogOpen} onOpenChange={setBugReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Bug className="h-4 w-4 mr-2" />
                    Bug Melden
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bug Melden</DialogTitle>
                    <DialogDescription>
                      Heb je een probleem gevonden? Laat het ons weten!
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitBugReport} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bug-title-logged">Titel</Label>
                      <Input
                        id="bug-title-logged"
                        placeholder="Korte beschrijving van het probleem"
                        value={newBugTitle}
                        onChange={(e) => setNewBugTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bug-description-logged">Beschrijving</Label>
                      <Textarea
                        id="bug-description-logged"
                        placeholder="Beschrijf het probleem in detail..."
                        value={newBugDescription}
                        onChange={(e) => setNewBugDescription(e.target.value)}
                        required
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prioriteit</Label>
                      <Select value={newBugPriority} onValueChange={setNewBugPriority}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Laag</SelectItem>
                          <SelectItem value="medium">Gemiddeld</SelectItem>
                          <SelectItem value="high">Hoog</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Versturen</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Uitloggen
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Mobile nav */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Welkom, {user.username}</span>
                {user.isAdmin && (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Admin
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => setBugReportDialogOpen(true)} className="w-full">
                <Bug className="h-4 w-4 mr-2" />
                Bug Melden
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Uitloggen
              </Button>
            </div>
          )}
        </div>
      </header>
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            <Button
              variant={activeTab === 'materials' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('materials')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Lesmaterialen
            </Button>
            <Button
              variant={activeTab === 'grades' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('grades')}
              className="gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Cijfers
            </Button>
            <Button
              variant={activeTab === 'agenda' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('agenda')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Agenda
            </Button>
            <Button
              variant={activeTab === 'support' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('support')}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Ondersteuning
            </Button>
            {user.isAdmin && (
              <Button
                variant={activeTab === 'admin' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('admin')}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Admin
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {/* Materials Tab */}
        {activeTab === 'materials' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Files Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filter and Admin controls */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                {renderSubjectsSelect(materialFilter, setMaterialFilter, "Filter op vak", true)}
                
                {user.isAdmin && (
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Lesmateriaal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Upload Lesmateriaal</DialogTitle>
                        <DialogDescription>
                          Voeg nieuw lesmateriaal toe voor studenten.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleUploadFile} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="upload-title">Titel</Label>
                          <Input
                            id="upload-title"
                            placeholder="bijv. Inleiding tot Breuken"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="upload-subject">Vak</Label>
                          {renderSubjectsSelect(uploadSubject, setUploadSubject, "Selecteer vak")}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="upload-description">Beschrijving</Label>
                          <Input
                            id="upload-description"
                            placeholder="Korte beschrijving van het materiaal"
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="upload-content">Inhoud</Label>
                          <Textarea
                            id="upload-content"
                            placeholder="Voer de inhoud van het lesmateriaal in..."
                            value={uploadContent}
                            onChange={(e) => setUploadContent(e.target.value)}
                            required
                            className="min-h-[200px]"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="upload-file-url">Bestandslink (optioneel)</Label>
                          <Input
                            id="upload-file-url"
                            type="url"
                            placeholder="https://voorbeeld.com/document.pdf"
                            value={uploadFileUrl}
                            onChange={(e) => setUploadFileUrl(e.target.value)}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="submit">Uploaden</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {/* Files list */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Lesmaterialen
                </h2>
                
                {filteredFiles.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Geen lesmaterialen beschikbaar.</p>
                      {user.isAdmin && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload je eerste materiaal met de knop hierboven.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {filteredFiles.map((file) => {
                      const subjectInfo = getSubjectInfo(file.subject);
                      return (
                        <Card key={file.id} className="group hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-lg line-clamp-1">{file.title}</CardTitle>
                              <Badge variant="outline" className="ml-2 shrink-0">
                                {subjectInfo.icon} {subjectInfo.displayName}
                              </Badge>
                            </div>
                            <CardDescription className="line-clamp-2">
                              {file.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pb-3">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Door {file.author.username}</span>
                              <span>•</span>
                              <span>{new Date(file.createdAt).toLocaleDateString('nl-NL')}</span>
                            </div>
                          </CardContent>
                          <CardFooter className="gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleViewFile(file)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Bekijken
                            </Button>
                            {file.fileUrl && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                asChild
                              >
                                <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                  Open Link
                                </a>
                              </Button>
                            )}
                            {user.isAdmin && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteFile(file.id)}
                                className="ml-auto"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            {/* Chat Section */}
            <div className="lg:col-span-1">
              <Card className="h-[700px] flex flex-col shadow-xl border-0">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">AI Studieassistent</CardTitle>
                  </div>
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground w-16">Vak:</Label>
                      {renderSubjectsSelect(chatSubject, (v) => { setChatSubject(v); setChatFileId(''); setChatAgendaId(''); }, "Alle vakken", true)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground w-16">Materiaal:</Label>
                      <Select value={chatFileId} onValueChange={setChatFileId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Alles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Alles</SelectItem>
                          {filteredFilesForChat.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground w-16">Toets:</Label>
                      <Select value={chatAgendaId} onValueChange={setChatAgendaId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Geen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Geen</SelectItem>
                          {filteredAgendaForChat.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.title} ({new Date(a.testDate).toLocaleDateString('nl-NL')})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full p-4">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Stel vragen over je studiematerialen!</p>
                        <p className="text-xs mt-1">Selecteer een vak, materiaal of toets voor specifieke hulp.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-4 py-2 text-sm">
                              <div className="flex gap-1">
                                <span className="animate-bounce">.</span>
                                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
                                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
                <div className="p-4 border-t">
                  <form onSubmit={handleChat} className="flex gap-2">
                    <Input
                      placeholder="Stel een vraag..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={chatLoading || !chatInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Grades Tab */}
        {activeTab === 'grades' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Mijn Cijfers
              </h2>
              {user.isAdmin && (
                <Dialog open={addGradeDialogOpen} onOpenChange={setAddGradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Cijfer Toevoegen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cijfer Toevoegen</DialogTitle>
                      <DialogDescription>
                        Voeg een cijfer toe voor een leerling.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddGrade} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Leerling</Label>
                        <Select value={newGradeStudentId} onValueChange={setNewGradeStudentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer leerling" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Vak</Label>
                        {renderSubjectsSelect(newGradeSubject, setNewGradeSubject, "Selecteer vak")}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grade-test">Toetsnaam</Label>
                        <Input
                          id="grade-test"
                          placeholder="bijv. Hoofdstuk 1 Toets"
                          value={newGradeTestName}
                          onChange={(e) => setNewGradeTestName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="grade-value">Cijfer</Label>
                          <Input
                            id="grade-value"
                            type="number"
                            step="0.1"
                            placeholder="8.5"
                            value={newGradeValue}
                            onChange={(e) => setNewGradeValue(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="grade-max">Maximum</Label>
                          <Input
                            id="grade-max"
                            type="number"
                            step="0.1"
                            value={newGradeMaxValue}
                            onChange={(e) => setNewGradeMaxValue(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grade-date">Datum</Label>
                        <Input
                          id="grade-date"
                          type="date"
                          value={newGradeDate}
                          onChange={(e) => setNewGradeDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grade-comment">Opmerking (optioneel)</Label>
                        <Input
                          id="grade-comment"
                          placeholder="Optionele opmerking"
                          value={newGradeComment}
                          onChange={(e) => setNewGradeComment(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit">Toevoegen</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {grades.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nog geen cijfers beschikbaar.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vak</TableHead>
                      <TableHead>Toets</TableHead>
                      <TableHead className="text-center">Cijfer</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Opmerking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {grades.map((grade) => {
                      const subjectInfo = getSubjectInfo(grade.subject);
                      return (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">
                            {subjectInfo.icon} {subjectInfo.displayName}
                          </TableCell>
                          <TableCell>{grade.testName}</TableCell>
                          <TableCell className="text-center">
                            <span className={`px-3 py-1 rounded-full font-bold ${getGradeColor(grade.grade, grade.maxGrade)}`}>
                              {grade.grade.toFixed(1)}/{grade.maxGrade.toFixed(0)}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(grade.date).toLocaleDateString('nl-NL')}</TableCell>
                          <TableCell className="text-muted-foreground">{grade.comment || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}

            {grades.length > 0 && (
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardContent className="py-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gemiddeld Cijfer</p>
                      <p className="text-3xl font-bold text-primary">
                        {(grades.reduce((sum, g) => sum + (g.grade / g.maxGrade) * 10, 0) / grades.length).toFixed(2)}
                        <span className="text-lg font-normal text-muted-foreground">/10</span>
                      </p>
                    </div>
                    <GraduationCap className="h-12 w-12 text-primary/30" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Agenda Tab */}
        {activeTab === 'agenda' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Agenda - Komende Toetsen
              </h2>
              {user.isAdmin && (
                <Dialog open={addAgendaDialogOpen} onOpenChange={setAddAgendaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Toevoegen
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agenda Item Toevoegen</DialogTitle>
                      <DialogDescription>
                        Voeg een nieuwe toets, examen of opdracht toe aan de agenda.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddAgenda} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="agenda-title">Titel</Label>
                        <Input
                          id="agenda-title"
                          placeholder="bijv. Wiskunde Toets Hoofdstuk 3"
                          value={newAgendaTitle}
                          onChange={(e) => setNewAgendaTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vak</Label>
                        {renderSubjectsSelect(newAgendaSubject, setNewAgendaSubject, "Selecteer vak")}
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={newAgendaType} onValueChange={setNewAgendaType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="toets">Toets</SelectItem>
                            <SelectItem value="examen">Examen</SelectItem>
                            <SelectItem value="opdracht">Opdracht</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="agenda-date">Datum</Label>
                          <Input
                            id="agenda-date"
                            type="date"
                            value={newAgendaDate}
                            onChange={(e) => setNewAgendaDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agenda-time">Tijd</Label>
                          <Input
                            id="agenda-time"
                            type="time"
                            value={newAgendaTime}
                            onChange={(e) => setNewAgendaTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agenda-description">Beschrijving (optioneel)</Label>
                        <Textarea
                          id="agenda-description"
                          placeholder="Extra details..."
                          value={newAgendaDescription}
                          onChange={(e) => setNewAgendaDescription(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="submit">Toevoegen</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {!user.isAdmin && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="py-4">
                  <p className="text-sm text-blue-700">
                    💡 Wil je een agenda item voorstellen? Gebruik het <strong>Ondersteuning</strong> tabblad om een suggestie naar de admin te sturen.
                  </p>
                </CardContent>
              </Card>
            )}

            {agenda.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Geen geplande toetsen.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {agenda.map((item) => {
                  const daysUntil = getDaysUntil(item.testDate);
                  const subjectInfo = getSubjectInfo(item.subject);
                  return (
                    <Card key={item.id} className={daysUntil <= 3 && daysUntil > 0 ? 'border-orange-300 bg-orange-50' : ''}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={item.type === 'examen' ? 'destructive' : 'default'}>
                                {item.type}
                              </Badge>
                              <Badge variant="outline">
                                {subjectInfo.icon} {subjectInfo.displayName}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-lg">{item.title}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {new Date(item.testDate).toLocaleDateString('nl-NL')}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {new Date(item.testDate).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${daysUntil <= 3 && daysUntil > 0 ? 'text-orange-600' : 'text-primary'}`}>
                              {daysUntil > 0 ? daysUntil : daysUntil === 0 ? 'Vandaag' : 'Voorbij'}
                            </div>
                            {daysUntil > 0 && (
                              <div className="text-xs text-muted-foreground">
                                dagen te gaan
                              </div>
                            )}
                          </div>
                          {user.isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-2 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteAgenda(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Ondersteuning & Suggesties
            </h2>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bericht Sturen</CardTitle>
                <CardDescription>
                  Stel een vraag, geef een suggestie voor agenda items, of meld een probleem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendSupportMessage} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newSupportType} onValueChange={setNewSupportType}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="suggestie">💡 Suggestie</SelectItem>
                        <SelectItem value="vraag">❓ Vraag</SelectItem>
                        <SelectItem value="probleem">🐛 Probleem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="support-message">Bericht</Label>
                    <Textarea
                      id="support-message"
                      placeholder="Typ je bericht hier..."
                      value={newSupportMessage}
                      onChange={(e) => setNewSupportMessage(e.target.value)}
                      required
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button type="submit" disabled={!newSupportMessage.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Verstuur Bericht
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {user.isAdmin ? 'Alle Berichten' : 'Jouw Berichten'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supportMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nog geen berichten.</p>
                ) : (
                  <div className="space-y-4">
                    {supportMessages.map((msg) => (
                      <div key={msg.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {msg.type === 'suggestie' && '💡'}
                              {msg.type === 'vraag' && '❓'}
                              {msg.type === 'probleem' && '🐛'}
                              {msg.type}
                            </Badge>
                            {getStatusBadge(msg.status)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleString('nl-NL')}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{msg.message}</p>
                        {msg.user && (
                          <p className="text-xs text-muted-foreground">Van: {msg.user.username}</p>
                        )}
                        {user.isAdmin && msg.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateSupportStatus(msg.id, 'reviewed')}
                            >
                              Markeer als Bekeken
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdateSupportStatus(msg.id, 'resolved')}
                            >
                              Markeer als Opgelost
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && user.isAdmin && (
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Admin Paneel
            </h2>

            {/* Bug Reports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Bug Reports
                  {bugReports.filter(b => b.status === 'open').length > 0 && (
                    <Badge variant="destructive">{bugReports.filter(b => b.status === 'open').length} Open</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Bekijk en beheer gemelde bugs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bugReports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Geen bug reports.</p>
                ) : (
                  <div className="space-y-4">
                    {bugReports.map((bug) => (
                      <div key={bug.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getBugStatusBadge(bug.status)}
                            {getPriorityBadge(bug.priority)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(bug.createdAt).toLocaleString('nl-NL')}
                          </span>
                        </div>
                        <h4 className="font-semibold">{bug.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{bug.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Gerapporteerd door: {bug.user?.username || bug.reporterName || 'Anoniem'}
                        </p>
                        <div className="flex gap-2 mt-3">
                          {bug.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateBugStatus(bug.id, 'in_progress')}
                            >
                              In Behandeling
                            </Button>
                          )}
                          {bug.status === 'in_progress' && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUpdateBugStatus(bug.id, 'resolved')}
                            >
                              Opgelost
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBugReport(bug.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Verwijderen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Site Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Site Instellingen
                </CardTitle>
                <CardDescription>
                  Pas het logo en de naam van de site aan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {siteSettings.logo && (
                    <img 
                      src={siteSettings.logo} 
                      alt="Huidig Logo" 
                      className="h-16 w-16 object-contain border rounded-lg p-2" 
                    />
                  )}
                  <div>
                    <p className="font-medium">{siteSettings.siteName}</p>
                    <p className="text-sm text-muted-foreground">Huidige site naam</p>
                  </div>
                  <Button variant="outline" onClick={handleOpenLogoDialog}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subject Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Vakken Beheer
                    </CardTitle>
                    <CardDescription>
                      Beheer de vakken die beschikbaar zijn in het systeem.
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => handleOpenSubjectDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Vak Toevoegen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <div 
                      key={subject.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      style={{ borderLeftColor: subject.color || '#6B7280', borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{subject.icon}</span>
                        <div>
                          <p className="font-medium">{subject.displayName}</p>
                          <p className="text-xs text-muted-foreground">{subject.name}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenSubjectDialog(subject)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Users */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Geregistreerde Gebruikers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Geen gebruikers gevonden.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Gebruikersnaam</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-center">Cijfers</TableHead>
                        <TableHead className="text-center">Berichten</TableHead>
                        <TableHead>Geregistreerd</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {u.username}
                              {u.id === user.id && (
                                <Badge variant="outline" className="text-xs">Jij</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {u.isAdmin ? (
                              <Badge className="gap-1">
                                <Shield className="h-3 w-3" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Leerling</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">{u._count.grades}</TableCell>
                          <TableCell className="text-center">{u._count.supportMessages}</TableCell>
                          <TableCell>{new Date(u.createdAt).toLocaleDateString('nl-NL')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{users.length}</p>
                      <p className="text-sm text-muted-foreground">Totaal Gebruikers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{users.filter(u => !u.isAdmin).length}</p>
                      <p className="text-sm text-muted-foreground">Leerlingen</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <MessageCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{supportMessages.filter(m => m.status === 'pending').length}</p>
                      <p className="text-sm text-muted-foreground">Openstaande Berichten</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Bug className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{bugReports.filter(b => b.status === 'open').length}</p>
                      <p className="text-sm text-muted-foreground">Open Bugs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      
      {/* File Viewer Dialog */}
      <Dialog open={viewFileDialogOpen} onOpenChange={setViewFileDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedFile?.title}</DialogTitle>
            <DialogDescription>
              {selectedFile && (
                <span className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {getSubjectInfo(selectedFile.subject).icon} {getSubjectInfo(selectedFile.subject).displayName}
                  </Badge>
                  <span>{selectedFile.description}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{selectedFile?.content}</p>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            {selectedFile?.fileUrl && (
              <Button variant="outline" asChild>
                <a href={selectedFile.fileUrl} target="_blank" rel="noopener noreferrer">
                  Open Externe Link
                </a>
              </Button>
            )}
            <Button variant="secondary" onClick={() => setViewFileDialogOpen(false)}>
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? 'Vak Bewerken' : 'Nieuw Vak'}</DialogTitle>
            <DialogDescription>
              {editingSubject ? 'Pas de gegevens van het vak aan.' : 'Voeg een nieuw vak toe aan het systeem.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveSubject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Systeem Naam</Label>
              <Input
                id="subject-name"
                placeholder="bijv. wiskunde"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">Gebruik kleine letters en koppeltekens</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-display">Weergavenaam</Label>
              <Input
                id="subject-display"
                placeholder="bijv. Wiskunde"
                value={newSubjectDisplayName}
                onChange={(e) => setNewSubjectDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-icon">Icoon (emoji)</Label>
              <Input
                id="subject-icon"
                placeholder="📐"
                value={newSubjectIcon}
                onChange={(e) => setNewSubjectIcon(e.target.value)}
                className="w-20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject-color">Kleur</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="subject-color"
                  type="color"
                  value={newSubjectColor}
                  onChange={(e) => setNewSubjectColor(e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={newSubjectColor}
                  onChange={(e) => setNewSubjectColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSubjectDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit">Opslaan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Logo Dialog */}
      <Dialog open={logoDialogOpen} onOpenChange={setLogoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Site Instellingen</DialogTitle>
            <DialogDescription>
              Pas het logo en de naam van de site aan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveLogo} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                placeholder="https://voorbeeld.com/logo.png"
                value={newLogoUrl}
                onChange={(e) => setNewLogoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Voer een URL in naar je logo afbeelding</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-name">Site Naam</Label>
              <Input
                id="site-name"
                placeholder="Mijn School"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
              />
            </div>
            {newLogoUrl && (
              <div className="flex justify-center p-4 border rounded-lg">
                <img src={newLogoUrl} alt="Logo Preview" className="h-16 w-16 object-contain" />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLogoDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit">Opslaan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
