import { getBookById } from '../bible/catalogue';
import {
  JourneyStageDefinition,
  JourneyChapterItem,
  JourneyPaceConfig,
  JOURNEY_PACE_PRESETS,
  JourneyProgressSummary,
  StageProgressSummary,
} from './types';

export const JOURNEY_STAGES: readonly JourneyStageDefinition[] = [
  {
    id: 1,
    name: 'Discover Jesus and the Church',
    subtitle: 'The Four Gospels and the Acts of the Apostles (5 Books)',
    description:
      'Begin at the heart of the Christian faith. Encounter Christ through the fast-paced testimony of Mark, the mystical contemplation of John, the compassionate account of Luke, the fulfillment in Matthew, and the Spirit-filled mission in Acts.',
    traditionNote:
      'Saint Thomas Christian tradition begins and rests upon the living person of Maran Isho Mshikha (Our Lord Jesus Christ).',
    bookIds: ['mrk', 'jhn', 'luk', 'mat', 'act'],
  },
  {
    id: 2,
    name: "Understand God's People",
    subtitle: 'Historical and Deuterocanonical Books (18 Books)',
    description:
      'Journey through the origin of God’s covenant family, the Exodus, the conquest of the Promised Land, the rise and fall of the kingdom, the exile, the return under Ezra and Nehemiah, and the heroic fidelity of Tobit, Judith, Esther, and the Maccabean martyrs.',
    traditionNote:
      'Features the treasured Catholic deuterocanonical histories of Tobit, Judith, and the Maccabees preserving sacred hope through trial.',
    bookIds: [
      'gen',
      'exo',
      'jos',
      'jdg',
      'rut',
      '1sa',
      '2sa',
      '1ki',
      '2ki',
      '1ch',
      '2ch',
      'ezr',
      'neh',
      'tob',
      'jdt',
      'est',
      '1ma',
      '2ma',
    ],
  },
  {
    id: 3,
    name: 'Prayer and Wisdom',
    subtitle: 'Poetry, Psalms, and Sacred Wisdom (7 Books)',
    description:
      'Enter into deep, contemplative dialogue with God through the 150 Psalms, the moral clarity of Proverbs, the raw vulnerability of Job, the vanity of Ecclesiastes, the mystical love of the Song of Songs, and the sublime theological insights of Wisdom and Sirach.',
    traditionNote:
      'Echoes the meditative psalmody of the East Syriac liturgy and the daily Liturgy of the Hours.',
    bookIds: ['psa', 'pro', 'job', 'ecc', 'sng', 'wis', 'sir'],
  },
  {
    id: 4,
    name: 'The Covenant and the Law',
    subtitle: 'Leviticus, Numbers, and Deuteronomy (3 Books)',
    description:
      'Understand God’s call to personal and communal holiness, the wandering in the desert wilderness, and Moses’ final farewell exhortation to love the Lord your God with all your heart, soul, and strength.',
    traditionNote:
      'The foundation of liturgical worship, sacrificial reverence, and the holiness of God’s dwelling among His people.',
    bookIds: ['lev', 'num', 'deu'],
  },
  {
    id: 5,
    name: 'Listen to the Prophets',
    subtitle: 'Major and Minor Prophets (18 Books)',
    description:
      'Hear the fiery, compassionate voices of the prophets calling Israel to justice, repentance, and fidelity. From Isaiah’s Suffering Servant to Jeremiah’s tears, Baruch’s prayer, Ezekiel’s valley of dry bones, Daniel’s visions, and the twelve minor prophets.',
    traditionNote:
      'Illuminates the prophecies fulfilled in Christ and the eternal pledge of the New Covenant.',
    bookIds: [
      'isa',
      'jer',
      'lam',
      'bar',
      'ezk',
      'dan',
      'hos',
      'jol',
      'amo',
      'oba',
      'jon',
      'mic',
      'nam',
      'hab',
      'zep',
      'hag',
      'zec',
      'mal',
    ],
  },
  {
    id: 6,
    name: 'Living the Christian Faith',
    subtitle: 'The Epistles and the Apocalypse (22 Books)',
    description:
      'Practical, theological, and pastoral wisdom for daily discipleship. Saint Paul’s monumental epistles, the Catholic epistles of James, Peter, John, and Jude, and Saint John’s glorious vision of the Heavenly Jerusalem in Revelation.',
    traditionNote:
      'Guides personal virtue, sacramental life, familial love, and steadfast hope in Christ’s eternal victory.',
    bookIds: [
      'rom',
      '1co',
      '2co',
      'gal',
      'eph',
      'php',
      'col',
      '1th',
      '2th',
      '1ti',
      '2ti',
      'tit',
      'phm',
      'heb',
      'jas',
      '1pe',
      '2pe',
      '1jn',
      '2jn',
      '3jn',
      'jud',
      'rev',
    ],
  },
];

// Precompute the entire ordered sequence of chapters across the journey
export function buildAllJourneyChapters(): JourneyChapterItem[] {
  const items: JourneyChapterItem[] = [];
  let globalIndex = 1;

  for (const stage of JOURNEY_STAGES) {
    for (const bookId of stage.bookIds) {
      const book = getBookById(bookId);
      if (!book) {
        throw new Error(`Journey references unknown canonical book ID: ${bookId}`);
      }
      for (let ch = 1; ch <= book.chapterCount; ch++) {
        items.push({
          bookId: book.id,
          chapter: ch,
          stageId: stage.id,
          stageName: stage.name,
          globalIndex,
        });
        globalIndex++;
      }
    }
  }

  return items;
}

export const ALL_JOURNEY_CHAPTERS: readonly JourneyChapterItem[] = buildAllJourneyChapters();

export const TOTAL_JOURNEY_CHAPTERS = ALL_JOURNEY_CHAPTERS.length;

// Reflection Prompts (FR-07)
export const JOURNEY_REFLECTION_PROMPTS = [
  'What did this chapter teach me about God?',
  'What did I find difficult or interesting?',
  'What can I apply to my life?',
] as const;

/**
 * Calculates complete journey progress, active stage, and next reading session chapters.
 */
export function calculateJourneyProgress(params: {
  completedKeys: Set<string>; // Set of `${bookId}:${chapter}`
  paceConfig?: JourneyPaceConfig;
}): JourneyProgressSummary {
  const { completedKeys, paceConfig = JOURNEY_PACE_PRESETS.gentle } = params;

  let totalCompleted = 0;
  let completedBooksCount = 0;

  const stagesProgress: StageProgressSummary[] = JOURNEY_STAGES.map((stage) => {
    let stageTotalChapters = 0;
    let stageCompletedChapters = 0;
    let stageCompletedBooks = 0;

    const booksSummary = stage.bookIds.map((bookId) => {
      const book = getBookById(bookId)!;
      stageTotalChapters += book.chapterCount;

      let bookCompletedChapters = 0;
      for (let ch = 1; ch <= book.chapterCount; ch++) {
        if (completedKeys.has(`${book.id}:${ch}`)) {
          bookCompletedChapters++;
        }
      }

      const isBookComplete = bookCompletedChapters === book.chapterCount;
      if (isBookComplete) {
        stageCompletedBooks++;
        completedBooksCount++;
      }

      stageCompletedChapters += bookCompletedChapters;

      return {
        book,
        totalChapters: book.chapterCount,
        completedChapters: bookCompletedChapters,
        isComplete: isBookComplete,
      };
    });

    totalCompleted += stageCompletedChapters;

    const isStageComplete = stageCompletedChapters === stageTotalChapters && stageTotalChapters > 0;
    const stagePercentage =
      stageTotalChapters > 0
        ? Math.round((stageCompletedChapters / stageTotalChapters) * 100)
        : 0;

    return {
      stage,
      totalChapters: stageTotalChapters,
      completedChapters: stageCompletedChapters,
      percentage: stagePercentage,
      isComplete: isStageComplete,
      totalBooks: stage.bookIds.length,
      completedBooks: stageCompletedBooks,
      books: booksSummary,
    };
  });

  // Find active stage (earliest stage not 100% complete)
  const activeStageSummary =
    stagesProgress.find((s) => !s.isComplete) || stagesProgress[stagesProgress.length - 1];
  const activeStage = activeStageSummary.stage;

  // Find next unread chapters in journey order
  const targetSessionCount = paceConfig.chaptersPerSession || 1;
  const nextSessionChapters: JourneyProgressSummary['nextSessionChapters'] = [];

  for (const item of ALL_JOURNEY_CHAPTERS) {
    if (!completedKeys.has(`${item.bookId}:${item.chapter}`)) {
      const book = getBookById(item.bookId)!;
      const stage = JOURNEY_STAGES.find((s) => s.id === item.stageId)!;

      nextSessionChapters.push({
        book,
        chapter: item.chapter,
        stage,
        globalIndex: item.globalIndex,
      });

      if (nextSessionChapters.length >= targetSessionCount) {
        break;
      }
    }
  }

  const isJourneyComplete = totalCompleted === TOTAL_JOURNEY_CHAPTERS && TOTAL_JOURNEY_CHAPTERS > 0;
  const overallPercentage =
    TOTAL_JOURNEY_CHAPTERS > 0
      ? Math.round((totalCompleted / TOTAL_JOURNEY_CHAPTERS) * 100)
      : 0;

  // Pace estimation
  const chaptersRemaining = Math.max(0, TOTAL_JOURNEY_CHAPTERS - totalCompleted);
  const chaptersPerWeek = paceConfig.chaptersPerSession * paceConfig.sessionsPerWeek;
  const estimatedWeeksRemaining =
    chaptersPerWeek > 0 ? Math.ceil(chaptersRemaining / chaptersPerWeek) : 0;
  const estimatedMonthsRemaining =
    Math.round((estimatedWeeksRemaining / 4.33) * 10) / 10;
  const estimatedDaysRemaining =
    chaptersPerWeek > 0
      ? Math.ceil((chaptersRemaining / paceConfig.chaptersPerSession) * (7 / paceConfig.sessionsPerWeek))
      : 0;

  return {
    totalChapters: TOTAL_JOURNEY_CHAPTERS,
    completedChapters: totalCompleted,
    percentage: overallPercentage,
    totalBooks: 73,
    completedBooks: completedBooksCount,
    activeStage,
    stagesProgress,
    nextSessionChapters,
    estimatedWeeksRemaining,
    estimatedMonthsRemaining,
    estimatedDaysRemaining,
    isJourneyComplete,
    paceConfig,
  };
}
