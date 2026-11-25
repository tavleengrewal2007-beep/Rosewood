import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { SvaEntry, SvaMood } from '../types/sva';

interface SvaContextType {
  entries: SvaEntry[];
  addEntry: (entry: Omit<SvaEntry, 'id' | 'createdAt' | 'updatedAt'>) => SvaEntry;
  updateEntry: (id: string, updates: Partial<Omit<SvaEntry, 'id' | 'createdAt'>>) => void;
  updateVoiceNoteTranscript: (entryId: string, noteId: string, transcript: string) => void;
  deleteEntry: (id: string) => void;
  togglePinEntry: (id: string) => void;
  streakDays: number;
  totalWords: number;
  totalVoiceNotes: number;
  mostFrequentMood: SvaMood | null;
  storageWarning: string | null;
}

const now = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

export const INITIAL_SVA_ENTRIES: SvaEntry[] = [
  {
    id: 'sva-1',
    title: 'Unhurried lunch between morning lectures',
    content:
      'Taking the full 45 minutes at the courtyard instead of eating at my desk changed how the afternoon felt. Leaving ten minutes to walk slowly past the eucalyptus trees made ENVRES 220 feel effortless instead of rushed.',
    mood: 'grounded',
    energyLevel: 4,
    tags: ['Mindfulness', 'Campus Life', 'Energy'],
    promptUsed: 'What gave you quiet energy between classes today?',
    isPinned: true,
    createdAt: new Date(now - 1 * DAY_MS).toISOString(),
    updatedAt: new Date(now - 1 * DAY_MS).toISOString(),
  },
  {
    id: 'sva-2',
    title: 'Dynamic programming clarity after studio critique',
    content:
      'Felt stuck on the memoization proof during CS 161, so I stepped away during the afternoon gap and sketched the recursion tree on paper over tea. Sometimes stepping back is faster than staring at the screen.',
    mood: 'focused',
    energyLevel: 4,
    tags: ['Academic', 'Clarity'],
    promptUsed: 'What did you learn today outside of lecture slides or textbooks?',
    isPinned: false,
    createdAt: new Date(now - 2 * DAY_MS).toISOString(),
    updatedAt: new Date(now - 2 * DAY_MS).toISOString(),
  },
  {
    id: 'sva-3',
    title: 'Gratitude for quiet library mornings',
    content:
      'Arrived twenty minutes before my first seminar just to read without notifications. Grateful for cool morning air, warm coffee, and having a clear plan for the week.',
    mood: 'grateful',
    energyLevel: 5,
    tags: ['Gratitude', 'Evening Reset'],
    isPinned: false,
    createdAt: new Date(now - 3 * DAY_MS).toISOString(),
    updatedAt: new Date(now - 3 * DAY_MS).toISOString(),
  },
];

const SvaContext = createContext<SvaContextType | undefined>(undefined);

function computeStreakDays(entries: SvaEntry[]): number {
  if (entries.length === 0) return 0;
  const uniqueDays = Array.from(
    new Set(
      entries.map((e) => {
        const d = new Date(e.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
          d.getDate()
        ).padStart(2, '0')}`;
      })
    )
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDays.length === 0) return 0;

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const yesterday = new Date(Date.now() - DAY_MS);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (uniqueDays[0] !== todayKey && uniqueDays[0] !== yesterdayKey) {
    return 0;
  }

  let streak = 1;
  let prevDate = new Date(uniqueDays[0] + 'T12:00:00');
  for (let i = 1; i < uniqueDays.length; i++) {
    const currDate = new Date(uniqueDays[i] + 'T12:00:00');
    const diffDays = Math.round((prevDate.getTime() - currDate.getTime()) / DAY_MS);
    if (diffDays === 1) {
      streak++;
      prevDate = currDate;
    } else {
      break;
    }
  }
  return streak;
}

export const SvaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<SvaEntry[]>(() => {
    try {
      const saved = localStorage.getItem('rosewood_sva_entries');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load SVA entries from storage', e);
    }
    return INITIAL_SVA_ENTRIES;
  });

  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('rosewood_sva_entries', JSON.stringify(entries));
      setStorageWarning(null);
    } catch (e) {
      console.error('Failed to save SVA entries to storage', e);
      setStorageWarning(
        'Local storage space is full—older or large audio recordings may not persist across page reloads.'
      );
    }
  }, [entries]);

  const addEntry = (
    entryData: Omit<SvaEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): SvaEntry => {
    const timestamp = new Date().toISOString();
    const created: SvaEntry = {
      ...entryData,
      id: `sva-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setEntries((prev) => [created, ...prev]);
    return created;
  };

  const updateEntry = (
    id: string,
    updates: Partial<Omit<SvaEntry, 'id' | 'createdAt'>>
  ) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
      )
    );
  };

  const updateVoiceNoteTranscript = (entryId: string, noteId: string, transcript: string) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id !== entryId || !entry.voiceNotes) return entry;
        return {
          ...entry,
          updatedAt: new Date().toISOString(),
          voiceNotes: entry.voiceNotes.map((note) =>
            note.id === noteId ? { ...note, transcript } : note
          ),
        };
      })
    );
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const togglePinEntry = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isPinned: !e.isPinned } : e))
    );
  };

  const streakDays = useMemo(() => computeStreakDays(entries), [entries]);

  const totalWords = useMemo(() => {
    return entries.reduce((sum, entry) => {
      const words = entry.content.trim().split(/\s+/).filter(Boolean).length;
      return sum + words;
    }, 0);
  }, [entries]);

  const totalVoiceNotes = useMemo(() => {
    return entries.reduce((sum, entry) => sum + (entry.voiceNotes?.length ?? 0), 0);
  }, [entries]);

  const mostFrequentMood = useMemo<SvaMood | null>(() => {
    if (entries.length === 0) return null;
    const counts = new Map<SvaMood, number>();
    for (const entry of entries) {
      counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1);
    }
    let top: SvaMood | null = null;
    let max = 0;
    counts.forEach((count, mood) => {
      if (count > max) {
        max = count;
        top = mood;
      }
    });
    return top;
  }, [entries]);

  return (
    <SvaContext.Provider
      value={{
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
      }}
    >
      {children}
    </SvaContext.Provider>
  );
};

export const useSva = (): SvaContextType => {
  const ctx = useContext(SvaContext);
  if (!ctx) throw new Error('useSva must be used inside a SvaProvider');
  return ctx;
};
