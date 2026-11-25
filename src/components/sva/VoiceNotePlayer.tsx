import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Trash2, Sparkles, Loader2, FileText, Volume2 } from 'lucide-react';
import { SvaVoiceNote } from '../../types/sva';
import { cn } from '../../utils/cn';

interface VoiceNotePlayerProps {
  note: SvaVoiceNote;
  onDelete?: () => void;
  onTranscribe?: (note: SvaVoiceNote) => Promise<void>;
  onInsertTranscript?: (transcript: string) => void;
  compact?: boolean;
}

export function formatAudioTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  note,
  onDelete,
  onTranscribe,
  onInsertTranscript,
  compact = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(note.durationSeconds || 0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(Boolean(note.transcript));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDuration(note.durationSeconds || 0);
  }, [note.durationSeconds]);

  useEffect(() => {
    if (note.transcript) {
      setShowTranscript(true);
    }
  }, [note.transcript]);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setError('Unable to play this audio clip in the current browser.');
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    if (audio && Number.isFinite(nextTime)) {
      audio.currentTime = nextTime;
    }
  };

  const handleTranscribeClick = async () => {
    if (!onTranscribe) return;
    setError(null);
    setIsTranscribing(true);
    try {
      await onTranscribe(note);
      setShowTranscript(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Transcription failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const effectiveDuration = duration > 0 ? duration : 1;

  return (
    <div
      className={cn(
        'rounded-2xl border border-blush/80 bg-ivory-paper/90 transition-all space-y-2',
        compact ? 'p-3' : 'p-3.5'
      )}
    >
      <audio
        ref={audioRef}
        src={note.audioDataUrl}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
          className="w-8 h-8 rounded-xl bg-forest text-ivory hover:bg-forest-hover flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-soft-sm"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-heading font-semibold text-charcoal flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-rose" />
              Voice Note
            </span>
            <span className="font-mono text-charcoal-muted">
              {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={effectiveDuration}
            step={0.1}
            value={Math.min(currentTime, effectiveDuration)}
            onChange={handleSeek}
            aria-label="Seek voice note"
            className="w-full h-1.5 accent-rose bg-blush rounded-full cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onTranscribe && !note.transcript && (
            <button
              type="button"
              onClick={handleTranscribeClick}
              disabled={isTranscribing}
              className="px-2.5 py-1 rounded-xl border border-forest/20 bg-white text-[11px] font-heading font-semibold text-forest hover:bg-forest-ultraLight transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Transcribe voice note to text"
            >
              {isTranscribing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-gold" />
              )}
              <span>{isTranscribing ? 'Transcribing...' : 'Transcribe'}</span>
            </button>
          )}

          {note.transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript((prev) => !prev)}
              className="p-1.5 rounded-lg text-charcoal-muted hover:text-forest hover:bg-blush/40 transition-colors cursor-pointer"
              title={showTranscript ? 'Hide transcript' : 'Show transcript'}
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Remove voice note"
              className="p-1.5 rounded-lg text-charcoal-muted hover:text-rose hover:bg-rose/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-rose font-medium">{error}</p>
      )}

      {showTranscript && note.transcript && (
        <div className="p-2.5 rounded-xl bg-white border border-blush/70 text-xs text-charcoal leading-relaxed space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-forest">
              Transcript
            </span>
            {onInsertTranscript && (
              <button
                type="button"
                onClick={() => onInsertTranscript(note.transcript!)}
                className="text-[11px] font-heading font-semibold text-rose hover:underline cursor-pointer"
              >
                + Append to Entry
              </button>
            )}
          </div>
          <p className="text-charcoal-muted">{note.transcript}</p>
        </div>
      )}
    </div>
  );
};
