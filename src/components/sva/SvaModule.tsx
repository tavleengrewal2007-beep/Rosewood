import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Feather,
  Sparkles,
  Pin,
  Trash2,
  Edit3,
  Search,
  RefreshCw,
  BookOpen,
  Flame,
  Calendar,
  Check,
  X,
  Mic,
  Square,
  AudioLines,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useSva } from '../../context/SvaContext';
import {
  SVA_MOODS,
  SVA_PROMPTS,
  SVA_TAGS,
  SvaEntry,
  SvaMood,
  SvaVoiceNote,
} from '../../types/sva';
import { VoiceNotePlayer, formatAudioTime } from './VoiceNotePlayer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn } from '../../utils/cn';

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

function getPreferredAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read recorded audio.'));
    reader.readAsDataURL(blob);
  });
}

async function requestTranscriptFromServer(
  audioDataUrl: string,
  mimeType: string
): Promise<string> {
  const response = await fetch('/api/sva/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64: audioDataUrl, mimeType }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Could not transcribe audio.');
  }
  return typeof data.transcript === 'string' ? data.transcript.trim() : '';
}

export const SvaModule: React.FC = () => {
  const {
    entries,
    addEntry,
    updateEntry,
    updateVoiceNoteTranscript,
    deleteEntry,
    togglePinEntry,
    streakDays,
    totalWords,
    totalVoiceNotes,
    mostFrequentMood,
    storageWarning,
  } = useSva();

  // Composer State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<SvaMood>('grounded');
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Mindfulness']);
  const [promptIndex, setPromptIndex] = useState(0);
  const [usePrompt, setUsePrompt] = useState(false);
  const [attachedVoiceNotes, setAttachedVoiceNotes] = useState<SvaVoiceNote[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Voice Typing State
  const [voiceTypingMode, setVoiceTypingMode] = useState<'idle' | 'speech' | 'audio' | 'transcribing'>('idle');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [dictationSeconds, setDictationSeconds] = useState(0);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const dictationRecorderRef = useRef<MediaRecorder | null>(null);
  const dictationStreamRef = useRef<MediaStream | null>(null);
  const dictationChunksRef = useRef<Blob[]>([]);
  const dictationTimerRef = useRef<number | null>(null);

  // Voice Note Recording State
  const [isRecordingNote, setIsRecordingNote] = useState(false);
  const [noteRecordSeconds, setNoteRecordSeconds] = useState(0);
  const noteRecordSecondsRef = useRef(0);
  const noteRecorderRef = useRef<MediaRecorder | null>(null);
  const noteStreamRef = useRef<MediaStream | null>(null);
  const noteChunksRef = useRef<Blob[]>([]);
  const noteTimerRef = useRef<number | null>(null);
  const audioUploadRef = useRef<HTMLInputElement>(null);

  // Archive Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<SvaMood | 'all'>('all');

  const activePrompt = SVA_PROMPTS[promptIndex];

  // Clean up any active streams/timers on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (dictationTimerRef.current) window.clearInterval(dictationTimerRef.current);
      if (noteTimerRef.current) window.clearInterval(noteTimerRef.current);
      dictationStreamRef.current?.getTracks().forEach((t) => t.stop());
      noteStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const appendSpokenText = (spoken: string) => {
    const cleaned = spoken.trim();
    if (!cleaned) return;
    setContent((prev) => {
      const existing = prev.trimEnd();
      return existing ? `${existing} ${cleaned}` : cleaned;
    });
  };

  // ---------------------------------------------------
  // Voice Typing (Live Speech API with MediaRecorder Fallback)
  // ---------------------------------------------------
  const stopDictationStream = () => {
    if (dictationTimerRef.current) {
      window.clearInterval(dictationTimerRef.current);
      dictationTimerRef.current = null;
    }
    dictationStreamRef.current?.getTracks().forEach((t) => t.stop());
    dictationStreamRef.current = null;
  };

  const startAudioDictationFallback = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setFormError('Microphone access is not available in this browser.');
      setVoiceTypingMode('idle');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      dictationStreamRef.current = stream;
      dictationChunksRef.current = [];

      const mimeType = getPreferredAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 })
        : new MediaRecorder(stream);

      dictationRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) dictationChunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        stopDictationStream();
        const blobType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(dictationChunksRef.current, { type: blobType });
        dictationChunksRef.current = [];

        if (blob.size < 200) {
          setVoiceTypingMode('idle');
          return;
        }

        setVoiceTypingMode('transcribing');
        try {
          const dataUrl = await blobToDataUrl(blob);
          const transcript = await requestTranscriptFromServer(dataUrl, blobType);
          if (transcript) {
            appendSpokenText(transcript);
          } else {
            setFormError('No speech was detected in that dictation clip.');
          }
        } catch (err: unknown) {
          setFormError(err instanceof Error ? err.message : 'Voice typing transcription failed.');
        } finally {
          setVoiceTypingMode('idle');
          setDictationSeconds(0);
        }
      };

      recorder.start(250);
      setDictationSeconds(0);
      setVoiceTypingMode('audio');
      dictationTimerRef.current = window.setInterval(() => {
        setDictationSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setFormError('Microphone permission was denied. Please allow microphone access to voice type.');
      setVoiceTypingMode('idle');
    }
  };

  const handleToggleVoiceTyping = async () => {
    setFormError(null);

    // Stop active voice typing
    if (voiceTypingMode === 'speech') {
      recognitionRef.current?.stop();
      setVoiceTypingMode('idle');
      setInterimTranscript('');
      return;
    }

    if (voiceTypingMode === 'audio') {
      dictationRecorderRef.current?.stop();
      return;
    }

    if (voiceTypingMode === 'transcribing') return;

    // If voice note recording is active, ask user to finish it first
    if (isRecordingNote) {
      setFormError('Please stop your active voice note recording before starting voice typing.');
      return;
    }

    const SpeechCtor = getSpeechRecognitionCtor();
    if (!SpeechCtor) {
      await startAudioDictationFallback();
      return;
    }

    try {
      const recognition = new SpeechCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        let interim = '';
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0]?.transcript ?? '';
          if (event.results[i].isFinal) {
            finalChunk += `${text} `;
          } else {
            interim += text;
          }
        }
        if (finalChunk.trim()) {
          appendSpokenText(finalChunk);
        }
        setInterimTranscript(interim.trim());
      };

      recognition.onerror = (event) => {
        setInterimTranscript('');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'network') {
          recognitionRef.current = null;
          setVoiceTypingMode('idle');
          void startAudioDictationFallback();
          return;
        }
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setFormError(`Voice typing error: ${event.error}`);
        }
        setVoiceTypingMode('idle');
      };

      recognition.onend = () => {
        setInterimTranscript('');
        setVoiceTypingMode((curr) => (curr === 'speech' ? 'idle' : curr));
      };

      recognition.start();
      setVoiceTypingMode('speech');
    } catch {
      await startAudioDictationFallback();
    }
  };

  // ---------------------------------------------------
  // Voice Note Recording & Audio Upload
  // ---------------------------------------------------
  const cleanupNoteRecorder = () => {
    if (noteTimerRef.current) {
      window.clearInterval(noteTimerRef.current);
      noteTimerRef.current = null;
    }
    noteStreamRef.current?.getTracks().forEach((t) => t.stop());
    noteStreamRef.current = null;
  };

  const handleStartVoiceNote = async () => {
    setFormError(null);

    if (voiceTypingMode !== 'idle') {
      setFormError('Please stop voice typing before recording a voice note.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setFormError('Audio recording is not supported in this browser. You can still upload an audio file.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      noteStreamRef.current = stream;
      noteChunksRef.current = [];
      noteRecordSecondsRef.current = 0;
      setNoteRecordSeconds(0);

      const mimeType = getPreferredAudioMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 })
        : new MediaRecorder(stream);

      noteRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) noteChunksRef.current.push(ev.data);
      };

      recorder.onstop = async () => {
        const finalDuration = Math.max(1, noteRecordSecondsRef.current);
        cleanupNoteRecorder();
        setIsRecordingNote(false);
        setNoteRecordSeconds(0);

        const blobType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(noteChunksRef.current, { type: blobType });
        noteChunksRef.current = [];

        if (blob.size < 200) return;

        try {
          const audioDataUrl = await blobToDataUrl(blob);
          const newNote: SvaVoiceNote = {
            id: `vn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            audioDataUrl,
            mimeType: blobType,
            durationSeconds: finalDuration,
            createdAt: new Date().toISOString(),
          };
          setAttachedVoiceNotes((prev) => [...prev, newNote]);
        } catch {
          setFormError('Could not process recorded voice note.');
        }
      };

      recorder.start(250);
      setIsRecordingNote(true);
      noteTimerRef.current = window.setInterval(() => {
        noteRecordSecondsRef.current += 1;
        setNoteRecordSeconds(noteRecordSecondsRef.current);
      }, 1000);
    } catch {
      setFormError('Microphone access was denied. Please enable microphone permissions to record a voice note.');
      cleanupNoteRecorder();
      setIsRecordingNote(false);
    }
  };

  const handleStopVoiceNote = () => {
    noteRecorderRef.current?.stop();
  };

  const handleDiscardVoiceNote = () => {
    if (noteRecorderRef.current) {
      noteRecorderRef.current.onstop = () => {
        cleanupNoteRecorder();
        noteChunksRef.current = [];
        setIsRecordingNote(false);
        setNoteRecordSeconds(0);
      };
      noteRecorderRef.current.stop();
    } else {
      cleanupNoteRecorder();
      setIsRecordingNote(false);
    }
  };

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setFormError('Please select a valid audio file (MP3, WAV, M4A, WebM, or OGG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFormError('Please keep uploaded audio notes under 8 MB.');
      return;
    }

    try {
      const dataUrl = await blobToDataUrl(file);
      const duration = await new Promise<number>((resolve) => {
        const audio = document.createElement('audio');
        audio.src = dataUrl;
        audio.onloadedmetadata = () => {
          resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0);
        };
        audio.onerror = () => resolve(0);
      });

      const uploadedNote: SvaVoiceNote = {
        id: `vn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        audioDataUrl: dataUrl,
        mimeType: file.type || 'audio/mpeg',
        durationSeconds: duration,
        createdAt: new Date().toISOString(),
      };
      setAttachedVoiceNotes((prev) => [...prev, uploadedNote]);
      setFormError(null);
    } catch {
      setFormError('Failed to read the uploaded audio file.');
    }
  };

  const handleTranscribeDraftNote = async (note: SvaVoiceNote) => {
    const transcript = await requestTranscriptFromServer(note.audioDataUrl, note.mimeType);
    if (!transcript) {
      throw new Error('No spoken words could be detected in this voice note.');
    }
    setAttachedVoiceNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, transcript } : n))
    );
  };

  const handleTranscribeSavedEntryNote = async (entryId: string, note: SvaVoiceNote) => {
    const transcript = await requestTranscriptFromServer(note.audioDataUrl, note.mimeType);
    if (!transcript) {
      throw new Error('No spoken words could be detected in this voice note.');
    }
    updateVoiceNoteTranscript(entryId, note.id, transcript);
  };

  // ---------------------------------------------------
  // Entry Submission & Editing
  // ---------------------------------------------------
  const resetComposer = () => {
    setEditingEntryId(null);
    setTitle('');
    setContent('');
    setMood('grounded');
    setEnergyLevel(4);
    setSelectedTags(['Mindfulness']);
    setUsePrompt(false);
    setAttachedVoiceNotes([]);
    setFormError(null);
  };

  const handleLoadForEdit = (entry: SvaEntry) => {
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setEnergyLevel(entry.energyLevel);
    setSelectedTags(entry.tags);
    setUsePrompt(Boolean(entry.promptUsed));
    setAttachedVoiceNotes(entry.voiceNotes ? [...entry.voiceNotes] : []);
    setFormError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!content.trim() && attachedVoiceNotes.length === 0) {
      setFormError('Write a reflection or attach a voice note before saving to SVA.');
      return;
    }

    const fallbackDateTitle = `Voice Reflection • ${new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date())}`;

    const derivedTitle =
      title.trim() ||
      (content.trim() ? content.trim().split(/[.!?\n]/)[0].slice(0, 60) : fallbackDateTitle);

    if (editingEntryId) {
      updateEntry(editingEntryId, {
        title: derivedTitle,
        content: content.trim(),
        mood,
        energyLevel,
        tags: selectedTags,
        promptUsed: usePrompt ? activePrompt : undefined,
        voiceNotes: attachedVoiceNotes,
      });
      setSavedNotice('Reflection updated in SVA.');
    } else {
      addEntry({
        title: derivedTitle,
        content: content.trim(),
        mood,
        energyLevel,
        tags: selectedTags,
        promptUsed: usePrompt ? activePrompt : undefined,
        voiceNotes: attachedVoiceNotes,
        isPinned: false,
      });
      setSavedNotice('Reflection saved to your SVA journal.');
    }

    resetComposer();
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const filteredEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...entries]
      .sort((a, b) => {
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
          return a.isPinned ? -1 : 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .filter((entry) => {
        if (moodFilter !== 'all' && entry.mood !== moodFilter) return false;
        if (!query) return true;
        return (
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query) ||
          entry.tags.some((t) => t.toLowerCase().includes(query)) ||
          Boolean(
            entry.voiceNotes?.some((n) => n.transcript?.toLowerCase().includes(query))
          )
        );
      });
  }, [entries, searchQuery, moodFilter]);

  const currentWordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const topMoodMeta = SVA_MOODS.find((m) => m.id === mostFrequentMood);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Module Header */}
      <div className="bg-white p-6 rounded-3xl border border-blush/80 shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest text-ivory flex items-center justify-center shadow-soft">
              <Feather className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-2xl text-forest tracking-tight">
                  SVA
                </h2>
                <Badge variant="gold" size="sm">Text & Voice Journal</Badge>
              </div>
              <p className="text-xs text-charcoal-muted mt-0.5">
                A quiet personal sanctuary for written reflections, voice typing, and saved voice notes.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="px-3.5 py-2 rounded-2xl bg-ivory-paper border border-blush/70 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-forest" />
            <span className="text-charcoal-muted">Entries:</span>
            <strong className="font-heading text-forest">{entries.length}</strong>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-rose/10 border border-rose/20 flex items-center gap-2">
            <AudioLines className="w-3.5 h-3.5 text-rose" />
            <span className="text-charcoal-muted">Voice Notes:</span>
            <strong className="font-heading text-charcoal">{totalVoiceNotes}</strong>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-gold/15 border border-gold/30 flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-rose" />
            <span className="text-charcoal-muted">Streak:</span>
            <strong className="font-heading text-charcoal">{streakDays}d</strong>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-ivory-paper border border-blush/70 flex items-center gap-2">
            <span className="text-charcoal-muted">Words:</span>
            <strong className="font-heading text-charcoal">{totalWords}</strong>
          </div>
          {topMoodMeta && (
            <Badge variant={topMoodMeta.badgeVariant} size="md">
              Primary Rhythm: {topMoodMeta.label}
            </Badge>
          )}
        </div>
      </div>

      {storageWarning && (
        <div className="p-3.5 rounded-2xl bg-gold/20 border border-gold/40 text-xs text-charcoal flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose shrink-0" />
          <span>{storageWarning}</span>
        </div>
      )}

      {/* 2. Two-Column Layout: Writing & Voice Studio + Reflection Archive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: SVA Writing & Voice Studio (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <Card elevated className="p-6 sm:p-7 bg-white border-blush/80">
            <CardHeader className="pb-4 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {editingEntryId ? 'Edit SVA Reflection' : 'Today’s SVA Space'}
                </CardTitle>
                <CardDescription>
                  Write, voice type directly, or record an unhurried voice note.
                </CardDescription>
              </div>
              {editingEntryId && (
                <Button variant="ghost" size="sm" onClick={resetComposer} leftIcon={<X className="w-3.5 h-3.5" />}>
                  Cancel Edit
                </Button>
              )}
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Guided Prompt Bar */}
                <div className="p-4 rounded-2xl bg-ivory-paper border border-blush/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-forest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      Guided Prompt
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPromptIndex((prev) => (prev + 1) % SVA_PROMPTS.length)}
                        className="text-[11px] font-medium text-charcoal-muted hover:text-forest flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Another</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsePrompt((prev) => !prev)}
                        className={cn(
                          'text-[11px] px-2.5 py-0.5 rounded-full font-semibold transition-colors cursor-pointer border',
                          usePrompt
                            ? 'bg-forest text-ivory border-forest'
                            : 'bg-white text-forest border-blush hover:bg-blush/30'
                        )}
                      >
                        {usePrompt ? 'Attached' : 'Attach Prompt'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-charcoal italic leading-relaxed">
                    "{activePrompt}"
                  </p>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose/10 border border-rose/30 text-xs text-rose font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {savedNotice && (
                  <div className="p-3 rounded-xl bg-forest-ultraLight border border-forest/20 text-xs text-forest font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{savedNotice}</span>
                  </div>
                )}

                <Input
                  label="Entry Title (optional)"
                  placeholder="e.g. Afternoon clarity after CS 161..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                {/* Reflection Textarea + Voice Typing Toolbar */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label
                      htmlFor="sva-content"
                      className="block text-xs font-heading font-medium text-charcoal"
                    >
                      Reflection
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-charcoal-muted">
                        {currentWordCount} {currentWordCount === 1 ? 'word' : 'words'}
                      </span>

                      <button
                        type="button"
                        onClick={handleToggleVoiceTyping}
                        disabled={voiceTypingMode === 'transcribing'}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold border transition-all cursor-pointer disabled:opacity-60',
                          voiceTypingMode === 'speech' || voiceTypingMode === 'audio'
                            ? 'bg-rose text-white border-rose shadow-soft-sm'
                            : 'bg-ivory-paper text-forest border-blush hover:border-forest/40'
                        )}
                      >
                        {voiceTypingMode === 'transcribing' ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Transcribing...</span>
                          </>
                        ) : voiceTypingMode === 'speech' || voiceTypingMode === 'audio' ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>
                              Stop Voice Type
                              {voiceTypingMode === 'audio' ? ` (${formatAudioTime(dictationSeconds)})` : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-rose" />
                            <span>Voice Type</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Live Dictation Indicator */}
                  {(voiceTypingMode === 'speech' || voiceTypingMode === 'audio') && (
                    <div className="p-2.5 rounded-xl bg-rose-soft border border-rose/30 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-rose animate-pulse shrink-0" />
                        <span className="font-medium text-charcoal truncate">
                          {interimTranscript
                            ? `Hearing: "${interimTranscript}"`
                            : voiceTypingMode === 'audio'
                              ? 'Recording speech—click Stop Voice Type to transcribe into your entry...'
                              : 'Listening live—speak naturally to type into your journal...'}
                        </span>
                      </div>
                    </div>
                  )}

                  <textarea
                    id="sva-content"
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write freely or tap Voice Type to speak your thoughts..."
                    className="w-full rounded-2xl border border-blush bg-ivory-paper/50 px-4 py-3 text-sm text-charcoal placeholder:text-charcoal-faded leading-relaxed focus:border-forest focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest/20 transition-colors resize-y"
                  />
                </div>

                {/* Voice Notes Studio Section */}
                <div className="p-4 rounded-2xl bg-ivory-paper/80 border border-blush/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-heading font-semibold text-charcoal flex items-center gap-1.5">
                        <AudioLines className="w-4 h-4 text-rose" />
                        Voice Notes
                      </span>
                      <span className="text-[11px] text-charcoal-muted block">
                        Save an audio memo or transcribe it into your reflection.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        ref={audioUploadRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioFileUpload}
                        className="hidden"
                      />

                      {!isRecordingNote ? (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            leftIcon={<Upload className="w-3.5 h-3.5" />}
                            onClick={() => audioUploadRef.current?.click()}
                          >
                            Upload Audio
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            leftIcon={<Mic className="w-3.5 h-3.5" />}
                            onClick={handleStartVoiceNote}
                          >
                            Record Note
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-rose/15 text-rose text-xs font-mono font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose animate-pulse" />
                            {formatAudioTime(noteRecordSeconds)}
                          </span>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            leftIcon={<Square className="w-3 h-3 fill-current" />}
                            onClick={handleStopVoiceNote}
                          >
                            Save Note
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleDiscardVoiceNote}
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attached Voice Notes List */}
                  {attachedVoiceNotes.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {attachedVoiceNotes.map((note) => (
                        <VoiceNotePlayer
                          key={note.id}
                          note={note}
                          compact
                          onTranscribe={handleTranscribeDraftNote}
                          onInsertTranscript={(text) => appendSpokenText(text)}
                          onDelete={() =>
                            setAttachedVoiceNotes((prev) => prev.filter((n) => n.id !== note.id))
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Mood Check-in */}
                <div className="space-y-2">
                  <label className="block text-xs font-heading font-medium text-charcoal">
                    Inner State & Mood
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SVA_MOODS.map((m) => {
                      const active = mood === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMood(m.id)}
                          className={cn(
                            'p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                            active
                              ? 'bg-forest text-ivory border-forest shadow-soft'
                              : 'bg-white border-blush/80 text-charcoal hover:bg-ivory-paper'
                          )}
                        >
                          <span className="font-heading font-semibold text-xs block">
                            {m.label}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] block truncate',
                              active ? 'text-ivory/75' : 'text-charcoal-muted'
                            )}
                          >
                            {m.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Energy Scale */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-heading font-medium text-charcoal">
                      Energy Level
                    </label>
                    <span className="text-xs font-heading font-semibold text-forest">
                      {energyLevel} / 5
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 5] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setEnergyLevel(lvl)}
                        className={cn(
                          'py-1.5 rounded-xl border text-xs font-heading font-semibold transition-all cursor-pointer',
                          energyLevel === lvl
                            ? 'bg-gold text-forest border-gold shadow-soft-sm'
                            : 'bg-white border-blush text-charcoal-muted hover:bg-blush/30'
                        )}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-heading font-medium text-charcoal">
                    Themes
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SVA_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={cn(
                            'px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                            active
                              ? 'bg-rose/15 text-rose border-rose/30 font-semibold'
                              : 'bg-ivory-paper text-charcoal-muted border-blush hover:border-blush-border'
                          )}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button type="submit" variant="primary" size="md" leftIcon={<Feather className="w-4 h-4" />}>
                    {editingEntryId ? 'Update SVA Entry' : 'Save to SVA'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Reflection Archive (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Search & Mood Filter */}
          <Card elevated className="p-4 space-y-3">
            <Input
              placeholder="Search SVA reflections or voice transcripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setMoodFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-heading font-semibold border transition-colors cursor-pointer',
                  moodFilter === 'all'
                    ? 'bg-forest text-ivory border-forest'
                    : 'bg-white text-charcoal-muted border-blush hover:bg-blush/30'
                )}
              >
                All ({entries.length})
              </button>
              {SVA_MOODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMoodFilter(m.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                    moodFilter === m.id
                      ? 'bg-forest text-ivory border-forest font-semibold'
                      : 'bg-white text-charcoal-muted border-blush hover:bg-blush/30'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Entries Feed */}
          {filteredEntries.length === 0 ? (
            <Card className="border-dashed border-2 border-blush bg-ivory/40 p-10 text-center space-y-2">
              <Feather className="w-7 h-7 text-charcoal-muted mx-auto" />
              <h3 className="font-heading font-semibold text-base text-forest">
                No matching SVA entries
              </h3>
              <p className="text-xs text-charcoal-muted max-w-sm mx-auto">
                {entries.length === 0
                  ? 'Begin your first reflection or voice note in the SVA studio on the left.'
                  : 'Try clearing your search or selecting another mood filter.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry) => {
                const moodMeta = SVA_MOODS.find((m) => m.id === entry.mood);
                const dateLabel = new Intl.DateTimeFormat('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date(entry.createdAt));

                return (
                  <Card
                    key={entry.id}
                    elevated
                    className={cn(
                      'p-5 space-y-3 group transition-all',
                      entry.isPinned && 'border-gold/60 bg-gradient-to-br from-white to-gold/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.isPinned && (
                            <Badge variant="gold" size="sm">Pinned</Badge>
                          )}
                          {moodMeta && (
                            <Badge variant={moodMeta.badgeVariant} size="sm">
                              {moodMeta.label}
                            </Badge>
                          )}
                          {entry.voiceNotes && entry.voiceNotes.length > 0 && (
                            <Badge variant="rose" size="sm">
                              <AudioLines className="w-3 h-3 mr-1 inline" />
                              {entry.voiceNotes.length} Voice
                            </Badge>
                          )}
                          <span className="text-[11px] text-charcoal-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {dateLabel}
                          </span>
                        </div>
                        <h3 className="font-heading font-bold text-base text-charcoal">
                          {entry.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => togglePinEntry(entry.id)}
                          aria-label={entry.isPinned ? 'Unpin entry' : 'Pin entry'}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors cursor-pointer',
                            entry.isPinned
                              ? 'text-gold bg-gold/15'
                              : 'text-charcoal-muted hover:text-forest hover:bg-blush/30'
                          )}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleLoadForEdit(entry)}
                          aria-label="Edit entry"
                          className="p-1.5 rounded-lg text-charcoal-muted hover:text-forest hover:bg-blush/30 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          aria-label="Delete entry"
                          className="p-1.5 rounded-lg text-charcoal-muted hover:text-rose hover:bg-rose/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {entry.promptUsed && (
                      <p className="text-[11px] italic text-forest/80 bg-forest-ultraLight px-3 py-1.5 rounded-xl border border-forest/10">
                        Prompt: {entry.promptUsed}
                      </p>
                    )}

                    {entry.content && (
                      <p className="text-xs sm:text-sm text-charcoal leading-relaxed whitespace-pre-line">
                        {entry.content}
                      </p>
                    )}

                    {entry.voiceNotes && entry.voiceNotes.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {entry.voiceNotes.map((note) => (
                          <VoiceNotePlayer
                            key={note.id}
                            note={note}
                            compact
                            onTranscribe={(target) => handleTranscribeSavedEntryNote(entry.id, target)}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-blush/50">
                      <div className="flex flex-wrap gap-1.5">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-ivory-paper border border-blush text-charcoal-muted font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-charcoal-muted">
                        Energy {entry.energyLevel}/5
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
