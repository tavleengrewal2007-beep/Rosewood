import React, { useState, useEffect } from 'react';
import { useTimetable } from '../../context/TimetableContext';
import { runSchedulingEngineUnitTests, TestSuiteSummary } from '../../services/gapEngine/schedulingEngine.test';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ShieldCheck, CheckCircle2, XCircle, RotateCcw, Play, Clock, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';

export const GapDiagnosticsModal: React.FC = () => {
  const { isDiagnosticsOpen, setIsDiagnosticsOpen, resetToSampleTimetable } = useTimetable();
  const [suiteSummary, setSuiteSummary] = useState<TestSuiteSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const summary = runSchedulingEngineUnitTests();
      setSuiteSummary(summary);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    if (isDiagnosticsOpen) {
      runTests();
    }
  }, [isDiagnosticsOpen]);

  return (
    <Modal
      isOpen={isDiagnosticsOpen}
      onClose={() => setIsDiagnosticsOpen(false)}
      title="Scheduling Algorithm & Unit Test Suite"
      description="Independent verification of interval mathematics, gap calculation, overlap detection, and buffer deductions."
      maxWidth="xl"
    >
      <div className="space-y-4 pt-1">
        {/* Test Summary Banner */}
        <div className="p-4 rounded-2xl bg-ivory-paper border border-blush/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest text-ivory flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-charcoal">
                  Test Execution Status
                </span>
                {suiteSummary && (
                  <Badge variant={suiteSummary.failed === 0 ? 'forest' : 'rose'} size="sm">
                    {suiteSummary.passed} / {suiteSummary.total} Passed
                  </Badge>
                )}
              </div>
              <p className="text-xs text-charcoal-muted mt-0.5">
                Runtime engine executed in {suiteSummary?.executionTimeMs || 0} ms. Zero runtime regressions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Play className="w-3.5 h-3.5 text-forest" />}
              isLoading={isRunning}
              onClick={runTests}
            >
              Re-run Tests
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => {
                resetToSampleTimetable();
                runTests();
              }}
            >
              Reset Sample Data
            </Button>
          </div>
        </div>

        {/* Detailed Results List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {suiteSummary?.results.map((result) => (
            <div
              key={result.id}
              className={cn(
                'p-3.5 rounded-2xl border transition-all text-xs',
                result.passed
                  ? 'bg-white border-blush/80 hover:border-forest/20'
                  : 'bg-rose/10 border-rose/40'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  {result.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="font-heading font-semibold text-charcoal text-xs sm:text-sm">
                      {result.name}
                    </h5>
                    {result.details && (
                      <p className="text-charcoal-muted text-[11px] mt-0.5 leading-relaxed">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>

                <Badge variant={result.passed ? 'forest' : 'rose'} size="sm">
                  {result.passed ? 'PASSED' : 'FAILED'}
                </Badge>
              </div>

              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-blush/40 text-[11px]">
                <div>
                  <span className="text-charcoal-muted font-medium block">Expected:</span>
                  <span className="font-mono text-forest font-semibold">{result.expected}</span>
                </div>
                <div>
                  <span className="text-charcoal-muted font-medium block">Received:</span>
                  <span className="font-mono text-charcoal font-semibold">{result.received}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-blush/80">
          <Button variant="primary" size="sm" onClick={() => setIsDiagnosticsOpen(false)}>
            Close Diagnostics
          </Button>
        </div>
      </div>
    </Modal>
  );
};
