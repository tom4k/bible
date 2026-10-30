import Dexie, { type Table } from 'dexie';
import {
  ChapterProgress,
  ReadingActivity,
  Bookmark,
  JournalEntry,
  UserPreferences,
  PlanSelection,
} from './schema';

export class LivingWordDatabase extends Dexie {
  chapterProgress!: Table<ChapterProgress, string>;
  readingActivity!: Table<ReadingActivity, string>;
  bookmarks!: Table<Bookmark, string>;
  journalEntries!: Table<JournalEntry, string>;
  preferences!: Table<UserPreferences, string>;
  planSelections!: Table<PlanSelection, string>;

  constructor() {
    super('TheLivingWordDB');

    // Schema Version 1
    this.version(1).stores({
      chapterProgress: 'id, bookId, chapter, completedAt, planId',
      readingActivity: 'id, date, timestamp, bookId, chapter, action',
      bookmarks: 'id, bookId, chapter, createdAt',
      journalEntries: 'id, bookId, chapter, createdAt, updatedAt',
      preferences: 'id',
      planSelections: 'planId, activatedAt',
    });
  }
}

// Singleton database instance
export const db = new LivingWordDatabase();

// Default initial preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  id: 'user_preferences',
  theme: 'light',
  // Embedded reader disabled by default per requirements until verified by user
  embeddedReaderEnabled: false,
  activePlanId: 'start-with-jesus',
  fontSize: 'medium',
  lastReadBookId: 'mrk',
  lastReadChapter: 1,
  notificationsEnabled: false,
  reminderTime: '07:00',
  journeyPace: 'gentle',
  customChaptersPerSession: 1,
  customSessionsPerWeek: 5,
  lastJourneyBookId: 'mrk',
  lastJourneyChapter: 1,
  updatedAt: new Date().toISOString(),
};

/**
 * Returns user preferences, initializing defaults if none exist yet.
 */
export async function getPreferences(): Promise<UserPreferences> {
  try {
    const existing = await db.preferences.get('user_preferences');
    if (existing) {
      return existing;
    }
    await db.preferences.put(DEFAULT_PREFERENCES);
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.warn('Storage unavailable or reading preferences failed:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Safely updates user preferences.
 */
export async function updatePreferences(
  updates: Partial<Omit<UserPreferences, 'id'>>
): Promise<UserPreferences> {
  const current = await getPreferences();
  const updated: UserPreferences = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await db.preferences.put(updated);
  return updated;
}

/**
 * Records a reading activity event. Prevents duplicate logging on the same action/day if needed.
 */
export async function recordActivity(
  bookId: string,
  chapter: number,
  action: 'read_open' | 'chapter_completed' | 'journal_added' | 'bookmark_added',
  planId?: string
): Promise<void> {
  try {
    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const id = `${date}-${action}-${bookId}-${chapter}-${now.getTime()}`;

    await db.readingActivity.add({
      id,
      bookId,
      chapter,
      date,
      timestamp: now.toISOString(),
      action,
      planId,
    });
  } catch (err) {
    console.warn('Could not record activity:', err);
  }
}

/**
 * Marks a chapter completed. ID is deterministic (${bookId}:${chapter}) to prevent duplicates.
 */
export async function markChapterCompleted(
  bookId: string,
  chapter: number,
  planId?: string
): Promise<void> {
  const id = `${bookId}:${chapter}`;
  const now = new Date().toISOString();
  await db.chapterProgress.put({
    id,
    bookId,
    chapter,
    completedAt: now,
    planId,
  });
  await recordActivity(bookId, chapter, 'chapter_completed', planId);
}

/**
 * Marks a chapter incomplete (unmarks it).
 */
export async function markChapterIncomplete(
  bookId: string,
  chapter: number
): Promise<void> {
  const id = `${bookId}:${chapter}`;
  await db.chapterProgress.delete(id);
}

/**
 * Checks if a chapter is completed.
 */
export async function isChapterCompleted(
  bookId: string,
  chapter: number
): Promise<boolean> {
  const id = `${bookId}:${chapter}`;
  const record = await db.chapterProgress.get(id);
  return Boolean(record);
}
