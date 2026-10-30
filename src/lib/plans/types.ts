export interface PlanChapterReference {
  bookId: string;
  chapter: number;
  label?: string; // Optional subtitle or reflection theme
}

export interface ReadingPlan {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  traditionNote?: string;
  chapters: PlanChapterReference[];
  totalChapters: number;
}
