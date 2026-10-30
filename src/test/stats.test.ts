import { describe, it, expect } from 'vitest';
import { calculateReadingStats } from '../lib/stats/calculator';
import { ChapterProgress, ReadingActivity } from '../lib/db/schema';

describe('Reading Statistics Calculator', () => {
  it('accurately calculates unique chapters and plan percentages', () => {
    const completedChapters: ChapterProgress[] = [
      { id: 'mrk:1', bookId: 'mrk', chapter: 1, completedAt: '2026-10-28T10:00:00Z', planId: 'start-with-jesus' },
      { id: 'mrk:2', bookId: 'mrk', chapter: 2, completedAt: '2026-10-29T10:00:00Z', planId: 'start-with-jesus' },
      { id: 'mrk:3', bookId: 'mrk', chapter: 3, completedAt: '2026-10-30T10:00:00Z', planId: 'start-with-jesus' },
      { id: 'mrk:4', bookId: 'mrk', chapter: 4, completedAt: '2026-10-30T11:00:00Z', planId: 'start-with-jesus' },
    ];

    const activities: ReadingActivity[] = [
      { id: '1', date: '2026-10-28', timestamp: '2026-10-28T10:00:00Z', bookId: 'mrk', chapter: 1, action: 'chapter_completed' },
      { id: '2', date: '2026-10-29', timestamp: '2026-10-29T10:00:00Z', bookId: 'mrk', chapter: 2, action: 'chapter_completed' },
      { id: '3', date: '2026-10-30', timestamp: '2026-10-30T10:00:00Z', bookId: 'mrk', chapter: 3, action: 'chapter_completed' },
      { id: '4', date: '2026-10-30', timestamp: '2026-10-30T11:00:00Z', bookId: 'mrk', chapter: 4, action: 'chapter_completed' },
    ];

    const stats = calculateReadingStats({
      completedChapters,
      activities,
      activePlanId: 'start-with-jesus',
      totalBookmarks: 2,
      totalJournalEntries: 1,
    });

    expect(stats.uniqueChaptersCompleted).toBe(4);
    expect(stats.readingDaysCount).toBe(3); // 2026-10-28, 2026-10-29, 2026-10-30
    // Mark has 16 chapters. 4 / 16 = 25%
    expect(stats.activePlanProgress.percentage).toBe(25);
    expect(stats.activePlanProgress.completedChapters).toBe(4);
    expect(stats.activePlanProgress.nextChapter?.chapter).toBe(5);
    expect(stats.totalBookmarks).toBe(2);
    expect(stats.totalJournalEntries).toBe(1);
  });

  it('handles zero activity without NaN or division by zero', () => {
    const stats = calculateReadingStats({
      completedChapters: [],
      activities: [],
      activePlanId: 'start-with-jesus',
      totalBookmarks: 0,
      totalJournalEntries: 0,
    });

    expect(stats.uniqueChaptersCompleted).toBe(0);
    expect(stats.readingDaysCount).toBe(0);
    expect(stats.activePlanProgress.percentage).toBe(0);
    expect(stats.activePlanProgress.nextChapter?.chapter).toBe(1);
  });
});
