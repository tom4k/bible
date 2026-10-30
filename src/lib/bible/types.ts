export type Testament = 'OT' | 'NT';

export type BookCategory =
  | 'Pentateuch'
  | 'Historical'
  | 'Wisdom'
  | 'Major Prophets'
  | 'Minor Prophets'
  | 'Gospels'
  | 'New Testament History'
  | 'Pauline Epistles'
  | 'Catholic Epistles'
  | 'Apocalypse';

export interface BibleBook {
  id: string; // Stable internal identifier, e.g. 'gen', 'tob', 'mrk'
  slug: string; // URL slug, e.g. 'genesis', 'tobit', 'mark'
  name: string; // Display name, e.g. 'Genesis', 'Tobit', 'Mark'
  abbreviation: string; // Common short form, e.g. 'Gen', 'Tob', 'Mk'
  testament: Testament;
  order: number; // 1 to 73 in canonical Catholic order
  chapterCount: number;
  category: BookCategory;
  isDeuterocanonical?: boolean;
  bibleGatewaySearchName: string; // e.g. 'Mark', 'Wisdom', 'Sirach'
}

export interface ScriptureReference {
  bookId: string;
  chapter: number;
  verse?: number;
  endVerse?: number;
}

export interface ScriptureContent {
  reference: ScriptureReference;
  bookName: string;
  chapter: number;
  title: string;
  isExternalOnly: boolean;
  externalUrl: string;
  text?: string; // Reserved for future licensed structured provider
  copyrightNotice?: string;
}

export interface ScriptureProvider {
  readonly id: string;
  readonly name: string;
  readonly supportsEmbeddedText: boolean;
  getPassageUrl(ref: ScriptureReference): string;
  getContent(ref: ScriptureReference): Promise<ScriptureContent>;
}
