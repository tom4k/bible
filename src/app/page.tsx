'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Flame,
  PenLine,
  Bookmark as BookmarkIcon,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db, isChapterCompleted, markChapterCompleted, markChapterIncomplete } from '../lib/db/dexie';
import { getBookById } from '../lib/bible/catalogue';
import { getReadingPlanById } from '../lib/plans/readingPlans';
import { calculateReadingStats, ReadingStatsSummary } from '../lib/stats/calculator';
import { JournalEntry } from '../lib/db/schema';
import { SyroCrossIcon } from '../components/icons/SyroCrossIcon';

export default function HomePage() {
  const { preferences, isLoading: prefsLoading } = useApp();
  const [stats, setStats] = useState<ReadingStatsSummary | null>(null);
  const [latestJournal, setLatestJournal] = useState<JournalEntry | null>(null);
  const [currentChapterIsDone, setCurrentChapterIsDone] = useState(false);

  const activePlan = getReadingPlanById(preferences.activePlanId) || getReadingPlanById('start-with-jesus')!;

  const loadDashboardData = async () => {
    try {
      const [allProgress, allActivities, totalBookmarks, allJournals] = await Promise.all([
        db.chapterProgress.toArray(),
        db.readingActivity.toArray(),
        db.bookmarks.count(),
        db.journalEntries.orderBy('createdAt').reverse().toArray(),
      ]);

      const calculatedStats = calculateReadingStats({
        completedChapters: allProgress,
        activities: allActivities,
        activePlanId: preferences.activePlanId,
        totalBookmarks,
        totalJournalEntries: allJournals.length,
      });

      setStats(calculatedStats);
      setLatestJournal(allJournals.length > 0 ? allJournals[0] : null);

      // Check if current recommended chapter is completed
      const targetBookId = preferences.lastReadBookId || 'mrk';
      const targetChapter = preferences.lastReadChapter || 1;
      const completed = await isChapterCompleted(targetBookId, targetChapter);
      setCurrentChapterIsDone(completed);
    } catch (err) {
      console.warn('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    if (!prefsLoading) {
      loadDashboardData();
    }
  }, [prefsLoading, preferences.activePlanId, preferences.lastReadBookId, preferences.lastReadChapter]);

  // Determine the next chapter to recommend
  const recommendedBookId =
    stats?.activePlanProgress.nextChapter?.bookId || preferences.lastReadBookId || 'mrk';
  const recommendedChapter =
    stats?.activePlanProgress.nextChapter?.chapter || preferences.lastReadChapter || 1;
  const recommendedBook = getBookById(recommendedBookId);

  const toggleChapterCompletion = async () => {
    if (currentChapterIsDone) {
      await markChapterIncomplete(recommendedBookId, recommendedChapter);
      setCurrentChapterIsDone(false);
    } else {
      await markChapterCompleted(recommendedBookId, recommendedChapter, preferences.activePlanId);
      setCurrentChapterIsDone(true);
    }
    await loadDashboardData();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Welcome & Syro-Malabar Heritage Header */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#173B33] to-[#254F44] text-white p-6 sm:p-8 shadow-md">
        <div className="absolute right-3 -bottom-6 opacity-10 pointer-events-none">
          <SyroCrossIcon className="w-64 h-64 text-[var(--gold)]" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-[var(--gold)] border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Catholic Contemplative Habit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
            The Living Word
          </h1>
          <p className="text-sm sm:text-base text-stone-200 font-light leading-relaxed">
            &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo;
            <span className="block mt-1 text-xs text-[var(--gold)] font-serif italic">
              — Psalm 119:105 (NRSV-CE)
            </span>
          </p>
        </div>
      </section>

      {/* Continue Reading Card */}
      <section aria-labelledby="continue-reading-heading">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-xs font-semibold tracking-wider uppercase text-[var(--text-muted)]">
                Continue Reading
              </span>
              <h2
                id="continue-reading-heading"
                className="text-xl sm:text-2xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]"
              >
                {recommendedBook?.name || 'Mark'} {recommendedChapter}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                Active Plan: <span className="font-medium text-[var(--text-primary)]">{activePlan.title}</span>
                {recommendedBook?.isDeuterocanonical && ' • Deuterocanonical'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggleChapterCompletion}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
                  currentChapterIsDone
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]'
                }`}
                aria-label={currentChapterIsDone ? 'Mark chapter incomplete' : 'Mark chapter completed'}
              >
                <CheckCircle2 className={`w-4 h-4 ${currentChapterIsDone ? 'text-emerald-600' : ''}`} />
                <span>{currentChapterIsDone ? 'Completed' : 'Mark Complete'}</span>
              </button>

              <Link
                href={`/bible/${recommendedBook?.slug || 'mark'}/${recommendedChapter}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-green)] text-white hover:bg-[var(--primary-green-hover)] dark:bg-[var(--gold)] dark:text-[#173B33] text-sm font-semibold shadow-sm transition-transform active:scale-95"
              >
                <span>Read Chapter</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Progress & Habit Statistics (Zero artificial data) */}
      <section aria-labelledby="stats-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="stats-heading" className="text-lg font-serif font-bold text-[var(--text-primary)]">
            Habit & Progress
          </h2>
          <Link
            href="/progress"
            className="text-xs font-medium text-[var(--sage)] hover:underline inline-flex items-center gap-1"
          >
            <span>Full Progress</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Chapters</span>
              <BookOpen className="w-4 h-4 text-[var(--primary-green)] dark:text-[var(--gold)]" />
            </div>
            <div className="text-2xl font-bold font-serif text-[var(--text-primary)]">
              {stats?.uniqueChaptersCompleted ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">73 Catholic books</span>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Reading Days</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-serif text-[var(--text-primary)]">
              {stats?.readingDaysCount ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Active days with Scripture</span>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Plan Progress</span>
              <CalendarDays className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-serif text-[var(--text-primary)]">
              {stats?.activePlanProgress.percentage ?? 0}%
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {stats?.activePlanProgress.completedChapters ?? 0} of {activePlan.totalChapters} chapters
            </span>
          </div>

          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
            <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Reflections</span>
              <PenLine className="w-4 h-4 text-[var(--gold)]" />
            </div>
            <div className="text-2xl font-bold font-serif text-[var(--text-primary)]">
              {stats?.totalJournalEntries ?? 0}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">Private local notes</span>
          </div>
        </div>
      </section>

      {/* Active Plan Card with Progress Bar */}
      <section aria-labelledby="active-plan-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="active-plan-heading" className="text-lg font-serif font-bold text-[var(--text-primary)]">
            Active Reading Plan
          </h2>
          <Link
            href="/plans"
            className="text-xs font-medium text-[var(--sage)] hover:underline inline-flex items-center gap-1"
          >
            <span>Explore All Plans</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--primary-green)] dark:text-[var(--gold)]">
                {activePlan.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">{activePlan.subtitle}</p>
              <p className="text-xs text-[var(--text-primary)] line-clamp-2 mt-1">
                {activePlan.description}
              </p>
            </div>
            <Link
              href={`/plans/${activePlan.id}`}
              className="shrink-0 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-medium hover:bg-[var(--bg-card-subtle)] text-[var(--text-primary)]"
            >
              View Plan
            </Link>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>{stats?.activePlanProgress.completedChapters ?? 0} of {activePlan.totalChapters} chapters completed</span>
              <span className="font-semibold">{stats?.activePlanProgress.percentage ?? 0}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
              <div
                className="h-full bg-[var(--primary-green)] dark:bg-[var(--gold)] transition-all duration-500 rounded-full"
                style={{ width: `${stats?.activePlanProgress.percentage ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Latest Journal Reflection or Prompt */}
      <section aria-labelledby="journal-shortcut-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="journal-shortcut-heading" className="text-lg font-serif font-bold text-[var(--text-primary)]">
            Personal Reflection Journal
          </h2>
          <Link
            href="/journal"
            className="text-xs font-medium text-[var(--sage)] hover:underline inline-flex items-center gap-1"
          >
            <span>All Entries</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {latestJournal ? (
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--primary-green)] dark:text-[var(--gold)]">
                {getBookById(latestJournal.bookId)?.name} {latestJournal.chapter}
                {latestJournal.verse ? `:${latestJournal.verse}` : ''}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {new Date(latestJournal.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            {latestJournal.title && (
              <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
                {latestJournal.title}
              </h3>
            )}
            <p className="text-xs sm:text-sm text-[var(--text-muted)] line-clamp-3 italic font-serif">
              &ldquo;{latestJournal.reflection}&rdquo;
            </p>
            <div className="pt-2 flex justify-end">
              <Link
                href="/journal"
                className="text-xs font-medium text-[var(--sage)] hover:text-[var(--primary-green)] inline-flex items-center gap-1"
              >
                <span>Read in Journal</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card-subtle)]/50 p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-card)] mx-auto flex items-center justify-center text-[var(--gold)] shadow-xs">
              <PenLine className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif font-semibold text-sm text-[var(--text-primary)]">
                Contemplative Journal Awaits
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                Capture the quiet inspirations, questions, and prayers God places on your heart during Scripture reading. Private and stored solely on this device.
              </p>
            </div>
            <Link
              href="/journal/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Write a Reflection</span>
            </Link>
          </div>
        )}
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link
          href="/bible"
          className="group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 hover:border-[var(--primary-green)] dark:hover:border-[var(--gold)] transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-card-subtle)] text-[var(--primary-green)] dark:text-[var(--gold)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
              All 73 Catholic Books
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Browse Pentateuch, Historical, Wisdom, Prophets, Gospels, and Epistles.
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--sage)] group-hover:text-[var(--primary-green)] dark:group-hover:text-[var(--gold)] inline-flex items-center gap-1 mt-4">
            Explore Canon <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          href="/plans"
          className="group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 hover:border-[var(--primary-green)] dark:hover:border-[var(--gold)] transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-card-subtle)] text-[var(--primary-green)] dark:text-[var(--gold)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
              5 Guided Reading Plans
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Start With Jesus, Knowing Jesus, Early Church, Genesis, and Psalms of Prayer.
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--sage)] group-hover:text-[var(--primary-green)] dark:group-hover:text-[var(--gold)] inline-flex items-center gap-1 mt-4">
            View Plans <ChevronRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          href="/bookmarks"
          className="group rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 hover:border-[var(--primary-green)] dark:hover:border-[var(--gold)] transition-all flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-card-subtle)] text-[var(--primary-green)] dark:text-[var(--gold)] flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookmarkIcon className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-[var(--text-primary)]">
              Sacred Bookmarks
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Keep favorite passages, verses, and chapters organized for prayer.
            </p>
          </div>
          <span className="text-xs font-semibold text-[var(--sage)] group-hover:text-[var(--primary-green)] dark:group-hover:text-[var(--gold)] inline-flex items-center gap-1 mt-4">
            Open Bookmarks <ChevronRight className="w-3 h-3" />
          </span>
        </Link>
      </section>
    </div>
  );
}
