'use client';

import { useState } from 'react';
import {
  ExternalLink as ExternalLinkIcon,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  convertToPrivateLink,
  isExternalLink,
  isYouTubeLink,
  getPlatformName,
} from '@/lib/privacy-links';

interface ExternalLinkProps {
  url: string;
  children?: React.ReactNode;
  className?: string;
}

export function ExternalLink({ url, children, className = '' }: ExternalLinkProps) {
  const [showWarning, setShowWarning] = useState(false);

  if (!isExternalLink(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {children || url}
      </a>
    );
  }

  const platform = getPlatformName(url);
  const isYouTube = isYouTubeLink(url);
  const privateUrl = isYouTube ? convertToPrivateLink(url) : url;

  const handleOpenLink = (usePrivateVersion: boolean) => {
    const finalUrl = usePrivateVersion && isYouTube ? privateUrl : url;
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
    setShowWarning(false);
  };

  if (isYouTube) {
    return (
      <>
        <button
          onClick={() => setShowWarning(true)}
          className={`inline-flex items-center gap-2 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 rounded border border-red-700/50 hover:border-red-600 transition-colors ${className}`}
        >
          <svg className="h-4 w-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span className="text-sm">Ver video</span>
          <Shield className="h-3 w-3 text-green-400" title="Ver con privacidad" />
        </button>

        <Dialog open={showWarning} onOpenChange={setShowWarning}>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
            <DialogHeader>
              <DialogTitle>🎬 Video de YouTube</DialogTitle>
              <DialogDescription className="text-slate-300 pt-2">
                El video se abrirá en una nueva pestaña.
              </DialogDescription>
            </DialogHeader>
            
            

              <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
                <div className="flex items-start gap-2">
                  <ExternalLinkIcon className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-300 font-medium">Opción estándar</p>
                    <p className="text-xs text-slate-400 mt-1">
                      YouTube puede rastrear tu visita.
                    </p>
                  </div>
                </div>
                <Button onClick={() => handleOpenLink(false)} variant="outline" className="w-full mt-3">
                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                  Ver en YouTube
                </Button>
              </div>
      
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowWarning(true)}
        className={`inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 hover:underline ${className}`}
      >
        {children || url}
        <ExternalLinkIcon className="h-3 w-3" />
      </button>

      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              Enlace externo
            </DialogTitle>
            <DialogDescription className="text-slate-300 pt-2">
              Estás a punto de salir del foro.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="p-3 bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-300"><strong>Plataforma:</strong> {platform}</p>
              <p className="text-xs text-slate-400 mt-1 break-all">{url.length > 60 ? url.substring(0, 60) + '...' : url}</p>
            </div>

            <div className="p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-200">
              ⚠️ Este sitio puede recopilar datos como tu IP y dispositivo.
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowWarning(false)} className="flex-1">Cancelar</Button>
              <Button onClick={() => { window.open(url, '_blank', 'noopener,noreferrer'); setShowWarning(false); }} className="flex-1 bg-blue-600 hover:bg-blue-700">Continuar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ContentWithLinksProps {
  content: string;
}

export function ContentWithLinks({ content }: ContentWithLinksProps) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);

  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return <ExternalLink key={index} url={part} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
