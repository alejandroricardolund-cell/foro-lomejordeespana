'use client';

import { useState } from 'react';

export default function TestUploadPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult('Subiendo...');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'forum');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Test de Upload (API real)</h1>
      <p>Selecciona una imagen para probar:</p>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleUpload}
        disabled={loading}
        style={{ marginBottom: '20px', display: 'block' }}
      />
      <pre style={{ 
        background: '#1a1a1a', 
        color: '#fff', 
        padding: '20px', 
        borderRadius: '8px',
        overflow: 'auto',
        minHeight: '100px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all'
      }}>
        {result || 'Resultado aparecerá aquí...'}
      </pre>
    </div>
  );
}
