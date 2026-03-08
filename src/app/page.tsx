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
  const
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-600 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">ES</span>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 bg-clip-text text-transparent">
              Lo Mejor De España
            </CardTitle>
            <CardDescription className="text-slate-400 text-lg">
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
                
                <p className="text-slate-500 text-xs text-center mt-4">
                  Foro exclusivo de invitación privada
                </p>
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
          {/* Vista: Foro principal (lista de temas) */}
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
                                  onClick={() => {
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
                                  onClick={() => deleteTopic(topic.id)}
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
                    {/* Vista: Tema (lista de subtemas y chat) */}
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
                  selectedTopic.subtopics.map((subtopic) => (
                    <Card 
                      key={subtopic.id} 
                      className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => goToSubtopic(subtopic)}
                          >
                            <h4 className="font-medium">{subtopic.name}</h4>
                            <p className="text-sm text-slate-500">
                              Por {subtopic.creator.name} • {subtopic._count.posts} publicaciones
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(user.role === 'admin' || user.id === subtopic.creator.id) && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingSubtopic(subtopic);
                                    setEditSubtopicName(subtopic.name);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteSubtopic(subtopic.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                </Button>
                              </>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => goToSubtopic(subtopic)}>
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

          {/* Vista: Chat del tema */}
          {view === 'chat' && selectedTopic && (
            <div className="flex flex-col h-full">
              <div 
                ref={chatRef}
                className="flex-1 overflow-y-auto space-y-2 mb-4 p-2 bg-slate-800/30 rounded-lg"
              >
                {chatMessages.length === 0 ? (
                  <p className="text-center text-slate-400 py-4">No hay mensajes en el chat.</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex gap-2">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-yellow-500 flex items-center justify-center text-sm font-bold">
                          {msg.user.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-700/50 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{msg.user.name}</span>
                          <span className="text-xs text-slate-500">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-slate-300">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Escribir mensaje..."
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

          {/* Vista: Subtema (lista de posts) */}
          {view === 'subtopic' && selectedSubtopic && (
            <div className="space-y-4">
              {/* Formulario de nueva publicación */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <Textarea
                    placeholder="Escribe una nueva publicación..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="bg-slate-700 border-slate-600 mb-2"
                    rows={3}
                  />
                  <Button onClick={createPost} disabled={loading || !newPostContent.trim()}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Publicar
                  </Button>
                </CardContent>
              </Card>

              {/* Lista de publicaciones */}
              <div className="space-y-4">
                {posts.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-6 text-center text-slate-400">
                      No hay publicaciones aún. ¡Sé el primero!
                    </CardContent>
                  </Card>
                ) : (
                  posts.map((post) => (
                    <Card key={post.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
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
                          <>
                            <p className="whitespace-pre-wrap">{post.content}</p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                              <div className="text-sm text-slate-500">
                                Por {post.author.name} • {formatDate(post.createdAt)}
                                {post.updatedAt !== post.createdAt && ' (editado)'}
                              </div>
                              <div className="flex items-center gap-2">
                                {/* Likes */}
                                <div className="flex items-center gap-1">
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
                                  <Reply className="h-4 w-4" />
                                </Button>
                                
                                {(user.role === 'admin' || user.id === post.author.id) && (
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
                                      onClick={() => deletePost(post.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-400" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Formulario de respuesta */}
                            {replyingTo?.id === post.id && (
                              <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                                <p className="text-sm text-slate-400">Respondiendo a {post.author.name}</p>
                                <Textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder="Escribe tu respuesta..."
                                  className="bg-slate-700 border-slate-600"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={createReply} disabled={loading || !replyContent.trim()}>
                                    Responder
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {/* Respuestas */}
                            {post.repliesCount > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-700">
                                <p className="text-sm text-slate-500">{post.repliesCount} respuestas</p>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Vista: Mensajes privados */}
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
                          className="w-full mt-1 bg-slate-700 border border-slate-600 rounded p-2"
                        >
                          <option value="">Seleccionar destinatario</option>
                          {allMembers
                            .filter(m => m.id !== user.id && m.isActive)
                            .map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))
                          }
                        </select>
                      </div>
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
                        className="bg-slate-700 border-slate-600"
                        rows={4}
                      />
                      <Button onClick={sendMessage} disabled={loading || !newMessageRecipient || !newMessageContent.trim()}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
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
                        No tienes mensajes.
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

          {/* Vista: Panel de Administración */}
          {view === 'admin' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Gestión de Usuarios</h3>
                <Dialog open={showInviteUser} onOpenChange={setShowInviteUser}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />Invitar Usuario
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
                        placeholder="Email"
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
              
              {/* Modal para mostrar clave de invitado */}
              {invitedUserKey && (
                <Card className="bg-green-900/30 border-green-700 mb-4">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-green-400 mb-2">¡Usuario invitado!</h4>
                    <p className="text-sm text-slate-300 mb-2">
                      <strong>{invitedUserKey.name}</strong> ({invitedUserKey.email})
                    </p>
                    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded mb-3">
                      <Key className="h-4 w-4 text-yellow-500" />
                      <code className="text-yellow-400 font-mono">{invitedUserKey.accessKey}</code>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(invitedUserKey.accessKey)}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-slate-800 p-3 rounded text-sm mb-3">
                      <p className="text-slate-400 mb-1">Mensaje para compartir:</p>
                      <pre className="text-slate-300 whitespace-pre-wrap text-xs">{getInvitationMessage()}</pre>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setInvitedUserKey(null)}>
                      Cerrar
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              <div className="grid gap-3">
                {members.map((member) => (
                  <Card key={member.id} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-yellow-500 flex items-center justify-center font-bold">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            {isUserOnline(member.lastActiveAt) && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.name}</span>
                              {member.role === 'admin' && <Crown className="h-4 w-4 text-yellow-500" />}
                              {!member.isActive && <Badge variant="destructive" className="text-xs">Inactivo</Badge>}
                            </div>
                            <p className="text-sm text-slate-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => toggleUserActive(member.id)}
                          >
                            {member.isActive ? <Circle className="h-4 w-4 text-green-500" /> : <CheckCircle className="h-4 w-4 text-slate-500" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => toggleUserRole(member.id)}
                            disabled={member.id === user.id}
                          >
                            {member.role === 'admin' ? <Crown className="h-4 w-4 text-yellow-500" /> : <User className="h-4 w-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteUser(member.id)}
                            disabled={member.id === user.id}
                          >
                            <UserX className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
            
            {newKeyGenerated && (
              <div className="bg-green-900/30 border border-green-700 rounded p-3">
                <p className="text-sm text-green-400 mb-1">¡Nueva clave generada!</p>
                <div className="flex items-center gap-2">
                  <code className="text-yellow-400 font-mono">{newKeyGenerated}</code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(newKeyGenerated)}
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Guárdala en un lugar seguro</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={() => updateProfile(false)} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Guardar
              </Button>
              <Button variant="outline" onClick={() => updateProfile(true)} disabled={loading}>
                Generar Nueva Clave
              </Button>
            </div>
            
            <div className="pt-4 border-t border-slate-700">
              <Button variant="destructive" size="sm" onClick={deleteAccount}>
                Darse de baja
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
