'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, File, Image, Music, Loader2, CheckCircle, AlertCircle, Trash2, Video } from 'lucide-react';

export interface UploadedFile {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  onUploadComplete: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  allowedTypes?: 'all' | 'images' | 'audio' | 'video' | 'documents';
  maxFiles?: number;
  disabled?: boolean;
  existingFiles?: UploadedFile[];
  onRemoveExisting?: (index: number) => void;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  allowedTypes = 'all',
  maxFiles = 5,
  disabled = false,
  existingFiles = [],
  onRemoveExisting,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', file.type.startsWith('image/') ? 'images' : 'forum');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMsg = 'Error al subir archivo';
      try {
        const data = await response.json();
        errorMsg = data.error || data.details || errorMsg;
      } catch {
        errorMsg = `Error ${response.status}`;
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.file;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalFiles = existingFiles.length + uploadedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      setError(`Máximo ${maxFiles} archivos`);
      return;
    }

    setError(null);
    setUploading(true);

    const uploadedResults: UploadedFile[] = [];

    try {
      for (const file of Array.from(files)) {
        const result = await uploadFile(file);
        uploadedResults.push(result);
      }

      setUploadedFiles(prev => [...prev, ...uploadedResults]);
      onUploadComplete(uploadedResults);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir';
      setError(msg);
      onUploadError?.(err instanceof Error ? err : new Error(msg));
    } finally {
      setUploading(false);
    }

    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getAcceptTypes = () => {
    if (allowedTypes === 'images') return 'image/*';
    if (allowedTypes === 'audio') return 'audio/*';
    if (allowedTypes === 'video') return 'video/*';
    return 'image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.md';
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4 text-blue-400" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4 text-purple-400" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4 text-red-400" />;
    return <File className="h-4 w-4 text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalFiles = existingFiles.length + uploadedFiles.length;

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-yellow-500 transition-colors">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={disabled || uploading || totalFiles >= maxFiles}
          className="hidden"
          id="file-upload-input"
          accept={getAcceptTypes()}
        />
        <label 
          htmlFor="file-upload-input"
          className={`cursor-pointer flex flex-col items-center gap-2 ${disabled || totalFiles >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {uploading ? <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" /> : <Upload className="h-8 w-8 text-slate-400" />}
          <span className="text-sm text-slate-400">
            {uploading ? 'Subiendo...' : 'Haz clic para subir archivos'}
          </span>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((file, index) => (
            <div key={`ex-${index}`} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded">
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate">{file.name}</span>
              {onRemoveExisting && (
                <Button variant="ghost" size="sm" onClick={() => onRemoveExisting(index)} className="h-6 w-6 p-0 text-red-400">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, i) => (
            <div key={`up-${i}`} className="flex items-center gap-2 p-2 bg-green-900/20 rounded">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
              <Button variant="ghost" size="sm" onClick={() => removeFile(i)} className="h-6 w-6 p-0 text-red-400">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
