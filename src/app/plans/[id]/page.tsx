'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Play, Check } from 'lucide-react';
import { getReadingPlanById } from '../../../lib/plans/readingPlans';
import { getBookById } from '../../../lib/bible/catalogue';
import { useApp } from '../../../context/AppContext';
import {
  db,
  markChapterCompleted,
  markChapterIncomplete,
} from '../../../lib/db/dexie';

interface PlanDetailProps {
  params: Promise<{
    id: string;
  }>;
}

function PlanDetailContent({ params }: PlanDetailProps) {
  const resolvedParams = use(params);
  const planId = resolvedParams.id;
  const plan = getReadingPlanById(planId);

  const { preferences, setActivePlanId, progressVersion, notifyProgressChanged } = useApp();
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());

  const loadProgress = async () => {
    const records = await db.chapterProgress.toArray();
    const set = new Set(records.map((r) => `${r.bookId}:${r.chapter}`));
    setCompletedSet(set);
  };

  useEffect(() => {
    loadProgress();
  }, [progressVersion]);

  useEffect(() => {
    const onFocus = () => loadProgress();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  if (!plan) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
          Plan Not Found
        </h1>
        <Link
          href="/plans"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Plans</span>
        </Link>
      </div>
    );
  }

  const isActive = preferences.activePlanId === plan.id;

  // Calculate completed count and identify the next unfinished chapter
  let completedCount = 0;
  let nextUnfinishedChapter: { bookId: string; chapter: number; slug: string } | null = null;

  for (const item of plan.chapters) {
    const key = `${item.bookId}:${item.chapter}`;
    if (completedSet.has(key)) {
      completedCount++;
    } else if (!nextUnfinishedChapter) {
      const book = getBookById(item.bookId);
      if (book) {
        nextUnfinishedChapter = {
          bookId: item.bookId,
          chapter: item.chapter,
          slug: book.slug,
        };
      }
    }
  }

  const percentage = Math.round((completedCount / plan.totalChapters) * 100);

  const handleToggle = async (bookId: string, chapter: number) => {
    const key = `${bookId}:${chapter}`;
    if (completedSet.has(key)) {
      await markChapterIncomplete(bookId, chapter);
    } else {
      await markChapterCompleted(bookId, chapter, plan.id);
    }
    notifyProgressChanged();
    await loadProgress();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back button */}
      <div>
        <Link
          href="/plans"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Reading Plans</span>
        </Link>
      </div>

      {/* Plan Header Card */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
                {plan.title}
              </h1>
              {isActive && (
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-[10px] font-bold uppercase tracking-wider">
                  Active Plan
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[var(--sage)] dark:text-[var(--gold)]">
              {plan.subtitle}
            </p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed pt-1">
              {plan.description}
            </p>
            {plan.traditionNote && (
              <p className="text-xs text-[var(--text-muted)] italic font-serif pt-1">
                Catholic Tradition: {plan.traditionNote}
              </p>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 shrink-0">
            {!isActive && (
              <button
                onClick={() => setActivePlanId(plan.id)}
                className="px-4 py-2 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-green)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-card-subtle)] transition-colors"
              >
                Set as Active Plan
              </button>
            )}

            {nextUnfinishedChapter ? (
              <Link
                href={`/bible/${nextUnfinishedChapter.slug}/${nextUnfinishedChapter.chapter}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-bold shadow-sm transition-transform active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume Reading (Ch {nextUnfinishedChapter.chapter})</span>
              </Link>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Plan Completed!</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2 space-y-1.5">
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>
              {completedCount} of {plan.totalChapters} chapters completed
            </span>
            <span className="font-semibold text-[var(--text-primary)]">{percentage}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
            <div
              className="h-full bg-[var(--primary-green)] dark:bg-[var(--gold)] rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chapters Ordered List */}
      <div className="space-y-3">
        <h2 className="text-lg font-serif font-bold text-[var(--text-primary)]">
          Plan Chapters ({plan.totalChapters})
        </h2>

        <div className="space-y-2">
          {plan.chapters.map((item, idx) => {
            const book = getBookById(item.bookId);
            const key = `${item.bookId}:${item.chapter}`;
            const isDone = completedSet.has(key);

            return (
              <div
                key={`${key}-${idx}`}
                className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-3 sm:p-4 flex items-center justify-between gap-3 hover:border-[var(--primary-green)] transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(item.bookId, item.chapter)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                      isDone
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--primary-green)] text-transparent'
                    }`}
                    aria-label={`Toggle completion for ${book?.name} ${item.chapter}`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--text-muted)]">
                        #{idx + 1}
                      </span>
                      <span
                        className={`font-serif font-bold text-sm sm:text-base ${
                          isDone
                            ? 'line-through text-[var(--text-muted)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {book?.name} {item.chapter}
                      </span>
                    </div>
                    {item.label && (
                      <p className="text-xs text-[var(--text-muted)] italic">
                        {item.label}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/bible/${book?.slug}/${item.chapter}`}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] hover:border-[var(--primary-green)] text-xs font-semibold text-[var(--primary-green)] dark:text-[var(--gold)] hover:bg-[var(--bg-card-subtle)] flex items-center gap-1 shrink-0"
                >
                  <span>Read</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function PlanDetailPage({ params }: PlanDetailProps) {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-[var(--text-muted)]">
          Loading reading plan details...
        </div>
      }
    >
      <PlanDetailContent params={params} />
    </Suspense>
  );
}
