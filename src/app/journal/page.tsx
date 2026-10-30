'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PenLine,
  Search,
  Trash2,
  Edit3,
  Plus,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { db } from '../../lib/db/dexie';
import { JournalEntry } from '../../lib/db/schema';
import { getBookById } from '../../lib/bible/catalogue';

export default function JournalListPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editReflection, setEditReflection] = useState('');
  const [editQuestion, setEditQuestion] = useState('');
  const [editPrayer, setEditPrayer] = useState('');

  const loadEntries = async () => {
    const list = await db.journalEntries.orderBy('createdAt').reverse().toArray();
    setEntries(list);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const bookName = getBookById(e.bookId)?.name.toLowerCase() || '';
    return (
      e.reflection.toLowerCase().includes(q) ||
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.question && e.question.toLowerCase().includes(q)) ||
      (e.prayer && e.prayer.toLowerCase().includes(q)) ||
      bookName.includes(q)
    );
  });

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    await db.journalEntries.delete(entryToDelete.id);
    setEntryToDelete(null);
    await loadEntries();
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditReflection(entry.reflection);
    setEditQuestion(entry.question || '');
    setEditPrayer(entry.prayer || '');
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    await db.journalEntries.update(editingEntry.id, {
      reflection: editReflection.trim(),
      question: editQuestion.trim() || undefined,
      prayer: editPrayer.trim() || undefined,
      updatedAt: new Date().toISOString(),
    });

    setEditingEntry(null);
    await loadEntries();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
            Contemplative Journal
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)]">
            Private, local reflections on Catholic Scripture. Stored solely on your device.
          </p>
        </div>

        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Reflection</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input
          type="search"
          placeholder="Search journal reflections, prayers, books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] shadow-2xs"
          aria-label="Search journal"
        />
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => {
          const book = getBookById(entry.bookId);

          return (
            <div
              key={entry.id}
              className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 sm:p-6 space-y-3 shadow-xs hover:border-[var(--sage)] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/bible/${book?.slug || entry.bookId}/${entry.chapter}`}
                      className="font-serif font-bold text-base text-[var(--primary-green)] dark:text-[var(--gold)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>
                        {book?.name || entry.bookId} {entry.chapter}
                        {entry.verse ? `:${entry.verse}` : ''}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </Link>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                    <span>
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {entry.updatedAt !== entry.createdAt && <span>• Edited</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(entry)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary-green)] hover:bg-[var(--bg-card-subtle)]"
                    aria-label="Edit journal entry"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEntryToDelete(entry)}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    aria-label="Delete journal entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {entry.title && (
                <h2 className="font-serif font-bold text-base text-[var(--text-primary)]">
                  {entry.title}
                </h2>
              )}

              <p className="text-sm text-[var(--text-primary)] whitespace-pre-line leading-relaxed font-serif">
                {entry.reflection}
              </p>

              {entry.question && (
                <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)]/70 border border-[var(--border-color)]/60 space-y-0.5 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-[var(--text-muted)] text-[10px]">
                    Contemplation Question
                  </span>
                  <p className="text-[var(--text-primary)] italic">{entry.question}</p>
                </div>
              )}

              {entry.prayer && (
                <div className="p-3 rounded-xl bg-[var(--gold-subtle)]/40 border border-[var(--gold)]/20 space-y-0.5 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-[#795213] dark:text-[var(--gold)] text-[10px]">
                    Personal Prayer
                  </span>
                  <p className="text-[var(--text-primary)] italic font-serif">&ldquo;{entry.prayer}&rdquo;</p>
                </div>
              )}
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--border-color)] p-6 space-y-3">
            <PenLine className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
            <div className="space-y-1">
              <h2 className="font-serif font-bold text-base text-[var(--text-primary)]">
                {searchQuery ? 'No Reflections Match Your Search' : 'No Reflections Yet'}
              </h2>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                {searchQuery
                  ? 'Try searching with a different word or book reference.'
                  : 'Write your thoughts, questions, and prayers as you read Catholic Scripture.'}
              </p>
            </div>
            {!searchQuery && (
              <Link
                href="/journal/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Write First Reflection</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <h2 className="font-serif font-bold text-lg text-[var(--primary-green)] dark:text-[var(--gold)]">
                Edit Reflection
              </h2>
              <button
                onClick={() => setEditingEntry(null)}
                className="p-1 text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Reflection Text *
                </label>
                <textarea
                  rows={5}
                  required
                  value={editReflection}
                  onChange={(e) => setEditReflection(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Question (Optional)
                </label>
                <input
                  type="text"
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                  Prayer (Optional)
                </label>
                <textarea
                  rows={2}
                  value={editPrayer}
                  onChange={(e) => setEditPrayer(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs"
                >
                  Update Reflection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Requirement from Section 7: Confirmation before deleting journal records) */}
      {entryToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h2 className="font-serif font-bold text-lg text-[var(--text-primary)]">
                Delete Reflection?
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Are you sure you want to delete this reflection for{' '}
                <span className="font-semibold text-[var(--text-primary)]">
                  {getBookById(entryToDelete.bookId)?.name} {entryToDelete.chapter}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEntryToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]"
              >
                Keep Entry
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
