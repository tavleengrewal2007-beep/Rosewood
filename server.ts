import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const PORT = 3000;
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/ogg',
  'audio/aac',
  'audio/m4a',
  'audio/x-m4a',
]);

const VALID_WEEKDAYS = new Set([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]);

const VALID_COLORS = new Set(['forest', 'rose', 'gold', 'blush', 'slate']);

function normalizeTime24h(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/timetable/scan', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({
          error: 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      const { imageBase64, mimeType } = req.body ?? {};

      if (typeof imageBase64 !== 'string' || imageBase64.trim().length === 0) {
        res.status(400).json({ error: 'Please upload a valid timetable image.' });
        return;
      }

      if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
        res.status(400).json({
          error: 'Unsupported image format. Please upload a PNG, JPEG, WebP, or HEIC photo.',
        });
        return;
      }

      // Strip data URL prefix if present
      const cleanBase64 = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;

      if (cleanBase64.length > 14 * 1024 * 1024) {
        res.status(413).json({
          error: 'Image file is too large. Please upload an image under 10 MB.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = [
        'Analyze this image of a student academic timetable, class schedule, screenshot, or handwritten weekly planner.',
        'Extract every scheduled class, lecture, lab, or seminar you can read.',
        'Rules:',
        '1. Convert all start and end times strictly to 24-hour HH:mm format (e.g., "09:00", "13:30", "16:45").',
        '2. Map days strictly to lowercase English weekday names from: monday, tuesday, wednesday, thursday, friday, saturday.',
        '3. If a class meets on multiple days at the same time (e.g., MWF or Tue/Thu), include all those weekdays in its "days" array.',
        '4. Extract course code (e.g., "CS 161"), subject name, professor/instructor (if visible, else ""), and classroom location (if visible, else "").',
        '5. Assign a balanced color token from: forest, rose, gold, blush, slate.',
        '6. Ensure startTime is strictly before endTime. If an end time is missing, estimate a standard 60-minute duration.',
        '7. Do not invent classes that are not in the photo. If the image is not a timetable or contains no readable classes, return an empty classes array and explain in summary.',
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType.toLowerCase() === 'image/jpg' ? 'image/jpeg' : mimeType.toLowerCase(),
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          systemInstruction:
            'You are an accurate academic timetable OCR and schedule parser. Always return strictly valid JSON matching the schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'A brief 1-sentence summary of what was detected in the timetable photo.',
              },
              classes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    code: { type: Type.STRING, description: 'Short course code like CS 101 or PHYS 201' },
                    subject: { type: Type.STRING, description: 'Full subject or class name' },
                    professor: { type: Type.STRING, description: 'Professor or instructor name if shown, otherwise empty string' },
                    location: { type: Type.STRING, description: 'Classroom or building location if shown, otherwise empty string' },
                    days: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Array of lowercase weekdays: monday, tuesday, wednesday, thursday, friday, saturday',
                    },
                    startTime: { type: Type.STRING, description: '24-hour start time in HH:mm format' },
                    endTime: { type: Type.STRING, description: '24-hour end time in HH:mm format' },
                    color: { type: Type.STRING, description: 'One of: forest, rose, gold, blush, slate' },
                    notes: { type: Type.STRING, description: 'Optional extra details such as Lab, Lecture, Section' },
                  },
                  required: ['code', 'subject', 'days', 'startTime', 'endTime'],
                },
              },
            },
            required: ['summary', 'classes'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      let parsed: { summary?: string; classes?: unknown[] };
      try {
        parsed = JSON.parse(rawText);
      } catch {
        res.status(502).json({
          error: 'Could not parse the extracted schedule format. Please try a clearer photo.',
        });
        return;
      }

      const rawClasses = Array.isArray(parsed.classes) ? parsed.classes : [];
      const sanitizedClasses = rawClasses
        .map((item: unknown, index: number) => {
          if (!item || typeof item !== 'object') return null;
          const obj = item as Record<string, unknown>;
          const startTime = normalizeTime24h(obj.startTime);
          const endTime = normalizeTime24h(obj.endTime);
          if (!startTime || !endTime || startTime >= endTime) return null;

          const days = Array.isArray(obj.days)
            ? Array.from(
                new Set(
                  obj.days
                    .map((d) => String(d).trim().toLowerCase())
                    .filter((d) => VALID_WEEKDAYS.has(d))
                )
              )
            : [];

          if (days.length === 0) return null;

          const subject = typeof obj.subject === 'string' && obj.subject.trim()
            ? obj.subject.trim()
            : typeof obj.code === 'string' && obj.code.trim()
              ? obj.code.trim()
              : `Class ${index + 1}`;

          const code = typeof obj.code === 'string' && obj.code.trim()
            ? obj.code.trim().slice(0, 24)
            : subject.slice(0, 12).toUpperCase();

          const rawColor = typeof obj.color === 'string' ? obj.color.trim().toLowerCase() : '';
          const paletteOrder = ['forest', 'rose', 'gold', 'slate', 'blush'];
          const color = VALID_COLORS.has(rawColor) ? rawColor : paletteOrder[index % paletteOrder.length];

          return {
            code,
            subject,
            professor: typeof obj.professor === 'string' ? obj.professor.trim() : '',
            location: typeof obj.location === 'string' ? obj.location.trim() : '',
            days,
            startTime,
            endTime,
            color,
            isRecurring: true,
            notes: typeof obj.notes === 'string' ? obj.notes.trim() : '',
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);

      res.json({
        summary:
          typeof parsed.summary === 'string' && parsed.summary.trim()
            ? parsed.summary.trim()
            : `Extracted ${sanitizedClasses.length} class(es) from your photo.`,
        classes: sanitizedClasses,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error while scanning photo.';
      console.error('Timetable scan error:', message);
      res.status(500).json({
        error: `Failed to scan timetable photo: ${message}`,
      });
    }
  });

  app.post('/api/sva/transcribe', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(500).json({
          error: 'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      const { audioBase64, mimeType } = req.body ?? {};

      if (typeof audioBase64 !== 'string' || audioBase64.trim().length === 0) {
        res.status(400).json({ error: 'Please provide a valid audio recording to transcribe.' });
        return;
      }

      const baseMime = typeof mimeType === 'string'
        ? mimeType.split(';')[0].trim().toLowerCase()
        : '';

      if (!ALLOWED_AUDIO_MIME_TYPES.has(baseMime)) {
        res.status(400).json({
          error: 'Unsupported audio format. Please record or upload WebM, MP3, WAV, M4A, or OGG audio.',
        });
        return;
      }

      const cleanBase64 = audioBase64.includes(',')
        ? audioBase64.split(',')[1]
        : audioBase64;

      if (cleanBase64.length > 14 * 1024 * 1024) {
        res.status(413).json({
          error: 'Audio recording is too large. Please keep recordings under 10 MB.',
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const normalizedMime = baseMime === 'audio/m4a' || baseMime === 'audio/x-m4a'
        ? 'audio/mp4'
        : baseMime === 'audio/wave'
          ? 'audio/wav'
          : baseMime;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: normalizedMime,
                data: cleanBase64,
              },
            },
            {
              text: 'Transcribe this personal journal voice recording accurately into clean, punctuated text. Return only the spoken transcript without extra commentary.',
            },
          ],
        },
      });

      const transcript = (response.text ?? '').trim();
      res.json({ transcript });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error while transcribing audio.';
      console.error('SVA transcribe error:', message);
      res.status(500).json({
        error: `Failed to transcribe audio: ${message}`,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ROSEWOOD server listening on http://localhost:${PORT}`);
  });
}

startServer();
