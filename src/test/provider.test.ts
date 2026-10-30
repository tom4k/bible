import { describe, it, expect } from 'vitest';
import { BibleGatewayProvider } from '../lib/bible/bibleGatewayProvider';

describe('Bible Gateway Scripture Provider', () => {
  const provider = new BibleGatewayProvider();

  it('correctly formats NRSV-CE chapter URLs without verse numbers', () => {
    const url = provider.getPassageUrl({ bookId: 'mrk', chapter: 1 });
    expect(url).toBe('https://www.biblegateway.com/passage/?search=Mark%201&version=NRSVCE');
  });

  it('correctly handles spaces and special names like 1 Maccabees and Song of Solomon', () => {
    const maccUrl = provider.getPassageUrl({ bookId: '1ma', chapter: 4 });
    expect(maccUrl).toBe('https://www.biblegateway.com/passage/?search=1%20Maccabees%204&version=NRSVCE');

    const songUrl = provider.getPassageUrl({ bookId: 'sng', chapter: 2 });
    expect(songUrl).toBe('https://www.biblegateway.com/passage/?search=Song%20of%20Solomon%202&version=NRSVCE');
  });

  it('supports single verse and verse range queries', () => {
    const singleVerse = provider.getPassageUrl({ bookId: 'jhn', chapter: 3, verse: 16 });
    expect(singleVerse).toBe('https://www.biblegateway.com/passage/?search=John%203%3A16&version=NRSVCE');

    const verseRange = provider.getPassageUrl({ bookId: 'mat', chapter: 5, verse: 1, endVerse: 12 });
    expect(verseRange).toBe('https://www.biblegateway.com/passage/?search=Matthew%205%3A1-12&version=NRSVCE');
  });

  it('throws an error for unrecognized canonical book IDs', () => {
    expect(() => {
      provider.getPassageUrl({ bookId: 'unknown-id', chapter: 1 });
    }).toThrow('Unknown canonical book ID: unknown-id');
  });

  it('declares that embedded text is not supported in Phase 1 (respecting copyright)', async () => {
    expect(provider.supportsEmbeddedText).toBe(false);
    const content = await provider.getContent({ bookId: 'mrk', chapter: 1 });
    expect(content.isExternalOnly).toBe(true);
    expect(content.text).toBeUndefined();
    expect(content.copyrightNotice).toBeDefined();
  });
});
