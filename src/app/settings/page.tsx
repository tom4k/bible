'use client';

import React, { useState, useRef } from 'react';
import {
  Moon,
  Sun,
  BookOpen,
  Download,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  createBackup,
  parseAndValidateBackup,
  restoreBackup,
  BackupPreview,
} from '../../lib/backup/backupService';
import { BackupData } from '../../lib/db/schema';
import { db } from '../../lib/db/dexie';
import { SyroCrossIcon } from '../../components/icons/SyroCrossIcon';

export default function SettingsPage() {
  const {
    preferences,
    setTheme,
    setEmbeddedReaderEnabled,
    refreshPreferences,
  } = useApp();

  // Export State
  const [encryptExport, setEncryptExport] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFileContent, setImportFileContent] = useState<string | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importPreview, setImportPreview] = useState<BackupPreview | null>(null);
  const [validatedBackupData, setValidatedBackupData] = useState<BackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');

  // Reset Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Handle Export
  const handleExport = async () => {
    try {
      if (encryptExport && (!exportPassphrase || exportPassphrase.length < 6)) {
        setExportMessage('Passphrase must be at least 6 characters for encrypted export.');
        return;
      }

      const backupJson = await createBackup(encryptExport ? exportPassphrase : undefined);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `the-living-word-backup-${timestamp}${encryptExport ? '-encrypted' : '-unencrypted'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage(
        encryptExport
          ? 'Encrypted backup exported securely.'
          : 'Backup exported. Note: Unencrypted files are not protected by a password.'
      );
    } catch (err) {
      setExportMessage(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(null);
    setImportPreview(null);
    setValidatedBackupData(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      setImportFileContent(content);
      attemptValidation(content, importPassphrase);
    };
    reader.readAsText(file);
  };

  const attemptValidation = async (content: string, passphrase?: string) => {
    try {
      setImportError(null);
      const { preview, data } = await parseAndValidateBackup(content, passphrase);
      setImportPreview(preview);
      setValidatedBackupData(data);
    } catch (err) {
      setImportPreview(null);
      setValidatedBackupData(null);
      setImportError(err instanceof Error ? err.message : String(err));
    }
  };

  const handlePassphraseSubmit = () => {
    if (importFileContent) {
      attemptValidation(importFileContent, importPassphrase);
    }
  };

  const handleRestore = async () => {
    if (!validatedBackupData) return;
    try {
      await restoreBackup(validatedBackupData, restoreMode);
      await refreshPreferences();
      setImportSuccess(`Data successfully restored in ${restoreMode} mode!`);
      setImportPreview(null);
      setValidatedBackupData(null);
      setImportFileContent(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setImportError(`Restoration failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleClearAllData = async () => {
    await Promise.all([
      db.chapterProgress.clear(),
      db.readingActivity.clear(),
      db.bookmarks.clear(),
      db.journalEntries.clear(),
      db.planSelections.clear(),
      db.preferences.clear(),
    ]);
    await refreshPreferences();
    setShowResetConfirm(false);
    setImportSuccess('All local data has been reset.');
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[var(--primary-green)] dark:text-[var(--gold)]">
          Settings & Local Data
        </h1>
        <p className="text-xs sm:text-sm text-[var(--text-muted)]">
          Manage your reading themes, reader preferences, and private backups.
        </p>
      </div>

      {/* Theme Settings */}
      <section aria-labelledby="appearance-heading" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4 shadow-xs">
        <h2 id="appearance-heading" className="font-serif font-bold text-lg text-[var(--text-primary)]">
          Theme & Appearance
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Choose a contemplative visual theme tailored for day or night Scripture meditation. (Note: Theme controls style our app, not external Bible Gateway pages).
        </p>

        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { id: 'light', label: 'Light Ivory', desc: 'Warm ivory & forest green', icon: Sun },
            { id: 'sepia', label: 'Sepia Parchment', desc: 'Contemplative parchment', icon: BookOpen },
            { id: 'dark', label: 'Dark Forest', desc: 'Nocturnal deep slate', icon: Moon },
          ].map((themeOption) => {
            const Icon = themeOption.icon;
            const active = preferences.theme === themeOption.id;
            return (
              <button
                key={themeOption.id}
                onClick={() => setTheme(themeOption.id as typeof preferences.theme)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  active
                    ? 'border-[var(--primary-green)] dark:border-[var(--gold)] bg-[var(--bg-card-subtle)] ring-2 ring-[var(--primary-green)]/20 shadow-xs'
                    : 'border-[var(--border-color)] hover:border-[var(--sage)] bg-[var(--bg-card)]'
                }`}
              >
                <Icon className={`w-5 h-5 mb-2 ${active ? 'text-[var(--primary-green)] dark:text-[var(--gold)]' : 'text-[var(--text-muted)]'}`} />
                <div className="font-semibold text-xs text-[var(--text-primary)]">{themeOption.label}</div>
                <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{themeOption.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Bible Reader Feature Flag */}
      <section aria-labelledby="reader-flag-heading" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-4 shadow-xs">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 id="reader-flag-heading" className="font-serif font-bold text-lg text-[var(--text-primary)]">
              Scripture Reader Mode
            </h2>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Toggle between Direct External Links and Embedded Iframe View.
            </p>
            <p className="text-[11px] text-[var(--text-muted)] italic pt-1">
              Bible Gateway embedding depends on your browser&apos;s cross-origin security settings. If embedding is ever blocked, direct external reading is always available.
            </p>
          </div>

          <button
            onClick={() => setEmbeddedReaderEnabled(!preferences.embeddedReaderEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
              preferences.embeddedReaderEnabled ? 'bg-[var(--primary-green)] dark:bg-[var(--gold)]' : 'bg-stone-300 dark:bg-stone-700'
            }`}
            aria-label="Toggle embedded reader"
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                preferences.embeddedReaderEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
          Current mode:{' '}
          <span className="font-semibold text-[var(--text-primary)]">
            {preferences.embeddedReaderEnabled ? 'Embedded Iframe Enabled' : 'Direct Link Fallback (Recommended)'}
          </span>
        </div>
      </section>

      {/* Backup and Restore (Section 14 & 7) */}
      <section aria-labelledby="backup-heading" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 id="backup-heading" className="font-serif font-bold text-lg text-[var(--text-primary)]">
            Backup & Restore Data
          </h2>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Important Local-Only Notice</span>
            </div>
            <p>
              The Living Word stores all your journal entries, reading progress, and bookmarks solely in your browser&apos;s local IndexedDB. It does not upload data to any cloud database. Export regular backups to protect your reflections across device changes.
            </p>
          </div>
        </div>

        {/* Export Data */}
        <div className="space-y-3 pt-2 border-t border-[var(--border-color)]">
          <h3 className="font-serif font-bold text-sm text-[var(--text-primary)]">
            Export Local Data
          </h3>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer">
              <input
                type="checkbox"
                checked={encryptExport}
                onChange={(e) => setEncryptExport(e.target.checked)}
                className="rounded accent-[var(--primary-green)]"
              />
              <span className="font-semibold">Encrypt with password (Web Crypto AES-256-GCM)</span>
            </label>

            {encryptExport ? (
              <div className="space-y-1.5">
                <input
                  type="password"
                  placeholder="Enter a secure encryption passphrase (min 6 chars)"
                  value={exportPassphrase}
                  onChange={(e) => setExportPassphrase(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
                />
                <span className="text-[11px] text-[var(--text-muted)] block">
                  Remember this passphrase. Without it, the backup cannot be decrypted.
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-[var(--bg-card-subtle)] text-[11px] text-[var(--text-muted)] flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <span>
                  <strong>Notice:</strong> An unencrypted export is plain text JSON. Never describe an unencrypted export as secure if stored on shared computers.
                </span>
              </div>
            )}

            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary-green)] text-white dark:bg-[var(--gold)] dark:text-[#173B33] text-xs font-semibold shadow-xs transition-transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{encryptExport ? 'Export Encrypted Backup (.json)' : 'Export Backup (.json)'}</span>
            </button>

            {exportMessage && (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium pt-1">
                {exportMessage}
              </p>
            )}
          </div>
        </div>

        {/* Restore Data */}
        <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
          <h3 className="font-serif font-bold text-sm text-[var(--text-primary)]">
            Restore Backup
          </h3>

          <div className="space-y-3">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full text-xs text-[var(--text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--bg-card-subtle)] file:text-[var(--text-primary)] hover:file:bg-[var(--border-color)]"
            />

            {importError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 space-y-2">
                <p className="font-semibold">{importError}</p>
                {importError.includes('encrypted') && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="password"
                      placeholder="Enter decryption passphrase"
                      value={importPassphrase}
                      onChange={(e) => setImportPassphrase(e.target.value)}
                      className="flex-1 p-2 rounded-lg border border-red-300 bg-white dark:bg-black text-xs text-black dark:text-white"
                    />
                    <button
                      onClick={handlePassphraseSubmit}
                      className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-xs font-semibold"
                    >
                      Decrypt & Validate
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Backup Preview Modal / Section */}
            {importPreview && validatedBackupData && (
              <div className="p-4 rounded-xl border border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3 animate-scale-up">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Valid Backup Verified (Exported: {new Date(importPreview.exportedAt).toLocaleDateString()})</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Chapters</span>
                    <span className="font-bold text-[var(--text-primary)]">{importPreview.counts.chaptersCompleted}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Reflections</span>
                    <span className="font-bold text-[var(--text-primary)]">{importPreview.counts.journalEntries}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Bookmarks</span>
                    <span className="font-bold text-[var(--text-primary)]">{importPreview.counts.bookmarks}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
                    <span className="text-[10px] text-[var(--text-muted)] block">Activities</span>
                    <span className="font-bold text-[var(--text-primary)]">{importPreview.counts.readingActivity}</span>
                  </div>
                </div>

                {/* Conflict handling options */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Restoration Mode:</span>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="replace"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="accent-[var(--primary-green)]"
                      />
                      <span>Replace current data</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="accent-[var(--primary-green)]"
                      />
                      <span>Merge with current data</span>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleRestore}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 text-white text-xs font-bold shadow-xs hover:bg-emerald-800 transition-colors"
                >
                  Confirm & Restore Data ({restoreMode} mode)
                </button>
              </div>
            )}

            {importSuccess && (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold pt-1">
                {importSuccess}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Syro-Malabar Catholic Tradition & Saint Thomas Cross Heritage */}
      <section aria-labelledby="tradition-heading" className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary-green)] text-[var(--gold)] flex items-center justify-center">
            <SyroCrossIcon className="w-6 h-6 text-[var(--gold)]" />
          </div>
          <div>
            <h2 id="tradition-heading" className="font-serif font-bold text-lg text-[var(--text-primary)]">
              Syro-Malabar Catholic Heritage
            </h2>
            <span className="text-xs text-[var(--text-muted)]">Saint Thomas Christian Tradition of Kerala, India</span>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-serif">
          The Living Word is consecrated to helping Saint Thomas Christians cultivate a contemplative, faithful, and persevering habit with the Holy Scriptures. The Mar Thoma Sleeva (Saint Thomas Cross) featured throughout the app symbolizes the Resurrection of Our Lord Jesus Christ, planted firmly upon the lotus of Indian spiritual heritage.
        </p>

        <div className="pt-2 text-[11px] text-[var(--text-muted)] border-t border-[var(--border-color)]/60">
          Scripture text: New Revised Standard Version Catholic Edition (NRSV-CE) accessed via Bible Gateway.
        </div>
      </section>

      {/* Danger Zone: Reset Data */}
      <section className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/30 dark:bg-red-950/20 p-6 space-y-3">
        <h2 className="font-serif font-bold text-sm text-red-700 dark:text-red-400">
          Reset Application Data
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Clears all reading progress, bookmarks, journal reflections, and preferences from this device.
        </p>

        {showResetConfirm ? (
          <div className="p-4 rounded-xl bg-white dark:bg-black border border-red-300 dark:border-red-800 space-y-3">
            <p className="text-xs font-bold text-red-600">
              Are you completely certain? All local reflections and reading progress will be permanently erased.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg border border-[var(--border-color)] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                Yes, Reset All Data
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-xl border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
          >
            Clear Local Data
          </button>
        )}
      </section>
    </div>
  );
}
