'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, PenLine } from 'lucide-react';
import { CATHOLIC_BIBLE_BOOKS, getBookById } from '../../../lib/bible/catalogue';
import { db, recordActivity } from '../../../lib/db/dexie';
import { useApp } from '../../../context/AppContext';

function JournalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { preferences } = useApp();

  const initialBookId = searchParams.get('book') || preferences.lastReadBookId || 'mrk';
  const initialChapter = parseInt(searchParams.get('chapter') || `${preferences.lastReadChapter || 1}`, 10);
  const initialVerse = searchParams.get('verse') ? parseInt(searchParams.get('verse')!, 10) : undefined;

  const [bookId, setBookId] = useState(initialBookId);
  const [chapter, setChapter] = useState(initialChapter);
  const [verse, setVerse] = useState<number | undefined>(initialVerse);
  const [title, setTitle] = useState('');
  const [reflection, setReflection] = useState('');
  const [question, setQuestion] = useState('');
  const [prayer, setPrayer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBook = getBookById(bookId) || CATHOLIC_BIBLE_BOOKS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.trim()) return;

    setIsSubmitting(true);
    const now = new Date().toISOString();
    const id = `jnl-${bookId}-${chapter}-${Date.now()}`;

    await db.journalEntries.add({
      id,
      bookId,
      chapter,
      verse: verse || undefined,
      title: title.trim() || undefined,
      reflection: reflection.trim(),
      question: question.trim() || undefined,
      prayer: prayer.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });

    await recordActivity(bookId, chapter, 'journal_added', preferences.activePlanId);

    router.push('/journal');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Journal</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
          New Reflection
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Contemplate Scripture and record what God is speaking to your soul.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-5 shadow-sm">
        {/* Scripture Reference Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4 border-b border-[var(--border-color)]">
          <div className="sm:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Catholic Book *
            </label>
            <select
              value={bookId}
              onChange={(e) => {
                setBookId(e.target.value);
                setChapter(1);
              }}
              className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            >
              {CATHOLIC_BIBLE_BOOKS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.testament}) {b.isDeuterocanonical ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Chapter (1–{selectedBook.chapterCount}) *
            </label>
            <input
              type="number"
              min={1}
              max={selectedBook.chapterCount}
              value={chapter}
              onChange={(e) => setChapter(parseInt(e.target.value, 10) || 1)}
              required
              className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Verse (Optional)
            </label>
            <input
              type="number"
              min={1}
              placeholder="e.g. 15"
              value={verse ?? ''}
              onChange={(e) => setVerse(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Reflection Title (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Encountering Christ in the Desert"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
          />
        </div>

        {/* Reflection Text */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Contemplative Reflection *
          </label>
          <textarea
            rows={6}
            required
            placeholder="How does this passage speak into your life today? What truth or virtue is illuminated?"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] leading-relaxed"
          />
        </div>

        {/* Question */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Question for Meditation (Optional)
          </label>
          <input
            type="text"
            placeholder="What question lingers with me after reading?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
          />
        </div>

        {/* Prayer */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            Personal Prayer (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="A short prayer offering these thoughts to the Lord..."
            value={prayer}
            onChange={(e) => setPrayer(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] italic font-serif"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-3">
          <Link
            href="/journal"
            className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !reflection.trim()}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-bold shadow-sm transition-transform active:scale-95 disabled:opacity-50"
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Reflection'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewJournalEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-xs text-[var(--text-muted)]">
          Loading reflection form...
        </div>
      }
    >
      <JournalForm />
    </Suspense>
  );
}
