'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Check, X, ChevronRight } from 'lucide-react';
import { CATHOLIC_BIBLE_BOOKS } from '../../lib/bible/catalogue';
import { BibleBook } from '../../lib/bible/types';
import { db } from '../../lib/db/dexie';

export default function BibleCataloguePage() {
  const [activeTab, setActiveTab] = useState<'all' | 'ot' | 'nt' | 'deut'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [completedChaptersSet, setCompletedChaptersSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadProgress() {
      const records = await db.chapterProgress.toArray();
      const set = new Set(records.map((r) => `${r.bookId}:${r.chapter}`));
      setCompletedChaptersSet(set);
    }
    loadProgress();
  }, []);

  const filteredBooks = CATHOLIC_BIBLE_BOOKS.filter((book) => {
    // Tab filter
    if (activeTab === 'ot' && book.testament !== 'OT') return false;
    if (activeTab === 'nt' && book.testament !== 'NT') return false;
    if (activeTab === 'deut' && !book.isDeuterocanonical) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        book.name.toLowerCase().includes(q) ||
        book.abbreviation.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
          Catholic Bible Canon
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          73 Canonical Books (46 Old Testament, 27 New Testament, including 7 Deuterocanonical Books)
        </p>
      </div>

      {/* Search and Tabs */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search book by name (e.g. Sirach, Mark, Psalms, Tobit)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] shadow-xs"
            aria-label="Search Catholic Bible books"
          />
        </div>

        {/* Tab Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {[
            { id: 'all', label: 'All 73 Books' },
            { id: 'ot', label: 'Old Testament (46)' },
            { id: 'nt', label: 'New Testament (27)' },
            { id: 'deut', label: 'Deuterocanonical (7)' },
          ].map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] font-semibold shadow-xs'
                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredBooks.map((book) => {
          let completedInThisBook = 0;
          for (let c = 1; c <= book.chapterCount; c++) {
            if (completedChaptersSet.has(`${book.id}:${c}`)) {
              completedInThisBook++;
            }
          }

          return (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="text-left rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 hover:border-[var(--primary-green)] dark:hover:border-[var(--gold)] transition-all flex items-center justify-between group shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-base text-[var(--text-primary)] group-hover:text-[var(--primary-green)] dark:group-hover:text-[var(--gold)]">
                    {book.name}
                  </span>
                  {book.isDeuterocanonical && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-[var(--gold-subtle)] text-[#795213] dark:bg-[var(--gold-subtle)] dark:text-[var(--gold)]">
                      Deuterocanonical
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                  <span>{book.category}</span>
                  <span>•</span>
                  <span>{book.chapterCount} {book.chapterCount === 1 ? 'ch' : 'chs'}</span>
                </div>
                {completedInThisBook > 0 && (
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{completedInThisBook} / {book.chapterCount} read</span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
            </button>
          );
        })}
      </div>

      {filteredBooks.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-dashed border-[var(--border-color)] p-6">
          <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
          <p className="text-sm text-[var(--text-muted)]">No books match &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}

      {/* Chapter Selection Modal */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chapter-modal-title"
        >
          <div className="w-full max-w-lg max-h-[85vh] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-xl flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <div>
                <h2
                  id="chapter-modal-title"
                  className="font-serif font-bold text-lg text-[var(--primary-green)] dark:text-[var(--gold)]"
                >
                  {selectedBook.name}
                </h2>
                <p className="text-xs text-[var(--text-muted)]">
                  {selectedBook.category} • {selectedBook.chapterCount} Chapters • NRSV-CE
                </p>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]"
                aria-label="Close chapter selector"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chapters Grid */}
            <div className="p-6 overflow-y-auto">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)] block mb-3">
                Select Chapter
              </span>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                {Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map((ch) => {
                  const isDone = completedChaptersSet.has(`${selectedBook.id}:${ch}`);
                  return (
                    <Link
                      key={ch}
                      href={`/bible/${selectedBook.slug}/${ch}`}
                      onClick={() => setSelectedBook(null)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl border text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${
                        isDone
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--primary-green)] dark:hover:border-[var(--gold)]'
                      }`}
                    >
                      <span>{ch}</span>
                      {isDone && (
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 absolute bottom-1 right-1" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-card-subtle)] rounded-b-2xl flex justify-between items-center text-xs text-[var(--text-muted)]">
              <span>Read on Bible Gateway (NRSV-CE)</span>
              <button
                onClick={() => setSelectedBook(null)}
                className="font-semibold text-[var(--primary-green)] dark:text-[var(--gold)] hover:underline"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
