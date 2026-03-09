'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lock, AlertCircle, Loader2, Home, MessageSquare, Users, Settings, LogOut, 
  Plus, ThumbsUp, ThumbsDown, Trash2, Edit, Send, Mail, ChevronRight,
  Menu, X, Key, User, UserX, Crown, Search, Reply, Circle, CheckCircle, XCircle, Copy, Check
} from 'lucide-react';

// Tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Topic {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  creator: { name: string };
  subtopics: Subtopic[];
  _count: { subtopics: number; chatMessages: number };
}

interface Subtopic {
  id: string;
  name: string;
  createdAt: string;
  creator: { name: string; id: string };
  _count: { posts: number };
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
  likesCount: number;
  dislikesCount: number;
  userLike?: string;
  parentId?: string;
  repliesCount: number;
}

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string };
}

interface Message {
  id: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  accessKey: string;
  keyIsPrivate?: boolean;
  createdAt: string;
  lastActiveAt?: string;
  inviter?: { name: string };
}

interface SearchResult {
  type: 'topic' | 'subtopic' | 'post';
  id: string;
  title: string;
  description: string;
  link: string;
  topicId?: string;
  subtopicId?: string;
}

type View = 'login' | 'forum' | 'topic' | 'subtopic' | 'chat' | 'admin' | 'profile' | 'messages';

export default function ForumPage() {
  // Estados de autenticación
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [needsInit, setNeedsInit] = useState(false);
  
  // Estados de login
  const [accessKey, setAccessKey] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  
  // Estados de navegación
  const [view, setView] = useState<View>('forum');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Datos
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<Subtopic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Estados de formularios
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [newSubtopicName, setNewSubtopicName] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  
  // Estados de UI
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [showNewSubtopic, setShowNewSubtopic] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [newKeyGenerated, setNewKeyGenerated] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados de edición
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(null);
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicDesc, setEditTopicDesc] = useState('');
  const [editSubtopicName, setEditSubtopicName] = useState('');
  
  // Estados de respuestas
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Estados de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ topics: SearchResult[]; subtopics: SearchResult[]; posts: SearchResult[] } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  // Estados de mensajes
  const [messageTab, setMessageTab] = useState<'received' | 'sent'>('received');
  
  // Estado para mostrar clave de invitado
  const [invitedUserKey, setInvitedUserKey] = useState<{name: string; email: string; accessKey: string} | null>(null);
  const [copied, setCopied] = useState(false);
  
  const chatRef = useRef<HTMLDivElement>(null);

  // Funciones de datos
  const loadTopics = async () => {
    try {
      const res = await fetch('/api/topics');
      const data = await res.json();
      setTopics(data.topics || []);
    } catch (e) {
      console.error('Error loading topics:', e);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setMembers(data.users || []);
    } catch (e) {
      console.error('Error loading members:', e);
    }
  };

  const loadAllMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      setAllMembers(data.members || []);
    } catch (e) {
      console.error('Error loading all members:', e);
    }
  };

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setProfileName(data.user.name);
          setProfileEmail(data.user.email);
          loadTopics();
          loadAllMembers();
          if (data.user.role === 'admin') {
            loadMembers();
          }
        }
      }
    } catch (e) {
      console.error('Error checking session:', e);
    }
    setCheckingSession(false);
  };

  const checkInit = async () => {
    try {
      const res = await fetch('/api/init');
      const data = await res.json();
      setNeedsInit(!data.initialized);
    } catch (e) {
      console.error('Error checking init:', e);
    }
  };

  useEffect(() => {
    checkSession();
    checkInit();
  }, []);

  useEffect(() => {
    if (waitTime > 0) {
      const timer = setTimeout(() => setWaitTime(waitTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [waitTime]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleInit = async () => {
    if (!confirm('¿Desea inicializar el sistema? Se creará una cuenta de administrador.')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/init', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert(`¡Administrador creado!\n\nSu clave de acceso es: ${data.accessKey}\n\n¡GUARDE ESTA CLAVE EN UN LUGAR SEGURO!`);
        setNeedsInit(false);
      } else {
        alert(data.error || 'Error al inicializar');
      }
    } catch (e) {
      alert('Error de conexión');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (blocked || waitTime > 0) return;
    
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: accessKey.toUpperCase() })
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setProfileName(data.user.name);
        setProfileEmail(data.user.email);
        loadTopics();
        loadAllMembers();
        if (data.user.role === 'admin') {
          loadMembers();
        }
      } else {
        setLoginError(data.error || 'Clave incorrecta');
        if (data.waitTime) setWaitTime(data.waitTime);
        if (data.blocked) setBlocked(true);
        else if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
          setWaitTime(5);
        }
      }
    } catch (e) {
      setLoginError('Error de conexión');
    }
    
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setView('forum');
  };

  const loadPosts = async (subtopicId: string) => {
    try {
      const res = await fetch(`/api/posts?subtopicId=${subtopicId}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (e) {
      console.error('Error loading posts:', e);
    }
  };

  const loadChat = async (topicId: string) => {
    try {
      const res = await fetch(`/api/chat?topicId=${topicId}`);
      const data = await res.json();
      setChatMessages(data.messages || []);
    } catch (e) {
      console.error('Error loading chat:', e);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/messages?type=received');
      const data = await res.json();
      setMessages(data.messages || []);
      setUnreadCount(data.messages?.filter((m: Message) => !m.isRead).length || 0);
    } catch (e) {
      console.error('Error loading messages:', e);
    }
  };

  const loadSentMessages = async () => {
    try {
      const res = await fetch('/api/messages?type=sent');
      const data = await res.json();
      setSentMessages(data.messages || []);
    } catch (e) {
      console.error('Error loading sent messages:', e);
    }
  };

  const goToTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    loadChat(topic.id);
    setView('topic');
  };

  const goToSubtopic = (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
    loadPosts(subtopic.id);
    setView('subtopic');
  };

  const goToChat = () => {
    if (selectedTopic) {
      loadChat(selectedTopic.id);
      setView('chat');
    }
  };

  const goToAdmin = () => {
    loadMembers();
    setView('admin');
  };

  const goToProfile = () => {
    setShowProfile(true);
  };

  const goToMessages = () => {
    loadMessages();
    loadSentMessages();
    setView('messages');
  };

  const createTopic = async () => {
    if (!newTopicName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTopicName, description: newTopicDesc })
      });
      if (res.ok) {
        setNewTopicName('');
        setNewTopicDesc('');
        setShowNewTopic(false);
        loadTopics();
      }
    } catch (e) {
      console.error('Error creating topic:', e);
    }
    setLoading(false);
  };

  const deleteTopic = async (id: string) => {
    if (!confirm('¿Eliminar este tema y todo su contenido?')) return;
    try {
      await fetch('/api/topics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      loadTopics();
    } catch (e) {
      console.error('Error deleting topic:', e);
    }
  };

  const editTopic = async () => {
    if (!editingTopic || !editTopicName.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/topics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingTopic.id, name: editTopicName, description: editTopicDesc })
      });
      setEditingTopic(null);
      loadTopics();
    } catch (e) {
      console.error('Error editing topic:', e);
    }
    setLoading(false);
  };

  const createSubtopic = async () => {
    if (!newSubtopicName.trim() || !selectedTopic) return;
    setLoading(true);
    try {
      const res = await fetch('/api/topics/subtopics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selectedTopic.id, name: newSubtopicName })
      });
      if (res.ok) {
        setNewSubtopicName('');
        setShowNewSubtopic(false);
        loadTopics();
        const updated = topics.find(t => t.id === selectedTopic.id);
        if (updated) setSelectedTopic(updated);
      }
    } catch (e) {
      console.error('Error creating subtopic:', e);
    }
    setLoading(false);
  };

  const editSubtopic = async () => {
    if (!editingSubtopic || !editSubtopicName.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/topics/subtopics', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingSubtopic.id, name: editSubtopicName })
      });
      setEditingSubtopic(null);
      loadTopics();
      if (selectedTopic) {
        const updated = topics.find(t => t.id === selectedTopic.id);
        if (updated) setSelectedTopic(updated);
      }
    } catch (e) {
      console.error('Error editing subtopic:', e);
    }
    setLoading(false);
  };

  const deleteSubtopic = async (id: string) => {
    if (!confirm('¿Eliminar este subtema y todas sus publicaciones?')) return;
    try {
      await fetch('/api/topics/subtopics', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      loadTopics();
      if (selectedTopic) {
        const updated = topics.find(t => t.id === selectedTopic.id);
        if (updated) setSelectedTopic(updated);
      }
    } catch (e) {
      console.error('Error deleting subtopic:', e);
    }
  };

  const createPost = async () => {
    if (!newPostContent.trim() || !selectedSubtopic) return;
    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtopicId: selectedSubtopic.id, content: newPostContent })
      });
      if (res.ok) {
        setNewPostContent('');
        loadPosts(selectedSubtopic.id);
      }
    } catch (e) {
      console.error('Error creating post:', e);
    }
    setLoading(false);
  };

  const createReply = async () => {
    if (!replyContent.trim() || !replyingTo || !selectedSubtopic) return;
    setLoading(true);
    try {
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subtopicId: selectedSubtopic.id, 
          content: replyContent,
          parentId: replyingTo.id 
        })
      });
      setReplyContent('');
      setReplyingTo(null);
      loadPosts(selectedSubtopic.id);
    } catch (e) {
      console.error('Error creating reply:', e);
    }
    setLoading(false);
  };

  const updatePost = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await fetch('/api/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, content: editContent })
      });
      setEditingPost(null);
      if (selectedSubtopic) loadPosts(selectedSubtopic.id);
    } catch (e) {
      console.error('Error updating post:', e);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('¿Eliminar esta publicación?')) return;
    try {
      await fetch('/api/posts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (selectedSubtopic) loadPosts(selectedSubtopic.id);
    } catch (e) {
      console.error('Error deleting post:', e);
    }
  };

  const handleLike = async (postId: string, type: 'like' | 'dislike') => {
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, type })
      });
      if (selectedSubtopic) loadPosts(selectedSubtopic.id);
    } catch (e) {
      console.error('Error with like:', e);
    }
  };

  const sendChatMessage = async () => {
    if (!newChatMessage.trim() || !selectedTopic) return;
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selectedTopic.id, message: newChatMessage })
      });
      setNewChatMessage('');
      loadChat(selectedTopic.id);
    } catch (e) {
      console.error('Error sending chat message:', e);
    }
  };

  const sendMessage = async () => {
    if (!newMessageContent.trim() || !newMessageRecipient) return;
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          receiverId: newMessageRecipient, 
          subject: newMessageSubject, 
          content: newMessageContent 
        })
      });
      setNewMessageRecipient('');
      setNewMessageSubject('');
      setNewMessageContent('');
      setShowNewMessage(false);
      loadSentMessages();
    } catch (e) {
      console.error('Error sending message:', e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      loadMessages();
    } catch (e) {
      console.error('Error marking as read:', e);
    }
  };

  const inviteUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, email: newUserEmail })
      });
      const data = await res.json();
      if (data.success) {
        setInvitedUserKey({
          name: data.user.name,
          email: data.user.email,
          accessKey: data.user.accessKey
        });
        setNewUserName('');
        setNewUserEmail('');
        setShowInviteUser(false);
        loadMembers();
      } else {
        alert(data.error || 'Error al invitar');
      }
    } catch (e) {
      console.error('Error inviting user:', e);
    }
    setLoading(false);
  };
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Error copying to clipboard:', e);
    }
  };

  const toggleUserActive = async (userId: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'toggleActive' })
      });
      loadMembers();
    } catch (e) {
      console.error('Error toggling user active:', e);
    }
  };

  const toggleUserRole = async (userId: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'toggleRole' })
      });
      loadMembers();
    } catch (e) {
      console.error('Error toggling user role:', e);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      loadMembers();
    } catch (e) {
      console.error('Error deleting user:', e);
    }
  };

  const updateProfile = async (generateNewKey: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: profileName, 
          email: profileEmail,
          newAccessKey: generateNewKey
        })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        if (generateNewKey && data.user.accessKey) {
          setNewKeyGenerated(data.user.accessKey);
        } else {
          setShowProfile(false);
        }
      }
    } catch (e) {
      console.error('Error updating profile:', e);
    }
    setLoading(false);
  };

  const deleteAccount = async () => {
    if (!confirm('¿Está seguro de darse de baja? Esta acción no se puede deshacer.')) return;
    try {
      await fetch('/api/users/profile', { method: 'DELETE' });
      handleLogout();
    } catch (e) {
      console.error('Error deleting account:', e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results);
      setShowSearch(true);
    } catch (e) {
      console.error('Error searching:', e);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUserOnline = (lastActiveAt?: string) => {
    if (!lastActiveAt) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActiveAt) > fiveMinutesAgo;
  };
  
  const getInvitationMessage = () => {
    if (!invitedUserKey) return '';
    return `¡Has sido invitado al foro "Lo Mejor de España"!

Tu clave de acceso es: ${invitedUserKey.accessKey}

Entra en: https://lomejordeespaña.es

¡Te esperamos!`;
  };
    // RENDER PRINCIPAL
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Vista de Login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md shadow-2xl border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-600 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent">
              Lo Mejor De España
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {needsInit ? (
              <div className="space-y-4 text-center">
                <p className="text-slate-300 text-sm">
                  El sistema no ha sido inicializado. Cree la cuenta de administrador para comenzar.
                </p>
                <Button 
                  onClick={handleInit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700"
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inicializando...</> : 'Inicializar Sistema'}
                </Button>
              </div>
            ) : blocked ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <p className="text-red-400 font-medium">Acceso bloqueado por demasiados intentos fallidos.</p>
                <p className="text-slate-400 text-sm">Intente nuevamente más tarde.</p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Ingrese su clave de acceso"
                    value={accessKey}
                    onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-yellow-500"
                    disabled={loginLoading || waitTime > 0}
                    maxLength={16}
                  />
                </div>
                
                {loginError && (
                  <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                    <AlertCircle className="h-4 w-4" />{loginError}
                  </p>
                )}
                
                {waitTime > 0 && (
                  <p className="text-yellow-400 text-sm text-center">Espere {waitTime} segundos...</p>
                )}
                
                {attemptsLeft < 3 && !blocked && (
                  <p className="text-yellow-400 text-sm text-center">Intentos restantes: {attemptsLeft}</p>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loginLoading || waitTime > 0 || !accessKey.trim()}
                  className="w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-medium py-2"
                >
                  {loginLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verificando...</> : 'Entrar'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Vista del Foro (logueado)
  return (
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="font-bold text-lg bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
              Lo Mejor De España
            </h1>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          <Button 
            variant={view === 'forum' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-2"
            onClick={() => setView('forum')}
          >
            <Home className="h-4 w-4" />
            {sidebarOpen && 'Inicio'}
          </Button>
          
          <Button 
            variant={view === 'messages' ? 'secondary' : 'ghost'} 
            className="w-full justify-start gap-2 relative"
            onClick={goToMessages}
          >
            <Mail className="h-4 w-4" />
            {sidebarOpen && 'Mensajes'}
            {unreadCount > 0 && (
              <Badge className="absolute right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">
                {unreadCount}
              </Badge>
            )}
          </Button>
          
          {user.role === 'admin' && (
            <Button 
              variant={view === 'admin' ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2"
              onClick={goToAdmin}
            >
              <Users className="h-4 w-4" />
              {sidebarOpen && 'Administrar'}
            </Button>
          )}
        </nav>
        
        <div className="p-2 border-t border-slate-700 space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2"
            onClick={goToProfile}
          >
            <Settings className="h-4 w-4" />
            {sidebarOpen && 'Mi Perfil'}
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 text-red-400 hover:text-red-300"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            {sidebarOpen && 'Salir'}
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {view !== 'forum' && (
              <Button variant="ghost" size="sm" onClick={() => setView('forum')}>
                <Home className="h-4 w-4 mr-2" />Volver
              </Button>
            )}
            <h2 className="text-xl font-semibold">
              {view === 'forum' && 'Foro'}
              {view === 'topic' && selectedTopic?.name}
              {view === 'subtopic' && selectedSubtopic?.name}
              {view === 'chat' && `Chat: ${selectedTopic?.name}`}
              {view === 'admin' && 'Panel de Administración'}
              {view === 'messages' && 'Mensajes'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-48 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button size="sm" onClick={handleSearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {showSearch && searchResults && (
                <div className="absolute right-0 top-12 w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-2 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-sm font-medium">Resultados</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowSearch(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {searchResults.topics.length === 0 && searchResults.subtopics.length === 0 && searchResults.posts.length === 0 ? (
                    <p className="p-4 text-slate-400 text-center">No se encontraron resultados</p>
                  ) : (
                    <div className="p-2 space-y-2">
                      {searchResults.topics.map(r => (
                        <div 
                          key={`topic-${r.id}`}
                          className="p-2 hover:bg-slate-700 rounded cursor-pointer"
                          onClick={() => {
                            const topic = topics.find(t => t.id === r.id);
                            if (topic) goToTopic(topic);
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Tema</Badge>
                            <span className="font-medium">{r.title}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{r.description}</p>
                        </div>
                      ))}
                      
                      {searchResults.subtopics.map(r => (
                        <div 
                          key={`subtopic-${r.id}`}
                          className="p-2 hover:bg-slate-700 rounded cursor-pointer"
                          onClick={() => {
                            const topic = topics.find(t => t.id === r.topicId);
                            const subtopic = topic?.subtopics.find(s => s.id === r.id);
                            if (topic && subtopic) {
                              setSelectedTopic(topic);
                              goToSubtopic(subtopic);
                            }
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-yellow-500">Subtema</Badge>
                            <span className="font-medium">{r.title}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{r.description}</p>
                        </div>
                      ))}
                      
                      {searchResults.posts.map(r => (
                        <div 
                          key={`post-${r.id}`}
                          className="p-2 hover:bg-slate-700 rounded cursor-pointer"
                          onClick={() => {
                            const topic = topics.find(t => t.id === r.topicId);
                            const subtopic = topic?.subtopics.find(s => s.id === r.subtopicId);
                            if (topic && subtopic) {
                              setSelectedTopic(topic);
                              goToSubtopic(subtopic);
                            }
                            setShowSearch(false);
                            setSearchQuery('');
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-green-500">Post</Badge>
                            <span className="font-medium">{r.title}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              {user.name}
              {user.role === 'admin' && <Crown className="h-3 w-3 text-yellow-500" />}
            </Badge>
          </div>
        </header>

        {/* Área de contenido */}
        <main className="flex-1 overflow-auto p-4">
          {/* Vista: Foro principal */}
          {view === 'forum' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Temas</h3>
                {user.role === 'admin' && (
                  <Dialog open={showNewTopic} onOpenChange={setShowNewTopic}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />Nuevo Tema
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Tema</DialogTitle>
                        <DialogDescription>
                          Los temas son las categorías principales del foro.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Nombre del tema"
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          className="bg-slate-700 border-slate-600"
                        />
                        <Textarea
                          placeholder="Descripción (opcional)"
                          value={newTopicDesc}
                          onChange={(e) => setNewTopicDesc(e.target.value)}
                          className="bg-slate-700 border-slate-600"
                        />
                        <Button onClick={createTopic} disabled={loading || !newTopicName.trim()}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Crear Tema
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              <div className="grid gap-4">
                {topics.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center text-slate-400">
                      No hay temas creados aún.
                    </CardContent>
                  </Card>
                ) : (
                  topics.map((topic) => (
                    <Card 
                      key={topic.id} 
                      className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => goToTopic(topic)}
                          >
                            <h4 className="font-semibold text-lg">{topic.name}</h4>
                            {topic.description && (
                              <p className="text-slate-400 text-sm mt-1">{topic.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                              <span>{topic._count.subtopics} subtemas</span>
                              <span>{topic._count.chatMessages} mensajes en chat</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {user.role === 'admin' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTopic(topic);
                                    setEditTopicName(topic.name);
                                    setEditTopicDesc(topic.description || '');
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTopic(topic.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => goToTopic(topic)}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}
                    {/* Vista: Tema (subtemas y chat) */}
          {view === 'topic' && selectedTopic && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Subtemas</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={goToChat}>
                    <MessageSquare className="h-4 w-4 mr-1" />Chat
                  </Button>
                  <Dialog open={showNewSubtopic} onOpenChange={setShowNewSubtopic}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />Nuevo Subtema
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Subtema</DialogTitle>
                        <DialogDescription>
                          Los subtemas contienen las publicaciones de discusión.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Nombre del subtema"
                          value={newSubtopicName}
                          onChange={(e) => setNewSubtopicName(e.target.value)}
                          className="bg-slate-700 border-slate-600"
                        />
                        <Button onClick={createSubtopic} disabled={loading || !newSubtopicName.trim()}>
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Crear Subtema
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <div className="grid gap-3">
                {selectedTopic.subtopics.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center text-slate-400">
                      No hay subtemas en este tema.
                    </CardContent>
                  </Card>
                ) : (
                  selectedTopic.subtopics.map((st) => (
                    <Card 
                      key={st.id} 
                      className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                      onClick={() => goToSubtopic(st)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{st.name}</h4>
                            <p className="text-sm text-slate-500">
                              Por {st.creator.name} • {st._count.posts} publicaciones
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(user.role === 'admin' || user.id === st.creator.id) && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSubtopic(st);
                                    setEditSubtopicName(st.name);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-400 hover:text-red-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteSubtopic(st.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <ChevronRight className="h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Vista: Chat del tema */}
          {view === 'chat' && selectedTopic && (
            <div className="flex flex-col h-[calc(100vh-12rem)]">
              <div 
                ref={chatRef}
                className="flex-1 overflow-y-auto space-y-3 p-4 bg-slate-800/30 rounded-lg"
              >
                {chatMessages.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No hay mensajes en el chat.</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-yellow-500 flex items-center justify-center font-bold">
                          {msg.user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-700/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{msg.user.name}</span>
                          <span className="text-xs text-slate-500">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-slate-200">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-4 flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="bg-slate-700 border-slate-600"
                />
                <Button onClick={sendChatMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Vista: Subtema (posts) */}
          {view === 'subtopic' && selectedSubtopic && (
            <div className="space-y-4">
              <Card className="bg-slate-800/30 border-slate-700">
                <CardContent className="p-4">
                  <Textarea
                    placeholder="Escribe tu publicación..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="bg-slate-700 border-slate-600 min-h-[100px]"
                  />
                  <div className="flex justify-end mt-2">
                    <Button onClick={createPost} disabled={loading || !newPostContent.trim()}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Publicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-3">
                {posts.filter(p => !p.parentId).length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center text-slate-400">
                      Sé el primero en publicar.
                    </CardContent>
                  </Card>
                ) : (
                  posts.filter(p => !p.parentId).map((post) => (
                    <Card key={post.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                              <User className="h-3 w-3" />
                              <span className="font-medium text-slate-300">{post.author.name}</span>
                              <span>•</span>
                              <span>{formatDate(post.createdAt)}</span>
                              {post.updatedAt !== post.createdAt && (
                                <span className="text-slate-500">(editado)</span>
                              )}
                            </div>
                            
                            {editingPost === post.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="bg-slate-700 border-slate-600"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => updatePost(post.id)}>Guardar</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingPost(null)}>Cancelar</Button>
                                </div>
                              </div>
                            ) : (
                              <p className="whitespace-pre-wrap text-slate-200">{post.content}</p>
                            )}
                            
                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700">
                              <div className="flex items-center gap-2">
                                <Button 
                                  size="sm" 
                                  variant={post.userLike === 'like' ? 'default' : 'ghost'}
                                  onClick={() => handleLike(post.id, 'like')}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">{post.likesCount}</span>
                                <Button 
                                  size="sm" 
                                  variant={post.userLike === 'dislike' ? 'default' : 'ghost'}
                                  onClick={() => handleLike(post.id, 'dislike')}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                                <span className="text-sm">{post.dislikesCount}</span>
                              </div>
                              
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setReplyingTo(post);
                                  setReplyContent('');
                                }}
                              >
                                <Reply className="h-4 w-4 mr-1" />Responder
                              </Button>
                              
                              {(user.role === 'admin' || user.id === post.author.id) && !editingPost && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => {
                                      setEditingPost(post.id);
                                      setEditContent(post.content);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => deletePost(post.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                            
                            {/* Formulario de respuesta */}
                            {replyingTo?.id === post.id && (
                              <div className="mt-4 pt-4 border-t border-slate-700">
                                <p className="text-sm text-slate-400 mb-2">Respondiendo a {post.author.name}</p>
                                <Textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Escribe tu respuesta..."
                                  className="bg-slate-700 border-slate-600 min-h-[80px]"
                                />
                                <div className="flex gap-2 mt-2">
                                  <Button size="sm" onClick={createReply} disabled={loading || !replyContent.trim()}>
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Responder
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {/* Respuestas */}
                            {posts.filter(p => p.parentId === post.id).length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                                {posts.filter(p => p.parentId === post.id).map((reply) => (
                                  <div key={reply.id} className="bg-slate-700/30 rounded p-3 ml-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                                      <User className="h-3 w-3" />
                                      <span className="font-medium text-slate-300">{reply.author.name}</span>
                                      <span>•</span>
                                      <span>{formatDate(reply.createdAt)}</span>
                                    </div>
                                    <p className="text-slate-200">{reply.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Vista: Administración */}
          {view === 'admin' && user.role === 'admin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Miembros del Foro</h3>
                <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />Invitar Miembro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                      <DialogDescription>
                        Se generará una clave de acceso única para el nuevo miembro.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        placeholder="Nombre completo"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                      <Input
                        placeholder="Correo electrónico"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                      <Button onClick={inviteUser} disabled={loading || !newUserName.trim() || !newUserEmail.trim()}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Invitar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-sm font-medium text-slate-400">Nombre</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400">Email</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400">Clave</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400">Rol</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400">Estado</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400">En línea</th>
                        <th className="text-left p-3 text-sm font-medium text-slate-400">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member) => (
                        <tr key={member.id} className="border-b border-slate-700/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {member.name}
                              {member.role === 'admin' && <Crown className="h-3 w-3 text-yellow-500" />}
                            </div>
                          </td>
                          <td className="p-3 text-slate-400">{member.email}</td>
                          <td className="p-3">
                            {member.keyIsPrivate ? (
                              <div className="flex items-center gap-1">
                                <code className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-500">••••••••••••••••</code>
                                <Lock className="h-3 w-3 text-slate-500" title="Clave privada" />
                              </div>
                            ) : (
                              <code className="text-xs bg-slate-700 px-2 py-1 rounded">{member.accessKey}</code>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                              {member.role === 'admin' ? 'Admin' : 'Miembro'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={member.isActive ? 'default' : 'destructive'}>
                              {member.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {isUserOnline(member.lastActiveAt) ? (
                                <>
                                  <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                                  <span className="text-green-500 text-sm">En línea</span>
                                </>
                              ) : (
                                <>
                                  <Circle className="h-3 w-3 text-slate-500" />
                                  <span className="text-slate-500 text-sm">Desconectado</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              {member.id !== user.id && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => toggleUserActive(member.id)}
                                    title={member.isActive ? 'Desactivar' : 'Activar'}
                                  >
                                    {member.isActive ? <Circle className="h-4 w-4 text-green-500" /> : <CheckCircle className="h-4 w-4 text-slate-500" />}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => toggleUserRole(member.id)}
                                    title="Cambiar rol"
                                  >
                                    {member.role === 'admin' ? <Crown className="h-4 w-4 text-yellow-500" /> : <User className="h-4 w-4" />}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => deleteUser(member.id)}
                                    title="Eliminar"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Vista: Mensajes */}
          {view === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Tabs value={messageTab} onValueChange={(v) => setMessageTab(v as 'received' | 'sent')}>
                  <TabsList className="bg-slate-800">
                    <TabsTrigger value="received">Recibidos</TabsTrigger>
                    <TabsTrigger value="sent">Enviados</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />Nuevo Mensaje
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle>Nuevo Mensaje</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm text-slate-400">Para:</label>
                        <select 
                          value={newMessageRecipient}
                          onChange={(e) => setNewMessageRecipient(e.target.value)}
                          className="w-full mt-1 bg-slate-700 border border-slate-600 rounded p-2 text-white"
                        >
                          <option value="">Seleccionar destinatario...</option>
                          {allMembers.filter(m => m.id !== user.id).map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <Input
                        placeholder="Asunto"
                        value={newMessageSubject}
                        onChange={(e) => setNewMessageSubject(e.target.value)}
                        className="bg-slate-700 border-slate-600"
                      />
                      <Textarea
                        placeholder="Contenido del mensaje"
                        value={newMessageContent}
                        onChange={(e) => setNewMessageContent(e.target.value)}
                        className="bg-slate-700 border-slate-600 min-h-[100px]"
                      />
                      <Button onClick={sendMessage} disabled={!newMessageRecipient || !newMessageContent.trim()}>
                        Enviar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <TabsContent value="received" className="mt-0">
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6 text-center text-slate-400">
                        No tienes mensajes recibidos.
                      </CardContent>
                    </Card>
                  ) : (
                    messages.map((msg) => (
                      <Card 
                        key={msg.id} 
                        className={`bg-slate-800/50 border-slate-700 ${!msg.isRead ? 'border-l-4 border-l-yellow-500' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{msg.subject}</span>
                                {!msg.isRead && <Badge variant="default" className="text-xs">Nuevo</Badge>}
                              </div>
                              <p className="text-sm text-slate-400 mt-1">
                                De: {msg.sender.name} • {formatDate(msg.createdAt)}
                              </p>
                              <p className="text-slate-300 mt-2">{msg.content}</p>
                            </div>
                            <div className="flex gap-2">
                              {!msg.isRead && (
                                <Button size="sm" variant="ghost" onClick={() => markAsRead(msg.id)}>
                                  Marcar leído
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={async () => {
                                  await loadAllMembers();
                                  setNewMessageRecipient(msg.sender.id);
                                  setNewMessageSubject(`Re: ${msg.subject}`);
                                  setNewMessageContent('');
                                  setShowNewMessage(true);
                                }}
                              >
                                <Reply className="h-4 w-4 mr-1" />
                                Responder
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="sent" className="mt-0">
                <div className="space-y-2">
                  {sentMessages.length === 0 ? (
                    <Card className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-6 text-center text-slate-400">
                        No tienes mensajes enviados.
                      </CardContent>
                    </Card>
                  ) : (
                    sentMessages.map((msg) => (
                      <Card 
                        key={msg.id} 
                        className="bg-slate-800/50 border-slate-700"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{msg.subject}</span>
                              </div>
                              <p className="text-sm text-slate-400 mt-1">
                                Para: {msg.receiver.name} • {formatDate(msg.createdAt)}
                              </p>
                              <p className="text-slate-300 mt-2">{msg.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </div>
          )}
        </main>
      </div>

      {/* Dialog: Editar Tema */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Editar Tema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Nombre del tema"
              value={editTopicName}
              onChange={(e) => setEditTopicName(e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
            <Textarea
              placeholder="Descripción (opcional)"
              value={editTopicDesc}
              onChange={(e) => setEditTopicDesc(e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
            <Button onClick={editTopic} disabled={loading || !editTopicName.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Subtema */}
      <Dialog open={!!editingSubtopic} onOpenChange={() => setEditingSubtopic(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Editar Subtema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Nombre del subtema"
              value={editSubtopicName}
              onChange={(e) => setEditSubtopicName(e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
            <Button onClick={editSubtopic} disabled={loading || !editSubtopicName.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Perfil */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Mi Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {newKeyGenerated ? (
              <div className="space-y-4 text-center">
                <p className="text-green-400">¡Nueva clave generada!</p>
                <div className="bg-slate-700 p-4 rounded">
                  <p className="text-sm text-slate-400 mb-2">Su nueva clave de acceso es:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-xl font-bold">{newKeyGenerated}</code>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(newKeyGenerated)}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-yellow-400 text-sm">¡Guarde esta clave en un lugar seguro! El administrador no podrá verla.</p>
                <Button onClick={() => { setNewKeyGenerated(''); setShowProfile(false); }}>
                  Entendido
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Nombre</label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-slate-400">Email</label>
                  <Input
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => updateProfile(false)} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => updateProfile(true)} disabled={loading}>
                    <Key className="h-4 w-4 mr-2" />
                    Nueva Clave
                  </Button>
                </div>
                {user.role !== 'admin' && (
                  <Button 
                    variant="destructive" 
                    className="w-full mt-4"
                    onClick={deleteAccount}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Darse de Baja
                  </Button>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Clave de invitación */}
      <Dialog open={!!invitedUserKey} onOpenChange={() => setInvitedUserKey(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-400">¡Usuario invitado!</DialogTitle>
            <DialogDescription>
              Comparte esta información con el nuevo miembro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-slate-700/50 p-4 rounded space-y-2">
              <p className="text-sm"><span className="text-slate-400">Nombre:</span> <span className="font-medium">{invitedUserKey?.name}</span></p>
              <p className="text-sm"><span className="text-slate-400">Email:</span> <span className="font-medium">{invitedUserKey?.email}</span></p>
              <div className="pt-2">
                <p className="text-sm text-slate-400 mb-1">Clave de acceso:</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-bold bg-slate-600 px-3 py-1 rounded flex-1 select-all">{invitedUserKey?.accessKey}</code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(invitedUserKey?.accessKey || '')}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-slate-400">Mensaje para compartir:</p>
              <Textarea
                value={getInvitationMessage()}
                readOnly
                className="bg-slate-700 border-slate-600 text-sm h-32"
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => copyToClipboard(getInvitationMessage())}
              >
                {copied ? <Check className="h-4 w-4 mr-2 text-green-400" /> : <Copy className="h-4 w-4 mr-2" />}
                Copiar mensaje completo
              </Button>
            </div>
            
            <Button onClick={() => setInvitedUserKey(null)} className="w-full">
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
