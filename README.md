# The Living Word

A private, contemplative Catholic Bible-reading Progressive Web App (PWA) designed to foster a sustainable daily Scripture-reading habit. Rooted in the **Syro-Malabar Catholic tradition** of Kerala, India, featuring the sacred emblem of the Mar Thoma Sleeva (Saint Thomas Cross) and using the **New Revised Standard Version Catholic Edition (NRSV-CE)**.

---

## 🌟 Key Features

1. **Complete 73-Book Catholic Canon**
   - 46 Old Testament books (including the 7 Deuterocanonical books: Tobit, Judith, 1 & 2 Maccabees, Wisdom, Sirach, Baruch, and Catholic additions to Esther and Daniel).
   - 27 New Testament books.
   - Strict canonical ordering, validated chapter counts, and interactive chapter selector.

2. **Scripture Reader & Bible Gateway Integration**
   - Accesses complete, uncropped, original Bible Gateway NRSV-CE Scripture passages.
   - **Feature Flag Switch**: Toggle easily between Direct External Reading Link (recommended default) and Embedded Iframe View.
   - Previous and next chapter navigation with seamless cross-book transitions.
   - Direct chapter completion toggling, sacred bookmarks, and quick contemplative reflections.

3. **Guided Reading Plans**
   - **Start With Jesus**: The Gospel of Mark (Chapters 1–16) — *Initial default plan*.
   - **Knowing Jesus**: The Gospel of John (Chapters 1–21).
   - **The Early Church**: The Acts of the Apostles (Chapters 1–28).
   - **The Beginning**: Genesis (Chapters 1–50).
   - **A Life of Prayer**: 20 curated contemplative Psalms.
   - Resume button automatically brings you to the next unfinished chapter. Switch plans anytime without losing reading history.

4. **Private Contemplative Reflection Journal**
   - Local-only private reflection journal.
   - Associate entries with any Catholic Scripture chapter and optional verse.
   - Record reflection text, meditation question, and personal prayer.
   - Search across reflections, prayers, and books.
   - Full CRUD with confirmation modal before deletion.

5. **Sacred Bookmarks**
   - Bookmark whole chapters or specific verse references with custom intentions/labels.
   - Tap any bookmark to open the chapter directly in the Bible reader.

6. **Honest, Transparent Reading Statistics**
   - Unique chapters completed.
   - Unique reading days (no artificial reading duration inferences).
   - Completion percentage per reading plan.
   - Recent Scripture activity history.

7. **Contemplative Design System & Themes**
   - Syro-Malabar Catholic aesthetic featuring Saint Thomas Cross (Mar Thoma Sleeva) iconography.
   - Three distinct themes:
     - **Light Ivory** (`#F8F6F1` background, `#173B33` deep forest green)
     - **Sepia Parchment** (`#F3EBDD` warm parchment, deep brown typography)
     - **Dark Forest** (`#0D1614` nocturnal slate, gold highlights)
   - Responsive layouts optimized for mobile bottom navigation and desktop top navigation.

8. **PWA & Offline Availability**
   - Web App Manifest (`manifest.json`) and service worker (`sw.js`).
   - App shell cached for offline availability; local IndexedDB operates fully without internet.
   - Explicit compliance: Bible Gateway external pages require an internet connection and are strictly never cached.

9. **Private Backup & Restore (Web Crypto)**
   - Complete JSON export and import with versioned Zod schema validation.
   - Optional client-side encryption using browser-native **PBKDF2** (100,000 iterations, SHA-256) and **AES-256-GCM**.
   - Clear privacy notice: unencrypted backups are plain-text JSON and never described as secure.
   - Pre-restoration preview with item counts and conflict handling (Replace vs. Merge).

---

## 🛠 Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom CSS theme variables
- **Local Database**: IndexedDB via Dexie.js
- **Validation**: Zod (v4)
- **Icons**: Lucide React & Custom Saint Thomas Cross SVG
- **Unit Testing**: Vitest with `@testing-library/react`, `jsdom`, and `fake-indexeddb`
- **End-to-End Testing**: Playwright (Desktop Chromium & Pixel 5 Mobile Viewports)

---

## 🚀 Getting Started on macOS

### Prerequisites

- Node.js LTS (v20+ or v22+; verified on Node v22.14.0)
- npm (v10+; verified on npm 10.9.2)

### Installation

```bash
# Clone or navigate to the repository
cd /Users/tomkurian/Development/bible

# Install all dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev

# Or specify a custom port (e.g. port 3005)
npm run dev -- -p 3005
```

The application is available at `http://localhost:3000` (or `http://localhost:3005`).

### Production Build & Run

```bash
# Create optimized production build
npm run build

# Start production server
npm run start
```

---

## 🧪 Automated Testing

### Unit Tests (Vitest)

Validates 73-book Catholic canon, ordering, chapter bounds, Bible Gateway URL formatting, reading plans, stats calculations, Dexie IndexedDB CRUD, and AES-256-GCM backup round-trip:

```bash
npm test
```

### End-to-End Tests (Playwright)

Validates full browser user flows across Desktop Chromium and Mobile Viewports:

```bash
npm run test:e2e
```

### Code Quality & Linting

```bash
npm run lint
```

---

## ⚖️ Bible Gateway & Scripture Provider Architecture

### Phase 1 Implementation

- Scripture is accessed exclusively from Bible Gateway using the **NRSV-CE** translation:
  `https://www.biblegateway.com/passage/?search=<Book>%20<Chapter>&version=NRSVCE`
- Direct reading links preserve Bible Gateway's original page, branding, attribution, and copyright notices.
- No text is scraped, copied, cached, or proxied from Bible Gateway, respecting intellectual property and copyright laws.
- Feature flag toggle allows testing embedded iframe viewing where browser permissions permit; otherwise direct links provide a reliable fallback.

### Future Licensed Provider Integration

A replaceable `ScriptureProvider` interface is implemented in `src/lib/bible/types.ts`. Once copyright licensing is obtained from the Division of Christian Education of the National Council of the Churches of Christ in the USA:
1. Implement `ScriptureProvider` with `supportsEmbeddedText: true`.
2. Register the provider in `src/lib/bible/`.
3. The UI automatically displays formatted, offline-readable Scripture with customized typography.
See `src/lib/bible/licensedProviderGuide.ts` for full architectural details.

---

## 🔒 Security & Privacy

- **Local-first**: All journal reflections, bookmarks, and reading progress reside exclusively in browser IndexedDB.
- **Zero cloud tracking**: No analytics, third-party user trackers, or external database synchronizations.
- **Native Cryptography**: Backups can be encrypted with password-derived AES-256-GCM before downloading.
