import { ReadingPlan, PlanChapterReference } from './types';

// Helper to generate consecutive chapter ranges
function range(bookId: string, start: number, end: number): PlanChapterReference[] {
  const result: PlanChapterReference[] = [];
  for (let ch = start; ch <= end; ch++) {
    result.push({ bookId, chapter: ch });
  }
  return result;
}

const PRAYER_PSALMS: { chapter: number; label: string }[] = [
  { chapter: 1, label: 'The Two Ways of Life' },
  { chapter: 8, label: 'God’s Glory and Human Dignity' },
  { chapter: 19, label: 'God’s Glory in Creation and Law' },
  { chapter: 23, label: 'The Divine Shepherd' },
  { chapter: 27, label: 'Triumphant Confidence in God' },
  { chapter: 34, label: 'Praise for God’s Deliverance' },
  { chapter: 42, label: 'Longing for God’s Presence' },
  { chapter: 51, label: 'Miserere: Contrition and Renewal' },
  { chapter: 63, label: 'The Soul Thirsting for God' },
  { chapter: 84, label: 'Longing for the House of the Lord' },
  { chapter: 90, label: 'God’s Eternity and Human Frailty' },
  { chapter: 91, label: 'Refuge in the Shadow of the Almighty' },
  { chapter: 103, label: 'Bless the Lord, O My Soul' },
  { chapter: 116, label: 'Thanksgiving for Rescue from Death' },
  { chapter: 121, label: 'The Keeper of Israel' },
  { chapter: 130, label: 'De Profundis: Out of the Depths' },
  { chapter: 139, label: 'The Inescapable God' },
  { chapter: 145, label: 'The Greatness and Goodness of the King' },
  { chapter: 148, label: 'Cosmic Hymn of Praise' },
  { chapter: 150, label: 'Final Doxology: Let Everything Praise the Lord' },
];

export const READING_PLANS: readonly ReadingPlan[] = [
  {
    id: 'start-with-jesus',
    title: 'Start With Jesus',
    subtitle: 'The Gospel of Mark (Chapters 1–16)',
    description:
      'The earliest, fastest-paced Gospel account. Experience Christ’s vivid ministry, miracles, teachings, Passion, and Resurrection.',
    traditionNote: 'Recommended initial plan for nurturing a gentle, daily contemplative habit in the presence of Jesus.',
    chapters: range('mrk', 1, 16),
    totalChapters: 16,
  },
  {
    id: 'knowing-jesus',
    title: 'Knowing Jesus',
    subtitle: 'The Gospel of John (Chapters 1–21)',
    description:
      'The mystical and theological Gospel. Contemplate the Word Made Flesh, the seven signs, and Jesus’ profound high-priestly prayer.',
    traditionNote: 'Beloved in Eastern and Syro-Malabar prayer for its rich Trinitarian and sacramental depth.',
    chapters: range('jhn', 1, 21),
    totalChapters: 21,
  },
  {
    id: 'early-church',
    title: 'The Early Church',
    subtitle: 'The Acts of the Apostles (Chapters 1–28)',
    description:
      'The Holy Spirit empowering the Apostles, Pentecost, the martyrdom of Stephen, and the global spread of the Gospel.',
    traditionNote: 'Connects deeply with Saint Thomas the Apostle’s apostolic mission to India and the roots of the Church.',
    chapters: range('act', 1, 28),
    totalChapters: 28,
  },
  {
    id: 'the-beginning',
    title: 'The Beginning',
    subtitle: 'Genesis (Chapters 1–50)',
    description:
      'Creation, the Fall, God’s covenants with Abraham, Isaac, Jacob, and the providential story of Joseph in Egypt.',
    traditionNote: 'The foundation of Salvation History, illuminating God’s steadfast fidelity through generations.',
    chapters: range('gen', 1, 50),
    totalChapters: 50,
  },
  {
    id: 'a-life-of-prayer',
    title: 'A Life of Prayer',
    subtitle: 'Curated Contemplative Psalms (20 Selections)',
    description:
      'Timeless liturgical and personal prayers of gratitude, repentance, trust, adoration, and cosmic praise.',
    traditionNote: 'Resonates with the Liturgy of the Hours and Syro-Malabar Qurbana traditions of sacred psalmody.',
    chapters: PRAYER_PSALMS.map((p) => ({
      bookId: 'psa',
      chapter: p.chapter,
      label: p.label,
    })),
    totalChapters: PRAYER_PSALMS.length,
  },
];

export const DEFAULT_PLAN_ID = 'start-with-jesus';

export function getReadingPlanById(id: string): ReadingPlan | undefined {
  return READING_PLANS.find((p) => p.id === id);
}
