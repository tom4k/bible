import { describe, it, expect, beforeEach } from 'vitest';
import {
  JOURNEY_STAGES,
  ALL_JOURNEY_CHAPTERS,
  TOTAL_JOURNEY_CHAPTERS,
  calculateJourneyProgress,
  JOURNEY_REFLECTION_PROMPTS,
} from '../lib/journey/definition';
import { JOURNEY_PACE_PRESETS } from '../lib/journey/types';
import { CATHOLIC_BIBLE_BOOKS, getBookById } from '../lib/bible/catalogue';
import { defaultScriptureProvider } from '../lib/bible/bibleGatewayProvider';
import {
  db,
  markChapterCompleted,
  markChapterIncomplete,
  getPreferences,
  updatePreferences,
} from '../lib/db/dexie';
import { createBackup, restoreBackup, parseAndValidateBackup } from '../lib/backup/backupService';
import { READING_PLANS } from '../lib/plans/readingPlans';

describe('My Bible Journey - Catholic Reading Journey Specification', () => {
  beforeEach(async () => {
    await db.chapterProgress.clear();
    await db.readingActivity.clear();
    await db.bookmarks.clear();
    await db.journalEntries.clear();
    await db.preferences.clear();
    await db.planSelections.clear();
  });

  // 1. Exactly 73 books are included
  it('includes exactly 73 canonical Catholic books', () => {
    const allStageBookIds = JOURNEY_STAGES.flatMap((stage) => stage.bookIds);
    expect(allStageBookIds.length).toBe(73);
    expect(CATHOLIC_BIBLE_BOOKS.length).toBe(73);
  });

  // 2. Every book occurs once in the journey
  it('includes every Catholic canonical book exactly once with no duplicates or omissions', () => {
    const allStageBookIds = JOURNEY_STAGES.flatMap((stage) => stage.bookIds);
    const uniqueIds = new Set(allStageBookIds);

    expect(uniqueIds.size).toBe(73);

    // Verify each book ID exists in CATHOLIC_BIBLE_BOOKS
    for (const b of CATHOLIC_BIBLE_BOOKS) {
      expect(uniqueIds.has(b.id)).toBe(true);
    }
  });

  // 3. The stage sequence matches the specification exactly
  it('matches the exact 6-stage sequence specified in FR-01', () => {
    expect(JOURNEY_STAGES.length).toBe(6);

    // Stage 1: Discover Jesus and the Church (Mark, John, Luke, Matthew, Acts)
    expect(JOURNEY_STAGES[0].name).toBe('Discover Jesus and the Church');
    expect(JOURNEY_STAGES[0].bookIds).toEqual(['mrk', 'jhn', 'luk', 'mat', 'act']);

    // Stage 2: Understand God's People
    expect(JOURNEY_STAGES[1].name).toBe("Understand God's People");
    expect(JOURNEY_STAGES[1].bookIds).toEqual([
      'gen', 'exo', 'jos', 'jdg', 'rut',
      '1sa', '2sa', '1ki', '2ki', '1ch', '2ch',
      'ezr', 'neh', 'tob', 'jdt', 'est', '1ma', '2ma',
    ]);

    // Stage 3: Prayer and Wisdom
    expect(JOURNEY_STAGES[2].name).toBe('Prayer and Wisdom');
    expect(JOURNEY_STAGES[2].bookIds).toEqual([
      'psa', 'pro', 'job', 'ecc', 'sng', 'wis', 'sir',
    ]);

    // Stage 4: The Covenant and the Law
    expect(JOURNEY_STAGES[3].name).toBe('The Covenant and the Law');
    expect(JOURNEY_STAGES[3].bookIds).toEqual(['lev', 'num', 'deu']);

    // Stage 5: Listen to the Prophets
    expect(JOURNEY_STAGES[4].name).toBe('Listen to the Prophets');
    expect(JOURNEY_STAGES[4].bookIds).toEqual([
      'isa', 'jer', 'lam', 'bar', 'ezk', 'dan',
      'hos', 'jol', 'amo', 'oba', 'jon', 'mic',
      'nam', 'hab', 'zep', 'hag', 'zec', 'mal',
    ]);

    // Stage 6: Living the Christian Faith
    expect(JOURNEY_STAGES[5].name).toBe('Living the Christian Faith');
    expect(JOURNEY_STAGES[5].bookIds).toEqual([
      'rom', '1co', '2co', 'gal', 'eph', 'php', 'col',
      '1th', '2th', '1ti', '2ti', 'tit', 'phm', 'heb',
      'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev',
    ]);

    // Default journey starts with Mark Chapter 1
    expect(ALL_JOURNEY_CHAPTERS[0].bookId).toBe('mrk');
    expect(ALL_JOURNEY_CHAPTERS[0].chapter).toBe(1);
  });

  // 4. Every chapter is included exactly once, subject to validated translation mapping
  it('includes every Catholic chapter exactly once (1,334 chapters) and validates Bible Gateway links', () => {
    expect(TOTAL_JOURNEY_CHAPTERS).toBe(1334);
    expect(ALL_JOURNEY_CHAPTERS.length).toBe(1334);

    // Verify all globalIndices are sequential from 1 to 1334
    for (let i = 0; i < ALL_JOURNEY_CHAPTERS.length; i++) {
      expect(ALL_JOURNEY_CHAPTERS[i].globalIndex).toBe(i + 1);
    }

    // Verify Catholic additions to Esther (16 chapters) and Daniel (14 chapters)
    const estherChapters = ALL_JOURNEY_CHAPTERS.filter((c) => c.bookId === 'est');
    expect(estherChapters.length).toBe(16);

    const danielChapters = ALL_JOURNEY_CHAPTERS.filter((c) => c.bookId === 'dan');
    expect(danielChapters.length).toBe(14);

    // 12. No chapter is silently skipped because a provider reference fails
    // Verify provider URLs generate valid non-empty URLs with NRSVCE version parameter
    for (const testBook of ['est', 'dan', 'tob', 'jdt', '1ma', 'wis', 'sir', 'bar']) {
      const b = getBookById(testBook)!;
      const url = defaultScriptureProvider.getPassageUrl({ bookId: b.id, chapter: 1 });
      expect(url).toContain('biblegateway.com/passage');
      expect(url).toContain('version=NRSVCE');
    }
  });

  // 5. Next-reading logic skips completed chapters
  it('correctly skips completed chapters and suggests the earliest unread chapter', () => {
    const completedKeys = new Set<string>(['mrk:1', 'mrk:2']);
    const progress = calculateJourneyProgress({ completedKeys });

    expect(progress.completedChapters).toBe(2);
    expect(progress.nextSessionChapters.length).toBe(1); // Gentle default pace
    expect(progress.nextSessionChapters[0].book.id).toBe('mrk');
    expect(progress.nextSessionChapters[0].chapter).toBe(3);
  });

  // 6. Changing pace does not change existing completion data
  it('changing pace does not alter completion data and updates duration estimates dynamically', () => {
    const completedKeys = new Set<string>(['mrk:1', 'mrk:2', 'mrk:3']);

    const gentleProgress = calculateJourneyProgress({
      completedKeys,
      paceConfig: JOURNEY_PACE_PRESETS.gentle, // 1 ch / session, 5 sessions / wk = 5 ch/wk
    });
    const steadyProgress = calculateJourneyProgress({
      completedKeys,
      paceConfig: JOURNEY_PACE_PRESETS.steady, // 2 ch / session, 5 sessions / wk = 10 ch/wk
    });
    const focusedProgress = calculateJourneyProgress({
      completedKeys,
      paceConfig: JOURNEY_PACE_PRESETS.focused, // 2 ch / session, 7 sessions / wk = 14 ch/wk
    });

    // Completion data remains identical
    expect(gentleProgress.completedChapters).toBe(3);
    expect(steadyProgress.completedChapters).toBe(3);
    expect(focusedProgress.completedChapters).toBe(3);

    // Next reading chapter counts reflect pace
    expect(gentleProgress.nextSessionChapters.length).toBe(1);
    expect(steadyProgress.nextSessionChapters.length).toBe(2);
    expect(focusedProgress.nextSessionChapters.length).toBe(2);

    // Dynamic duration estimates update
    const remaining = 1334 - 3; // 1331
    expect(gentleProgress.estimatedWeeksRemaining).toBe(Math.ceil(remaining / 5));
    expect(steadyProgress.estimatedWeeksRemaining).toBe(Math.ceil(remaining / 10));
    expect(focusedProgress.estimatedWeeksRemaining).toBe(Math.ceil(remaining / 14));
  });

  // 7. Closing and reopening the app preserves progress
  it('preserves progress across database writes and reloads', async () => {
    await markChapterCompleted('mrk', 1, 'my-bible-journey');
    await markChapterCompleted('mrk', 2, 'my-bible-journey');

    const fromDb = await db.chapterProgress.toArray();
    const set = new Set(fromDb.map((c) => `${c.bookId}:${c.chapter}`));

    expect(set.has('mrk:1')).toBe(true);
    expect(set.has('mrk:2')).toBe(true);

    const progress = calculateJourneyProgress({ completedKeys: set });
    expect(progress.completedChapters).toBe(2);

    // FR-05: When a user unmarks a chapter, update all relevant progress indicators
    await markChapterIncomplete('mrk', 2);
    const afterUnmark = await db.chapterProgress.toArray();
    const afterSet = new Set(afterUnmark.map((c) => `${c.bookId}:${c.chapter}`));
    expect(afterSet.has('mrk:2')).toBe(false);

    const progressAfterUnmark = calculateJourneyProgress({ completedKeys: afterSet });
    expect(progressAfterUnmark.completedChapters).toBe(1);
    expect(progressAfterUnmark.nextSessionChapters[0].chapter).toBe(2);
  });

  // 8. Completing a chapter updates book, stage and overall progress
  it('completing all chapters of a book marks the book and stage complete', () => {
    const completedKeys = new Set<string>();

    // Complete all 16 chapters of Mark
    for (let ch = 1; ch <= 16; ch++) {
      completedKeys.add(`mrk:${ch}`);
    }

    const progress = calculateJourneyProgress({ completedKeys });
    const stage1 = progress.stagesProgress[0];
    const markBookSummary = stage1.books.find((b) => b.book.id === 'mrk')!;

    expect(markBookSummary.completedChapters).toBe(16);
    expect(markBookSummary.isComplete).toBe(true);
    expect(stage1.completedBooks).toBe(1);
    expect(stage1.isComplete).toBe(false); // John, Luke, Matthew, Acts still remaining

    // Complete all books in Stage 1
    for (const bookId of ['jhn', 'luk', 'mat', 'act']) {
      const b = getBookById(bookId)!;
      for (let ch = 1; ch <= b.chapterCount; ch++) {
        completedKeys.add(`${bookId}:${ch}`);
      }
    }

    const stage1FinishedProgress = calculateJourneyProgress({ completedKeys });
    expect(stage1FinishedProgress.stagesProgress[0].isComplete).toBe(true);
    expect(stage1FinishedProgress.stagesProgress[0].percentage).toBe(100);
    expect(stage1FinishedProgress.activeStage.id).toBe(2); // Automatically shifts to Stage 2
  });

  // 9. Existing reading plans continue to function
  it('existing reading plans continue to function and share completion records', async () => {
    // Complete Mark 1 via existing reading plan
    await markChapterCompleted('mrk', 1, 'start-with-jesus');

    const list = await db.chapterProgress.toArray();
    const keys = new Set(list.map((c) => `${c.bookId}:${c.chapter}`));

    // Journey reflects Mark 1 as completed without duplication
    const journeyProgress = calculateJourneyProgress({ completedKeys: keys });
    expect(journeyProgress.completedChapters).toBe(1);
    expect(journeyProgress.nextSessionChapters[0].chapter).toBe(2);

    // Verify all 5 existing reading plans are intact
    expect(READING_PLANS.length).toBe(5);
  });

  // 10. Backup and restore preserve journey state
  it('backup and restore preserve journey preferences and completion data', async () => {
    await markChapterCompleted('mrk', 1, 'my-bible-journey');
    await markChapterCompleted('mrk', 2, 'my-bible-journey');

    await updatePreferences({
      journeyPace: 'focused',
      customChaptersPerSession: 3,
      customSessionsPerWeek: 6,
      lastJourneyBookId: 'mrk',
      lastJourneyChapter: 2,
    });

    const backupJson = await createBackup();
    const parsed = await parseAndValidateBackup(backupJson);

    expect(parsed.data.payload.preferences?.journeyPace).toBe('focused');
    expect(parsed.data.payload.preferences?.customChaptersPerSession).toBe(3);
    expect(parsed.data.payload.preferences?.lastJourneyBookId).toBe('mrk');

    // Clear and restore
    await db.chapterProgress.clear();
    await db.preferences.clear();

    await restoreBackup(parsed.data);

    const restoredPrefs = await getPreferences();
    expect(restoredPrefs.journeyPace).toBe('focused');
    expect(restoredPrefs.customChaptersPerSession).toBe(3);

    const restoredProgress = await db.chapterProgress.toArray();
    expect(restoredProgress.length).toBe(2);
  });

  // 11. Completing the final chapter marks the whole journey complete
  it('completing the final chapter marks the whole journey complete', () => {
    const completedKeys = new Set<string>();

    for (const item of ALL_JOURNEY_CHAPTERS) {
      completedKeys.add(`${item.bookId}:${item.chapter}`);
    }

    const finalProgress = calculateJourneyProgress({ completedKeys });
    expect(finalProgress.completedChapters).toBe(1334);
    expect(finalProgress.percentage).toBe(100);
    expect(finalProgress.completedBooks).toBe(73);
    expect(finalProgress.isJourneyComplete).toBe(true);
    expect(finalProgress.nextSessionChapters.length).toBe(0);
  });

  // FR-07: Reflection prompts
  it('includes the 3 specified optional Catholic reflection prompts', () => {
    expect(JOURNEY_REFLECTION_PROMPTS).toContain('What did this chapter teach me about God?');
    expect(JOURNEY_REFLECTION_PROMPTS).toContain('What did I find difficult or interesting?');
    expect(JOURNEY_REFLECTION_PROMPTS).toContain('What can I apply to my life?');
  });
});
