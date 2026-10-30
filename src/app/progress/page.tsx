'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Flame,
  CheckCircle2,
  Bookmark,
  PenLine,
} from 'lucide-react';
import { db } from '../../lib/db/dexie';
import { useApp } from '../../context/AppContext';
import { calculateReadingStats, ReadingStatsSummary } from '../../lib/stats/calculator';
import { ReadingActivity } from '../../lib/db/schema';
import { getBookById } from '../../lib/bible/catalogue';

export default function ProgressPage() {
  const { preferences } = useApp();
  const [stats, setStats] = useState<ReadingStatsSummary | null>(null);
  const [recentActivities, setRecentActivities] = useState<ReadingActivity[]>([]);

  useEffect(() => {
    async function loadData() {
      const [allProgress, allActivities, totalBookmarks, totalJournals] = await Promise.all([
        db.chapterProgress.toArray(),
        db.readingActivity.orderBy('timestamp').reverse().toArray(),
        db.bookmarks.count(),
        db.journalEntries.count(),
      ]);

      const calculated = calculateReadingStats({
        completedChapters: allProgress,
        activities: allActivities,
        activePlanId: preferences.activePlanId,
        totalBookmarks,
        totalJournalEntries: totalJournals,
      });

      setStats(calculated);
      setRecentActivities(allActivities.slice(0, 15));
    }
    loadData();
  }, [preferences.activePlanId]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
          Reading Habit & Statistics
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Honest, transparent statistics of your contemplative Scripture journey.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Unique Chapters</span>
            <BookOpen className="w-4 h-4 text-[var(--primary-green)] dark:text-[var(--gold)]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[var(--text-primary)]">
            {stats?.uniqueChaptersCompleted ?? 0}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Across 73 Catholic books</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Reading Days</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-serif font-bold text-[var(--text-primary)]">
            {stats?.readingDaysCount ?? 0}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Days with Bible engagement</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Reflections</span>
            <PenLine className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-serif font-bold text-[var(--text-primary)]">
            {stats?.totalJournalEntries ?? 0}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Private local entries</p>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-1">
          <div className="flex items-center justify-between text-[var(--text-muted)]">
            <span className="text-xs font-semibold uppercase tracking-wider">Bookmarks</span>
            <Bookmark className="w-4 h-4 text-[var(--gold)]" />
          </div>
          <div className="text-3xl font-serif font-bold text-[var(--text-primary)]">
            {stats?.totalBookmarks ?? 0}
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">Saved sacred passages</p>
        </div>
      </div>

      {/* Progress Across All Reading Plans */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-5 shadow-xs">
        <h2 className="font-serif font-bold text-lg text-[var(--text-primary)]">
          Plan Completion Overview
        </h2>

        <div className="space-y-4">
          {stats?.allPlansProgress.map((plan) => {
            const isCurrent = plan.planId === preferences.activePlanId;
            return (
              <div key={plan.planId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {plan.title}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-[9px] font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-[var(--text-muted)]">
                    {plan.completedChapters} / {plan.totalChapters} ({plan.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-green)] dark:bg-[var(--gold)] rounded-full transition-all duration-500"
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Scripture Activity Log */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4 shadow-xs">
        <h2 className="font-serif font-bold text-lg text-[var(--text-primary)]">
          Recent Scripture Activity
        </h2>

        {recentActivities.length > 0 ? (
          <div className="divide-y divide-[var(--border-color)]/60">
            {recentActivities.map((act) => {
              const book = getBookById(act.bookId);
              const actionLabel =
                act.action === 'chapter_completed'
                  ? 'Completed chapter'
                  : act.action === 'journal_added'
                  ? 'Added reflection for'
                  : act.action === 'bookmark_added'
                  ? 'Bookmarked'
                  : 'Opened';

              return (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        act.action === 'chapter_completed'
                          ? 'text-emerald-600'
                          : 'text-[var(--text-muted)]'
                      }`}
                    />
                    <span>
                      <span className="text-[var(--text-muted)]">{actionLabel} </span>
                      <Link
                        href={`/bible/${book?.slug || act.bookId}/${act.chapter}`}
                        className="font-semibold text-[var(--text-primary)] hover:underline"
                      >
                        {book?.name || act.bookId} {act.chapter}
                      </Link>
                    </span>
                  </div>

                  <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • {act.date}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)] italic text-center py-4">
            No activity recorded yet. Start reading a chapter to build your sacred log.
          </p>
        )}
      </div>
    </div>
  );
}
