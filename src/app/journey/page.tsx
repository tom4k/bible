'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Sliders,
  Check,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/db/dexie';
import { calculateJourneyProgress } from '../../lib/journey/definition';
import {
  JourneyProgressSummary,
  JourneyPaceConfig,
  JOURNEY_PACE_PRESETS,
  JourneyPacePreset,
} from '../../lib/journey/types';
import { SyroCrossIcon } from '../../components/icons/SyroCrossIcon';

export default function JourneyDashboardPage() {
  const { preferences, setJourneyPace } = useApp();
  const [journeySummary, setJourneySummary] = useState<JourneyProgressSummary | null>(null);
  const [selectedPace, setSelectedPace] = useState<JourneyPacePreset>(preferences.journeyPace || 'gentle');
  const [customChapters, setCustomChapters] = useState(preferences.customChaptersPerSession || 1);
  const [customSessions, setCustomSessions] = useState(preferences.customSessionsPerWeek || 5);
  const [expandedStageId, setExpandedStageId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    const records = await db.chapterProgress.toArray();
    const completedKeys = new Set(records.map((r) => `${r.bookId}:${r.chapter}`));

    const currentPaceConfig: JourneyPaceConfig =
      selectedPace === 'custom'
        ? { preset: 'custom', chaptersPerSession: customChapters, sessionsPerWeek: customSessions }
        : JOURNEY_PACE_PRESETS[selectedPace];

    const summary = calculateJourneyProgress({
      completedKeys,
      paceConfig: currentPaceConfig,
    });

    setJourneySummary(summary);
    if (expandedStageId === null) {
      setExpandedStageId(summary.activeStage.id);
    }
  };

  useEffect(() => {
    loadData();
  }, [preferences.journeyPace, selectedPace, customChapters, customSessions]);

  const handlePaceChange = async (pace: JourneyPacePreset) => {
    setSelectedPace(pace);
    if (pace !== 'custom') {
      const preset = JOURNEY_PACE_PRESETS[pace];
      await setJourneyPace(pace, preset.chaptersPerSession, preset.sessionsPerWeek);
    } else {
      await setJourneyPace('custom', customChapters, customSessions);
    }
    setToastMessage(`Reading pace updated to ${pace.toUpperCase()}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCustomPaceSave = async () => {
    await setJourneyPace('custom', customChapters, customSessions);
    setToastMessage('Custom reading pace saved');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const nextReading = journeySummary?.nextSessionChapters[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[var(--primary-green)] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[var(--gold)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#173B33] via-[#214D43] to-[#2E6054] text-white p-6 sm:p-8 shadow-md">
        <div className="absolute right-3 -bottom-6 opacity-10 pointer-events-none">
          <SyroCrossIcon className="w-72 h-72 text-[var(--gold)]" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-[var(--gold)] border border-white/10">
            <Compass className="w-3.5 h-3.5" />
            <span>All 73 Catholic Books</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
            My Bible Journey
          </h1>
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed font-light">
            A contemplative, 6-stage sacred pilgrimage through the entire Catholic Bible. Read at your own peaceful pace without guilt or rigid deadlines.
          </p>
        </div>
      </section>

      {/* Continue Reading Action Card */}
      <section aria-labelledby="journey-action-heading">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">
                Next Journey Reading
              </span>
              <h2
                id="journey-action-heading"
                className="text-xl sm:text-2xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]"
              >
                {nextReading ? `${nextReading.book.name} ${nextReading.chapter}` : 'Journey Complete!'}
              </h2>
              {nextReading ? (
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Stage {nextReading.stage.id}: <span className="font-medium text-[var(--text-primary)]">{nextReading.stage.name}</span>
                </p>
              ) : (
                <p className="text-xs text-emerald-600 font-semibold">
                  Praise be to God! You have completed all 73 books of the Catholic Bible.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/journey/read"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary-green)] text-white hover:bg-[var(--primary-green-hover)] dark:bg-[var(--gold)] dark:text-[#173B33] text-sm font-bold shadow-sm transition-transform active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>{nextReading ? 'Start Today’s Session' : 'Review Journey'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Overall Progress & Stats Grid */}
      <section aria-labelledby="journey-stats-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="journey-stats-heading" className="text-lg font-serif font-bold text-[var(--text-primary)]">
            Overall Bible Progress
          </h2>
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            {journeySummary?.percentage ?? 0}% Complete
          </span>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
            <div
              className="h-full bg-[var(--primary-green)] dark:bg-[var(--gold)] rounded-full transition-all duration-700"
              style={{ width: `${journeySummary?.percentage ?? 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{journeySummary?.completedChapters ?? 0} of {journeySummary?.totalChapters ?? 0} chapters</span>
            <span>{journeySummary?.completedBooks ?? 0} of 73 books complete</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Chapters Read</span>
            <div className="text-2xl font-bold font-serif text-[var(--text-primary)]">
              {journeySummary?.completedChapters ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">of {journeySummary?.totalChapters ?? 0} chapters</span>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Books Completed</span>
            <div className="text-2xl font-bold font-serif text-[var(--text-primary)]">
              {journeySummary?.completedBooks ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">of 73 Catholic books</span>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Active Stage</span>
            <div className="text-lg font-bold font-serif text-[var(--primary-green)] dark:text-[var(--gold)] truncate">
              Stage {journeySummary?.activeStage.id}
            </div>
            <span className="text-[11px] text-[var(--text-muted)] truncate block">{journeySummary?.activeStage.name}</span>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block">Pace Estimate</span>
            <div className="text-lg font-bold font-serif text-amber-600 dark:text-[var(--gold)]">
              ~{journeySummary?.estimatedMonthsRemaining ?? 0} mos
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {journeySummary?.estimatedWeeksRemaining ?? 0} weeks at {selectedPace} pace
            </span>
          </div>
        </div>
      </section>

      {/* Six-Stage Visual Progress Indicator */}
      <section aria-labelledby="stages-timeline-heading" className="space-y-4">
        <h2 id="stages-timeline-heading" className="text-lg font-serif font-bold text-[var(--text-primary)]">
          The 6 Sequential Stages
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {journeySummary?.stagesProgress.map((sp) => {
            const isActive = sp.stage.id === journeySummary.activeStage.id;
            const isDone = sp.isComplete;

            return (
              <button
                key={sp.stage.id}
                onClick={() => setExpandedStageId(sp.stage.id)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                  isActive
                    ? 'border-[var(--primary-green)] dark:border-[var(--gold)] bg-[var(--bg-card)] ring-2 ring-[var(--primary-green)]/20 shadow-sm'
                    : isDone
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--sage)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Stage {sp.stage.id}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isActive ? (
                      <span className="w-2 h-2 rounded-full bg-[var(--primary-green)] dark:bg-[var(--gold)] animate-pulse" />
                    ) : null}
                  </div>
                  <h3 className="font-serif font-bold text-xs line-clamp-2 leading-tight text-[var(--text-primary)]">
                    {sp.stage.name}
                  </h3>
                </div>

                <div className="mt-3 pt-2 border-t border-[var(--border-color)]/50">
                  <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                    <span>{sp.completedChapters}/{sp.totalChapters}</span>
                    <span className="font-semibold">{sp.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary-green)] dark:bg-[var(--gold)] rounded-full"
                      style={{ width: `${sp.percentage}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Configurable Reading Pace (FR-02) */}
      <section aria-labelledby="pace-heading" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[var(--primary-green)] dark:text-[var(--gold)]" />
              <h2 id="pace-heading" className="font-serif font-bold text-lg text-[var(--text-primary)]">
                Configurable Reading Pace
              </h2>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Choose your reading rhythm. Duration estimates update dynamically based on the Catholic canon without strict deadlines.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          {[
            {
              id: 'gentle',
              label: 'Gentle (Default)',
              desc: '1 ch / session, 5 days / wk',
              detail: '~5.1 years total',
            },
            {
              id: 'steady',
              label: 'Steady',
              desc: '2 ch / session, 5 days / wk',
              detail: '~2.6 years total',
            },
            {
              id: 'focused',
              label: 'Focused',
              desc: '2 ch / session, 7 days / wk',
              detail: '~1.8 years total',
            },
            {
              id: 'custom',
              label: 'Custom Pace',
              desc: 'Set your own target',
              detail: 'Tailored duration',
            },
          ].map((preset) => {
            const active = selectedPace === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handlePaceChange(preset.id as JourneyPacePreset)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-[var(--primary-green)] dark:border-[var(--gold)] bg-[var(--bg-card-subtle)] ring-2 ring-[var(--primary-green)]/20 shadow-xs'
                    : 'border-[var(--border-color)] hover:border-[var(--sage)] bg-[var(--bg-card)]'
                }`}
              >
                <div className="font-semibold text-xs text-[var(--text-primary)]">{preset.label}</div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{preset.desc}</div>
                <div className="text-[10px] text-[var(--sage)] dark:text-[var(--gold)] font-medium mt-1">{preset.detail}</div>
              </button>
            );
          })}
        </div>

        {selectedPace === 'custom' && (
          <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] space-y-3 animate-scale-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Chapters per Session (1–10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={customChapters}
                  onChange={(e) => setCustomChapters(Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1)))}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                  Sessions per Week (1–7)
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={customSessions}
                  onChange={(e) => setCustomSessions(Math.max(1, Math.min(7, parseInt(e.target.value, 10) || 1)))}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)]"
                />
              </div>
            </div>

            <button
              onClick={handleCustomPaceSave}
              className="px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white text-xs font-semibold shadow-xs"
            >
              Apply Custom Pace
            </button>
          </div>
        )}
      </section>

      {/* Stage Detail & Book Checklist */}
      <section aria-labelledby="stage-books-heading" className="space-y-4">
        <h2 id="stage-books-heading" className="text-lg font-serif font-bold text-[var(--text-primary)]">
          Stage Breakdown & Book Checklist
        </h2>

        <div className="space-y-3">
          {journeySummary?.stagesProgress.map((sp) => {
            const isExpanded = expandedStageId === sp.stage.id;
            return (
              <div
                key={sp.stage.id}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-xs transition-colors"
              >
                <button
                  onClick={() => setExpandedStageId(isExpanded ? null : sp.stage.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-[var(--bg-card-subtle)]/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                        Stage {sp.stage.id}
                      </span>
                      {sp.isComplete && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--text-primary)]">
                      {sp.stage.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">{sp.stage.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{sp.percentage}%</span>
                      <span className="text-[11px] text-[var(--text-muted)] block">{sp.completedBooks}/{sp.totalBooks} books</span>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 pt-0 border-t border-[var(--border-color)]/60 space-y-4 animate-scale-up">
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed pt-3">
                      {sp.stage.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
                      {sp.books.map((b) => (
                        <Link
                          key={b.book.id}
                          href={`/bible/${b.book.slug}/1`}
                          className={`p-3 rounded-xl border flex items-center justify-between text-left transition-colors ${
                            b.isComplete
                              ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                              : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--primary-green)]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-serif font-bold text-xs text-[var(--text-primary)]">
                                {b.book.name}
                              </span>
                              {b.book.isDeuterocanonical && (
                                <span className="text-[9px] text-[#795213] dark:text-[var(--gold)] font-medium">★</span>
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {b.completedChapters}/{b.totalChapters} chapters
                            </span>
                          </div>

                          {b.isComplete ? (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {Math.round((b.completedChapters / b.totalChapters) * 100)}%
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
