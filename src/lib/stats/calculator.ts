import { ChapterProgress, ReadingActivity } from '../db/schema';
import { READING_PLANS } from '../plans/readingPlans';

export interface PlanProgressSummary {
  planId: string;
  title: string;
  totalChapters: number;
  completedChapters: number;
  percentage: number;
  nextChapter?: {
    bookId: string;
    chapter: number;
  };
}

export interface ReadingStatsSummary {
  uniqueChaptersCompleted: number;
  readingDaysCount: number;
  overallPlanPercentage: number;
  activePlanProgress: PlanProgressSummary;
  allPlansProgress: PlanProgressSummary[];
  totalBookmarks: number;
  totalJournalEntries: number;
}

export function calculateReadingStats(params: {
  completedChapters: ChapterProgress[];
  activities: ReadingActivity[];
  activePlanId: string;
  totalBookmarks: number;
  totalJournalEntries: number;
}): ReadingStatsSummary {
  const {
    completedChapters,
    activities,
    activePlanId,
    totalBookmarks,
    totalJournalEntries,
  } = params;

  // Set of completed chapter keys: `${bookId}:${chapter}`
  const completedSet = new Set(
    completedChapters.map((c) => `${c.bookId}:${c.chapter}`)
  );

  // Unique reading days from activities
  const uniqueDates = new Set(activities.map((a) => a.date));

  // Compute progress for each plan
  const allPlansProgress: PlanProgressSummary[] = READING_PLANS.map((plan) => {
    let completedInPlan = 0;
    let nextChapter: { bookId: string; chapter: number } | undefined;

    for (const ch of plan.chapters) {
      const key = `${ch.bookId}:${ch.chapter}`;
      if (completedSet.has(key)) {
        completedInPlan++;
      } else if (!nextChapter) {
        nextChapter = { bookId: ch.bookId, chapter: ch.chapter };
      }
    }

    const percentage =
      plan.totalChapters > 0
        ? Math.round((completedInPlan / plan.totalChapters) * 100)
        : 0;

    return {
      planId: plan.id,
      title: plan.title,
      totalChapters: plan.totalChapters,
      completedChapters: completedInPlan,
      percentage,
      nextChapter,
    };
  });

  const activePlanProgress =
    allPlansProgress.find((p) => p.planId === activePlanId) ||
    allPlansProgress[0];

  return {
    uniqueChaptersCompleted: completedSet.size,
    readingDaysCount: uniqueDates.size,
    overallPlanPercentage: activePlanProgress.percentage,
    activePlanProgress,
    allPlansProgress,
    totalBookmarks,
    totalJournalEntries,
  };
}
