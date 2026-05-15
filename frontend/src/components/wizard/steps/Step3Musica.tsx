import { useState, useEffect, useRef } from 'react';
import { Search, X, Repeat } from 'lucide-react';
import { useWizardStore } from '../../../stores/wizard-store';
import type { MusicData } from '../../../stores/wizard-store';
import type { YouTubeResult } from '../../../lib/youtube-api';
import { searchYouTube } from '../../../lib/youtube-api';
import { extractYoutubeId } from '../../../lib/youtube';
import { Button } from '../../ui/Button';

const MAX_END_TIME = 272;
const MAX_START_TIME = 270;
const MIN_CLIP_DURATION = 5;
const DEFAULT_END_TIME = 30;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function isLikelyUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://');
}

interface Step3MusicaProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step3Musica({ onNext, onBack }: Step3MusicaProps) {
  const { music, setField } = useWizardStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [quotaError, setQuotaError] = useState(false);
  const [urlError, setUrlError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTrack = !!music.videoId;

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const updateMusic = (patch: Partial<MusicData>) => {
    setField('music', { ...music, ...patch });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setUrlError('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    if (isLikelyUrl(value)) {
      const videoId = extractYoutubeId(value);
      if (videoId) {
        setResults([]);
        setField('music', { ...music, videoId, query: 'Vídeo do YouTube', startTime: 0, endTime: DEFAULT_END_TIME });
        setQuery('');
      } else {
        setUrlError('URL inválida. Use um link do YouTube.');
      }
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setQuotaError(false);
      try {
        const data = await searchYouTube(value);
        setResults(data);
      } catch (err) {
        if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
          setQuotaError(true);
        }
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectTrack = (track: YouTubeResult) => {
    setField('music', { ...music, videoId: track.videoId, query: track.title, startTime: 0, endTime: DEFAULT_END_TIME });
    setResults([]);
    setQuery('');
  };

  const handleRemoveTrack = () => {
    setField('music', { ...music, videoId: '', query: '', startTime: 0, endTime: 0 });
    setResults([]);
  };

  const handleStartChange = (value: number) => {
    const newStart = Math.min(value, MAX_START_TIME);
    const newEnd = Math.max(music.endTime, newStart + MIN_CLIP_DURATION);
    setField('music', { ...music, startTime: newStart, endTime: Math.min(newEnd, MAX_END_TIME) });
  };

  const handleEndChange = (value: number) => {
    const newEnd = Math.max(value, music.startTime + MIN_CLIP_DURATION);
    setField('music', { ...music, endTime: Math.min(newEnd, MAX_END_TIME) });
  };

  return (
    <div className="flex flex-col gap-5">
      {!hasTrack && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buscar música ou colar link do YouTube..."
              className="w-full pl-9 pr-4 py-[11px] rounded-md border border-[1.5px] border-[#E0DCE5] focus:border-olm-accent outline-none text-sm text-fg-2 font-sans"
            />
          </div>
          {urlError && (
            <p className="text-olm-error text-xs" role="alert">
              {urlError}
            </p>
          )}
          {quotaError && (
            <p className="text-olm-error text-xs" role="alert">
              Busca indisponível. Cole o link direto do YouTube.
            </p>
          )}
          {isSearching && <p className="text-fg-3 text-xs">Buscando...</p>}
          {results.length > 0 && !isSearching && (
            <div className="flex flex-col gap-1 rounded-xl border border-olm-surface bg-white p-2">
              {results.map((result) => (
                <button
                  key={result.videoId}
                  type="button"
                  onClick={() => handleSelectTrack(result)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-olm-surface text-left transition-colors"
                >
                  <img
                    src={result.thumbnailUrl}
                    alt={result.title}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <span className="text-sm text-fg-2 line-clamp-2">{result.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {hasTrack && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-olm-surface bg-white p-3">
            <img
              src={`https://img.youtube.com/vi/${music.videoId}/default.jpg`}
              alt={music.query || 'Música selecionada'}
              className="w-20 h-[60px] object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-olm-title truncate">
                {music.query || 'Vídeo do YouTube'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveTrack}
              className="text-fg-3 hover:text-olm-error transition-colors flex-shrink-0"
              aria-label="Remover música"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex flex-col gap-4 bg-white rounded-xl border border-olm-surface p-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-fg-3">
                <span>Início</span>
                <span className="font-mono">{formatTime(music.startTime)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={MAX_START_TIME}
                value={music.startTime}
                onChange={(e) => handleStartChange(Number(e.target.value))}
                className="w-full accent-olm-primary"
                aria-label="Tempo de início"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs text-fg-3">
                <span>Fim</span>
                <span className="font-mono">{formatTime(music.endTime)}</span>
              </div>
              <input
                type="range"
                min={music.startTime + MIN_CLIP_DURATION}
                max={MAX_END_TIME}
                value={music.endTime}
                onChange={(e) => handleEndChange(Number(e.target.value))}
                className="w-full accent-olm-accent"
                aria-label="Tempo de fim"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={music.loop}
                onChange={(e) => updateMusic({ loop: e.target.checked })}
                className="w-4 h-4 accent-olm-primary"
                aria-label="Repetir em loop"
              />
              <span className="flex items-center gap-1.5 text-sm text-fg-2">
                <Repeat size={14} />
                Repetir em loop
              </span>
            </label>
          </div>
        </div>
      )}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" size="md" onClick={onBack}>
          Voltar
        </Button>
        <Button variant="primary" size="lg" onClick={onNext}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
