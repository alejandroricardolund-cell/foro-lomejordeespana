'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Lock, AlertCircle, Loader2, Home, MessageSquare, Users, Settings, LogOut, 
  Plus, ThumbsUp, ThumbsDown, Trash2, Edit, Send, Mail, ChevronRight, ChevronDown, ChevronUp,
  Menu, X, Key, User, UserX, UserCheck, UserPlus, Crown, Search, Reply, Circle, CheckCircle, XCircle, Copy, Check, File, Music
} from 'lucide-react';
import { FileUpload, UploadedFile } from '@/components/file-upload';
import { ContentWithLinks } from '@/components/external-link';

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

  // Funciones de autenticación
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
        const newView = event.state.view;
        setView(newView);
        
        if (newView === 'forum') {
          setSelectedTopic(null);
          setSelectedSubtopic(null);
        } else if (newView === 'topic' && event.state.topicId) {
          const topic = topics.find(t => t.id === event.state.topicId);
          if (topic) setSelectedTopic(topic);
          setSelectedSubtopic(null);
        } else if (newView === 'subtopic' && event.state.subtopicId) {
          for (const t of topics) {
            const st = t.subtopics.find(s => s.id === event.state.subtopicId);
            if (st) {
              setSelectedTopic(t);
              setSelectedSubtopic(st);
              break;
            }
          }
        }
      } else {
        if (user) {
          setView('forum');
          setSelectedTopic(null);
          setSelectedSubtopic(null);
          window.history.pushState({ view: 'forum' }, '', window.location.pathname);
        }
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user, topics]);

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
    // Acciones de navegación
  const goToTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    loadChat(topic.id);
    setView('topic');
    window.history.pushState({ view: 'topic', topicId: topic.id }, '');
  };

  const goToSubtopic = (subtopic: Subtopic) => {
    setSelectedSubtopic(subtopic);
    loadPosts(subtopic.id);
    setView('subtopic');
    window.history.pushState({ view: 'subtopic', subtopicId: subtopic.id }, '');
  };

  const goToChat = () => {
    if (selectedTopic) {
      loadChat(selectedTopic.id);
      setView('chat');
      window.history.pushState({ view: 'chat', topicId: selectedTopic.id }, '');
    }
  };

  const goToAdmin = () => {
    loadMembers();
    setView('admin');
    window.history.pushState({ view: 'admin' }, '');
  };

  const goToProfile = () => setShowProfile(true);

  const goToMessages = () => {
    loadMessages();
    loadSentMessages();
    setView('messages');
    window.history.pushState({ view: 'messages' }, '');
  };
  
  const goToForum = () => {
    setView('forum');
    setSelectedTopic(null);
    setSelectedSubtopic(null);
    window.history.pushState({ view: 'forum' }, '');
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
    if ((!newPostContent.trim() && postAttachments.length === 0) || !selectedSubtopic) return;
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
        setShowNewPostForm(false);
        loadPosts(selectedSubtopic.id);
      }
    } catch (e) {
      console.error('Error creating post:', e);
    }
    setLoading(false);
  };

  const createReply = async () => {
    if ((!replyContent.trim() && postAttachments.length === 0) || !replyingTo || !selectedSubtopic) return;
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
    if ((!newChatMessage.trim() && chatAttachments.length === 0) || !selectedTopic) return;
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
    if ((!newMessageContent.trim() && messageAttachments.length === 0) || !newMessageRecipient) return;
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
    try {
      await fetch(`/api/messages/${id}?userId=${user?.id}`, { method: 'DELETE' });
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
        setInvitedUserKey({ name: data.user.name, email: data.user.email, accessKey: data.user.accessKey });
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
        body: JSON.stringify({ name: profileName, email: profileEmail, newAccessKey: generateNewKey })
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
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Función para renderizar attachments
  const renderAttachment = (att: { id: string; url: string; name: string; size: number; type: string }, isCompact: boolean = false) => {
    const isImage = att.type.startsWith('image/');
    const isVideo = att.type.startsWith('video/');
    const isAudio = att.type.startsWith('audio/');
    
    const formatSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getProxyUrl = (url: string) => `/api/file?url=${encodeURIComponent(url)}`;

    if (isImage) {
      return (
        <div key={att.id} className={`${isCompact ? '' : 'my-2'}`}>
          <a href={getProxyUrl(att.url)} target="_blank" rel="noopener noreferrer" className="block">
            <img src={getProxyUrl(att.url)} alt={att.name} className={`${isCompact ? 'max-w-[150px] max-h-[100px]' : 'max-w-full md:max-w-[400px] max-h-[300px]'} object-cover rounded border border-slate-600 hover:border-yellow-500 transition-colors cursor-pointer`} loading="lazy" />
          </a>
          <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{att.name}</p>
        </div>
      );
    }
    
    if (isVideo) {
      return (
        <div key={att.id} className={`${isCompact ? '' : 'my-2'}`}>
          <video src={getProxyUrl(att.url)} controls className={`${isCompact ? 'max-w-[200px] max-h-[150px]' : 'max-w-full md:max-w-[500px] max-h-[300px]'} rounded border border-slate-600`} preload="metadata">
            Tu navegador no soporta video HTML5.
          </video>
          <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{att.name}</p>
        </div>
      );
    }
    
    if (isAudio) {
      return (
        <div key={att.id} className={`flex items-center gap-2 ${isCompact ? '' : 'my-2'} p-2 bg-slate-700/50 rounded`}>
          <Music className="h-5 w-5 text-purple-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs truncate">{att.name}</p>
            <p className="text-xs text-slate-400">{formatSize(att.size)}</p>
          </div>
          <audio src={getProxyUrl(att.url)} controls className="h-8 w-32 md:w-48" preload="metadata">
            Tu navegador no soporta audio HTML5.
          </audio>
        </div>
      );
    } 
    
    return (
      <a key={att.id} href={getProxyUrl(att.url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded border border-slate-600 hover:border-yellow-500 transition-colors">
        <File className="h-4 w-4 text-slate-400" />
        <div className="flex flex-col">
          <span className="text-sm truncate max-w-[150px]">{att.name}</span>
          <span className="text-xs text-slate-400">{formatSize(att.size)}</span>
        </div>
      </a>
    );
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

Entra en: https://lomejordeespana.es

¡Te esperamos!`;
  };

  // Función para abrir el diálogo de nuevo mensaje
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
            <CardDescription className="text-slate-300 text-lg mt-2">Foro Privado</CardDescription>
          </CardHeader>
          
          <CardContent>
            {needsInit ? (
              <div className="space-y-4 text-center">
                <p className="text-slate-300 text-sm">El sistema no ha sido inicializado. Cree la cuenta de administrador para comenzar.</p>
                <Button onClick={handleInit} disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Inicializando...</> : 'Inicializar Sistema'}
                </Button>
              </div>
            ) : blocked ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center"><AlertCircle className="w-12 h-12 text-red-500" /></div>
                <p className="text-red-400 font-medium">Acceso bloqueado por demasiados intentos fallidos.</p>
                <p className="text-slate-400 text-sm">Intente nuevamente más tarde.</p>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input type="text" placeholder="Ingrese su clave de acceso" value={accessKey} onChange={(e) => setAccessKey(e.target.value.toUpperCase())} className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-yellow-500" disabled={loginLoading || waitTime > 0} maxLength={16} />
                </div>
                {loginError && <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2"><AlertCircle className="h-4 w-4" />{loginError}</p>}
                {waitTime > 0 && <p className="text-yellow-400 text-sm text-center">Espere {waitTime} segundos...</p>}
                {attemptsLeft < 3 && !blocked && <p className="text-yellow-400 text-sm text-center">Intentos restantes: {attemptsLeft}</p>}
                <Button type="submit" disabled={loginLoading || waitTime > 0 || !accessKey.trim()} className="w-full bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700 text-white font-medium py-2">
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
    <>
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && <h1 className="font-bold text-lg bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">Lo Mejor De España</h1>}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          <Button variant={view === 'forum' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={() => setView('forum')}>
            <Home className="h-4 w-4" />
            {sidebarOpen && 'Inicio'}
          </Button>
          <Button variant={view === 'messages' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2 relative" onClick={goToMessages}>
            <Mail className="h-4 w-4" />
            {sidebarOpen && 'Mensajes'}
            {unreadCount > 0 && <Badge className="absolute right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500">{unreadCount}</Badge>}
          </Button>
          {user.role === 'admin' && (
            <Button variant={view === 'admin' ? 'secondary' : 'ghost'} className="w-full justify-start gap-2" onClick={goToAdmin}>
              <Users className="h-4 w-4" />
              {sidebarOpen && 'Administrar'}
            </Button>
          )}
        </nav>
        
        <div className="p-2 border-t border-slate-700 space-y-1">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={goToProfile}>
            <Settings className="h-4 w-4" />
            {sidebarOpen && 'Mi Perfil'}
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-2 text-red-400 hover:text-red-300" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            {sidebarOpen && 'Salir'}
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800/50 border-b border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {view !== 'forum' && (
                <Button variant="ghost" size="sm" onClick={goToForum}>
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </Button>
              )}
              <h2 className="text-xl font-semibold">
                {view === 'forum' && 'Foro'}
                {view === 'topic' && selectedTopic?.name}
                {view === 'subtopic' && selectedSubtopic?.name}
                {view === 'chat' && `Chat: ${selectedTopic?.name}`}
                {view === 'admin' && 'Administración'}
                {view === 'messages' && 'Mensajes'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); handleSearch(); }} className="w-48 bg-slate-700/50 border-slate-600" />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              {showSearch && searchResults && (
                <div className="absolute top-16 right-4 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-2 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-sm font-medium">Resultados</span>
                    <Button variant="ghost" size="sm" onClick={() => { setShowSearch(false); setSearchResults(null); setSearchQuery(''); }}><X className="h-4 w-4" /></Button>
                  </div>
                  {searchResults.topics.length === 0 && searchResults.subtopics.length === 0 && searchResults.posts.length === 0 ? (
                    <p className="p-4 text-slate-400 text-sm text-center">No se encontraron resultados</p>
                  ) : (
                    <div className="p-2 space-y-2">
                      {searchResults.topics.map(t => (
                        <button key={t.id} onClick={() => { const topic = topics.find(tp => tp.id === t.id); if (topic) goToTopic(topic); setShowSearch(false); }} className="w-full text-left p-2 hover:bg-slate-700 rounded">
                          <p className="text-sm font-medium">{t.title}</p>
                          <p className="text-xs text-slate-400">Tema</p>
                        </button>
                      ))}
                      {searchResults.subtopics.map(s => (
                        <button key={s.id} onClick={() => { for (const t of topics) { const st = t.subtopics.find(sb => sb.id === s.id); if (st) { setSelectedTopic(t); goToSubtopic(st); break; } } setShowSearch(false); }} className="w-full text-left p-2 hover:bg-slate-700 rounded">
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-slate-400">Subtema</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <span className="text-sm text-slate-400">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* Vista: Foro principal */}
          {view === 'forum' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Temas</h3>
                {user.role === 'admin' && (
                  <Button onClick={() => setShowNewTopic(true)} className="bg-gradient-to-r from-red-600 to-yellow-600">
                    <Plus className="mr-2 h-4 w-4" />Nuevo Tema
                  </Button>
                )}
              </div>
              {topics.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <p className="text-slate-400">No hay temas aún.</p>
                    {user.role === 'admin' && <p className="text-sm text-slate-500 mt-2">Crea el primer tema para comenzar.</p>}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {topics.map(topic => (
                    <Card key={topic.id} className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <button onClick={() => goToTopic(topic)} className="text-left flex-1">
                            <h4 className="font-semibold text-lg">{topic.name}</h4>
                            {topic.description && <p className="text-sm text-slate-400 mt-1">{topic.description}</p>}
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                              <span>{topic._count.subtopics} subtemas</span>
                              <span>{topic._count.chatMessages} mensajes en chat</span>
                            </div>
                          </button>
                          {user.role === 'admin' && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => { setEditingTopic(topic); setEditTopicName(topic.name); setEditTopicDesc(topic.description || ''); }}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteTopic(topic.id)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </div>
                        {topic.subtopics.length > 0 && (
                          <div className="mt-4 pl-4 border-l-2 border-slate-700 space-y-2">
                            {topic.subtopics.map(st => (
                              <button key={st.id} onClick={() => { setSelectedTopic(topic); goToSubtopic(st); }} className="w-full text-left p-2 hover:bg-slate-700/50 rounded flex justify-between items-center">
                                <span>{st.name}</span>
                                <span className="text-xs text-slate-400">{st._count.posts} posts</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vista: Tema */}
          {view === 'topic' && selectedTopic && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium">{selectedTopic.name}</h3>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowNewSubtopic(true)}>
                    <Plus className="mr-2 h-4 w-4" />Nuevo Subtema
                  </Button>
                  <Button variant="outline" onClick={goToChat}>
                    <MessageSquare className="mr-2 h-4 w-4" />Chat
                  </Button>
                </div>
              </div>
              {selectedTopic.subtopics.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <p className="text-slate-400">No hay subtemas. Crea uno para empezar a discutir.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {selectedTopic.subtopics.map(st => (
                    <Card key={st.id} className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors cursor-pointer" onClick={() => goToSubtopic(st)}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{st.name}</h4>
                          <p className="text-xs text-slate-400">Creado por {st.creator.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-slate-400">{st._count.posts} publicaciones</span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Vista: Subtema */}
          {view === 'subtopic' && selectedSubtopic && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">{selectedSubtopic.name}</h3>
                <Button onClick={() => setShowNewPostForm(true)} className="bg-gradient-to-r from-red-600 to-yellow-600">
                  <Plus className="mr-2 h-4 w-4" />Nueva Publicación
                </Button>
              </div>
              {posts.length === 0 ? (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <p className="text-slate-400">No hay publicaciones aún.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.filter(p => !p.parentId).map(post => (
                    <Card key={post.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold">{post.author.name}</span>
                            <span className="text-xs text-slate-400 ml-2">{formatDate(post.createdAt)}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleLike(post.id, 'like')} className={post.userLike === 'like' ? 'text-green-400' : ''}>
                              <ThumbsUp className="h-4 w-4" />
                              <span className="ml-1 text-xs">{post.likesCount}</span>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleLike(post.id, 'dislike')} className={post.userLike === 'dislike' ? 'text-red-400' : ''}>
                              <ThumbsDown className="h-4 w-4" />
                              <span className="ml-1 text-xs">{post.dislikesCount}</span>
                            </Button>
                            {post.author.id === user.id && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => { setEditingPost(post.id); setEditContent(post.content); }}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                              </>
                            )}
                          </div>
                        </div>
                        {editingPost === post.id ? (
                          <div className="space-y-2">
                            <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="bg-slate-700 border-slate-600" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updatePost(post.id)}>Guardar</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingPost(null)}>Cancelar</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <ContentWithLinks content={post.content} />
                            {post.attachments?.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {post.attachments.map(att => renderAttachment(att))}
                              </div>
                            )}
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(post)} className="mt-2">
                          <Reply className="h-4 w-4 mr-1" /> Responder
                        </Button>
                        {post.repliesCount > 0 && (
                          <Collapsible open={expandedPosts.has(post.id)} onOpenChange={(open) => { const newSet = new Set(expandedPosts); if (open) newSet.add(post.id); else newSet.delete(post.id); setExpandedPosts(newSet); }}>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="ml-2">
                                {post.repliesCount} respuesta(s) <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expandedPosts.has(post.id) ? 'rotate-180' : ''}`} />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="mt-3 pl-4 border-l-2 border-slate-700 space-y-3">
                                {posts.filter(r => r.parentId === post.id).map(reply => (
                                  <div key={reply.id} className="p-3 bg-slate-700/30 rounded">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-sm">{reply.author.name}</span>
                                      <span className="text-xs text-slate-400">{formatDate(reply.createdAt)}</span>
                                    </div>
                                    <ContentWithLinks content={reply.content} />
                                    {reply.attachments?.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {reply.attachments.map(att => renderAttachment(att, true))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
                    {/* Vista: Chat */}
          {view === 'chat' && selectedTopic && (
            <div className="flex flex-col h-[calc(100vh-180px)]">
              <div ref={chatRef} className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-800/30 rounded-lg">
                {chatMessages.length === 0 ? (
                  <p className="text-slate-400 text-center">No hay mensajes. ¡Sé el primero!</p>
                ) : (
                  chatMessages.map(msg => (
                    <div key={msg.id} className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{msg.user.name}</span>
                        <span className="text-xs text-slate-400">{formatDate(msg.createdAt)}</span>
                      </div>
                      <ContentWithLinks content={msg.message} />
                      {msg.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.attachments.map(att => renderAttachment(att, true))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Textarea value={newChatMessage} onChange={(e) => setNewChatMessage(e.target.value)} placeholder="Escribe un mensaje..." className="bg-slate-700 border-slate-600" rows={2} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }} />
                <div className="flex flex-col gap-2">
                  <FileUpload onUploadComplete={(files) => setChatAttachments(prev => [...prev, ...files])} allowedTypes="all" maxFiles={3} />
                  <Button onClick={sendChatMessage} disabled={!newChatMessage.trim() && chatAttachments.length === 0} className="bg-gradient-to-r from-red-600 to-yellow-600">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Vista: Mensajes */}
          {view === 'messages' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Tabs value={messageTab} onValueChange={(v) => setMessageTab(v as 'received' | 'sent')}>
                  <TabsList>
                    <TabsTrigger value="received">Recibidos {messages.filter(m => !m.isRead).length > 0 && `(${messages.filter(m => !m.isRead).length})`}</TabsTrigger>
                    <TabsTrigger value="sent">Enviados</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button onClick={handleOpenNewMessage} className="bg-gradient-to-r from-red-600 to-yellow-600">
                  <Plus className="mr-2 h-4 w-4" />Nuevo Mensaje
                </Button>
              </div>
              <TabsContent value="received">
                {messages.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700"><CardContent className="p-8 text-center"><p className="text-slate-400">No tienes mensajes.</p></CardContent></Card>
                ) : (
                  <div className="space-y-2">
                    {messages.map(msg => (
                      <Collapsible key={msg.id} open={expandedMessages.has(msg.id)} onOpenChange={(open) => { const newSet = new Set(expandedMessages); if (open) { newSet.add(msg.id); if (!msg.isRead) markAsRead(msg.id); } else newSet.delete(msg.id); setExpandedMessages(newSet); }}>
                        <Card className={`bg-slate-800/50 border-slate-700 ${!msg.isRead ? 'border-l-4 border-l-yellow-500' : ''}`}>
                          <CardHeader className="p-3">
                            <CollapsibleTrigger className="w-full">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {!msg.isRead && <Circle className="h-2 w-2 text-yellow-500" />}
                                  <span className="font-semibold">{msg.subject}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                  <span>De: {msg.sender.name}</span>
                                  <span>{formatDate(msg.createdAt)}</span>
                                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedMessages.has(msg.id) ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </CollapsibleTrigger>
                          </CardHeader>
                          <CollapsibleContent>
                            <CardContent className="pt-0 space-y-4">
                              <ContentWithLinks content={msg.content} />
                              {msg.attachments?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {msg.attachments.map(att => renderAttachment(att))}
                                </div>
                              )}
                              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                                <Button size="sm" variant="outline" onClick={() => { setNewMessageRecipient(msg.sender.id); setNewMessageSubject(`Re: ${msg.subject}`); setShowNewMessage(true); }}>Responder</Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteMessage(msg.id)} className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="sent">
                {sentMessages.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700"><CardContent className="p-8 text-center"><p className="text-slate-400">No has enviado mensajes.</p></CardContent></Card>
                ) : (
                  <div className="space-y-2">
                    {sentMessages.map(msg => (
                      <Collapsible key={msg.id} open={expandedMessages.has(msg.id)} onOpenChange={(open) => { const newSet = new Set(expandedMessages); if (open) newSet.add(msg.id); else newSet.delete(msg.id); setExpandedMessages(newSet); }}>
                        <Card className="bg-slate-800/50 border-slate-700">
                          <CardHeader className="p-3">
                            <CollapsibleTrigger className="w-full">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold">{msg.subject}</span>
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                  <span>Para: {msg.receiver.name}</span>
                                  <span>{formatDate(msg.createdAt)}</span>
                                  <ChevronDown className={`h-4 w-4 transition-transform ${expandedMessages.has(msg.id) ? 'rotate-180' : ''}`} />
                                </div>
                              </div>
                            </CollapsibleTrigger>
                          </CardHeader>
                          <CollapsibleContent>
                            <CardContent className="pt-0 space-y-4">
                              <ContentWithLinks content={msg.content} />
                              {msg.attachments?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {msg.attachments.map(att => renderAttachment(att))}
                                </div>
                              )}
                            </CardContent>
                          </CollapsibleContent>
                        </Card>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          )}

          {/* Vista: Admin */}
          {view === 'admin' && user.role === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Gestión de Usuarios</h3>
                <Button onClick={() => setShowInviteUser(true)} className="bg-gradient-to-r from-red-600 to-yellow-600">
                  <UserPlus className="mr-2 h-4 w-4" />Invitar Usuario
                </Button>
              </div>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="p-3 text-left">Usuario</th>
                          <th className="p-3 text-left">Email</th>
                          <th className="p-3 text-left">Rol</th>
                          <th className="p-3 text-left">Estado</th>
                          <th className="p-3 text-left">Clave de Acceso</th>
                          <th className="p-3 text-left">Última actividad</th>
                          <th className="p-3 text-left">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(member => (
                          <tr key={member.id} className="border-t border-slate-700">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {member.role === 'admin' && <Crown className="h-4 w-4 text-yellow-500" />}
                                {member.name}
                              </div>
                            </td>
                            <td className="p-3 text-slate-400">{member.email}</td>
                            <td className="p-3">
                              <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>{member.role}</Badge>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                {member.isActive ? <UserCheck className="h-4 w-4 text-green-400" /> : <UserX className="h-4 w-4 text-red-400" />}
                                <span className={member.isActive ? 'text-green-400' : 'text-red-400'}>{member.isActive ? 'Activo' : 'Inactivo'}</span>
                                {isUserOnline(member.lastActiveAt) && <span className="text-xs text-green-400">(online)</span>}
                              </div>
                            </td>
                            <td className="p-3">
                              <code className="text-xs bg-slate-700 px-2 py-1 rounded">{member.keyIsPrivate ? '••••••••••••••••' : member.accessKey}</code>
                            </td>
                            <td className="p-3 text-slate-400 text-sm">
                              {member.lastActiveAt ? formatDate(member.lastActiveAt) : 'Nunca'}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => toggleUserActive(member.id)} title={member.isActive ? 'Desactivar' : 'Activar'}>
                                  {member.isActive ? <UserX className="h-4 w-4 text-red-400" /> : <UserCheck className="h-4 w-4 text-green-400" />}
                                </Button>
                                {member.id !== user.id && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => toggleUserRole(member.id)} title="Cambiar rol">
                                      <Crown className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => deleteUser(member.id)} className="text-red-400" title="Eliminar">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>

    {/* Diálogos */}
    {/* Diálogo: Nuevo Tema */}
    <Dialog open={showNewTopic} onOpenChange={setShowNewTopic}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>Nuevo Tema</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="Nombre del tema" className="bg-slate-700/50 border-slate-600" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Descripción (opcional)</label>
            <Textarea value={newTopicDesc} onChange={(e) => setNewTopicDesc(e.target.value)} placeholder="Descripción del tema" className="bg-slate-700/50 border-slate-600" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewTopic(false)}>Cancelar</Button>
            <Button onClick={createTopic} disabled={loading || !newTopicName.trim()} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Nuevo Subtema */}
    <Dialog open={showNewSubtopic} onOpenChange={setShowNewSubtopic}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>Nuevo Subtema</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input value={newSubtopicName} onChange={(e) => setNewSubtopicName(e.target.value)} placeholder="Nombre del subtema" className="bg-slate-700/50 border-slate-600" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowNewSubtopic(false)}>Cancelar</Button>
            <Button onClick={createSubtopic} disabled={loading || !newSubtopicName.trim()} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Crear</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Nueva Publicación */}
    <Dialog open={showNewPostForm} onOpenChange={setShowNewPostForm}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>Nueva Publicación</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Escribe tu publicación..." className="bg-slate-700/50 border-slate-600 min-h-[150px]" />
          <FileUpload onUploadComplete={(files) => setPostAttachments(prev => [...prev, ...files])} allowedTypes="all" maxFiles={5} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowNewPostForm(false); setPostAttachments([]); }}>Cancelar</Button>
            <Button onClick={createPost} disabled={loading || (!newPostContent.trim() && postAttachments.length === 0)} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publicar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Responder */}
    <Dialog open={!!replyingTo} onOpenChange={() => setReplyingTo(null)}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>Responder</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-slate-700/50 rounded text-sm">{replyingTo?.content}</div>
          <Textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Escribe tu respuesta..." className="bg-slate-700/50 border-slate-600" />
          <FileUpload onUploadComplete={(files) => setPostAttachments(prev => [...prev, ...files])} allowedTypes="all" maxFiles={5} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setReplyingTo(null); setPostAttachments([]); }}>Cancelar</Button>
            <Button onClick={createReply} disabled={loading || (!replyContent.trim() && postAttachments.length === 0)} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Responder</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Nuevo Mensaje */}
    <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>Nuevo Mensaje</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Para</label>
            <Select value={newMessageRecipient} onValueChange={setNewMessageRecipient}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600"><SelectValue placeholder="Seleccionar destinatario" /></SelectTrigger>
              <SelectContent>
                {allMembers.filter(m => m.id !== user?.id).map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Asunto</label>
            <Input value={newMessageSubject} onChange={(e) => setNewMessageSubject(e.target.value)} placeholder="Asunto del mensaje" className="bg-slate-700/50 border-slate-600" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Mensaje</label>
            <Textarea value={newMessageContent} onChange={(e) => setNewMessageContent(e.target.value)} placeholder="Escribe tu mensaje..." className="bg-slate-700/50 border-slate-600 min-h-[100px]" />
          </div>
          <FileUpload onUploadComplete={(files) => setMessageAttachments(prev => [...prev, ...files])} allowedTypes="all" maxFiles={5} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowNewMessage(false); setMessageAttachments([]); }}>Cancelar</Button>
            <Button onClick={sendMessage} disabled={loading || !newMessageRecipient || (!newMessageContent.trim() && messageAttachments.length === 0)} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Invitar Usuario */}
    <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
          <DialogDescription>Se generará una clave de acceso única para el nuevo usuario.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} placeholder="Nombre del usuario" className="bg-slate-700/50 border-slate-600" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} placeholder="email@ejemplo.com" className="bg-slate-700/50 border-slate-600" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInviteUser(false)}>Cancelar</Button>
            <Button onClick={inviteUser} disabled={loading || !newUserName.trim() || !newUserEmail.trim()} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Invitar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Clave de invitado */}
    <Dialog open={!!invitedUserKey} onOpenChange={() => setInvitedUserKey(null)}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle>¡Usuario Invitado!</DialogTitle>
          <DialogDescription>Comparte esta información con el nuevo usuario. La clave es única y confidencial.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Nombre:</span><span className="font-medium">{invitedUserKey?.name}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-400">Email:</span><span className="font-medium">{invitedUserKey?.email}</span></div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Clave de acceso:</span>
              <div className="flex items-center gap-2">
                <code className="px-2 py-1 bg-slate-600 rounded font-mono text-yellow-400">{invitedUserKey?.accessKey}</code>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(invitedUserKey?.accessKey || '')}>{copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}</Button>
              </div>
            </div>
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-200"><strong>Importante:</strong> Guarda esta clave en un lugar seguro. El usuario la necesitará para acceder al foro.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setInvitedUserKey(null)}>Cerrar</Button>
            <Button onClick={() => { const message = getInvitationMessage(); navigator.clipboard.writeText(message); setCopied(true); }} className="bg-gradient-to-r from-red-600 to-yellow-600"><Copy className="mr-2 h-4 w-4" />Copiar mensaje completo</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Perfil */}
    <Dialog open={showProfile} onOpenChange={setShowProfile}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>Mi Perfil</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} className="bg-slate-700/50 border-slate-600" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="bg-slate-700/50 border-slate-600" />
          </div>
          {newKeyGenerated && (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-200 mb-2"><strong>¡Nueva clave generada!</strong></p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2 py-1 bg-slate-600 rounded font-mono text-yellow-400">{newKeyGenerated}</code>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newKeyGenerated)}><Copy className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => updateProfile(false)} disabled={loading} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar cambios</Button>
            <Button variant="outline" onClick={() => updateProfile(true)} disabled={loading}><Key className="mr-2 h-4 w-4" />Generar nueva clave</Button>
          </div>
          <div className="pt-4 border-t border-slate-700">
            <Button variant="ghost" onClick={deleteAccount} className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><UserX className="mr-2 h-4 w-4" />Darse de baja</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Editar Tema */}
    <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>Editar Tema</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input value={editTopicName} onChange={(e) => setEditTopicName(e.target.value)} className="bg-slate-700/50 border-slate-600" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Descripción</label>
            <Textarea value={editTopicDesc} onChange={(e) => setEditTopicDesc(e.target.value)} className="bg-slate-700/50 border-slate-600" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingTopic(null)}>Cancelar</Button>
            <Button onClick={editTopic} disabled={loading || !editTopicName.trim()} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Diálogo: Editar Subtema */}
    <Dialog open={!!editingSubtopic} onOpenChange={() => setEditingSubtopic(null)}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader><DialogTitle>Editar Subtema</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Nombre</label>
            <Input value={editSubtopicName} onChange={(e) => setEditSubtopicName(e.target.value)} className="bg-slate-700/50 border-slate-600" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingSubtopic(null)}>Cancelar</Button>
            <Button onClick={editSubtopic} disabled={loading || !editSubtopicName.trim()} className="bg-gradient-to-r from-red-600 to-yellow-600">{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
