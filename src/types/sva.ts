export type SvaMood =
  | 'grounded'
  | 'focused'
  | 'grateful'
  | 'inspired'
  | 'restless'
  | 'drained';

export interface SvaMoodMeta {
  id: SvaMood;
  label: string;
  description: string;
  badgeVariant: 'forest' | 'rose' | 'gold' | 'blush' | 'slate';
}

export const SVA_MOODS: SvaMoodMeta[] = [
  {
    id: 'grounded',
    label: 'Grounded',
    description: 'Calm, steady, and present',
    badgeVariant: 'forest',
  },
  {
    id: 'focused',
    label: 'Focused',
    description: 'Clear mind and deep flow',
    badgeVariant: 'forest',
  },
  {
    id: 'grateful',
    label: 'Grateful',
    description: 'Appreciative of small moments',
    badgeVariant: 'gold',
  },
  {
    id: 'inspired',
    label: 'Inspired',
    description: 'Curious and energized by ideas',
    badgeVariant: 'gold',
  },
  {
    id: 'restless',
    label: 'Restless',
    description: 'Scattered or carrying tension',
    badgeVariant: 'rose',
  },
  {
    id: 'drained',
    label: 'Drained',
    description: 'Low energy, needing rest',
    badgeVariant: 'blush',
  },
];

export const SVA_TAGS = [
  'Academic',
  'Clarity',
  'Gratitude',
  'Campus Life',
  'Mindfulness',
  'Energy',
  'Evening Reset',
] as const;

export const SVA_PROMPTS: string[] = [
  'What gave you quiet energy between classes today?',
  'Which academic pressure can you gently set down for tonight?',
  'Describe one small, ordinary moment on campus worth remembering.',
  'How did your body feel during your study blocks and meals today?',
  'What is one honest intention you want to carry into tomorrow morning?',
  'What did you learn today outside of lecture slides or textbooks?',
];

export interface SvaVoiceNote {
  id: string;
  audioDataUrl: string;
  mimeType: string;
  durationSeconds: number;
  transcript?: string;
  createdAt: string;
}

export interface SvaEntry {
  id: string;
  title: string;
  content: string;
  mood: SvaMood;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  promptUsed?: string;
  voiceNotes?: SvaVoiceNote[];
  isPinned?: boolean;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}
