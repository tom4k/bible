/**
 * Integration Point: Future Licensed Structured-Content Scripture Provider
 * 
 * Once formal copyright permissions/licenses for NRSV-CE are acquired from the
 * copyright holder (Division of Christian Education of the National Council of
 * the Churches of Christ in the USA) or an authorized licensed API provider:
 * 
 * 1. Implement the `ScriptureProvider` interface:
 * 
 *    ```typescript
 *    export class LicensedNRSVCEProvider implements ScriptureProvider {
 *      readonly id = 'licensed-nrsvce-structured';
 *      readonly name = 'Licensed NRSV-CE Catholic Edition';
 *      readonly supportsEmbeddedText = true;
 * 
 *      async getContent(ref: ScriptureReference): Promise<ScriptureContent> {
 *        // Fetch or load offline from encrypted/authorized local database:
 *        const structuredText = await loadLicensedChapter(ref.bookId, ref.chapter);
 *        return {
 *          reference: ref,
 *          bookName: book.name,
 *          chapter: ref.chapter,
 *          title: `${book.name} ${ref.chapter}`,
 *          isExternalOnly: false,
 *          externalUrl: defaultScriptureProvider.getPassageUrl(ref),
 *          text: structuredText,
 *          copyrightNotice: 'NRSV-CE used under License #...',
 *        };
 *      }
 *    }
 *    ```
 * 
 * 2. Register the provider in `src/lib/bible/providerRegistry.ts`.
 * 3. The UI components check `provider.supportsEmbeddedText`:
 *    - When true, render native typography with custom font sizing, verse selection, and offline caching.
 *    - When false (Phase 1), use iframe/external Bible Gateway link.
 */

export const LICENSED_PROVIDER_INTEGRATION_STATUS = {
  phase: 1,
  providerActive: 'BibleGatewayProvider',
  supportsOfflineText: false,
  legalNotice: 'Phase 1 strictly respects copyright: no scraping, copying or proxying of NRSV-CE text.',
};
