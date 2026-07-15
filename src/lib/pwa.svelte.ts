// PWA update handling (autoUpdate): the new service worker takes control as soon as it's
// installed (skipWaiting + clientsClaim), and we reload once it does so the fresh content shows.
// Checks on load, on focus (key on iOS) and periodically. Browser-only.

export const pwa = $state<{ needRefresh: boolean; updating: boolean }>({
  needRefresh: false,
  updating: false
});

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;
let reg: ServiceWorkerRegistration | undefined;
let started = false;
let reloadingByUpdate = false;

export async function initPWA() {
  if (started || typeof window === 'undefined') return;
  started = true;
  try {
    // When the controlling SW changes (a new version activated), reload once to show it.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloadingByUpdate) return;
        reloadingByUpdate = true;
        location.reload();
      });
    }

    const { registerSW } = await import('virtual:pwa-register');
    updateSW = registerSW({
      immediate: true,
      onRegisteredSW(_swUrl: string, r?: ServiceWorkerRegistration) {
        reg = r;
        if (r) {
          // Check shortly after load, then periodically…
          setTimeout(() => r.update().catch(() => {}), 3000);
          setInterval(() => r.update().catch(() => {}), 15 * 60 * 1000);
          // …and whenever the app returns to the foreground (key on iOS).
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') r.update().catch(() => {});
          });
        }
      },
      onNeedRefresh() {
        // In autoUpdate this rarely fires, but keep the flag for an optional banner.
        pwa.needRefresh = true;
      }
    });
  } catch {
    /* SW not available — ignore */
  }
}

/** Apply a waiting update and reload (used by the banner / ↻). */
export async function applyUpdate() {
  pwa.updating = true;
  pwa.needRefresh = false;
  try {
    if (updateSW) await updateSW(true);
    else location.reload();
  } catch {
    location.reload();
  }
}

/** Ask the browser to fetch a fresh service worker now. If one exists, it activates and the
 *  page reloads via the controllerchange handler above. */
export async function checkForUpdate() {
  if (!reg) {
    location.reload();
    return;
  }
  await reg.update().catch(() => {});
}
