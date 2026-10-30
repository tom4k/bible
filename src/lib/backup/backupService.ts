import { db, getPreferences } from '../db/dexie';
import {
  BackupData,
  BackupDataSchema,
  EncryptedBackupContainer,
  EncryptedBackupContainerSchema,
} from '../db/schema';
import { encryptData, decryptData } from './crypto';

export interface BackupPreview {
  exportedAt: string;
  isEncrypted: boolean;
  counts: {
    chaptersCompleted: number;
    readingActivity: number;
    bookmarks: number;
    journalEntries: number;
    planSelections: number;
  };
}

/**
 * Creates a complete JSON export of all user data.
 * If passphrase is provided, encrypts the payload using AES-256-GCM.
 */
export async function createBackup(passphrase?: string): Promise<string> {
  const [
    chapterProgress,
    readingActivity,
    bookmarks,
    journalEntries,
    preferences,
    planSelections,
  ] = await Promise.all([
    db.chapterProgress.toArray(),
    db.readingActivity.toArray(),
    db.bookmarks.toArray(),
    db.journalEntries.toArray(),
    getPreferences(),
    db.planSelections.toArray(),
  ]);

  const rawBackup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    appName: 'The Living Word',
    encrypted: Boolean(passphrase && passphrase.trim().length > 0),
    payload: {
      chapterProgress,
      readingActivity,
      bookmarks,
      journalEntries,
      preferences,
      planSelections,
    },
  };

  // Validate the structure before exporting
  BackupDataSchema.parse(rawBackup);

  if (passphrase && passphrase.trim().length > 0) {
    const serializedPayload = JSON.stringify(rawBackup.payload);
    const { salt, iv, ciphertext } = await encryptData(serializedPayload, passphrase.trim());
    const encryptedContainer: EncryptedBackupContainer = {
      version: 1,
      appName: 'The Living Word',
      encrypted: true,
      exportedAt: rawBackup.exportedAt,
      salt,
      iv,
      ciphertext,
    };
    return JSON.stringify(encryptedContainer, null, 2);
  }

  return JSON.stringify(rawBackup, null, 2);
}

/**
 * Inspects, decrypts (if encrypted), and validates backup data.
 * Throws friendly validation or decryption errors if invalid.
 */
export async function parseAndValidateBackup(
  content: string,
  passphrase?: string
): Promise<{ preview: BackupPreview; data: BackupData }> {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('Invalid JSON format. Please upload a valid .json backup file.');
  }

  // Check if encrypted container
  const encryptedCheck = EncryptedBackupContainerSchema.safeParse(parsedJson);
  if (encryptedCheck.success) {
    if (!passphrase || passphrase.trim().length === 0) {
      throw new Error('This backup file is encrypted. Please provide the decryption passphrase.');
    }

    const decryptedJsonString = await decryptData(
      {
        salt: encryptedCheck.data.salt,
        iv: encryptedCheck.data.iv,
        ciphertext: encryptedCheck.data.ciphertext,
      },
      passphrase.trim()
    );

    let decryptedPayload: unknown;
    try {
      decryptedPayload = JSON.parse(decryptedJsonString);
    } catch {
      throw new Error('Decryption succeeded, but decrypted payload is not valid JSON.');
    }

    const reconstructedBackup: BackupData = {
      version: encryptedCheck.data.version,
      exportedAt: encryptedCheck.data.exportedAt,
      appName: encryptedCheck.data.appName,
      encrypted: true,
      payload: decryptedPayload as BackupData['payload'],
    };

    const validated = BackupDataSchema.parse(reconstructedBackup);

    const preview: BackupPreview = {
      exportedAt: validated.exportedAt,
      isEncrypted: true,
      counts: {
        chaptersCompleted: validated.payload.chapterProgress.length,
        readingActivity: validated.payload.readingActivity.length,
        bookmarks: validated.payload.bookmarks.length,
        journalEntries: validated.payload.journalEntries.length,
        planSelections: validated.payload.planSelections.length,
      },
    };

    return { preview, data: validated };
  }

  // Check unencrypted backup
  const unencrypted = BackupDataSchema.safeParse(parsedJson);
  if (!unencrypted.success) {
    const errorIssues = unencrypted.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    throw new Error(`Backup file does not match expected schema: ${errorIssues}`);
  }

  const preview: BackupPreview = {
    exportedAt: unencrypted.data.exportedAt,
    isEncrypted: false,
    counts: {
      chaptersCompleted: unencrypted.data.payload.chapterProgress.length,
      readingActivity: unencrypted.data.payload.readingActivity.length,
      bookmarks: unencrypted.data.payload.bookmarks.length,
      journalEntries: unencrypted.data.payload.journalEntries.length,
      planSelections: unencrypted.data.payload.planSelections.length,
    },
  };

  return { preview, data: unencrypted.data };
}

/**
 * Restores validated data into IndexedDB.
 * mode: 'replace' clears current data first; 'merge' keeps existing and overwrites overlapping keys.
 */
export async function restoreBackup(
  backup: BackupData,
  mode: 'replace' | 'merge' = 'replace'
): Promise<void> {
  const { payload } = backup;

  await db.transaction(
    'rw',
    [
      db.chapterProgress,
      db.readingActivity,
      db.bookmarks,
      db.journalEntries,
      db.preferences,
      db.planSelections,
    ],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.chapterProgress.clear(),
          db.readingActivity.clear(),
          db.bookmarks.clear(),
          db.journalEntries.clear(),
          db.planSelections.clear(),
        ]);
      }

      // Bulk put prevents duplicate key errors
      if (payload.chapterProgress.length > 0) {
        await db.chapterProgress.bulkPut(payload.chapterProgress);
      }
      if (payload.readingActivity.length > 0) {
        await db.readingActivity.bulkPut(payload.readingActivity);
      }
      if (payload.bookmarks.length > 0) {
        await db.bookmarks.bulkPut(payload.bookmarks);
      }
      if (payload.journalEntries.length > 0) {
        await db.journalEntries.bulkPut(payload.journalEntries);
      }
      if (payload.planSelections.length > 0) {
        await db.planSelections.bulkPut(payload.planSelections);
      }
      if (payload.preferences) {
        await db.preferences.put(payload.preferences);
      }
    }
  );
}
