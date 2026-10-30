'use client';

import React, { Suspense, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Bookmark as BookmarkIcon,
  PenLine,
  LayoutTemplate,
  Sparkles,
  Trophy,
  Compass,
  X,
  Check,
} from 'lucide-react';
import {
  getBookById,
  getBookBySlug,
  isValidChapter,
} from '../../../lib/bible/catalogue';
import { defaultScriptureProvider } from '../../../lib/bible/bibleGatewayProvider';
import { useApp } from '../../../context/AppContext';
import {
  db,
  markChapterCompleted,
  markChapterIncomplete,
  recordActivity,
} from '../../../lib/db/dexie';
import {
  ALL_JOURNEY_CHAPTERS,
  JOURNEY_STAGES,
  JOURNEY_REFLECTION_PROMPTS,
} from '../../../lib/journey/definition';
import { JOURNEY_PACE_PRESETS, JourneyPaceConfig } from '../../../lib/journey/types';

interface MilestoneCelebration {
  type: 'book' | 'stage' | 'journey';
  title: string;
  subtitle: string;
  description: string;
}

function JourneyReaderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedBookParam = searchParams.get('book');
  const requestedChapterParam = searchParams.get('chapter');

  const { preferences, setEmbeddedReaderEnabled, setLastJourneyPosition, notifyProgressChanged } = useApp();

  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [sessionChapters, setSessionChapters] = useState<typeof ALL_JOURNEY_CHAPTERS[number][]>([]);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Reflection Modal State (FR-07)
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [promptGod, setPromptGod] = useState('');
  const [promptDifficult, setPromptDifficult] = useState('');
  const [promptLife, setPromptLife] = useState('');
  const [promptPrayer, setPromptPrayer] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Milestone celebration banner (FR-08)
  const [milestone, setMilestone] = useState<MilestoneCelebration | null>(null);

  // Load all completed chapters from Dexie
  const loadCompletedChapters = async () => {
    const list = await db.chapterProgress.toArray();
    const set = new Set(list.map((c) => `${c.bookId}:${c.chapter}`));
    setCompletedKeys(set);
    setIsLoaded(true);
    return set;
  };

  useEffect(() => {
    loadCompletedChapters();
  }, []);

  // Compute pace config
  const paceConfig: JourneyPaceConfig = useMemo(() => {
    if (preferences.journeyPace === 'custom') {
      return {
        preset: 'custom',
        name: 'Custom Pace',
        chaptersPerSession: preferences.customChaptersPerSession || 1,
        sessionsPerWeek: preferences.customSessionsPerWeek || 5,
        description: `${preferences.customChaptersPerSession} chapters, ${preferences.customSessionsPerWeek} days/week`,
      };
    }
    return JOURNEY_PACE_PRESETS[preferences.journeyPace] || JOURNEY_PACE_PRESETS.gentle;
  }, [preferences.journeyPace, preferences.customChaptersPerSession, preferences.customSessionsPerWeek]);

  // Initialize or update reading assignment once on load or when query params change
  useEffect(() => {
    if (!isLoaded) return;

    // If explicit query params are provided
    if (requestedBookParam && requestedChapterParam) {
      const parsedCh = parseInt(requestedChapterParam, 10);
      const matchedBook = getBookBySlug(requestedBookParam) || getBookById(requestedBookParam);
      if (matchedBook && isValidChapter(matchedBook.id, parsedCh)) {
        const found = ALL_JOURNEY_CHAPTERS.find(
          (j) => j.bookId === matchedBook.id && j.chapter === parsedCh
        );
        if (found) {
          setSessionChapters([found]);
          setActiveSessionIndex(0);
          return;
        }
      }
    }

    // Default daily session assignment based on current unread chapters
    const targetCount = Math.max(1, paceConfig.chaptersPerSession);
    const unread: typeof ALL_JOURNEY_CHAPTERS[number][] = [];

    for (const item of ALL_JOURNEY_CHAPTERS) {
      if (!completedKeys.has(`${item.bookId}:${item.chapter}`)) {
        unread.push(item);
        if (unread.length >= targetCount) break;
      }
    }

    const session = unread.length > 0 ? unread : [ALL_JOURNEY_CHAPTERS[ALL_JOURNEY_CHAPTERS.length - 1]];
    setSessionChapters(session);
    setActiveSessionIndex(0);
  }, [isLoaded, requestedBookParam, requestedChapterParam, paceConfig.preset, paceConfig.chaptersPerSession]);

  const currentChapterItem = useMemo(() => {
    if (sessionChapters.length === 0) return null;
    const safeIndex = Math.min(activeSessionIndex, sessionChapters.length - 1);
    return sessionChapters[safeIndex] || sessionChapters[0];
  }, [sessionChapters, activeSessionIndex]);

  const currentBook = useMemo(() => {
    return currentChapterItem ? getBookById(currentChapterItem.bookId) : null;
  }, [currentChapterItem]);

  const currentStage = useMemo(() => {
    return currentChapterItem
      ? JOURNEY_STAGES.find((s) => s.id === currentChapterItem.stageId)
      : null;
  }, [currentChapterItem]);

  const isCurrentCompleted = useMemo(() => {
    if (!currentChapterItem) return false;
    return completedKeys.has(`${currentChapterItem.bookId}:${currentChapterItem.chapter}`);
  }, [currentChapterItem, completedKeys]);

  // Update last opened journey position and record activity
  useEffect(() => {
    if (!currentChapterItem || !currentBook) return;

    setLastJourneyPosition(currentBook.id, currentChapterItem.chapter);
    recordActivity(currentBook.id, currentChapterItem.chapter, 'read_open', 'my-bible-journey');

    // Check bookmark
    db.bookmarks
      .where('bookId')
      .equals(currentBook.id)
      .and((b) => b.chapter === currentChapterItem.chapter && !b.verse)
      .first()
      .then((bm) => setIsBookmarked(Boolean(bm)));
  }, [currentChapterItem?.bookId, currentChapterItem?.chapter]);

  if (!isLoaded || !currentChapterItem || !currentBook) {
    return (
      <div className="py-20 text-center space-y-3">
        <Compass className="w-8 h-8 text-[var(--gold)] animate-spin mx-auto" />
        <p className="text-sm text-[var(--text-muted)] font-serif">
          Preparing your Bible Journey reading session...
        </p>
      </div>
    );
  }

  const passageUrl = defaultScriptureProvider.getPassageUrl({
    bookId: currentBook.id,
    chapter: currentChapterItem.chapter,
  });

  // Toggle chapter completion and verify milestone celebrations
  const handleToggleCompletion = async () => {
    const key = `${currentBook.id}:${currentChapterItem.chapter}`;
    const nextKeys = new Set(completedKeys);

    if (isCurrentCompleted) {
      await markChapterIncomplete(currentBook.id, currentChapterItem.chapter);
      nextKeys.delete(key);
      setCompletedKeys(nextKeys);
      setMilestone(null);
      notifyProgressChanged();
      setSaveMessage(`Marked ${currentBook.name} ${currentChapterItem.chapter} incomplete`);
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      await markChapterCompleted(currentBook.id, currentChapterItem.chapter, 'my-bible-journey');
      nextKeys.add(key);
      setCompletedKeys(nextKeys);
      notifyProgressChanged();

      // Check milestones
      let bookFinished = true;
      for (let ch = 1; ch <= currentBook.chapterCount; ch++) {
        if (!nextKeys.has(`${currentBook.id}:${ch}`)) {
          bookFinished = false;
          break;
        }
      }

      let stageFinished = false;
      if (currentStage && bookFinished) {
        stageFinished = true;
        for (const bId of currentStage.bookIds) {
          const b = getBookById(bId);
          if (!b) continue;
          for (let ch = 1; ch <= b.chapterCount; ch++) {
            if (!nextKeys.has(`${b.id}:${ch}`)) {
              stageFinished = false;
              break;
            }
          }
          if (!stageFinished) break;
        }
      }

      const journeyFinished = nextKeys.size === ALL_JOURNEY_CHAPTERS.length;

      if (journeyFinished) {
        setMilestone({
          type: 'journey',
          title: 'Catholic Bible Journey Complete! 🕊️',
          subtitle: 'All 73 Canonical Books and 1,334 Chapters Finished',
          description:
            'You have traversed the entire Word of God, from Genesis to Revelation. May the living Word dwell richly in your heart and bear abundant spiritual fruit.',
        });
      } else if (stageFinished && currentStage) {
        setMilestone({
          type: 'stage',
          title: `Stage ${currentStage.id} Completed! 🏆`,
          subtitle: currentStage.name,
          description: `You have completed every chapter across all books in "${currentStage.name}". A momentous spiritual milestone!`,
        });
      } else if (bookFinished) {
        setMilestone({
          type: 'book',
          title: `Book Completed: ${currentBook.name}! 🎉`,
          subtitle: `All ${currentBook.chapterCount} Chapters Read`,
          description: `You have successfully read the complete book of ${currentBook.name}. Continue walking in faith through Sacred Scripture.`,
        });
      }

      setSaveMessage(`Marked ${currentBook.name} ${currentChapterItem.chapter} completed`);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleToggleBookmark = async () => {
    const existing = await db.bookmarks
      .where('bookId')
      .equals(currentBook.id)
      .and((b) => b.chapter === currentChapterItem.chapter && !b.verse)
      .first();

    if (existing) {
      await db.bookmarks.delete(existing.id);
      setIsBookmarked(false);
      setSaveMessage('Bookmark removed');
    } else {
      const id = `bm-${currentBook.id}-${currentChapterItem.chapter}-${Date.now()}`;
      await db.bookmarks.add({
        id,
        bookId: currentBook.id,
        chapter: currentChapterItem.chapter,
        createdAt: new Date().toISOString(),
      });
      await recordActivity(
        currentBook.id,
        currentChapterItem.chapter,
        'bookmark_added',
        'my-bible-journey'
      );
      setIsBookmarked(true);
      setSaveMessage('Chapter bookmarked');
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Save reflection (FR-07)
  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptGod.trim() && !promptDifficult.trim() && !promptLife.trim() && !promptPrayer.trim()) {
      return;
    }

    const id = `jnl-journey-${currentBook.id}-${currentChapterItem.chapter}-${Date.now()}`;
    const now = new Date().toISOString();

    const sections: string[] = [];
    if (promptGod.trim()) {
      sections.push(`**What this taught me about God:**\n${promptGod.trim()}`);
    }
    if (promptLife.trim()) {
      sections.push(`**Application to my life:**\n${promptLife.trim()}`);
    }

    const reflectionCombined = sections.join('\n\n') || promptGod.trim() || promptDifficult.trim() || promptLife.trim() || 'Journey Reflection';

    await db.journalEntries.add({
      id,
      bookId: currentBook.id,
      chapter: currentChapterItem.chapter,
      title: `My Bible Journey: ${currentBook.name} ${currentChapterItem.chapter}`,
      reflection: reflectionCombined,
      question: promptDifficult.trim() || undefined,
      prayer: promptPrayer.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    await recordActivity(
      currentBook.id,
      currentChapterItem.chapter,
      'journal_added',
      'my-bible-journey'
    );

    setPromptGod('');
    setPromptDifficult('');
    setPromptLife('');
    setPromptPrayer('');
    setShowReflectionModal(false);
    setSaveMessage('Reflection saved to your journal');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Journey progression helpers
  const currentGlobalIndex = currentChapterItem.globalIndex;
  const prevChapter =
    currentGlobalIndex > 1 ? ALL_JOURNEY_CHAPTERS[currentGlobalIndex - 2] : null;
  const nextChapter =
    currentGlobalIndex < ALL_JOURNEY_CHAPTERS.length
      ? ALL_JOURNEY_CHAPTERS[currentGlobalIndex]
      : null;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Toast Alert */}
      {saveMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[var(--primary-green)] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[var(--gold)]" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Milestone Celebration Modal */}
      {milestone && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--gold)] max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-5 text-center shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setMilestone(null)}
              className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Close celebration"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--gold-subtle)] text-[var(--gold)] flex items-center justify-center shadow-inner">
              <Trophy className="w-8 h-8 text-[#795213] dark:text-[var(--gold)]" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-[var(--gold-subtle)] text-[#795213] dark:text-[var(--gold)]">
                Milestone Achieved
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)] pt-1">
                {milestone.title}
              </h2>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                {milestone.subtitle}
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed pt-1">
                {milestone.description}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => setMilestone(null)}
                className="w-full py-2.5 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold"
              >
                Continue Journey
              </button>
              <Link
                href="/journey"
                className="w-full py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--primary-green)] text-center flex items-center justify-center"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Top Breadcrumb & Session Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link
            href="/journey"
            className="hover:text-[var(--primary-green)] dark:hover:text-[var(--gold)] flex items-center gap-1 font-medium"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>My Bible Journey</span>
          </Link>
          <span>/</span>
          {currentStage && (
            <span className="font-medium text-[var(--text-muted)] truncate max-w-[150px] sm:max-w-none">
              Stage {currentStage.id}: {currentStage.name}
            </span>
          )}
          <span>/</span>
          <span className="font-semibold text-[var(--text-primary)]">
            {currentBook.name} {currentChapterItem.chapter}
          </span>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEmbeddedReaderEnabled(!preferences.embeddedReaderEnabled)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              preferences.embeddedReaderEnabled
                ? 'border-[var(--primary-green)] bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33]'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            title="Toggle between embedded iframe and direct external reading mode"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>{preferences.embeddedReaderEnabled ? 'Embed View' : 'Direct Link View'}</span>
          </button>

          <a
            href={passageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--primary-green)] transition-colors shadow-2xs"
            aria-label="Open in Bible Gateway (external link)"
          >
            <span>Bible Gateway</span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          </a>
        </div>
      </div>

      {/* Multi-chapter Session Tabs (FR-04) */}
      {sessionChapters.length > 1 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Today&apos;s Reading Session:
            </span>
            <span className="text-xs font-medium text-[var(--text-muted)]">
              ({sessionChapters.length} chapters at {paceConfig.name})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {sessionChapters.map((sc, idx) => {
              const b = getBookById(sc.bookId);
              const done = completedKeys.has(`${sc.bookId}:${sc.chapter}`);
              const isActive = idx === activeSessionIndex;
              return (
                <button
                  key={`${sc.bookId}-${sc.chapter}`}
                  onClick={() => setActiveSessionIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] shadow-xs'
                      : 'border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-[var(--text-primary)] hover:border-[var(--primary-green)]'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-current text-[10px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                  )}
                  <span>
                    {b?.name} {sc.chapter}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reader Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
              {currentBook.name} {currentChapterItem.chapter}
            </h1>
            {currentBook.isDeuterocanonical && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[var(--gold-subtle)] text-[#795213] dark:text-[var(--gold)]">
                Deuterocanonical
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]">
              Chapter {currentGlobalIndex} of {ALL_JOURNEY_CHAPTERS.length}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            New Revised Standard Version Catholic Edition (NRSV-CE) • Stage {currentStage?.id}: {currentStage?.name}
          </p>
        </div>

        {/* Reader Action Toolbar (FR-04) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleToggleCompletion}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              isCurrentCompleted
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-xs'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--primary-green)] hover:shadow-xs'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCurrentCompleted ? 'text-emerald-600' : ''}`} />
            <span>{isCurrentCompleted ? 'Chapter Completed' : 'Mark Completed'}</span>
          </button>

          <button
            onClick={handleToggleBookmark}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition-colors ${
              isBookmarked
                ? 'border-[var(--gold)] bg-[var(--gold-subtle)] text-[#795213] dark:text-[var(--gold)]'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark chapter'}
          >
            <BookmarkIcon className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>

          <button
            onClick={() => setShowReflectionModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:border-[var(--primary-green)] transition-colors shadow-2xs"
          >
            <PenLine className="w-4 h-4 text-[var(--primary-green)] dark:text-[var(--gold)]" />
            <span>Add Reflection</span>
          </button>
        </div>
      </div>

      {/* Main Scripture Reading View Area */}
      {preferences.embeddedReaderEnabled ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
            <iframe
              src={passageUrl}
              title={`Bible Gateway NRSV-CE - ${currentBook.name} ${currentChapterItem.chapter}`}
              className="w-full h-[70vh] sm:h-[75vh] border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              loading="lazy"
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] italic text-center">
            Scripture rendered from Bible Gateway NRSV-CE. If cross-origin security prevents display in your browser, switch to &ldquo;Direct Link View&rdquo; or tap &ldquo;Bible Gateway&rdquo; above.
          </p>
        </div>
      ) : (
        /* Direct Reading Mode Fallback */
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card-subtle)] mx-auto flex items-center justify-center text-[var(--primary-green)] dark:text-[var(--gold)]">
            <ExternalLink className="w-8 h-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-primary)]">
              Read {currentBook.name} Chapter {currentChapterItem.chapter}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Read the full, official Catholic text on Bible Gateway under the Catholic New Revised Standard Version (NRSV-CE). When you finish, return here to mark the chapter complete and log your spiritual reflection.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={passageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-sm font-semibold shadow-sm transition-transform active:scale-95"
            >
              <span>Open Scripture on Bible Gateway</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => setEmbeddedReaderEnabled(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-primary)] hover:border-[var(--primary-green)]"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span>Try Embedded View</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation Footer (FR-04) */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {prevChapter ? (
              <button
                onClick={() => {
                  router.push(`/journey/read?book=${prevChapter.bookId}&chapter=${prevChapter.chapter}`);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--primary-green)]"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous: {getBookById(prevChapter.bookId)?.name} {prevChapter.chapter}</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* If in multi-chapter session and on chapter 1 of 2 */}
            {sessionChapters.length > 1 && activeSessionIndex < sessionChapters.length - 1 ? (
              <button
                onClick={() => setActiveSessionIndex(activeSessionIndex + 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs"
              >
                <span>Continue to Next Chapter ({sessionChapters[activeSessionIndex + 1]?.chapter})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : nextChapter ? (
              <button
                onClick={() => {
                  router.push(`/journey/read?book=${nextChapter.bookId}&chapter=${nextChapter.chapter}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-xs font-medium text-[var(--text-primary)] hover:border-[var(--primary-green)]"
              >
                <span>Next: {getBookById(nextChapter.bookId)?.name} {nextChapter.chapter}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            <Link
              href="/journey"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--gold)] text-[#173B33] dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-bold shadow-xs hover:opacity-90"
            >
              <Check className="w-4 h-4" />
              <span>Finish Today&apos;s Session</span>
            </Link>
          </div>
        </div>

        {/* Catholic Contemplative Encouragement Note */}
        <p className="text-[11px] text-[var(--text-muted)] text-center border-t border-[var(--border-color)] pt-3 italic">
          &ldquo;Your word is a lamp to my feet and a light to my path.&rdquo; — Psalm 119:105
        </p>
      </div>

      {/* Reflection Modal (FR-07) */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] max-w-xl w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative my-8 animate-scale-up">
            <button
              onClick={() => setShowReflectionModal(false)}
              className="absolute top-5 right-5 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Close reflection modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--gold)] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Contemplative Reflection</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
                {currentBook.name} Chapter {currentChapterItem.chapter}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Optional prayerful prompts for your Catholic spiritual journal. Complete any or all.
              </p>
            </div>

            <form onSubmit={handleSaveReflection} className="space-y-4">
              {/* Prompt 1 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  {JOURNEY_REFLECTION_PROMPTS[0]}
                </label>
                <textarea
                  value={promptGod}
                  onChange={(e) => setPromptGod(e.target.value)}
                  placeholder="His mercy, justice, holiness, steadfast love..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary-green)] resize-none"
                />
              </div>

              {/* Prompt 2 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  {JOURNEY_REFLECTION_PROMPTS[1]}
                </label>
                <textarea
                  value={promptDifficult}
                  onChange={(e) => setPromptDifficult(e.target.value)}
                  placeholder="Questions, surprising verses, historical context..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary-green)] resize-none"
                />
              </div>

              {/* Prompt 3 */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  {JOURNEY_REFLECTION_PROMPTS[2]}
                </label>
                <textarea
                  value={promptLife}
                  onChange={(e) => setPromptLife(e.target.value)}
                  placeholder="Practical virtues, forgiveness, prayer habits..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary-green)] resize-none"
                />
              </div>

              {/* Optional Prayer */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Personal Prayer (Optional)
                </label>
                <textarea
                  value={promptPrayer}
                  onChange={(e) => setPromptPrayer(e.target.value)}
                  placeholder="Lord Jesus, give me the grace to live this word..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--primary-green)] resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReflectionModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Skip / Cancel
                </button>
                <button
                  type="submit"
                  disabled={!promptGod.trim() && !promptDifficult.trim() && !promptLife.trim() && !promptPrayer.trim()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs disabled:opacity-50 transition-transform active:scale-95"
                >
                  Save Reflection to Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JourneyReadingSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center space-y-3">
          <Compass className="w-8 h-8 text-[var(--gold)] animate-spin mx-auto" />
          <p className="text-sm text-[var(--text-muted)] font-serif">Loading your reading journey session...</p>
        </div>
      }
    >
      <JourneyReaderContent />
    </Suspense>
  );
}
