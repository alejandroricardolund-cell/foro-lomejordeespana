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
  Menu, X, Key, User, UserX, Crown, Search, Reply, Circle, CheckCircle, XCircle, Copy, Check, File, Music,
  UserPlus, UserCheck
} from 'lucide-react';
import { FileUpload, UploadedFile } from '@/components/file-upload';
import { ContentWithLinks } from '@/components/external-link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  // Estados de autenticacion
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
  
  // Estados de navegacion
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
  
  // Estados de edicion
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
  
  // Estados de busqueda
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

  // Funciones de autenticacion
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
  
  // Manejar el boton atras del navegador
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
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, topics]);

  const handleInit = async () => {
    if (!confirm('Desea inicializar el sistema? Se creara una cuenta de administrador.')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/init', { method: 'POST' });
      const data = await res.json();
      
      if (data.success) {
        alert(`Administrador creado!\n\nSu clave de acceso es: ${data.accessKey}\n\nGUARDE ESTA CLAVE EN UN LUGAR SEGURO!`);
        setNeedsInit(false);
      } else {
        alert(data.error || 'Error al inicializar');
      }
    } catch (e) {
      alert('Error de conexion');
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
      setLoginError('Error de conexion');
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

  // Acciones de navegacion
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

  const goToProfile = () => {
    setShowProfile(true);
  };

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
    if (!confirm('Eliminar este tema y todo su contenido?')) return;
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
    if (!confirm('Eliminar este subtema y todas sus publicaciones?')) return;
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
    if (!confirm('Eliminar esta publicacion?')) return;
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
    if (!confirm('Eliminar este mensaje?')) return;
    try {
      await fetch(`/api/messages/${id}?userId=${user?.id}`, {
        method: 'DELETE'
      });
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

  // Gestion de usuarios (admin)
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
    if (!confirm('Esta seguro de eliminar este usuario? Esta accion no se puede deshacer.')) return;
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
    if (!confirm('Esta seguro de darse de baja? Esta accion no se puede deshacer.')) return;
    try {
      await fetch('/api/users/profile', { method: 'DELETE' });
      handleLogout();
    } catch (e) {
      console.error('Error deleting account:', e);
    }
  };

  // Busqueda
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

  // Funcion para renderizar attachments
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
            <img 
              src={getProxyUrl(att.url)} 
              alt={att.name} 
              className={`${isCompact ? 'max-w-[150px] max-h-[100px]' : 'max-w-full md:max-w-[400px] max-h-[300px]'} object-cover rounded border border-slate-600 hover:border-yellow-500 transition-colors cursor-pointer`}
              loading="lazy"
            />
          </a>
          <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{att.name}</p>
        </div>
      );
    }
    
    if (isVideo) {
      return (
        <div key={att.id} className={`${isCompact ? '' : 'my-2'}`}>
          <video 
            src={getProxyUrl(att.url)} 
            controls 
            className={`${isCompact ? 'max-w-[200px] max-h-[150px]' : 'max-w-full md:max-w-[500px] max-h-[300px]'} rounded border border-slate-600`}
            preload="metadata"
          >
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
      <a
        key={att.id}
        href={getProxyUrl(att.url)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded border border-slate-600 hover:border-yellow-500 transition-colors"
      >
        <File className="h-4 w-4 text-slate-400" />
        <div className="flex flex-col">
          <span className="text-sm truncate max-w-[150px]">{att.name}</span>
          <span className="text-xs text-slate-400">{formatSize(att.size)}</span>
        </div>
      </a>
    );
  };

  // Verificar si usuario esta en linea
  const isUserOnline = (lastActiveAt?: string) => {
    if (!lastActiveAt) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActiveAt) > fiveMinutesAgo;
  };
  
  // Generar mensaje para compartir
  // Generar mensaje para compartir
  const getInvitationMessage = () => {
    if (!invitedUserKey) return '';
    return `Has sido invitado al foro "Lo Mejor de España"!

Tu clave de acceso es: ${invitedUserKey.accessKey}

Entra en: https://lomejordeespana.es

Te esperamos!`;
  };

  // Funcion para abrir el dialogo de nuevo mensaje
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
              Lo Mejor de España
            </CardTitle>
            <CardDescription className="text-slate-300 text-lg mt-2">
              Foro Privado
            </CardDescription>
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
                <p className="text-slate-400 text-sm">Intente nuevamente mas tarde.</p>
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
    <>
    <div className="min-h-screen bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="font-bold text-lg bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
              Lo Mejor de España
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
                {view === 'messages' && 'Mensajes Privados'}
                {view === 'admin' && 'Administracion'}
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-48 bg-slate-700/50 border-slate-600"
                />
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute right-0 top-0 h-full"
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm hidden md:inline">{user.name}</span>
                {user.role === 'admin' && <Crown className="h-4 w-4 text-yellow-400" />}
              </div>
            </div>
          </div>
        </header>

        {/* Resultados de busqueda */}
        {showSearch && searchResults && (
          <Dialog open={showSearch} onOpenChange={setShowSearch}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle>Resultados de busqueda</DialogTitle>
                <DialogDescription>
                  Se encontraron {(searchResults.topics?.length || 0) + (searchResults.subtopics?.length || 0) + (searchResults.posts?.length || 0)} resultados
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {searchResults.topics?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Temas</h4>
                    {searchResults.topics.map(r => (
                      <Button key={r.id} variant="ghost" className="w-full justify-start" onClick={() => {
                        const topic = topics.find(t => t.id === r.id);
                        if (topic) goToTopic(topic);
                        setShowSearch(false);
                      }}>
                        {r.title}
                      </Button>
                    ))}
                  </div>
                )}
                
                {searchResults.subtopics?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Subtemas</h4>
                    {searchResults.subtopics.map(r => (
                      <Button key={r.id} variant="ghost" className="w-full justify-start" onClick={() => {
                        const topic = topics.find(t => t.id === r.topicId);
                        if (topic) {
                          setSelectedTopic(topic);
                          const subtopic = topic.subtopics.find(s => s.id === r.id);
                          if (subtopic) goToSubtopic(subtopic);
                        }
                        setShowSearch(false);
                      }}>
                        {r.title}
                      </Button>
                    ))}
                  </div>
                )}
                
                {searchResults.posts?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Publicaciones</h4>
                    {searchResults.posts.map(r => (
                      <Button key={r.id} variant="ghost" className="w-full justify-start text-left" onClick={() => {
                        const topic = topics.find(t => t.id === r.topicId);
                        if (topic) {
                          setSelectedTopic(topic);
                          const subtopic = topic.subtopics.find(s => s.id === r.subtopicId);
                          if (subtopic) goToSubtopic(subtopic);
                        }
                        setShowSearch(false);
                      }}>
                        <span className="truncate">{r.title}</span>
                      </Button>
                    ))}
                  </div>
                )}
                
                {!searchResults.topics?.length && !searchResults.subtopics?.length && !searchResults.posts?.length && (
                  <p className="text-slate-400 text-center py-4">No se encontraron resultados</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Contenido segun vista */}
        <main className="flex-1 overflow-y-auto p-4">
          {/* VISTA: Foro principal */}
          {view === 'forum' && (
            <div className="space-y-6">
              {user.role === 'admin' && (
                <div className="flex justify-end">
                  <Button onClick={() => setShowNewTopic(true)} className="bg-gradient-to-r from-red-600 to-yellow-600 hover:from-red-700 hover:to-yellow-700">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Tema
                  </Button>
                </div>
              )}
              
              <div className="grid gap-4">
                {topics.map(topic => (
                  <Card key={topic.id} className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors">
                    <CardHeader className="cursor-pointer" onClick={() => goToTopic(topic)}>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{topic.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' && (
                            <>
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                setEditingTopic(topic);
                                setEditTopicName(topic.name);
                                setEditTopicDesc(topic.description || '');
                              }}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => {
                                e.stopPropagation();
                                deleteTopic(topic.id);
                              }} className="text-red-400 hover:text-red-300">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {topic.description && (
                        <CardDescription>{topic.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{topic._count.subtopics} subtemas</span>
                        <span>|</span>
                        <span>{topic._count.chatMessages} mensajes en chat</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {topics.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay temas creados aun</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA: Tema */}
          {view === 'topic' && selectedTopic && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedTopic.name}</h3>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={goToChat}>
                    <MessageSquare className="mr-2 h-4 w-4" /> Chat del Tema
                  </Button>
                  
                    <Button onClick={() => setShowNewSubtopic(true)} className="bg-gradient-to-r from-red-600 to-yellow-600">
                      <Plus className="mr-2 h-4 w-4" /> Nuevo Subtema
                    </Button>
           
                </div>
              </div>
              
              <div className="grid gap-4">
                {selectedTopic.subtopics?.map(subtopic => (
                  <Card key={subtopic.id} className="bg-slate-800/50 border-slate-700 hover:border-yellow-500/50 transition-colors cursor-pointer" onClick={() => goToSubtopic(subtopic)}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{subtopic.name}</CardTitle>
                        {user.role === 'admin' && (
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingSubtopic(subtopic);
                              setEditSubtopicName(subtopic.name);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteSubtopic(subtopic.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>{subtopic._count.posts} publicaciones</span>
                        <span>|</span>
                        <span>Creado por {subtopic.creator.name}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {(!selectedTopic.subtopics || selectedTopic.subtopics.length === 0) && (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay subtemas en este tema</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA: Subtema */}
          {view === 'subtopic' && selectedSubtopic && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{selectedSubtopic.name}</h3>
                <Button onClick={() => setShowNewPostForm(!showNewPostForm)} className="bg-gradient-to-r from-red-600 to-yellow-600">
                  <Plus className="mr-2 h-4 w-4" /> Nueva Publicacion
                </Button>
              </div>
              
              {showNewPostForm && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-lg">Nueva Publicacion</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Escribe tu publicacion..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="min-h-[100px] bg-slate-700/50 border-slate-600"
                    />
                    <FileUpload
                      onUploadComplete={(files) => setPostAttachments(prev => [...prev, ...files])}
                      existingFiles={postAttachments}
                      onRemoveExisting={(index) => setPostAttachments(prev => prev.filter((_, i) => i !== index))}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                        setShowNewPostForm(false);
                        setNewPostContent('');
                        setPostAttachments([]);
                      }}>
                        Cancelar
                      </Button>
                      <Button onClick={createPost} disabled={loading || (!newPostContent.trim() && postAttachments.length === 0)} className="bg-gradient-to-r from-red-600 to-yellow-600">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Publicar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <div className="space-y-4">
                {posts.filter(p => !p.parentId).map(post => (
                  <Card key={post.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="font-bold">{post.author.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{post.author.name}</span>
                            <span className="text-xs text-slate-400">{formatDate(post.createdAt)}</span>
                            {post.createdAt !== post.updatedAt && (
                              <span className="text-xs text-slate-400">(editado)</span>
                            )}
                          </div>
                          
                          {editingPost === post.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-slate-700/50 border-slate-600"
                              />
                                                            
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
                          
                          <div className="flex items-center gap-4 mt-3">
                            <Button variant="ghost" size="sm" onClick={() => handleLike(post.id, 'like')} className={post.userLike === 'like' ? 'text-green-400' : ''}>
                              <ThumbsUp className="h-4 w-4 mr-1" /> {post.likesCount}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleLike(post.id, 'dislike')} className={post.userLike === 'dislike' ? 'text-red-400' : ''}>
                              <ThumbsDown className="h-4 w-4 mr-1" /> {post.dislikesCount}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(post)}>
                              <Reply className="h-4 w-4 mr-1" /> Responder
                            </Button>
                            {post.author.id === user.id && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setEditingPost(post.id);
                                  setEditContent(post.content);
                                }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deletePost(post.id)} className="text-red-400">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                          
                          {post.repliesCount > 0 && (
                            <div className="mt-4 pl-4 border-l-2 border-slate-700 space-y-4">
                              {posts.filter(p => p.parentId === post.id).map(reply => (
                                <div key={reply.id} className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-red-500/70 to-yellow-500/70 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-sm font-bold">{reply.author.name.charAt(0)}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
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
                                    <div className="flex items-center gap-4 mt-2">
                                      <Button variant="ghost" size="sm" onClick={() => handleLike(reply.id, 'like')} className={reply.userLike === 'like' ? 'text-green-400' : ''}>
                                        <ThumbsUp className="h-3 w-3 mr-1" /> {reply.likesCount}
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => handleLike(reply.id, 'dislike')} className={reply.userLike === 'dislike' ? 'text-red-400' : ''}>
                                        <ThumbsDown className="h-3 w-3 mr-1" /> {reply.dislikesCount}
                                      </Button>
                                      {reply.author.id === user.id && (
                                        <Button variant="ghost" size="sm" onClick={() => deletePost(reply.id)} className="text-red-400">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {replyingTo?.id === post.id && (
                            <div className="mt-4 pl-4 border-l-2 border-yellow-500/50">
                              <Textarea
                                placeholder="Escribe tu respuesta..."
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="min-h-[80px] bg-slate-700/50 border-slate-600"
                              />
                              <FileUpload
                                onUploadComplete={(files) => setPostAttachments(prev => [...prev, ...files])}
                                existingFiles={postAttachments}
                                onRemoveExisting={(index) => setPostAttachments(prev => prev.filter((_, i) => i !== index))}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button size="sm" variant="outline" onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                  setPostAttachments([]);
                                }}>
                                  Cancelar
                                </Button>
                                <Button size="sm" onClick={createReply} disabled={loading || (!replyContent.trim() && postAttachments.length === 0)} className="bg-gradient-to-r from-red-600 to-yellow-600">
                                  Responder
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {posts.filter(p => !p.parentId).length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay publicaciones aun</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VISTA: Chat */}
          {view === 'chat' && selectedTopic && (
            <div className="flex flex-col h-[calc(100vh-180px)]">
              <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-800/30 rounded-lg" ref={chatRef}>
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.user.id === user.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold">{msg.user.name.charAt(0)}</span>
                    </div>
                    <div className={`max-w-[70%] ${msg.user.id === user.id ? 'bg-red-600/20' : 'bg-slate-700/50'} rounded-lg p-3`}>
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
                  </div>
                ))}
                
                {chatMessages.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay mensajes en el chat aun</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escribe un mensaje..."
                    value={newChatMessage}
                    onChange={(e) => setNewChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendChatMessage())}
                    className="min-h-[60px] bg-slate-700/50 border-slate-600"
                  />
                  <Button onClick={sendChatMessage} disabled={(!newChatMessage.trim() && chatAttachments.length === 0)} className="bg-gradient-to-r from-red-600 to-yellow-600 self-end">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <FileUpload
                  onUploadComplete={(files) => setChatAttachments(prev => [...prev, ...files])}
                  existingFiles={chatAttachments}
                  onRemoveExisting={(index) => setChatAttachments(prev => prev.filter((_, i) => i !== index))}
                />
              </div>
            </div>
          )}

          {/* VISTA: Mensajes privados */}
          {view === 'messages' && (
            <Tabs value={messageTab} onValueChange={(v) => setMessageTab(v as 'received' | 'sent')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="received">Recibidos {messages.filter(m => !m.isRead).length > 0 && `(${messages.filter(m => !m.isRead).length})`}</TabsTrigger>
                <TabsTrigger value="sent">Enviados</TabsTrigger>
              </TabsList>
              
              <TabsContent value="received" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Button onClick={handleOpenNewMessage} className="bg-gradient-to-r from-red-600 to-yellow-600">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Mensaje
                  </Button>
                </div>
                
                {messages.map(msg => (
                  <Card key={msg.id} className={`bg-slate-800/50 border-slate-700 ${!msg.isRead ? 'border-l-4 border-l-yellow-500' : ''}`}>
                    <Collapsible open={expandedMessages.has(msg.id)} onOpenChange={(open) => {
                      const newExpanded = new Set(expandedMessages);
                      if (open) {
                        newExpanded.add(msg.id);
                        if (!msg.isRead) markAsRead(msg.id);
                      } else {
                        newExpanded.delete(msg.id);
                      }
                      setExpandedMessages(newExpanded);
                    }}>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                                <span className="font-bold">{msg.sender.name.charAt(0)}</span>
                              </div>
                              <div>
                                <CardTitle className="text-base">{msg.subject || '(Sin asunto)'}</CardTitle>
                                <p className="text-sm text-slate-400">De: {msg.sender.name} | {formatDate(msg.createdAt)}</p>
                              </div>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedMessages.has(msg.id) ? 'rotate-180' : ''}`} />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <ContentWithLinks content={msg.content} />
                          {msg.attachments?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {msg.attachments.map(att => renderAttachment(att))}
                            </div>
                          )}
                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                            <Button size="sm" variant="outline" onClick={() => {
                              setNewMessageRecipient(msg.sender.id);
                              setNewMessageSubject(`Re: ${msg.subject || '(Sin asunto)'}`);
                              setShowNewMessage(true);
                            }}>
                              <Reply className="mr-2 h-4 w-4" /> Responder
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteMessage(msg.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
                
                {messages.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tienes mensajes</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="sent" className="space-y-4">
                {sentMessages.map(msg => (
                  <Card key={msg.id} className="bg-slate-800/50 border-slate-700">
                    <Collapsible open={expandedMessages.has(msg.id)} onOpenChange={(open) => {
                      const newExpanded = new Set(expandedMessages);
                      if (open) newExpanded.add(msg.id);
                      else newExpanded.delete(msg.id);
                      setExpandedMessages(newExpanded);
                    }}>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-slate-700/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-slate-600 rounded-full flex items-center justify-center">
                                <Send className="h-4 w-4" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{msg.subject || '(Sin asunto)'}</CardTitle>
                                <p className="text-sm text-slate-400">Para: {msg.receiver.name} | {formatDate(msg.createdAt)}</p>
                              </div>
                            </div>
                            <ChevronDown className={`h-4 w-4 transition-transform ${expandedMessages.has(msg.id) ? 'rotate-180' : ''}`} />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-4">
                          <ContentWithLinks content={msg.content} />
                          {msg.attachments?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {msg.attachments.map(att => renderAttachment(att))}
                            </div>
                          )}
                          <div className="flex justify-end pt-2 border-t border-slate-700">
                            <Button size="sm" variant="ghost" onClick={() => deleteMessage(msg.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
                
                {sentMessages.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No has enviado mensajes</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* VISTA: Admin */}
          {view === 'admin' && user.role === 'admin' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Administracion de Usuarios</h3>
                <Button onClick={() => setShowInviteUser(true)} className="bg-gradient-to-r from-red-600 to-yellow-600">
                  <UserPlus className="mr-2 h-4 w-4" /> Invitar Usuario
                </Button>
              </div>
              
              <div className="grid gap-4">
                {members.map(member => (
                  <Card key={member.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-full flex items-center justify-center">
                              <span className="font-bold">{member.name.charAt(0)}</span>
                            </div>
                            {isUserOnline(member.lastActiveAt) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{member.name}</span>
                              {member.role === 'admin' && <Crown className="h-4 w-4 text-yellow-400" />}
                              {!member.isActive && <Badge variant="destructive" className="text-xs">Inactivo</Badge>}
                            </div>
                            <p className="text-sm text-slate-400">{member.email}</p>
                            <p className="text-xs text-slate-500">
                              {member.lastActiveAt ? `Ultimo acceso: ${formatDate(member.lastActiveAt)}` : 'Nunca ha accedido'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {member.id !== user.id && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => toggleUserActive(member.id)} title={member.isActive ? 'Desactivar' : 'Activar'}>
                                {member.isActive ? <UserCheck className="h-4 w-4 text-green-400" /> : <UserX className="h-4 w-4 text-red-400" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => toggleUserRole(member.id)} title="Cambiar rol">
                                {member.role === 'admin' ? <Crown className="h-4 w-4 text-yellow-400" /> : <User className="h-4 w-4 text-slate-400" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteUser(member.id)} className="text-red-400 hover:text-red-300">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {members.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay usuarios registrados</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>

      {/* Dialogo: Nuevo Tema */}
      <Dialog open={showNewTopic} onOpenChange={setShowNewTopic}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Tema</DialogTitle>
            <DialogDescription>Los temas agrupan subtemas y tienen un chat general.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre del tema</label>
              <Input
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Ej: Gastronomia, Turismo..."
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descripcion (opcional)</label>
              <Textarea
                value={newTopicDesc}
                onChange={(e) => setNewTopicDesc(e.target.value)}
                placeholder="Breve descripcion del tema..."
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTopic(false)}>Cancelar</Button>
              <Button onClick={createTopic} disabled={loading || !newTopicName.trim()} className="bg-gradient-to-r from-red-600 to-yellow-600">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo: Editar Tema */}
      <Dialog open={!!editingTopic} onOpenChange={() => setEditingTopic(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Editar Tema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre del tema</label>
              <Input
                value={editTopicName}
                onChange={(e) => setEditTopicName(e.target.value)}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Descripcion</label>
              <Textarea
                value={editTopicDesc}
                onChange={(e) => setEditTopicDesc(e.target.value)}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTopic(null)}>Cancelar</Button>
              <Button onClick={editTopic} disabled={loading} className="bg-gradient-to-r from-red-600 to-yellow-600">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo: Nuevo Subtema */}
      <Dialog open={showNewSubtopic} onOpenChange={setShowNewSubtopic}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Subtema</DialogTitle>
            <DialogDescription>Los subtemas contienen las publicaciones del foro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre del subtema</label>
              <Input
                value={newSubtopicName}
                onChange={(e) => setNewSubtopicName(e.target.value)}
                placeholder="Ej: Recetas, Restaurantes..."
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewSubtopic(false)}>Cancelar</Button>
              <Button onClick={createSubtopic} disabled={loading || !newSubtopicName.trim()} className="bg-gradient-to-r from-red-600 to-yellow-600">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo: Editar Subtema */}
      <Dialog open={!!editingSubtopic} onOpenChange={() => setEditingSubtopic(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Editar Subtema</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre del subtema</label>
              <Input
                value={editSubtopicName}
                onChange={(e) => setEditSubtopicName(e.target.value)}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSubtopic(null)}>Cancelar</Button>
              <Button onClick={editSubtopic} disabled={loading} className="bg-gradient-to-r from-red-600 to-yellow-600">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
         

      {/* Dialogo: Nuevo Mensaje Privado */}
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Nuevo Mensaje Privado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Destinatario</label>
              <Select value={newMessageRecipient} onValueChange={setNewMessageRecipient}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue placeholder="Seleccionar destinatario" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {allMembers.filter(m => m.id !== user?.id).map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Asunto</label>
              <Input
                value={newMessageSubject}
                onChange={(e) => setNewMessageSubject(e.target.value)}
                placeholder="Asunto del mensaje..."
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mensaje</label>
              <Textarea
                value={newMessageContent}
                onChange={(e) => setNewMessageContent(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="min-h-[120px] bg-slate-700/50 border-slate-600"
              />
            </div>
            <FileUpload
              onUploadComplete={(files) => setMessageAttachments(prev => [...prev, ...files])}
              existingFiles={messageAttachments}
              onRemoveExisting={(index) => setMessageAttachments(prev => prev.filter((_, i) => i !== index))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowNewMessage(false);
                setMessageAttachments([]);
              }}>Cancelar</Button>
              <Button onClick={sendMessage} disabled={loading || (!newMessageContent.trim() && messageAttachments.length === 0) || !newMessageRecipient} className="bg-gradient-to-r from-red-600 to-yellow-600">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo: Invitar Usuario */}
      <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
            <DialogDescription>Se generara una clave de acceso unica para el nuevo usuario.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre</label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Nombre del usuario"
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowInviteUser(false)}>Cancelar</Button>
              <Button onClick={inviteUser} disabled={loading || !newUserName.trim() || !newUserEmail.trim()} className="bg-gradient-to-r from-red-600 to-yellow-600">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Invitar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo: Clave de invitado generada */}
      <Dialog open={!!invitedUserKey} onOpenChange={() => setInvitedUserKey(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Usuario Invitado!</DialogTitle>
            <DialogDescription>
              Comparte esta informacion con el nuevo usuario. La clave es unica y confidencial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-slate-700/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Nombre:</span>
                <span className="font-medium">{invitedUserKey?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Email:</span>
                <span className="font-medium">{invitedUserKey?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Clave de acceso:</span>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-slate-600 rounded font-mono text-yellow-400">{invitedUserKey?.accessKey}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(invitedUserKey?.accessKey || '')}>
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-200">
                <strong>Importante:</strong> Guarda esta clave en un lugar seguro. El usuario la necesitara para acceder al foro.
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInvitedUserKey(null)}>Cerrar</Button>
              <Button onClick={() => {
                const message = getInvitationMessage();
                navigator.clipboard.writeText(message);
                setCopied(true);
              }} className="bg-gradient-to-r from-red-600 to-yellow-600">
                <Copy className="mr-2 h-4 w-4" />
                Copiar mensaje completo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogo: Perfil */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle>Mi Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nombre</label>
              <Input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            
            {newKeyGenerated && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200 mb-2">
                  <strong>Nueva clave generada!</strong>
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1 bg-slate-600 rounded font-mono text-yellow-400">{newKeyGenerated}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(newKeyGenerated)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => updateProfile(false)} disabled={loading} className="bg-gradient-to-r from-red-600 to-yellow-600">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar cambios
              </Button>
              <Button variant="outline" onClick={() => updateProfile(true)} disabled={loading}>
                <Key className="mr-2 h-4 w-4" />
                Generar nueva clave
              </Button>
            </div>
            
            <div className="pt-4 border-t border-slate-700">
              <Button variant="ghost" onClick={deleteAccount} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <UserX className="mr-2 h-4 w-4" />
                Darse de baja
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
