'use client';

import { useState, useCallback } from 'react';
import { useUploadThing } from '@/lib/uploadthing-client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, X, File, Image, Music, FileText, Loader2, 
  CheckCircle, AlertCircle, Trash2 
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
  endpoint: 'imageUploader' | 'audioUploader' | 'documentUploader' | 'mediaUploader';
  maxFiles?: number;
  disabled?: boolean;
  existingFiles?: UploadedFile[];
  onRemoveExisting?: (index: number) => void;
}

export function FileUpload({
  onUploadComplete,
  onUploadError,
  endpoint,
  maxFiles = 5,
  disabled = false,
  existingFiles = [],
  onRemoveExisting,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      if (res) {
        const files: UploadedFile[] = res.map((file) => ({
          url: file.url,
          key: file.key,
          name: file.name,
          size: file.size,
          type: file.type || 'unknown',
        }));
        setUploadedFiles((prev) => [...prev, ...files]);
        onUploadComplete(files);
      }
      setUploading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    },
    onUploadError: (error) => {
      setError(error.message);
      setUploading(false);
      setProgress(0);
      onUploadError?.(error);
    },
    onUploadProgress: (p) => {
      setProgress(p);
    },
  });

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

      try {
        await startUpload(Array.from(files));
      } catch (err) {
        setError('Error al subir archivos');
        setUploading(false);
      }
    },
    [startUpload, maxFiles, existingFiles.length, uploadedFiles.length]
  );

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
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
          id="file-upload"
          accept={
            endpoint === 'imageUploader'
              ? 'image/*'
              : endpoint === 'audioUploader'
              ? 'audio/*'
              : endpoint === 'documentUploader'
              ? '.pdf,.ppt,.pptx,.doc,.docx'
              : undefined
          }
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
            {endpoint === 'imageUploader' && 'Imágenes (máx. 8MB, hasta 5)'}
            {endpoint === 'audioUploader' && 'Audio (máx. 32MB, hasta 3)'}
            {endpoint === 'documentUploader' && 'PDF, PPT, PPTX (máx. 16MB)'}
            {endpoint === 'mediaUploader' && 'Imágenes, audio o documentos'}
          </span>
        </label>
      </div>

      {uploading && progress > 0 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-slate-400 text-center">{progress}%</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Archivos adjuntos:</p>
          {existingFiles.map((file, index) => (
            <div
              key={`existing-${index}`}
              className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg"
            >
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
              {onRemoveExisting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveExisting(index)}
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">Subidos ({uploadedFiles.length}):</p>
          {uploadedFiles.map((file, index) => (
            <div
              key={file.key}
              className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg"
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <span className="text-xs text-slate-400">{formatSize(file.size)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
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
