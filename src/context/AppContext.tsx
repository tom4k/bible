'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserPreferences } from '../lib/db/schema';
import { getPreferences, updatePreferences, DEFAULT_PREFERENCES } from '../lib/db/dexie';
import {
  requestNotificationPermission,
  checkDailyReminder,
  isNotificationSupported,
} from '../lib/notifications/notificationService';

interface AppContextType {
  preferences: UserPreferences;
  setTheme: (theme: 'light' | 'dark' | 'sepia') => Promise<void>;
  setEmbeddedReaderEnabled: (enabled: boolean) => Promise<void>;
  setActivePlanId: (planId: string) => Promise<void>;
  setFontSize: (size: 'small' | 'medium' | 'large') => Promise<void>;
  setLastRead: (bookId: string, chapter: number) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<boolean>;
  setReminderTime: (time: string) => Promise<void>;
  setJourneyPace: (
    pace: 'gentle' | 'steady' | 'focused' | 'custom',
    customChapters?: number,
    customSessions?: number
  ) => Promise<void>;
  setLastJourneyPosition: (bookId: string, chapter: number) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  isLoading: boolean;
}

function applyThemeToDOM(theme: 'light' | 'dark' | 'sepia') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  const loadPrefs = async () => {
    try {
      const prefs = await getPreferences();
      setPreferences(prefs);
      applyThemeToDOM(prefs.theme);
    } catch (err) {
      console.warn('Error loading preferences:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrefs();
  }, []);

  // Check reminders on load and periodically
  useEffect(() => {
    if (!isLoading && preferences.notificationsEnabled) {
      checkDailyReminder();
      const interval = setInterval(() => {
        checkDailyReminder();
      }, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [isLoading, preferences.notificationsEnabled, preferences.reminderTime]);

  const setTheme = async (theme: 'light' | 'dark' | 'sepia') => {
    applyThemeToDOM(theme);
    const updated = await updatePreferences({ theme });
    setPreferences(updated);
  };

  const setEmbeddedReaderEnabled = async (enabled: boolean) => {
    const updated = await updatePreferences({ embeddedReaderEnabled: enabled });
    setPreferences(updated);
  };

  const setActivePlanId = async (activePlanId: string) => {
    const updated = await updatePreferences({ activePlanId });
    setPreferences(updated);
  };

  const setFontSize = async (fontSize: 'small' | 'medium' | 'large') => {
    const updated = await updatePreferences({ fontSize });
    setPreferences(updated);
  };

  const setLastRead = async (bookId: string, chapter: number) => {
    const updated = await updatePreferences({
      lastReadBookId: bookId,
      lastReadChapter: chapter,
    });
    setPreferences(updated);
  };

  const setNotificationsEnabled = async (enabled: boolean): Promise<boolean> => {
    if (enabled) {
      if (!isNotificationSupported()) {
        throw new Error('Notifications are not supported in this browser.');
      }
      const perm = await requestNotificationPermission();
      if (perm !== 'granted') {
        return false;
      }
    }
    const updated = await updatePreferences({ notificationsEnabled: enabled });
    setPreferences(updated);
    return true;
  };

  const setReminderTime = async (time: string) => {
    const updated = await updatePreferences({ reminderTime: time });
    setPreferences(updated);
  };

  const setJourneyPace = async (
    pace: 'gentle' | 'steady' | 'focused' | 'custom',
    customChapters?: number,
    customSessions?: number
  ) => {
    const updates: Partial<UserPreferences> = { journeyPace: pace };
    if (customChapters !== undefined) updates.customChaptersPerSession = customChapters;
    if (customSessions !== undefined) updates.customSessionsPerWeek = customSessions;
    const updated = await updatePreferences(updates);
    setPreferences(updated);
  };

  const setLastJourneyPosition = async (bookId: string, chapter: number) => {
    const updated = await updatePreferences({
      lastJourneyBookId: bookId,
      lastJourneyChapter: chapter,
    });
    setPreferences(updated);
  };

  const refreshPreferences = async () => {
    await loadPrefs();
  };

  return (
    <AppContext.Provider
      value={{
        preferences,
        setTheme,
        setEmbeddedReaderEnabled,
        setActivePlanId,
        setFontSize,
        setLastRead,
        setNotificationsEnabled,
        setReminderTime,
        setJourneyPace,
        setLastJourneyPosition,
        refreshPreferences,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
