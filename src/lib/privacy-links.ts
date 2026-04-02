// Utilidades para proteger la privacidad de los usuarios al acceder a enlaces externos

// Instancias de Invidious (frontend privado de YouTube)
const INVIDIOUS_INSTANCES = [
  'yewtu.be',
  'vid.puffyan.us',
  'invidious.snopyta.org',
  'invidious.kavin.rocks',
];

// Instancias de Piped (alternativa privada a YouTube)
const PIPED_INSTANCES = [
  'piped.video',
  'piped.kavin.rocks',
  'piped.silkky.cloud',
];

/**
 * Convierte un enlace de YouTube a una instancia privada (Invidious/Piped)
 */
export function convertToPrivateLink(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // YouTube
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        // Usar Invidious
        const instance = INVIDIOUS_INSTANCES[0];
        return `https://${instance}/watch?v=${videoId}`;
      }
    }
    
    // Twitter/X -> Nitter
    if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
      const path = urlObj.pathname;
      const instance = 'nitter.net';
      return `https://${instance}${path}`;
    }
    
    return url;
  } catch {
    return url;
  }
}

/**
 * Extrae el ID de video de un enlace de YouTube
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Formato youtube.com/watch?v=xxx
    if (urlObj.searchParams.has('v')) {
      return urlObj.searchParams.get('v');
    }
    
    // Formato youtu.be/xxx
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1).split('?')[0];
    }
    
    // Formato youtube.com/embed/xxx
    if (urlObj.pathname.startsWith('/embed/')) {
      return urlObj.pathname.slice(7);
    }
    
    // Formato youtube.com/shorts/xxx
    if (urlObj.pathname.startsWith('/shorts/')) {
      return urlObj.pathname.slice(8);
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Detecta si un enlace es de una plataforma de video conocida
 */
export function isVideoPlatform(url: string): boolean {
  const videoPlatforms = [
    'youtube.com', 'youtu.be',
    'vimeo.com',
    'rumble.com',
    'odysee.com',
    'bitchute.com',
    'tiktok.com',
  ];
  
  try {
    const urlObj = new URL(url);
    return videoPlatforms.some(platform => urlObj.hostname.includes(platform));
  } catch {
    return false;
  }
}

/**
 * Detecta si un enlace es de YouTube
 */
export function isYouTubeLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
  } catch {
    return false;
  }
}

/**
 * Detecta si un enlace es de Twitter/X
 */
export function isTwitterLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com');
  } catch {
    return false;
  }
}

/**
 * Detecta si un enlace es externo al foro
 */
export function isExternalLink(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const foroDomains = ['lomejordeespana.es', 'foro-lomejordeespana.vercel.app', 'localhost'];
    return !foroDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Obtiene el nombre de la plataforma desde una URL
 */
export function getPlatformName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    const platforms: Record<string, string> = {
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'vimeo.com': 'Vimeo',
      'rumble.com': 'Rumble',
      'odysee.com': 'Odysee',
      'bitchute.com': 'BitChute',
      'tiktok.com': 'TikTok',
      'twitter.com': 'Twitter/X',
      'x.com': 'Twitter/X',
      'facebook.com': 'Facebook',
      'instagram.com': 'Instagram',
    };
    
    for (const [domain, name] of Object.entries(platforms)) {
      if (hostname.includes(domain)) {
        return name;
      }
    }
    
    return hostname;
  } catch {
    return 'sitio externo';
  }
}

/**
 * Procesa el contenido de un post/mensaje para detectar enlaces
 * y convertirlos a formato seguro con advertencia
 */
export function processContentWithLinks(content: string): Array<{
  type: 'text' | 'link';
  content: string;
  url?: string;
  platform?: string;
  isYouTube?: boolean;
  isTwitter?: boolean;
}> {
  // Regex para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  
  return parts.map(part => {
    if (part.match(urlRegex)) {
      const url = part;
      return {
        type: 'link' as const,
        content: url,
        url: url,
        platform: getPlatformName(url),
        isYouTube: isYouTubeLink(url),
        isTwitter: isTwitterLink(url),
      };
    }
    return {
      type: 'text' as const,
      content: part,
    };
  });
}
