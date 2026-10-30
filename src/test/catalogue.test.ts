import { describe, it, expect } from 'vitest';
import {
  CATHOLIC_BIBLE_BOOKS,
  getBookById,
  getBookBySlug,
  getBookByOrder,
  getOldTestamentBooks,
  getNewTestamentBooks,
  isValidChapter,
  getAdjacentChapters,
} from '../lib/bible/catalogue';

describe('Catholic Bible Catalogue (73 Books)', () => {
  it('contains exactly 73 canonical books', () => {
    expect(CATHOLIC_BIBLE_BOOKS).toHaveLength(73);
  });

  it('contains exactly 46 Old Testament books and 27 New Testament books', () => {
    const ot = getOldTestamentBooks();
    const nt = getNewTestamentBooks();
    expect(ot).toHaveLength(46);
    expect(nt).toHaveLength(27);
  });

  it('maintains strict sequential order from 1 to 73 with unique IDs and slugs', () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();

    CATHOLIC_BIBLE_BOOKS.forEach((book, index) => {
      expect(book.order).toBe(index + 1);
      expect(ids.has(book.id)).toBe(false);
      expect(slugs.has(book.slug)).toBe(false);
      ids.add(book.id);
      slugs.add(book.slug);
      expect(book.chapterCount).toBeGreaterThan(0);
    });
  });

  it('includes Catholic deuterocanonical books with correct chapter counts', () => {
    const tobit = getBookById('tob');
    expect(tobit).toBeDefined();
    expect(tobit?.isDeuterocanonical).toBe(true);
    expect(tobit?.chapterCount).toBe(14);

    const judith = getBookById('jdt');
    expect(judith?.isDeuterocanonical).toBe(true);
    expect(judith?.chapterCount).toBe(16);

    const wisdom = getBookById('wis');
    expect(wisdom?.isDeuterocanonical).toBe(true);
    expect(wisdom?.chapterCount).toBe(19);

    const sirach = getBookById('sir');
    expect(sirach?.isDeuterocanonical).toBe(true);
    expect(sirach?.chapterCount).toBe(51);

    const baruch = getBookById('bar');
    expect(baruch?.isDeuterocanonical).toBe(true);
    expect(baruch?.chapterCount).toBe(6);

    const macc1 = getBookById('1ma');
    expect(macc1?.isDeuterocanonical).toBe(true);
    expect(macc1?.chapterCount).toBe(16);

    const macc2 = getBookById('2ma');
    expect(macc2?.isDeuterocanonical).toBe(true);
    expect(macc2?.chapterCount).toBe(15);
  });

  it('correctly looks up books by id, slug, or order', () => {
    expect(getBookById('mrk')?.name).toBe('Mark');
    expect(getBookBySlug('mark')?.name).toBe('Mark');
    expect(getBookByOrder(48)?.name).toBe('Mark');

    expect(getBookById('gen')?.name).toBe('Genesis');
    expect(getBookBySlug('genesis')?.name).toBe('Genesis');
    expect(getBookByOrder(1)?.name).toBe('Genesis');

    expect(getBookById('rev')?.name).toBe('Revelation');
    expect(getBookByOrder(73)?.name).toBe('Revelation');
  });

  it('validates chapters strictly against catalogue bounds', () => {
    expect(isValidChapter('mark', 1)).toBe(true);
    expect(isValidChapter('mark', 16)).toBe(true);
    expect(isValidChapter('mark', 0)).toBe(false);
    expect(isValidChapter('mark', 17)).toBe(false);
    expect(isValidChapter('mark', -1)).toBe(false);
    expect(isValidChapter('unknown-book', 1)).toBe(false);

    expect(isValidChapter('psalms', 150)).toBe(true);
    expect(isValidChapter('psalms', 151)).toBe(false);
  });

  it('computes adjacent chapters across book boundaries correctly', () => {
    // Within same book
    const midMark = getAdjacentChapters('mrk', 5);
    expect(midMark.previous?.book.id).toBe('mrk');
    expect(midMark.previous?.chapter).toBe(4);
    expect(midMark.next?.book.id).toBe('mrk');
    expect(midMark.next?.chapter).toBe(6);

    // Beginning of Genesis (first book, chapter 1)
    const gen1 = getAdjacentChapters('gen', 1);
    expect(gen1.previous).toBeNull();
    expect(gen1.next?.book.id).toBe('gen');
    expect(gen1.next?.chapter).toBe(2);

    // End of Mark (chapter 16) -> Next should be Luke chapter 1
    const markEnd = getAdjacentChapters('mrk', 16);
    expect(markEnd.next?.book.id).toBe('luk');
    expect(markEnd.next?.chapter).toBe(1);

    // Beginning of Mark (chapter 1) -> Previous should be Matthew chapter 28
    const markStart = getAdjacentChapters('mrk', 1);
    expect(markStart.previous?.book.id).toBe('mat');
    expect(markStart.previous?.chapter).toBe(28);

    // End of Revelation (last book, chapter 22) -> Next should be null
    const revEnd = getAdjacentChapters('rev', 22);
    expect(revEnd.next).toBeNull();
  });
});
