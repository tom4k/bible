import { BibleBook } from '../bible/types';

export type JourneyPacePreset = 'gentle' | 'steady' | 'focused' | 'custom';

export interface JourneyPaceConfig {
  preset: JourneyPacePreset;
  chaptersPerSession: number;
  sessionsPerWeek: number;
  name?: string;
  description?: string;
}

export const JOURNEY_PACE_PRESETS: Record<Exclude<JourneyPacePreset, 'custom'>, JourneyPaceConfig> = {
  gentle: {
    preset: 'gentle',
    name: 'Gentle',
    chaptersPerSession: 1,
    sessionsPerWeek: 5,
    description: '1 chapter per session, 5 sessions per week',
  },
  steady: {
    preset: 'steady',
    name: 'Steady',
    chaptersPerSession: 2,
    sessionsPerWeek: 5,
    description: '2 chapters per session, 5 sessions per week',
  },
  focused: {
    preset: 'focused',
    name: 'Focused',
    chaptersPerSession: 2,
    sessionsPerWeek: 7,
    description: '2 chapters per session, 7 sessions per week',
  },
};

export interface JourneyStageDefinition {
  id: number; // 1 to 6
  name: string;
  subtitle: string;
  description: string;
  traditionNote: string;
  bookIds: string[];
}

export interface JourneyChapterItem {
  bookId: string;
  chapter: number;
  stageId: number;
  stageName: string;
  globalIndex: number;
}

export interface StageProgressSummary {
  stage: JourneyStageDefinition;
  totalChapters: number;
  completedChapters: number;
  percentage: number;
  isComplete: boolean;
  totalBooks: number;
  completedBooks: number;
  books: Array<{
    book: BibleBook;
    totalChapters: number;
    completedChapters: number;
    isComplete: boolean;
  }>;
}

export interface JourneyProgressSummary {
  totalChapters: number;
  completedChapters: number;
  percentage: number;
  totalBooks: number;
  completedBooks: number;
  activeStage: JourneyStageDefinition;
  stagesProgress: StageProgressSummary[];
  nextSessionChapters: Array<{
    book: BibleBook;
    chapter: number;
    stage: JourneyStageDefinition;
    globalIndex: number;
  }>;
  estimatedWeeksRemaining: number;
  estimatedMonthsRemaining: number;
  estimatedDaysRemaining: number;
  isJourneyComplete: boolean;
  paceConfig: JourneyPaceConfig;
}
