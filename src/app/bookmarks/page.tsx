'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark, Plus, Trash2, ArrowRight, X } from 'lucide-react';
import { db } from '../../lib/db/dexie';
import { Bookmark as BookmarkModel } from '../../lib/db/schema';
import { CATHOLIC_BIBLE_BOOKS, getBookById } from '../../lib/bible/catalogue';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkModel[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bookId, setBookId] = useState('mrk');
  const [chapter, setChapter] = useState(1);
  const [verse, setVerse] = useState<number | undefined>();
  const [label, setLabel] = useState('');

  const loadBookmarks = async () => {
    const list = await db.bookmarks.orderBy('createdAt').reverse().toArray();
    setBookmarks(list);
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const selectedBook = getBookById(bookId) || CATHOLIC_BIBLE_BOOKS[0];

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `bm-${bookId}-${chapter}-${verse || 0}-${Date.now()}`;
    await db.bookmarks.add({
      id,
      bookId,
      chapter,
      verse: verse || undefined,
      label: label.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setLabel('');
    setVerse(undefined);
    setShowAddModal(false);
    await loadBookmarks();
  };

  const deleteBookmark = async (id: string) => {
    await db.bookmarks.delete(id);
    await loadBookmarks();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
            Sacred Bookmarks
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Saved Catholic Scripture references and prayer reminders.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bookmark</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {bookmarks.map((bm) => {
          const book = getBookById(bm.bookId);
          return (
            <div
              key={bm.id}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 space-y-3 shadow-xs hover:border-[var(--primary-green)] transition-all flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-[var(--gold)] fill-current" />
                    <h2 className="font-serif font-bold text-base sm:text-lg text-[var(--text-primary)]">
                      {book?.name || bm.bookId} {bm.chapter}
                      {bm.verse ? `:${bm.verse}` : ''}
                    </h2>
                  </div>
                  <button
                    onClick={() => deleteBookmark(bm.id)}
                    className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    aria-label="Delete bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {bm.label && (
                  <p className="text-xs text-[var(--text-muted)] italic font-serif">
                    &ldquo;{bm.label}&rdquo;
                  </p>
                )}
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Saved {new Date(bm.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)]/60 flex justify-end">
                <Link
                  href={`/bible/${book?.slug || bm.bookId}/${bm.chapter}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary-green)] dark:text-[var(--gold)] hover:underline"
                >
                  <span>Read Chapter</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {bookmarks.length === 0 && (
        <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--border-color)] p-6 space-y-3">
          <Bookmark className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
          <div className="space-y-1">
            <h2 className="font-serif font-bold text-base text-[var(--text-primary)]">
              No Bookmarks Saved Yet
            </h2>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Save favorite passages directly while reading in the Bible reader or add a custom reference here.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Bookmark</span>
          </button>
        </div>
      )}

      {/* Add Bookmark Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h2 className="font-serif font-bold text-lg text-[var(--primary-green)] dark:text-[var(--gold)]">
                Add Sacred Bookmark
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBookmark} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Catholic Book
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

              <div className="grid grid-cols-2 gap-3">
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
                    placeholder="e.g. 12"
                    value={verse ?? ''}
                    onChange={(e) => setVerse(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Personal Label / Intention (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prayer for family, favorite comfort verse"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs"
                >
                  Save Bookmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
