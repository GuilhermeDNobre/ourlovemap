import { useState, useEffect, useRef } from 'react';
import { Search, X, Repeat, Check } from 'lucide-react';
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

interface TimeRangeSliderProps {
  start: number;
  end: number;
  min: number;
  max: number;
  minGap: number;
  onStartChange: (v: number) => void;
  onEndChange: (v: number) => void;
}

function TimeRangeSlider({ start, end, min, max, minGap, onStartChange, onEndChange }: TimeRangeSliderProps) {
  const range = max - min;
  const startPct = ((start - min) / range) * 100;
  const endPct = ((end - min) / range) * 100;
  const trackStyle = {
    background: `linear-gradient(to right,
      #E0DCE5 ${startPct}%,
      #F56C73 ${startPct}%,
      #F56C73 ${endPct}%,
      #E0DCE5 ${endPct}%)`,
  };
  return (
    <>
      <style>{`
        .tlrs { -webkit-appearance:none; appearance:none; width:100%; height:6px;
          background:transparent; outline:none; position:absolute; top:50%; transform:translateY(-50%); margin:0; pointer-events:none; }
        .tlrs::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:20px; height:20px;
          border-radius:50%; background:#fff; border:2.5px solid #F56C73;
          box-shadow:0 2px 6px rgba(245,108,115,0.35); cursor:pointer; pointer-events:all; }
        .tlrs::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:#fff;
          border:2.5px solid #F56C73; box-shadow:0 2px 6px rgba(245,108,115,0.35); cursor:pointer; pointer-events:all; }
      `}</style>
      <div className="relative h-10 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full" style={trackStyle} />
        <input
          type="range"
          className="tlrs"
          min={min}
          max={max - minGap}
          value={start}
          onChange={(e) => onStartChange(Number(e.target.value))}
          style={{ zIndex: startPct >= 50 ? 5 : 3 }}
          aria-label="Tempo de início"
        />
        <input
          type="range"
          className="tlrs"
          min={min + minGap}
          max={max}
          value={end}
          onChange={(e) => onEndChange(Number(e.target.value))}
          style={{ zIndex: startPct >= 50 ? 3 : 5 }}
          aria-label="Tempo de fim"
        />
      </div>
    </>
  );
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
    <div className="flex flex-col gap-6">
      {!hasTrack && (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buscar música ou colar link do YouTube..."
              className="w-full pl-9 pr-4 py-[11px] rounded-md border border-[1.5px] border-olm-surface focus:border-olm-accent outline-none text-sm text-fg-2 font-sans bg-olm-bg-elevated"
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
          {isSearching && (
            <div className="flex flex-col gap-2 rounded-xl border border-olm-surface bg-olm-bg-elevated p-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-16 h-12 rounded bg-olm-surface-soft" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded bg-olm-surface-soft w-4/5" />
                    <div className="h-3 rounded bg-olm-surface-soft w-3/5" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {results.length > 0 && !isSearching && (
            <div className="flex flex-col gap-1 rounded-xl border border-olm-surface bg-olm-bg-elevated p-2">
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
          <div className="flex items-center gap-3 rounded-xl border border-olm-surface bg-olm-bg-elevated p-3">
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
          <div className="flex flex-col gap-3 bg-olm-bg-elevated rounded-xl border border-olm-surface p-4">
            <div className="flex justify-between text-xs text-fg-2">
              <span>Início <span className="font-mono text-olm-primary font-semibold">{formatTime(music.startTime)}</span></span>
              <span>Fim <span className="font-mono text-olm-primary font-semibold">{formatTime(music.endTime)}</span></span>
            </div>
            <TimeRangeSlider
              start={music.startTime}
              end={music.endTime}
              min={0}
              max={MAX_END_TIME}
              minGap={MIN_CLIP_DURATION}
              onStartChange={handleStartChange}
              onEndChange={handleEndChange}
            />
            <label className="flex items-center gap-3 cursor-pointer select-none rounded-lg border border-olm-surface bg-[color-mix(in_srgb,var(--olm-primary)_6%,transparent)] px-3 py-2">
              <span
                className={[
                  'w-5 h-5 rounded-md border flex items-center justify-center transition-all',
                  music.loop
                    ? 'bg-olm-primary border-olm-primary text-white'
                    : 'bg-olm-bg-elevated border-olm-surface text-transparent',
                ].join(' ')}
              >
                <Check size={13} strokeWidth={3} />
              </span>
              <input
                type="checkbox"
                checked={music.loop}
                onChange={(e) => updateMusic({ loop: e.target.checked })}
                className="sr-only"
                aria-label="Repetir em loop"
              />
              <span className="flex items-center gap-1.5 text-sm text-fg-1">
                <Repeat size={14} />
                Repetir em loop
              </span>
            </label>
          </div>
        </div>
      )}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-4">
        <Button variant="ghost" size="md" onClick={onBack} className="w-full sm:w-auto justify-center">
          Voltar
        </Button>
        <Button variant="primary" size="lg" onClick={onNext} className="w-full sm:w-auto justify-center">
          Continuar
        </Button>
      </div>
    </div>
  );
}
