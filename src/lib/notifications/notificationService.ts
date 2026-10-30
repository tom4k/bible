import { getPreferences, updatePreferences } from '../db/dexie';
import { getBookById } from '../bible/catalogue';
import { getReadingPlanById } from '../plans/readingPlans';

export interface NotificationStatus {
  isSupported: boolean;
  permission: NotificationPermission;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    throw new Error('Notifications are not supported by this browser.');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export async function showReadingNotification(
  title: string,
  body: string,
  urlPath = '/'
): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  const options: NotificationOptions = {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'the-living-word-daily-reminder',
    data: { url: urlPath },
  };

  // Try showing via active service worker registration first
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return true;
      }
    } catch {
      // Fallback to standard window Notification
    }
  }

  // Fallback to window Notification
  try {
    new Notification(title, options);
    return true;
  } catch (err) {
    console.warn('Could not display notification:', err);
    return false;
  }
}

/**
 * Sends an immediate test reminder for the user to verify functionality.
 */
export async function sendTestReminder(): Promise<boolean> {
  const prefs = await getPreferences();
  const book = getBookById(prefs.lastReadBookId) || { name: 'Mark' };
  const chapter = prefs.lastReadChapter || 1;
  const plan = getReadingPlanById(prefs.activePlanId);

  const title = 'The Living Word — Sacred Scripture Reminder';
  const body = `Time for your daily contemplation. Continue with ${book.name} ${chapter} in "${plan?.title || 'Start With Jesus'}".`;

  return showReadingNotification(title, body, `/bible/${prefs.lastReadBookId}/${chapter}`);
}

/**
 * Checks if a daily reminder should be triggered based on user preferences and current time.
 */
export async function checkDailyReminder(): Promise<boolean> {
  try {
    const prefs = await getPreferences();
    if (!prefs.notificationsEnabled) return false;
    if (getNotificationPermission() !== 'granted') return false;

    const now = new Date();
    const todayDate = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Already sent today?
    if (prefs.lastReminderSentDate === todayDate) {
      return false;
    }

    // Check time: e.g. "07:30"
    const [targetHour, targetMinute] = (prefs.reminderTime || '07:00')
      .split(':')
      .map((n) => parseInt(n, 10));

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // If current time is at or past the reminder time today
    if (
      currentHour > targetHour ||
      (currentHour === targetHour && currentMinute >= targetMinute)
    ) {
      const book = getBookById(prefs.lastReadBookId) || { name: 'Mark' };
      const chapter = prefs.lastReadChapter || 1;
      const plan = getReadingPlanById(prefs.activePlanId);

      const title = 'The Living Word — Daily Scripture Time';
      const body = `Pause for quiet contemplation. Continue reading ${book.name} ${chapter} (${plan?.title || 'Start With Jesus'}).`;

      const sent = await showReadingNotification(
        title,
        body,
        `/bible/${prefs.lastReadBookId}/${chapter}`
      );

      if (sent) {
        await updatePreferences({ lastReminderSentDate: todayDate });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn('Error in checkDailyReminder:', err);
    return false;
  }
}
