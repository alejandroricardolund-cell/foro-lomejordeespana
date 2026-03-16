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
  Plus, ThumbsUp, ThumbsDown, Trash2, Edit, Send, Mail, ChevronRight, ChevronDown, ChevronUp,
  Menu, X, Key, User, UserX, Crown, Search, Reply, Circle, CheckCircle, XCircle, Copy, Check, File
} from 'lucide-react';
import { FileUpload, UploadedFile } from '@/components/file-upload';

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
  attachments: {
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
    key: string;
  }[];
}

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string };
  attachments: {
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
    key: string;
  }[];
}

interface Message {
  id: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
  attachments: {
    id: string;
    url: string;
    name: string;
    size: number;
    type: string;
    key: string;
  }[];
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
  
  // Estados de archivos adjuntos
  const [postAttachments, setPostAttachments] = useState<UploadedFile[]>([]);
  const [chatAttachments, setChatAttachments] = useState<UploadedFile[]>([]);
  const [messageAttachments, setMessageAttachments] = useState<UploadedFile[]>([]);
  
  // Estados de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ topics: SearchResult[]; subtopics: SearchResult[]; posts: SearchResult[] } | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  
  // Estados de mensajes
  const [messageTab, setMessageTab] = useState<'received' | 'sent'>('received');
  
  // Estados para acordeones
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  
  // Estado para mostrar clave de invitado
  const [invitedUserKey, setInvitedUserKey] = useState<{name: string; email: string; accessKey: string} | null>(null);
  const [copied, setCopied] = useState(false);
  
  const chatRef = useRef<HTMLDivElement>(null);

  // Funciones de datos (definidas primero)
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

  // Funciones de autenticación (definidas antes de usarlas en useEffect)
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
  
  // Manejar el botón "atrás" del navegador
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
        if (event.state.view === 'forum') {
          setSelectedTopic(null);
          setSelectedSubtopic(null);
        }
      } else {
        // Si no hay estado, volver al foro
        if (user) {
          setView('forum');
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    // Inicializar el historial con el estado actual
    window.history.replaceState({ view: 'forum' }, '');
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user]);
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

  // Funciones de datos adicionales
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

  // Acciones de navegación
  const goToTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    loadChat(topic.id);
    setView('topic');
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'topic', topicId: topic.id }, '');
    }
  };

  const goToSubtopic = (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
    loadPosts(subtopic.id);
    setView('subtopic');
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'subtopic', subtopicId: subtopic.id }, '');
    }
  };

  const goToChat = () => {
    if (selectedTopic) {
      loadChat(selectedTopic.id);
      setView('chat');
      if (typeof window !== 'undefined') {
        window.history.pushState({ view: 'chat', topicId: selectedTopic.id }, '');
      }
    }
  };

  const goToAdmin = () => {
    loadMembers();
    setView('admin');
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'admin' }, '');
    }
  };

  const goToProfile = () => {
    setShowProfile(true);
  };

  const goToMessages = () => {
    loadMessages();
    loadSentMessages();
    setView('messages');
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'messages' }, '');
    }
  };
  
  const goToForum = () => {
    setView('forum');
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({ view: 'forum' }, '');
    }
  };

  // Acciones de contenido
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
        body: JSON.stringify({ 
          subtopicId: selectedSubtopic.id, 
          content: newPostContent,
          attachments: postAttachments 
        })
      });
      if (res.ok) {
        setNewPostContent('');
        setPostAttachments([]);
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
          parentId: replyingTo.id,
          attachments: postAttachments 
        })
      });
      setReplyContent('');
      setPostAttachments([]);
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
        body: JSON.stringify({ 
          topicId: selectedTopic.id, 
          message: newChatMessage,
          attachments: chatAttachments 
        })
      });
      setNewChatMessage('');
      setChatAttachments([]);
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
          content: newMessageContent,
          attachments: messageAttachments 
        })
      });
      setNewMessageRecipient('');
      setNewMessageSubject('');
      setNewMessageContent('');
      setMessageAttachments([]);
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

  const deleteMessage = async (id: string) => {
    if (!confirm('¿Eliminar este mensaje?')) return;
    if (!user) return;
    try {
      await fetch(`/api/messages/${id}?userId=${user.id}`, { method: 'DELETE' });
      loadMessages();
      loadSentMessages();
    } catch (e) {
      console.error('Error deleting message:', e);
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
        setUserEmail('');
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

  // Gestión de usuarios (admin)
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

  // Búsqueda
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

  // Formatear fecha
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verificar si usuario está en línea
  const isUserOnline = (lastActiveAt?: string) => {
    if (!lastActiveAt) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActiveAt) > fiveMinutesAgo;
  };
  
  // Generar mensaje para compartir
  const getInvitationMessage = () => {
    if (!invitedUserKey) return '';
    return `¡Has sido invitado al foro "Lo Mejor de España"!

Tu clave de acceso es: ${invitedUserKey.accessKey}

Entra en: https://lomejordeespaña.es

¡Te esperamos!`;
  };

  // Función para abrir el diálogo de nuevo mensaje y cargar miembros
  const handleOpenNewMessage = () => {
    loadAllMembers();
    setShowNewMessage(true);
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
              <Button variant="ghost" size="sm" onClick={goToForum}>
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
            {/* Barra de búsqueda */}
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
              
              {/* Resultados de búsqueda */}
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
                          <p className="text-sm text-slate-400 mt-1 line-clamp-2">{r.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <span className="text-sm text-slate-400">
              Hola, <span className="text-yellow-500">{user.name}</span>
            </span>
          </div>
        </header>
                {/* Contenido */}
        <main className="flex-1 overflow-auto p-4">
          {/* Vista: Foro principal */}
          {view === 'forum' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Temas del Foro</h3>
                {user.role === 'admin' && (
                  <Dialog open={showNewTopic} onOpenChange={setShowNewTopic}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />Nuevo Tema
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Tema</DialogTitle>
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
                        <Button onClick={createTopic} disabled={loading} className="w-full">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Crear Tema
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {topics.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 text-center text-slate-400">
                    No hay temas creados. {user.role === 'admin' && 'Crea el primer tema para comenzar.'}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {topics.map((topic) => (
                    <Card key={topic.id} className="bg-slate-800/50 border-slate-700 hover:border-yellow-500 transition-colors">
                      <CardHeader className="cursor-pointer" onClick={() => goToTopic(topic)}>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{topic.name}</CardTitle>
                          {user.role === 'admin' && (
                            <div className="flex gap-1">
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
                            </div>
                          )}
                        </div>
                        <CardDescription className="text-slate-400 mt-1">
                          {topic.description || 'Sin descripción'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm text-slate-400">
                          <span>{topic._count.subtopics} subtemas</span>
                          <span>{topic._count.chatMessages} mensajes en chat</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vista: Tema seleccionado */}
          {view === 'topic' && selectedTopic && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Subtemas</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToChat}>
                    <MessageSquare className="h-4 w-4 mr-2" />Chat Brainstorming
                  </Button>
                  <Dialog open={showNewSubtopic} onOpenChange={setShowNewSubtopic}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />Nuevo Subtema
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-800 border-slate-700">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Subtema</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          placeholder="Nombre del subtema"
                          value={newSubtopicName}
                          onChange={(e) => setNewSubtopicName(e.target.value)}
                          className="bg-slate-700 border-slate-600"
                        />
                        <Button onClick={createSubtopic} disabled={loading} className="w-full">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Crear Subtema
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {selectedTopic.subtopics.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 text-center text-slate-400">
                    No hay subtemas. Crea uno para empezar a discutir.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {selectedTopic.subtopics.map((subtopic) => (
                    <Card 
                      key={subtopic.id} 
                      className="bg-slate-800/50 border-slate-700 hover:border-yellow-500 transition-colors cursor-pointer"
                      onClick={() => goToSubtopic(subtopic)}
                    >
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <span className="font-medium">{subtopic.name}</span>
                          <span className="text-sm text-slate-400 ml-2">
                            por {subtopic.creator.name} • {subtopic._count.posts} posts
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vista: Subtema (posts) */}
          {view === 'subtopic' && selectedSubtopic && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Discusión</h3>
                <Button 
                  size="sm" 
                  onClick={() => setShowNewPostForm(!showNewPostForm)}
                >
                  {showNewPostForm ? 'Cancelar' : <><Plus className="h-4 w-4 mr-2" />Nuevo Post</>}
                </Button>
              </div>
              
              {/* Formulario nuevo post */}
              {showNewPostForm && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-4 space-y-3">
                    <Textarea
                      placeholder="Escribe tu publicación..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="bg-slate-700 border-slate-600 min-h-[60px]"
                    />
                    <div className="mt-2">
                      <FileUpload
                        allowedTypes="all"
                        onUploadComplete={(files) => setPostAttachments(files)}
                      />
                    </div>
                    <Button onClick={createPost} disabled={loading || !newPostContent.trim()}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Publicar
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Lista de posts */}
              {posts.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-6 text-center text-slate-400">
                    No hay publicaciones. Sé el primero en escribir.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.filter(p => !p.parentId).map((post) => (
                    <Card key={post.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-yellow-500">{post.author.name}</span>
                            <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
                          </div>
                          {post.author.id === user.id && (
                            <div className="flex gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setEditingPost(post.id);
                                  setEditContent(post.content);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deletePost(post.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
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
                              <Button size="sm" variant="outline" onClick={() => setEditingPost(null)}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-slate-300">{post.content}</p>
                        )}
                        
                        {/* Archivos adjuntos */}
                        {post.attachments && post.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {post.attachments.map((att) => (
                              <a 
                                key={att.id} 
                                href={att.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-sm hover:bg-slate-600"
                              >
                                📎 {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                        
                        {/* Likes/Dislikes */}
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLike(post.id, 'like')}
                            className={post.userLike === 'like' ? 'text-green-500' : ''}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            {post.likesCount}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLike(post.id, 'dislike')}
                            className={post.userLike === 'dislike' ? 'text-red-500' : ''}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            {post.dislikesCount}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setReplyingTo(post)}
                          >
                            <Reply className="h-4 w-4 mr-1" />
                            Responder
                          </Button>
                        </div>
                        
                        {/* Respuestas */}
                        {posts.filter(p => p.parentId === post.id).length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-slate-700 space-y-3">
                            {posts.filter(p => p.parentId === post.id).map((reply) => (
                              <div key={reply.id} className="bg-slate-700/50 p-3 rounded">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-yellow-500 text-sm">{reply.author.name}</span>
                                  <span className="text-xs text-slate-400">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p className="text-sm text-slate-300">{reply.content}</p>
                                {reply.attachments && reply.attachments.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {reply.attachments.map((att) => (
                                      <a 
                                        key={att.id} 
                                        href={att.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-600 rounded text-xs hover:bg-slate-500"
                                      >
                                        📎 {att.name}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Dialog para responder */}
              {replyingTo && (
                <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle>Responder a {replyingTo.author.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <p className="text-slate-400 text-sm italic">"{replyingTo.content}"</p>
                      <Textarea
                        placeholder="Tu respuesta..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="bg-slate-700 border-slate-600 min-h-[60px]"
                      />
                      <div className="mt-2">
                        <FileUpload
                          allowedTypes="all"
                          onUploadComplete={(files) => setPostAttachments(files)}
                        />
                      </div>
                      <Button onClick={createReply} disabled={loading || !replyContent.trim()} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Enviar Respuesta
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {/* Vista: Chat */}
          {view === 'chat' && selectedTopic && (
            <div className="flex flex-col h-[calc(100vh-200px)]">
              <div ref={chatRef} className="flex-1 overflow-auto space-y-2 mb-4">
                {chatMessages.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center text-slate-400">
                      No hay mensajes en el chat. Inicia la conversación.
                    </CardContent>
                  </Card>
                ) : (
                  chatMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-lg ${msg.user.id === user.id ? 'bg-yellow-600/20 ml-auto' : 'bg-slate-700/50'} max-w-[80%]`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-yellow-500 text-sm">{msg.user.name}</span>
                        <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                      </div>
                      <p className="text-slate-200">{msg.message}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.attachments.map((att) => (
                            <a 
                              key={att.id} 
                              href={att.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-slate-600 rounded text-xs hover:bg-slate-500"
                            >
                              📎 {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Escribe un mensaje..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="bg-slate-700 border-slate-600"
                />
                <Button size="sm" onClick={sendChatMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Vista: Administración */}
          {view === 'admin' && user.role === 'admin' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Gestión de Usuarios</h3>
                <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />Invitar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700">
                    <DialogHeader>
                      <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
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
                      <Button onClick={inviteUser} disabled={loading} className="w-full">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Crear Invitación
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              {/* Mostrar clave de invitado */}
              {invitedUserKey && (
                <Card className="bg-green-900/30 border-green-500">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-green-400 mb-2">¡Usuario creado!</h4>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>{invitedUserKey.name}</strong> ({invitedUserKey.email})
                    </p>
                    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded">
                      <code className="text-yellow-400 flex-1">{invitedUserKey.accessKey}</code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(getInvitationMessage())}
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Comparte esta clave con el usuario. Puede cambiarla desde su perfil.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid gap-2">
                {members.map((member) => (
                  <Card key={member.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{member.name}</span>
                            {member.role === 'admin' && <Crown className="h-4 w-4 text-yellow-500" />}
                            {!member.isActive && <Badge variant="destructive">Inactivo</Badge>}
                            {isUserOnline(member.lastActiveAt) && (
                              <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                            )}
                          </div>
                          <span className="text-sm text-slate-400">{member.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleUserActive(member.id)}
                          disabled={member.id === user.id}
                        >
                          {member.isActive ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleUserRole(member.id)}
                          disabled={member.id === user.id}
                        >
                          {member.role === 'admin' ? <Crown className="h-4 w-4 text-yellow-500" /> : <User className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteUser(member.id)}
                          disabled={member.id === user.id}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Vista: Mensajes */}
          {view === 'messages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Mensajes Privados</h3>
                <Button size="sm" onClick={handleOpenNewMessage}>
                  <Plus className="h-4 w-4 mr-2" />Nuevo Mensaje
                </Button>
              </div>
              
              {/* Dialog nuevo mensaje */}
              <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle>Nuevo Mensaje</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <select
                      value={newMessageRecipient}
                      onChange={(e) => setNewMessageRecipient(e.target.value)}
                      className="w-full bg-slate-700 border-slate-600 rounded p-2"
                    >
                      <option value="">Seleccionar destinatario...</option>
                      {allMembers.filter(m => m.id !== user.id).map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <Input
                      placeholder="Asunto"
                      value={newMessageSubject}
                      onChange={(e) => setNewMessageSubject(e.target.value)}
                      className="bg-slate-700 border-slate-600"
                    />
                    <Textarea
                      placeholder="Mensaje..."
                      value={newMessageContent}
                      onChange={(e) => setNewMessageContent(e.target.value)}
                      className="bg-slate-700 border-slate-600 min-h-[60px]"
                    />
                    <div className="mt-2">
                      <FileUpload
                        allowedTypes="all"
                        onUploadComplete={(files) => setMessageAttachments(files)}
                      />
                    </div>
                    <Button onClick={sendMessage} disabled={loading || !newMessageContent.trim() || !newMessageRecipient} className="w-full">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Enviar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Tabs value={messageTab} onValueChange={(v) => setMessageTab(v as 'received' | 'sent')}>
                <TabsList className="bg-slate-800">
                  <TabsTrigger value="received">Recibidos {unreadCount > 0 && `(${unreadCount})`}</TabsTrigger>
                  <TabsTrigger value="sent">Enviados</TabsTrigger>
                </TabsList>
                
                <TabsContent value="received" className="mt-0">
                  <div className="space-y-2">
                    {messages.length === 0 ? (
                      <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-6 text-center text-slate-400">
                          No tienes mensajes recibidos.
                        </CardContent>
                      </Card>
                    ) : (
                      messages.map((msg) => {
                        const isExpanded = expandedMessages.has(msg.id);
                        const toggleExpand = () => {
                          const newExpanded = new Set(expandedMessages);
                          if (newExpanded.has(msg.id)) {
                            newExpanded.delete(msg.id);
                          } else {
                            newExpanded.add(msg.id);
                            if (!msg.isRead) markAsRead(msg.id);
                          }
                          setExpandedMessages(newExpanded);
                        };
                        
                        return (
                          <Card 
                            key={msg.id} 
                            className={`bg-slate-800/50 border-slate-700 ${!msg.isRead ? 'border-l-4 border-l-yellow-500' : ''}`}
                          >
                            <CardContent className="p-4">
                              <div 
                                className="flex items-center justify-between cursor-pointer"
                                onClick={toggleExpand}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{msg.subject}</span>
                                  {!msg.isRead && <Badge variant="default" className="text-xs">Nuevo</Badge>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-400">{msg.sender.name} • {formatDate(msg.createdAt)}</span>
                                  <Button variant="ghost" size="sm">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                  <p className="text-slate-300">{msg.content}</p>
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {msg.attachments.map((att) => (
                                        <a 
                                          key={att.id} 
                                          href={att.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-sm hover:bg-slate-600"
                                        >
                                          📎 {att.name}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex gap-2 mt-3">
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        loadAllMembers();
                                        setNewMessageRecipient(msg.sender.id);
                                        setNewMessageSubject(`Re: ${msg.subject}`);
                                        setNewMessageContent('');
                                        setShowNewMessage(true);
                                      }}
                                    >
                                      <Reply className="h-4 w-4 mr-1" />
                                      Responder
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="text-red-400 hover:text-red-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteMessage(msg.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Eliminar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
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
                      sentMessages.map((msg) => {
                        const isExpanded = expandedMessages.has(`sent-${msg.id}`);
                        const toggleExpand = () => {
                          const key = `sent-${msg.id}`;
                          const newExpanded = new Set(expandedMessages);
                          if (newExpanded.has(key)) {
                            newExpanded.delete(key);
                          } else {
                            newExpanded.add(key);
                          }
                          setExpandedMessages(newExpanded);
                        };
                        
                        return (
                          <Card 
                            key={msg.id} 
                            className="bg-slate-800/50 border-slate-700"
                          >
                            <CardContent className="p-4">
                              <div 
                                className="flex items-center justify-between cursor-pointer"
                                onClick={toggleExpand}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{msg.subject}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-slate-400">Para: {msg.receiver.name} • {formatDate(msg.createdAt)}</span>
                                  <Button variant="ghost" size="sm">
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              
                              {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-slate-700">
                                  <p className="text-slate-300">{msg.content}</p>
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {msg.attachments.map((att) => (
                                        <a
                                          key={att.id}
                                          href={att.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-sm hover:bg-slate-600"
                                        >
                                          📎 {att.name}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-400 hover:text-red-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteMessage(msg.id);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Eliminar
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
              placeholder="Descripción"
              value={editTopicDesc}
              onChange={(e) => setEditTopicDesc(e.target.value)}
              className="bg-slate-700 border-slate-600"
            />
            <Button onClick={editTopic} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Cambios
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
            <div>
              <label className="text-sm text-slate-400">Nombre</label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="bg-slate-700 border-slate-600 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <Input
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 mt-1"
              />
            </div>
            <Button onClick={() => updateProfile(false)} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Cambios
            </Button>
            <Button onClick={() => updateProfile(true)} variant="outline" className="w-full">
              Generar Nueva Clave de Acceso
            </Button>
            {newKeyGenerated && (
              <div className="bg-green-900/30 border border-green-500 rounded p-3">
                <p className="text-sm text-green-400 mb-1">Nueva clave generada:</p>
                <code className="text-yellow-400">{newKeyGenerated}</code>
                <p className="text-xs text-slate-400 mt-2">¡Guárdala en un lugar seguro!</p>
              </div>
            )}
            <Button onClick={deleteAccount} variant="destructive" className="w-full">
              Darse de Baja
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
