import { ScriptureContent, ScriptureProvider, ScriptureReference } from './types';
import { getBookById } from './catalogue';

export class BibleGatewayProvider implements ScriptureProvider {
  readonly id = 'bible-gateway-nrsvce';
  readonly name = 'Bible Gateway (NRSV-CE)';
  readonly supportsEmbeddedText = false; // Phase 1: iframe/direct external link only. No text scraping.

  /**
   * Generates the canonical Bible Gateway passage URL for NRSV-CE.
   * e.g. https://www.biblegateway.com/passage/?search=Mark%201&version=NRSVCE
   */
  getPassageUrl(ref: ScriptureReference): string {
    const book = getBookById(ref.bookId);
    if (!book) {
      throw new Error(`Unknown canonical book ID: ${ref.bookId}`);
    }

    let searchParam = `${book.bibleGatewaySearchName} ${ref.chapter}`;
    if (ref.verse) {
      if (ref.endVerse && ref.endVerse > ref.verse) {
        searchParam += `:${ref.verse}-${ref.endVerse}`;
      } else {
        searchParam += `:${ref.verse}`;
      }
    }

    const encoded = encodeURIComponent(searchParam);
    return `https://www.biblegateway.com/passage/?search=${encoded}&version=NRSVCE`;
  }

  async getContent(ref: ScriptureReference): Promise<ScriptureContent> {
    const book = getBookById(ref.bookId);
    if (!book) {
      throw new Error(`Unknown canonical book ID: ${ref.bookId}`);
    }

    const externalUrl = this.getPassageUrl(ref);

    return {
      reference: ref,
      bookName: book.name,
      chapter: ref.chapter,
      title: `${book.name} ${ref.chapter}`,
      isExternalOnly: true,
      externalUrl,
      copyrightNotice:
        'New Revised Standard Version Bible: Catholic Edition, copyright © 1989, 1993 the Division of Christian Education of the National Council of the Churches of Christ in the United States of America. Used by permission. All rights reserved.',
    };
  }
}

export const defaultScriptureProvider: ScriptureProvider = new BibleGatewayProvider();
