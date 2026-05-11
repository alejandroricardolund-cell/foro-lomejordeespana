'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, X, File, Image, Music, FileText, Loader2, 
  CheckCircle, AlertCircle, Trash2, Video 
} from 'lucide-react';
import { useUploadThing } from "@uploadthing/react";

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
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { startUpload } = useUploadThing("fileUploader", {
    onClientUploadComplete: (res) => {
      const files = res.map(file => ({
        url: file.url,
        key: file.key,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
      }));
      setUploadedFiles(prev => [...prev, ...files]);
      onUploadComplete(files);
      setUploading(false);
      setProgress(100);
    },
    onUploadError: (error) => {
      setError(error.message);
      onUploadError?.(error);
      setUploading(false);
    },
    onUploadProgress: (progress) => {
      setProgress(Math.round(progress));
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const totalFiles = existingFiles.length + uploadedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      setError(`Máximo ${maxFiles} archivos permitidos`);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      await startUpload(Array.from(files));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al subir archivos';
      setError(errorMsg);
      onUploadError?.(err instanceof Error ? err : new Error(errorMsg));
      setUploading(false);
    } finally {
      setTimeout(() => setProgress(0), 2000);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4 text-blue-400" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4 text-purple-400" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4 text-red-400" />;
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('presentation') || type.includes('powerpoint')) return <FileText className="h-4 w-4 text-orange-400" />;
    if (type.includes('document') || type.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    return <File className="h-4 w-4 text-slate-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAcceptTypes = () => {
    switch (allowedTypes) {
      case 'images': return 'image/*';
      case 'audio': return 'audio/*';
      case 'video': return 'video/*';
      case 'documents': return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.md,.txt,.json,.csv,.note,.pages,.numbers,.key,.rtf,.odt,.ods,.odp';
      default: return '*/*';
    }
  };

  const getTypeLabel = () => {
    switch (allowedTypes) {
      case 'images': return 'Imágenes - máx. 32MB';
      case 'audio': return 'Audio - máx. 32MB';
      case 'video': return 'Video - máx. 32MB';
      case 'documents': return 'Documentos (PDF, PPT...) - máx. 32MB';
      default: return 'Cualquier archivo - máx. 32MB';
    }
  };

  const totalFiles = existingFiles.length + uploadedFiles.length;

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-yellow-500 transition-colors">
        <input type="file" multiple onChange={handleFileChange} disabled={disabled || uploading || totalFiles >= maxFiles} className="hidden" id="file-upload" accept={getAcceptTypes()} />
        <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center gap-2 ${disabled || totalFiles >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {uploading ? <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" /> : <Upload className="h-8 w-8 text-slate-400" />}
          <span className="text-sm text-slate-400">{uploading ? 'Subiendo...' : totalFiles >= maxFiles ? 'Límite alcanzado' : 'Haz clic para subir archivos'}</span>
          <span className="text-xs text-slate-500">{getTypeLabel()}</span>
          <span className="text-xs text-slate-500">{totalFiles}/{maxFiles} archivos</span>
        </label>
      </div>

      {uploading && progress > 0 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2 bg-slate-700" />
          <p className="text-xs text-slate-400 text-center">{progress}%</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Archivos adjuntos:</p>
          {existingFiles.map((file, index) => (
            <div key={`existing-${index}`} className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg">
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate text-slate-200">{file.name}</span>
              <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
              {onRemoveExisting && <Button variant="ghost" size="sm" onClick={() => onRemoveExisting(index)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Subidos ({uploadedFiles.length}):</p>
          {uploadedFiles.map((file, index) => (
            <div key={file.key} className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-800/30 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate text-slate-200">{file.name}</span>
              <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
              <Button variant="ghost" size="sm" onClick={() => removeFile(index)} className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
