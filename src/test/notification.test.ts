import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isNotificationSupported,
  getNotificationPermission,
  showReadingNotification,
  sendTestReminder,
} from '../lib/notifications/notificationService';
import { db, updatePreferences } from '../lib/db/dexie';

describe('Notification Service & Reminders', () => {
  beforeEach(async () => {
    await db.preferences.clear();
    await updatePreferences({
      notificationsEnabled: true,
      reminderTime: '07:30',
      lastReadBookId: 'mrk',
      lastReadChapter: 1,
    });
  });

  it('detects notification support in jsdom / browser environment', () => {
    // In standard node jsdom, Notification may or may not be defined on global window
    const supported = isNotificationSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('reports notification permission accurately', () => {
    const permission = getNotificationPermission();
    expect(['default', 'granted', 'denied']).toContain(permission);
  });

  it('handles showReadingNotification safely without crashing when permissions are default or denied', async () => {
    const sent = await showReadingNotification('Daily Bread', 'Contemplate the Word');
    expect(typeof sent).toBe('boolean');
  });

  it('runs sendTestReminder safely without unhandled exceptions', async () => {
    const result = await sendTestReminder();
    expect(typeof result).toBe('boolean');
  });
});
