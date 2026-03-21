'use client';

import { useState } from 'react';
import { FileUpload, UploadedFile } from '@/components/file-upload';

export default function TestUploadPage() {
  const [result, setResult] = useState<string>('');
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const handleComplete = (uploaded: UploadedFile[]) => {
    setFiles(prev => [...prev, ...uploaded]);
    setResult('Subido correctamente:\n' + JSON.stringify(uploaded, null, 2));
  };

  const handleError = (err: Error) => {
    setResult('Error: ' + err.message);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test FileUpload Component</h1>
      
      <FileUpload 
        onUploadComplete={handleComplete}
        onUploadError={handleError}
        allowedTypes="all"
        maxFiles={3}
      />

      <pre style={{ 
        background: '#1a1a1a', 
        color: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
      }}>
        {result || 'Resultado aparecerá aquí...'}
      </pre>

      {files.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h3>Archivos subidos:</h3>
          {files.map((f, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <a href={f.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>
                {f.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
