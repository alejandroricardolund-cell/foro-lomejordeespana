'use client';

import { useState } from 'react';
import { FileUpload, UploadedFile } from '@/components/file-upload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function TestUploadPage() {
  const [result, setResult] = useState<string>('');
  const [postAttachments, setPostAttachments] = useState<UploadedFile[]>([]);
  const [chatAttachments, setChatAttachments] = useState<UploadedFile[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePostComplete = (files: UploadedFile[]) => {
    setPostAttachments(prev => [...prev, ...files]);
    setResult('Post attachments:\n' + JSON.stringify(files, null, 2));
  };

  const handleChatComplete = (files: UploadedFile[]) => {
    setChatAttachments(prev => [...prev, ...files]);
    setResult('Chat attachments:\n' + JSON.stringify(files, null, 2));
  };

  const handleError = (err: Error) => {
    setResult('ERROR: ' + err.message + '\n\nStack: ' + err.stack);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test FileUpload - Simulación Foro</h1>

      <h2 style={{ marginTop: '30px' }}>1. FileUpload directo (como nuevo post)</h2>
      <FileUpload 
        onUploadComplete={handlePostComplete}
        onUploadError={handleError}
        allowedTypes="all"
        maxFiles={5}
        existingFiles={postAttachments}
        onRemoveExisting={(index) => setPostAttachments(prev => prev.filter((_, i) => i !== index))}
      />

      <h2 style={{ marginTop: '30px' }}>2. FileUpload dentro de Dialog (como respuesta)</h2>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>Abrir Dialog de Respuesta</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Sube un archivo:</p>
            <FileUpload 
              onUploadComplete={(files) => {
                setPostAttachments(prev => [...prev, ...files]);
                setResult('Respuesta attachments:\n' + JSON.stringify(files, null, 2));
              }}
              onUploadError={handleError}
              allowedTypes="all"
              maxFiles={3}
            />
          </div>
        </DialogContent>
      </Dialog>

      <h2 style={{ marginTop: '30px' }}>3. FileUpload Chat</h2>
      <FileUpload 
        onUploadComplete={handleChatComplete}
        onUploadError={handleError}
        allowedTypes="all"
        maxFiles={3}
        existingFiles={chatAttachments}
        onRemoveExisting={(index) => setChatAttachments(prev => prev.filter((_, i) => i !== index))}
      />

      <pre style={{ 
        background: '#1a1a1a', 
        color: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        minHeight: '100px'
      }}>
        {result || 'Resultado aparecerá aquí...'}
      </pre>

      <div style={{ marginTop: '20px' }}>
        <h3>Estado actual:</h3>
        <p>Post attachments: {postAttachments.length}</p>
        <p>Chat attachments: {chatAttachments.length}</p>
      </div>
    </div>
  );
}
