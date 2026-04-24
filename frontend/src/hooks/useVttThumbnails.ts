import { useState, useEffect } from 'react';
import { api } from '@/services/apiClient';

interface VttThumbnail {
  startTime: number;
  endTime: number;
  image: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function useVttThumbnails(vttUrl: string | null) {
  const [thumbnails, setThumbnails] = useState<VttThumbnail[]>([]);

  useEffect(() => {
    if (!vttUrl) {
      setThumbnails([]);
      return;
    }

    // Use api instance to include authorization token
    api.get(vttUrl, { responseType: 'text' })
      .then((res) => {
        const parsed = parseVtt(res.data, vttUrl);
        setThumbnails(parsed);

        // Pre-load images to avoid flickering on first hover
        const uniqueImages = Array.from(new Set(parsed.map(t => t.image)));
        uniqueImages.forEach(src => {
          const img = new Image();
          img.src = src;
        });
      })
      .catch((err) => {
        console.error('Failed to load VTT thumbnails:', err);
        setThumbnails([]);
      });
  }, [vttUrl]);

  return thumbnails;
}

function parseVtt(text: string, baseUrl: string): VttThumbnail[] {
  const lines = text.split(/\r?\n/);
  const results: VttThumbnail[] = [];
  let current: Partial<VttThumbnail> | null = null;

  const timeRegex = /(\d{2}:\d{2}:\d{2}.\d{3}) --> (\d{2}:\d{2}:\d{2}.\d{3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const timeMatch = line.match(timeRegex);
    if (timeMatch) {
      current = {
        startTime: parseTime(timeMatch[1]),
        endTime: parseTime(timeMatch[2]),
      };
    } else if (current && line.includes('#xywh=')) {
      const [urlPart, coordsPart] = line.split('#xywh=');
      const [x, y, w, h] = coordsPart.split(',').map(Number);
      
      // Resolve image URL relative to VTT
      const absoluteImageUrl = new URL(urlPart, baseUrl).href;

      results.push({
        ...(current as any),
        image: absoluteImageUrl,
        x, y, w, h
      });
      current = null;
    }
  }

  return results;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':');
  const secondsParts = parts[2].split('.');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(secondsParts[0], 10);
  const ms = parseInt(secondsParts[1], 10);
  return hours * 3600 + minutes * 60 + seconds + ms / 1000;
}
