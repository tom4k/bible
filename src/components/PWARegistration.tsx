'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('PWA ServiceWorker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('PWA ServiceWorker registration failed:', error);
        });
    }
  }, []);

  return null;
}
