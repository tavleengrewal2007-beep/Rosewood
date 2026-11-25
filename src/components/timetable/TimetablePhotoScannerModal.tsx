import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Loader2,
  RotateCcw,
  Calendar,
  MapPin,
  Clock,
  Check,
} from 'lucide-react';
import { useTimetable } from '../../context/TimetableContext';
import { useNavigation } from '../../context/NavigationContext';
import {
  AcademicClass,
  ClassColorToken,
  WEEKDAYS,
  WEEKDAY_SHORT_LABELS,
  Weekday,
} from '../../types/timetable';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

interface ScannedDraftClass extends Omit<AcademicClass, 'id'> {
  tempId: string;
  selected: boolean;
}

const COLOR_TOKENS: ClassColorToken[] = ['forest', 'rose', 'gold', 'blush', 'slate'];

async function prepareImagePayload(file: File): Promise<{ base64: string; mimeType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected image file.'));
    reader.readAsDataURL(file);
  });

  // If image is small enough and standard format, send directly
  const supportedDirect = ['image/png', 'image/jpeg', 'image/webp'];
  if (file.size <= 2.5 * 1024 * 1024 && supportedDirect.includes(file.type)) {
    return { base64: dataUrl, mimeType: file.type };
  }

  // Otherwise resize/re-encode cleanly via canvas to keep payload fast & reliable
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 2048;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ base64: dataUrl, mimeType: file.type || 'image/jpeg' });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const jpegUrl = canvas.toDataURL('image/jpeg', 0.9);
      resolve({ base64: jpegUrl, mimeType: 'image/jpeg' });
    };
    img.onerror = () => {
      resolve({ base64: dataUrl, mimeType: file.type || 'image/jpeg' });
    };
    img.src = dataUrl;
  });
}

export const TimetablePhotoScannerModal: React.FC = () => {
  const { isScannerModalOpen, setIsScannerModalOpen, importClasses } = useTimetable();
  const { setActiveModule } = useNavigation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSummary, setScanSummary] = useState<string | null>(null);
  const [draftClasses, setDraftClasses] = useState<ScannedDraftClass[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);

  const resetState = () => {
    setPreviewUrl(null);
    setFileName('');
    setIsScanning(false);
    setScanError(null);
    setScanSummary(null);
    setDraftClasses([]);
    setApplyFeedback(null);
  };

  const handleClose = () => {
    setIsScannerModalOpen(false);
    resetState();
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Please select an image file (PNG, JPG, WebP, or HEIC).');
      return;
    }

    setScanError(null);
    setScanSummary(null);
    setApplyFeedback(null);
    setDraftClasses([]);
    setFileName(file.name);
    setIsScanning(true);

    try {
      const { base64, mimeType } = await prepareImagePayload(file);
      setPreviewUrl(base64);

      const response = await fetch('/api/timetable/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan timetable photo.');
      }

      const extracted: Omit<AcademicClass, 'id'>[] = Array.isArray(data.classes) ? data.classes : [];
      setScanSummary(data.summary || `Detected ${extracted.length} class(es).`);

      if (extracted.length === 0) {
        setScanError(
          data.summary ||
            'No readable classes were found in this image. Try a clearer photo or screenshot of your weekly schedule.'
        );
      } else {
        setDraftClasses(
          extracted.map((cls, idx) => ({
            ...cls,
            tempId: `draft-${Date.now()}-${idx}`,
            selected: true,
          }))
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while scanning the photo.';
      setScanError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const updateDraft = (tempId: string, patch: Partial<ScannedDraftClass>) => {
    setDraftClasses((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item))
    );
  };

  const toggleDraftDay = (tempId: string, day: Weekday) => {
    setDraftClasses((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const exists = item.days.includes(day);
        const nextDays = exists
          ? item.days.length > 1
            ? item.days.filter((d) => d !== day)
            : item.days
          : [...item.days, day];
        return { ...item, days: nextDays };
      })
    );
  };

  const removeDraft = (tempId: string) => {
    setDraftClasses((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  const selectedDrafts = draftClasses.filter((d) => d.selected);

  const handleApplyToTimetable = () => {
    if (selectedDrafts.length === 0) {
      setScanError('Select at least one class to update your timetable.');
      return;
    }

    const payload: Omit<AcademicClass, 'id'>[] = selectedDrafts.map(
      ({ tempId: _tempId, selected: _selected, ...rest }) => rest
    );

    const { addedCount, skippedDuplicates } = importClasses(payload, importMode);

    const summaryMsg =
      importMode === 'replace'
        ? `Replaced timetable with ${addedCount} scanned class(es) and recalculated free periods.`
        : `Added ${addedCount} class(es) to your timetable${
            skippedDuplicates > 0 ? ` (${skippedDuplicates} duplicate skipped)` : ''
          } and recalculated free periods.`;

    setApplyFeedback(summaryMsg);

    setTimeout(() => {
      setIsScannerModalOpen(false);
      setActiveModule('timetable');
      resetState();
    }, 1100);
  };

  return (
    <Modal
      isOpen={isScannerModalOpen}
      onClose={handleClose}
      title="Scan Timetable Photo"
      description="Upload a photo or screenshot of your class schedule. Rosewood reads your classes and automatically updates your timetable and free periods."
      maxWidth="xl"
    >
      <div className="space-y-5 pt-1">
        {/* Hidden inputs for file upload and camera capture */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Step 1: Upload Zone */}
        {!previewUrl && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'rounded-3xl border-2 border-dashed p-8 sm:p-10 text-center transition-all space-y-4',
              isDragging
                ? 'border-forest bg-forest-ultraLight'
                : 'border-blush-border bg-ivory-paper/60 hover:border-forest/40'
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-forest text-ivory mx-auto flex items-center justify-center shadow-soft">
              <Camera className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-bold text-base text-forest">
                Drop a timetable photo or screenshot here
              </h3>
              <p className="text-xs text-charcoal-muted max-w-md mx-auto leading-relaxed">
                Supports university portal screenshots, printed weekly grids, PDF snapshots, or clear handwritten schedules (PNG, JPG, WebP).
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Camera className="w-4 h-4 text-rose" />}
                onClick={() => cameraInputRef.current?.click()}
              >
                Take Photo
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Image Preview + Scanning Status */}
        {previewUrl && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-2xl bg-ivory-paper border border-blush/80">
            <div className="md:col-span-4">
              <img
                src={previewUrl}
                alt="Uploaded timetable preview"
                className="w-full h-36 object-cover rounded-xl border border-blush shadow-soft-sm"
              />
            </div>
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-heading font-semibold text-xs text-charcoal truncate">
                  {fileName || 'Timetable Image'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                  onClick={resetState}
                  disabled={isScanning}
                >
                  Scan Another
                </Button>
              </div>

              {isScanning && (
                <div className="p-3 rounded-xl bg-white border border-blush flex items-center gap-3 text-xs text-forest">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <div>
                    <span className="font-heading font-semibold block">
                      Analyzing schedule layout...
                    </span>
                    <span className="text-charcoal-muted">
                      Extracting course codes, days, classrooms, and 24h times.
                    </span>
                  </div>
                </div>
              )}

              {!isScanning && scanSummary && !scanError && (
                <div className="p-3 rounded-xl bg-forest-ultraLight border border-forest/20 text-xs text-forest flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-forest" />
                  <span>{scanSummary}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Alert */}
        {scanError && (
          <div className="p-3.5 rounded-2xl border border-rose/40 bg-rose/10 flex items-start gap-2.5 text-xs text-rose font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Success Feedback */}
        {applyFeedback && (
          <div className="p-3.5 rounded-2xl border border-forest/30 bg-forest-ultraLight flex items-center gap-2.5 text-xs text-forest font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{applyFeedback}</span>
          </div>
        )}

        {/* Step 3: Review & Edit Extracted Classes */}
        {draftClasses.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-charcoal">
                  Review Extracted Classes
                </span>
                <Badge variant="forest" size="sm">
                  {selectedDrafts.length} of {draftClasses.length} selected
                </Badge>
              </div>

              {/* Merge vs Replace Mode */}
              <div className="flex p-1 rounded-xl bg-ivory-paper border border-blush text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={cn(
                    'px-3 py-1 rounded-lg font-heading font-semibold transition-all cursor-pointer',
                    importMode === 'merge'
                      ? 'bg-forest text-ivory shadow-soft-sm'
                      : 'text-charcoal-muted hover:text-forest'
                  )}
                >
                  Merge with Current
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={cn(
                    'px-3 py-1 rounded-lg font-heading font-semibold transition-all cursor-pointer',
                    importMode === 'replace'
                      ? 'bg-rose text-white shadow-soft-sm'
                      : 'text-charcoal-muted hover:text-rose'
                  )}
                >
                  Replace Timetable
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {draftClasses.map((cls) => (
                <div
                  key={cls.tempId}
                  className={cn(
                    'p-4 rounded-2xl border transition-all space-y-3',
                    cls.selected
                      ? 'bg-white border-blush/90 shadow-soft-sm'
                      : 'bg-ivory/40 border-blush/50 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1">
                      <button
                        type="button"
                        onClick={() => updateDraft(cls.tempId, { selected: !cls.selected })}
                        aria-label="Include class"
                        className={cn(
                          'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors',
                          cls.selected
                            ? 'bg-forest border-forest text-ivory'
                            : 'bg-white border-blush-border'
                        )}
                      >
                        {cls.selected && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                        <input
                          type="text"
                          value={cls.code}
                          onChange={(e) => updateDraft(cls.tempId, { code: e.target.value })}
                          placeholder="Code"
                          className="rounded-lg border border-blush px-2.5 py-1.5 text-xs font-heading font-bold text-forest bg-ivory-paper focus:outline-none focus:border-forest"
                        />
                        <input
                          type="text"
                          value={cls.subject}
                          onChange={(e) => updateDraft(cls.tempId, { subject: e.target.value })}
                          placeholder="Subject Title"
                          className="sm:col-span-2 rounded-lg border border-blush px-2.5 py-1.5 text-xs font-medium text-charcoal bg-white focus:outline-none focus:border-forest"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeDraft(cls.tempId)}
                      aria-label="Remove extracted class"
                      className="p-1.5 rounded-lg text-charcoal-muted hover:text-rose hover:bg-rose/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Times, Location & Color */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-forest shrink-0" />
                      <input
                        type="time"
                        value={cls.startTime}
                        onChange={(e) => updateDraft(cls.tempId, { startTime: e.target.value })}
                        className="w-full rounded-lg border border-blush px-2 py-1 text-xs text-charcoal bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-charcoal-muted text-[10px]">to</span>
                      <input
                        type="time"
                        value={cls.endTime}
                        onChange={(e) => updateDraft(cls.tempId, { endTime: e.target.value })}
                        className="w-full rounded-lg border border-blush px-2 py-1 text-xs text-charcoal bg-white"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose shrink-0" />
                      <input
                        type="text"
                        value={cls.location}
                        onChange={(e) => updateDraft(cls.tempId, { location: e.target.value })}
                        placeholder="Room / Building"
                        className="w-full rounded-lg border border-blush px-2 py-1 text-xs text-charcoal bg-white"
                      />
                    </div>
                    <div>
                      <select
                        value={cls.color}
                        onChange={(e) =>
                          updateDraft(cls.tempId, { color: e.target.value as ClassColorToken })
                        }
                        className="w-full rounded-lg border border-blush px-2 py-1 text-xs text-charcoal bg-white capitalize cursor-pointer"
                      >
                        {COLOR_TOKENS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Weekday Toggles */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-charcoal-muted mr-1" />
                    {WEEKDAYS.map((day) => {
                      const active = cls.days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDraftDay(cls.tempId, day)}
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold border transition-colors cursor-pointer',
                            active
                              ? 'bg-forest text-ivory border-forest'
                              : 'bg-ivory-paper text-charcoal-muted border-blush hover:border-forest/40'
                          )}
                        >
                          {WEEKDAY_SHORT_LABELS[day]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-blush/80">
          <span className="text-[11px] text-charcoal-muted">
            Gap detection recalculates automatically as soon as you apply.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            {draftClasses.length > 0 && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-4 h-4" />}
                onClick={handleApplyToTimetable}
                disabled={selectedDrafts.length === 0 || Boolean(applyFeedback)}
              >
                Update Timetable ({selectedDrafts.length})
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
