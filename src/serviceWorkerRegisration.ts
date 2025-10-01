/**
 * Service Worker registration for PWA offline support
 */

import { Workbox } from 'workbox-window';

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        console.log('[SW] New version available, reloading...');
        window.location.reload();
      } else {
        console.log('[SW] Service worker installed for the first time');
      }
    });

    wb.addEventListener('activated', (event) => {
      console.log('[SW] Service worker activated');
      if (!event.isUpdate) {
        console.log('[SW] App is now ready for offline use');
      }
    });

    wb.addEventListener('waiting', () => {
      console.log('[SW] New service worker waiting to activate');
    });

    wb.addEventListener('controlling', () => {
      console.log('[SW] Service worker is now controlling the page');
    });

    wb.register()
      .then((registration) => {
        console.log('[SW] Registration successful:', registration);
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error);
      });
  } else {
    console.warn('[SW] Service workers are not supported in this browser');
  }
}