'use client';

import React, { useEffect, useState, use, Suspense } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Bookmark as BookmarkIcon,
  PenLine,
  LayoutTemplate,
  CalendarDays,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getBookById,
  getBookBySlug,
  isValidChapter,
  getAdjacentChapters,
} from '../../../../lib/bible/catalogue';
import { defaultScriptureProvider } from '../../../../lib/bible/bibleGatewayProvider';
import { useApp } from '../../../../context/AppContext';
import {
  db,
  isChapterCompleted,
  markChapterCompleted,
  markChapterIncomplete,
  recordActivity,
} from '../../../../lib/db/dexie';
import { getReadingPlanById } from '../../../../lib/plans/readingPlans';

interface ReaderProps {
  params: Promise<{
    book: string;
    chapter: string;
  }>;
}

function BibleReaderContent({ params }: ReaderProps) {
  const resolvedParams = use(params);
  const bookParam = resolvedParams.book;
  const chapterNum = parseInt(resolvedParams.chapter, 10);

  const book = getBookBySlug(bookParam) || getBookById(bookParam);
  const valid = book && isValidChapter(book.id, chapterNum);

  const { preferences, setLastRead, setEmbeddedReaderEnabled, notifyProgressChanged } = useApp();

  const [isCompleted, setIsCompleted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showReflectionModal, setShowReflectionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionQuestion, setReflectionQuestion] = useState('');
  const [reflectionPrayer, setReflectionPrayer] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Active plan info
  const activePlan = getReadingPlanById(preferences.activePlanId);
  const isInActivePlan = activePlan?.chapters.some(
    (c) => c.bookId === book?.id && c.chapter === chapterNum
  );

  useEffect(() => {
    if (!book || !valid) return;

    // Record last read and activity
    setLastRead(book.id, chapterNum);
    recordActivity(book.id, chapterNum, 'read_open', preferences.activePlanId);

    // Check completion status
    isChapterCompleted(book.id, chapterNum).then(setIsCompleted);

    // Check if bookmarked
    db.bookmarks
      .where('bookId')
      .equals(book.id)
      .and((b) => b.chapter === chapterNum && !b.verse)
      .first()
      .then((bm) => setIsBookmarked(Boolean(bm)));
  }, [book?.id, chapterNum, valid]);

  if (!book || !valid) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-2xl font-serif font-bold text-[var(--text-primary)]">
          Chapter Not Found
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
          The requested Catholic Scripture chapter does not exist in the 73-book canon.
        </p>
        <Link
          href="/bible"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Bible Canon</span>
        </Link>
      </div>
    );
  }

  const adjacent = getAdjacentChapters(book.id, chapterNum);
  const passageUrl = defaultScriptureProvider.getPassageUrl({
    bookId: book.id,
    chapter: chapterNum,
  });

  const toggleCompletion = async () => {
    if (isCompleted) {
      await markChapterIncomplete(book.id, chapterNum);
      setIsCompleted(false);
    } else {
      await markChapterCompleted(book.id, chapterNum, preferences.activePlanId);
      setIsCompleted(true);
    }
    notifyProgressChanged();
  };

  const toggleBookmark = async () => {
    const existing = await db.bookmarks
      .where('bookId')
      .equals(book.id)
      .and((b) => b.chapter === chapterNum && !b.verse)
      .first();

    if (existing) {
      await db.bookmarks.delete(existing.id);
      setIsBookmarked(false);
      setSaveMessage('Bookmark removed');
    } else {
      const id = `bm-${book.id}-${chapterNum}-${Date.now()}`;
      await db.bookmarks.add({
        id,
        bookId: book.id,
        chapter: chapterNum,
        createdAt: new Date().toISOString(),
      });
      await recordActivity(book.id, chapterNum, 'bookmark_added', preferences.activePlanId);
      setIsBookmarked(true);
      setSaveMessage('Chapter bookmarked');
    }
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;

    const id = `jnl-${book.id}-${chapterNum}-${Date.now()}`;
    const now = new Date().toISOString();

    await db.journalEntries.add({
      id,
      bookId: book.id,
      chapter: chapterNum,
      reflection: reflectionText.trim(),
      question: reflectionQuestion.trim() || undefined,
      prayer: reflectionPrayer.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    await recordActivity(book.id, chapterNum, 'journal_added', preferences.activePlanId);

    setReflectionText('');
    setReflectionQuestion('');
    setReflectionPrayer('');
    setShowReflectionModal(false);
    setSaveMessage('Reflection saved to your local journal');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Alert */}
      {saveMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[var(--primary-green)] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-[var(--gold)]" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Breadcrumb & Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Link
            href="/bible"
            className="hover:text-[var(--primary-green)] dark:hover:text-[var(--gold)] flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bible</span>
          </Link>
          <span>/</span>
          <span>{book.name}</span>
          <span>/</span>
          <span className="font-semibold text-[var(--text-primary)]">Chapter {chapterNum}</span>
          {isInActivePlan && activePlan && (
            <Link
              href={`/plans/${activePlan.id}`}
              className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--gold-subtle)] text-[#795213] dark:text-[var(--gold)] text-[10px] font-semibold"
            >
              <CalendarDays className="w-3 h-3" />
              <span>{activePlan.title}</span>
            </Link>
          )}
        </div>

        {/* Reader Mode Feature Flag Switch */}
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

      {/* Reader Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
              {book.name} {chapterNum}
            </h1>
            {book.isDeuterocanonical && (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[var(--gold-subtle)] text-[#795213] dark:text-[var(--gold)]">
                Deuterocanonical
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            New Revised Standard Version Catholic Edition (NRSV-CE)
          </p>
        </div>

        {/* Reader Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleCompletion}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${
              isCompleted
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--primary-green)]'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'text-emerald-600' : ''}`} />
            <span>{isCompleted ? 'Chapter Completed' : 'Mark Completed'}</span>
          </button>

          <button
            onClick={toggleBookmark}
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
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs sm:text-sm font-medium text-[var(--text-primary)] hover:border-[var(--primary-green)] transition-colors"
          >
            <PenLine className="w-4 h-4 text-[var(--primary-green)] dark:text-[var(--gold)]" />
            <span>Reflect</span>
          </button>
        </div>
      </div>

      {/* Main Scripture Reading View Area */}
      {preferences.embeddedReaderEnabled ? (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden shadow-sm">
            <iframe
              src={passageUrl}
              title={`Bible Gateway NRSV-CE - ${book.name} ${chapterNum}`}
              className="w-full h-[70vh] sm:h-[75vh] border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
              loading="lazy"
            />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] italic text-center">
            Embedded from Bible Gateway. If your browser restricts cross-origin embedding, use the &ldquo;Bible Gateway&rdquo; direct button above.
          </p>
        </div>
      ) : (
        /* Direct Reading Mode (Default per safe compatibility & copyright requirements) */
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card-subtle)] mx-auto flex items-center justify-center text-[var(--primary-green)] dark:text-[var(--gold)]">
            <ExternalLink className="w-8 h-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-primary)]">
              Read {book.name} Chapter {chapterNum}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              Read the complete, authorized New Revised Standard Version Catholic Edition text directly on Bible Gateway.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a
              href={passageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--primary-green)] text-white hover:bg-[var(--primary-green-hover)] dark:bg-[var(--gold)] dark:text-[#173B33] text-sm font-semibold shadow-sm transition-transform active:scale-95"
            >
              <span>Open in Bible Gateway</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={() => setEmbeddedReaderEnabled(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-subtle)] text-sm font-medium text-[var(--text-primary)] transition-colors"
            >
              <LayoutTemplate className="w-4 h-4 text-[var(--text-muted)]" />
              <span>Try Embedded View</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[var(--border-color)]/60 max-w-lg mx-auto">
            <p className="text-[11px] text-[var(--text-muted)] leading-normal">
              New Revised Standard Version Bible: Catholic Edition, copyright © 1989, 1993 Division of Christian Education of the National Council of the Churches of Christ in the USA.
            </p>
          </div>
        </div>
      )}

      {/* Prev / Next Chapter Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        {adjacent.previous ? (
          <Link
            href={`/bible/${adjacent.previous.book.slug}/${adjacent.previous.chapter}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary-green)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              {adjacent.previous.book.name} {adjacent.previous.chapter}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {adjacent.next ? (
          <Link
            href={`/bible/${adjacent.next.book.slug}/${adjacent.next.chapter}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary-green)] text-xs sm:text-sm font-semibold text-[var(--text-primary)] transition-colors"
          >
            <span>
              {adjacent.next.book.name} {adjacent.next.chapter}
            </span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Add Reflection Modal */}
      {showReflectionModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reflection-modal-title"
        >
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div>
                <h2
                  id="reflection-modal-title"
                  className="font-serif font-bold text-lg text-[var(--primary-green)] dark:text-[var(--gold)]"
                >
                  Contemplative Reflection
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {book.name} {chapterNum} • Private and stored locally
                </p>
              </div>
              <button
                onClick={() => setShowReflectionModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReflection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Reflection / Insights *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="What spoke to your heart in this chapter?"
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Question for Contemplation (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. How does Jesus' obedience challenge my pride?"
                  value={reflectionQuestion}
                  onChange={(e) => setReflectionQuestion(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Personal Prayer (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Lord Jesus, help me..."
                  value={reflectionPrayer}
                  onChange={(e) => setReflectionPrayer(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReflectionModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs"
                >
                  Save Reflection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BibleReaderPage({ params }: ReaderProps) {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center text-xs text-[var(--text-muted)]">
          Opening Catholic Scripture passage...
        </div>
      }
    >
      <BibleReaderContent params={params} />
    </Suspense>
  );
}
