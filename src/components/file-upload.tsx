'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, X, File, Image, Music, FileText, Loader2, 
  CheckCircle, AlertCircle, Trash2, Video 
} from 'lucide-react';

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

  const uploadFile = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Determinar carpeta según tipo
    let folder = 'forum';
    if (file.type.startsWith('image/')) folder = 'images';
    else if (file.type.startsWith('audio/')) folder = 'audio';
    else if (file.type.startsWith('video/')) folder = 'videos';
    else if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('presentation')) folder = 'documents';
    
    formData.append('folder', folder);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error al subir archivo');
    }

    const data = await response.json();
    return data.file;
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const uploadedResults: UploadedFile[] = [];
      const totalSize = Array.from(files).reduce((acc, f) => acc + f.size, 0);
      let uploadedSize = 0;

      try {
        for (const file of Array.from(files)) {
          const result = await uploadFile(file);
          uploadedResults.push(result);
          uploadedSize += file.size;
          setProgress(Math.round((uploadedSize / totalSize) * 100));
        }

        setUploadedFiles((prev) => [...prev, ...uploadedResults]);
        onUploadComplete(uploadedResults);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al subir archivos';
        setError(errorMsg);
        onUploadError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setUploading(false);
        setTimeout(() => setProgress(0), 1000);
      }

      // Reset input
      e.target.value = '';
    },
    [maxFiles, existingFiles.length, uploadedFiles.length, onUploadComplete, onUploadError]
  );

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
      case 'images':
        return 'image/*';
      case 'audio':
        return 'audio/*';
      case 'video':
        return 'video/*';
      case 'documents':
        return '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx';
      default:
        return 'image/*,audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx';
    }
  };

  const getTypeLabel = () => {
    switch (allowedTypes) {
      case 'images':
        return 'Imágenes (JPG, PNG, GIF, WebP) - máx. 20MB';
      case 'audio':
        return 'Audio (MP3, WAV, OGG) - máx. 20MB';
      case 'video':
        return 'Video (MP4, WebM, MOV) - máx. 50MB';
      case 'documents':
        return 'Documentos (PDF, Word, PowerPoint, Excel) - máx. 20MB';
      default:
        return 'Imágenes, audio, video o documentos';
    }
  };

  const totalFiles = existingFiles.length + uploadedFiles.length;

  return (
    <div className="space-y-3">
      {/* Área de subida */}
      <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-yellow-500 transition-colors">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={disabled || uploading || totalFiles >= maxFiles}
          className="hidden"
          id="file-upload"
          accept={getAcceptTypes()}
        />
        <label
          htmlFor="file-upload"
          className={`cursor-pointer flex flex-col items-center gap-2 ${
            disabled || totalFiles >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-yellow-500 animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-slate-400" />
          )}
          <span className="text-sm text-slate-400">
            {uploading
              ? 'Subiendo...'
              : totalFiles >= maxFiles
              ? 'Límite alcanzado'
              : 'Haz clic para subir archivos'}
          </span>
          <span className="text-xs text-slate-500">
            {getTypeLabel()}
          </span>
          <span className="text-xs text-slate-500">
            {totalFiles}/{maxFiles} archivos
          </span>
        </label>
      </div>

      {/* Barra de progreso */}
      {uploading && progress > 0 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2 bg-slate-700" />
          <p className="text-xs text-slate-400 text-center">{progress}%</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Archivos existentes */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Archivos adjuntos:</p>
          {existingFiles.map((file, index) => (
            <div
              key={`existing-${index}`}
              className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg"
            >
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate text-slate-200">{file.name}</span>
              <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
              {onRemoveExisting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveExisting(index)}
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Archivos subidos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-green-400 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Subidos ({uploadedFiles.length}):
          </p>
          {uploadedFiles.map((file, index) => (
            <div
              key={file.key}
              className="flex items-center gap-2 p-2 bg-green-900/20 border border-green-800/30 rounded-lg"
            >
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate text-slate-200">{file.name}</span>
              <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
