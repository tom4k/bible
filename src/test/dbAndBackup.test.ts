import { describe, it, expect, beforeEach } from 'vitest';
import {
  db,
  markChapterCompleted,
  markChapterIncomplete,
  isChapterCompleted,
  getPreferences,
  updatePreferences,
} from '../lib/db/dexie';
import {
  createBackup,
  parseAndValidateBackup,
  restoreBackup,
} from '../lib/backup/backupService';

describe('IndexedDB Persistence and Backup Service', () => {
  beforeEach(async () => {
    await db.chapterProgress.clear();
    await db.readingActivity.clear();
    await db.bookmarks.clear();
    await db.journalEntries.clear();
    await db.preferences.clear();
    await db.planSelections.clear();
  });

  it('marks chapters completed without duplicate records', async () => {
    expect(await isChapterCompleted('mrk', 1)).toBe(false);

    await markChapterCompleted('mrk', 1, 'start-with-jesus');
    expect(await isChapterCompleted('mrk', 1)).toBe(true);

    // Call again to verify idempotent behavior (no duplicate keys)
    await markChapterCompleted('mrk', 1, 'start-with-jesus');
    const records = await db.chapterProgress.where('bookId').equals('mrk').toArray();
    expect(records.filter((r) => r.chapter === 1)).toHaveLength(1);

    // Mark incomplete
    await markChapterIncomplete('mrk', 1);
    expect(await isChapterCompleted('mrk', 1)).toBe(false);
  });

  it('performs Journal CRUD operations accurately', async () => {
    const entryId = 'journal-test-1';
    const now = new Date().toISOString();

    // Create
    await db.journalEntries.add({
      id: entryId,
      bookId: 'mrk',
      chapter: 1,
      title: 'Beginning the Good News',
      reflection: 'The wilderness experience of Christ calls us to quiet repentance.',
      question: 'What desert is God inviting me to enter?',
      prayer: 'Lord Jesus, grant me the courage to follow You.',
      createdAt: now,
      updatedAt: now,
    });

    let saved = await db.journalEntries.get(entryId);
    expect(saved?.title).toBe('Beginning the Good News');

    // Update
    const updatedNow = new Date().toISOString();
    await db.journalEntries.update(entryId, {
      reflection: 'Updated reflection on Christ preaching in Galilee.',
      updatedAt: updatedNow,
    });

    saved = await db.journalEntries.get(entryId);
    expect(saved?.reflection).toBe('Updated reflection on Christ preaching in Galilee.');

    // Delete
    await db.journalEntries.delete(entryId);
    expect(await db.journalEntries.get(entryId)).toBeUndefined();
  });

  it('performs Bookmark operations accurately', async () => {
    const bookmarkId = 'bm-1';
    await db.bookmarks.add({
      id: bookmarkId,
      bookId: 'mrk',
      chapter: 1,
      verse: 15,
      label: 'The time is fulfilled',
      createdAt: new Date().toISOString(),
    });

    const bm = await db.bookmarks.get(bookmarkId);
    expect(bm?.chapter).toBe(1);
    expect(bm?.verse).toBe(15);
    expect(bm?.label).toBe('The time is fulfilled');
  });

  it('tracks preferences with defaults', async () => {
    const prefs = await getPreferences();
    expect(prefs.theme).toBe('light');
    expect(prefs.activePlanId).toBe('start-with-jesus');
    expect(prefs.embeddedReaderEnabled).toBe(false);

    await updatePreferences({ theme: 'sepia', embeddedReaderEnabled: true });
    const updated = await getPreferences();
    expect(updated.theme).toBe('sepia');
    expect(updated.embeddedReaderEnabled).toBe(true);
  });

  it('performs round-trip unencrypted backup export, validation, and restoration', async () => {
    await markChapterCompleted('mrk', 1, 'start-with-jesus');
    await markChapterCompleted('mrk', 2, 'start-with-jesus');
    await db.journalEntries.add({
      id: 'j-roundtrip',
      bookId: 'mrk',
      chapter: 1,
      reflection: 'A test reflection for backup',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const exportedJson = await createBackup();
    expect(exportedJson).toContain('The Living Word');
    expect(exportedJson).toContain('mrk:1');

    // Validate and inspect preview
    const { preview, data } = await parseAndValidateBackup(exportedJson);
    expect(preview.isEncrypted).toBe(false);
    expect(preview.counts.chaptersCompleted).toBe(2);
    expect(preview.counts.journalEntries).toBe(1);

    // Clear DB
    await db.chapterProgress.clear();
    await db.journalEntries.clear();
    expect(await db.chapterProgress.count()).toBe(0);

    // Restore
    await restoreBackup(data, 'replace');
    expect(await db.chapterProgress.count()).toBe(2);
    expect(await isChapterCompleted('mrk', 1)).toBe(true);
    expect(await isChapterCompleted('mrk', 2)).toBe(true);
    expect(await db.journalEntries.count()).toBe(1);
  });

  it('performs round-trip encrypted backup export and restoration with passphrase', async () => {
    await markChapterCompleted('jhn', 1, 'knowing-jesus');
    await db.journalEntries.add({
      id: 'secret-journal',
      bookId: 'jhn',
      chapter: 1,
      reflection: 'In the beginning was the Word, and the Word was with God.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const passphrase = 'CatholicHabit2026!';
    const encryptedJson = await createBackup(passphrase);
    expect(encryptedJson).toContain('"encrypted": true');
    expect(encryptedJson).not.toContain('In the beginning was the Word'); // Ciphertext only!

    // Fails without passphrase
    await expect(parseAndValidateBackup(encryptedJson)).rejects.toThrow(
      'This backup file is encrypted. Please provide the decryption passphrase.'
    );

    // Fails with wrong passphrase
    await expect(parseAndValidateBackup(encryptedJson, 'WrongPassphrase!')).rejects.toThrow(
      'Incorrect passphrase or corrupted encrypted backup data.'
    );

    // Succeeds with correct passphrase
    const { preview, data } = await parseAndValidateBackup(encryptedJson, passphrase);
    expect(preview.isEncrypted).toBe(true);
    expect(preview.counts.chaptersCompleted).toBe(1);
    expect(preview.counts.journalEntries).toBe(1);

    // Clear and restore
    await db.chapterProgress.clear();
    await db.journalEntries.clear();

    await restoreBackup(data, 'replace');
    expect(await isChapterCompleted('jhn', 1)).toBe(true);
    const restoredJournal = await db.journalEntries.get('secret-journal');
    expect(restoredJournal?.reflection).toContain('In the beginning was the Word');
  });
});
