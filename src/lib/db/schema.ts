import { z } from 'zod';

export const ChapterProgressSchema = z.object({
  id: z.string(), // Composite key: `${bookId}:${chapter}`
  bookId: z.string(),
  chapter: z.number().int().positive(),
  completedAt: z.string(), // ISO string
  planId: z.string().optional(), // If completed within the context of a plan
});
export type ChapterProgress = z.infer<typeof ChapterProgressSchema>;

export const ReadingActivitySchema = z.object({
  id: z.string(), // UUID or timestamp-based ID
  bookId: z.string(),
  chapter: z.number().int().positive(),
  date: z.string(), // YYYY-MM-DD for counting unique reading days
  timestamp: z.string(), // ISO string
  action: z.enum(['read_open', 'chapter_completed', 'journal_added', 'bookmark_added']),
  planId: z.string().optional(),
});
export type ReadingActivity = z.infer<typeof ReadingActivitySchema>;

export const BookmarkSchema = z.object({
  id: z.string(), // UUID
  bookId: z.string(),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive().optional(),
  endVerse: z.number().int().positive().optional(),
  label: z.string().optional(),
  createdAt: z.string(),
});
export type Bookmark = z.infer<typeof BookmarkSchema>;

export const JournalEntrySchema = z.object({
  id: z.string(), // UUID
  bookId: z.string(),
  chapter: z.number().int().positive(),
  verse: z.number().int().positive().optional(),
  title: z.string().optional(),
  reflection: z.string().min(1, 'Reflection text is required'),
  question: z.string().optional(),
  prayer: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type JournalEntry = z.infer<typeof JournalEntrySchema>;

export const UserPreferencesSchema = z.object({
  id: z.literal('user_preferences'),
  theme: z.enum(['light', 'dark', 'sepia']),
  embeddedReaderEnabled: z.boolean(), // Feature flag for Bible Gateway iframe
  activePlanId: z.string(),
  fontSize: z.enum(['small', 'medium', 'large']),
  lastReadBookId: z.string(),
  lastReadChapter: z.number().int().positive(),
  updatedAt: z.string(),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

export const PlanSelectionSchema = z.object({
  planId: z.string(),
  activatedAt: z.string(),
  lastAccessedChapter: z.number().int().positive().optional(),
});
export type PlanSelection = z.infer<typeof PlanSelectionSchema>;

// Full Backup Schema for Import/Export (Zod validated)
export const BackupDataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  appName: z.literal('The Living Word'),
  encrypted: z.boolean(),
  payload: z.object({
    chapterProgress: z.array(ChapterProgressSchema),
    readingActivity: z.array(ReadingActivitySchema),
    bookmarks: z.array(BookmarkSchema),
    journalEntries: z.array(JournalEntrySchema),
    preferences: UserPreferencesSchema.optional(),
    planSelections: z.array(PlanSelectionSchema),
  }),
});
export type BackupData = z.infer<typeof BackupDataSchema>;

export const EncryptedBackupContainerSchema = z.object({
  version: z.literal(1),
  appName: z.literal('The Living Word'),
  encrypted: z.literal(true),
  exportedAt: z.string(),
  salt: z.string(), // Base64 salt for PBKDF2
  iv: z.string(), // Base64 IV for AES-GCM
  ciphertext: z.string(), // Base64 ciphertext
});
export type EncryptedBackupContainer = z.infer<typeof EncryptedBackupContainerSchema>;
