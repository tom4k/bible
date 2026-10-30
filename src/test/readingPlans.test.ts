import { describe, it, expect } from 'vitest';
import {
  READING_PLANS,
  DEFAULT_PLAN_ID,
  getReadingPlanById,
} from '../lib/plans/readingPlans';
import { isValidChapter, getBookById } from '../lib/bible/catalogue';

describe('Reading Plans Integrity', () => {
  it('includes all 5 required reading plans with Start With Jesus as default', () => {
    expect(READING_PLANS).toHaveLength(5);
    expect(DEFAULT_PLAN_ID).toBe('start-with-jesus');
    const defaultPlan = getReadingPlanById(DEFAULT_PLAN_ID);
    expect(defaultPlan?.title).toBe('Start With Jesus');
  });

  it('validates that every plan chapter maps to a valid canonical Catholic book and chapter', () => {
    for (const plan of READING_PLANS) {
      expect(plan.chapters.length).toBe(plan.totalChapters);
      expect(plan.chapters.length).toBeGreaterThan(0);

      for (const ref of plan.chapters) {
        const book = getBookById(ref.bookId);
        expect(book).toBeDefined();
        expect(isValidChapter(ref.bookId, ref.chapter)).toBe(true);
      }
    }
  });

  it('verifies Mark has 16 chapters, John has 21, Acts has 28, Genesis has 50', () => {
    const markPlan = getReadingPlanById('start-with-jesus');
    expect(markPlan?.totalChapters).toBe(16);
    expect(markPlan?.chapters[0].chapter).toBe(1);
    expect(markPlan?.chapters[15].chapter).toBe(16);

    const johnPlan = getReadingPlanById('knowing-jesus');
    expect(johnPlan?.totalChapters).toBe(21);

    const actsPlan = getReadingPlanById('early-church');
    expect(actsPlan?.totalChapters).toBe(28);

    const genPlan = getReadingPlanById('the-beginning');
    expect(genPlan?.totalChapters).toBe(50);
  });

  it('verifies A Life of Prayer curated Psalms selection', () => {
    const prayerPlan = getReadingPlanById('a-life-of-prayer');
    expect(prayerPlan).toBeDefined();
    expect(prayerPlan?.chapters.length).toBe(20);
    expect(prayerPlan?.chapters.every((c) => c.bookId === 'psa')).toBe(true);
  });
});
