'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { READING_PLANS } from '../../lib/plans/readingPlans';
import { useApp } from '../../context/AppContext';
import { db } from '../../lib/db/dexie';
import { calculateReadingStats, PlanProgressSummary } from '../../lib/stats/calculator';

export default function PlansOverviewPage() {
  const { preferences, setActivePlanId } = useApp();
  const [plansProgress, setPlansProgress] = useState<Map<string, PlanProgressSummary>>(new Map());
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [allProgress, allActivities, totalBookmarks, totalJournals] = await Promise.all([
        db.chapterProgress.toArray(),
        db.readingActivity.toArray(),
        db.bookmarks.count(),
        db.journalEntries.count(),
      ]);

      const stats = calculateReadingStats({
        completedChapters: allProgress,
        activities: allActivities,
        activePlanId: preferences.activePlanId,
        totalBookmarks,
        totalJournalEntries: totalJournals,
      });

      const map = new Map<string, PlanProgressSummary>();
      for (const p of stats.allPlansProgress) {
        map.set(p.planId, p);
      }
      setPlansProgress(map);
    }
    load();
  }, [preferences.activePlanId]);

  const handleActivate = async (planId: string) => {
    await setActivePlanId(planId);
    setActionMessage('Active reading plan updated');
    setTimeout(() => setActionMessage(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {actionMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[var(--primary-green)] text-white px-4 py-2 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[var(--gold)]" />
          <span>{actionMessage}</span>
        </div>
      )}

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
          Reading Plans
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Catholic contemplative reading plans. Switch plans anytime without losing chapter history.
        </p>
      </div>

      <div className="space-y-4">
        {READING_PLANS.map((plan) => {
          const isActive = preferences.activePlanId === plan.id;
          const prog = plansProgress.get(plan.id);
          const completedCount = prog?.completedChapters ?? 0;
          const percentage = prog?.percentage ?? 0;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl border bg-[var(--bg-card)] p-5 sm:p-6 transition-all ${
                isActive
                  ? 'border-[var(--primary-green)] dark:border-[var(--gold)] ring-1 ring-[var(--primary-green)]/20 dark:ring-[var(--gold)]/20 shadow-md'
                  : 'border-[var(--border-color)] hover:border-[var(--sage)] shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-[var(--text-primary)]">
                      {plan.title}
                    </h2>
                    {isActive && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-[10px] font-bold uppercase tracking-wider">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[var(--sage)] dark:text-[var(--gold)]">
                    {plan.subtitle}
                  </p>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                    {plan.description}
                  </p>
                  {plan.traditionNote && (
                    <p className="text-[11px] text-[var(--text-muted)] italic font-serif pt-1">
                      Tradition: {plan.traditionNote}
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                  {!isActive && (
                    <button
                      onClick={() => handleActivate(plan.id)}
                      className="px-3.5 py-1.5 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-green)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors"
                    >
                      Make Active
                    </button>
                  )}
                  <Link
                    href={`/plans/${plan.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs"
                  >
                    <span>View Plan</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]/60 space-y-1.5">
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>
                    {completedCount} of {plan.totalChapters} chapters completed
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">{percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-green)] dark:bg-[var(--gold)] rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
