import { test, expect, type Page } from '@playwright/test';

// The api-client treats `localStorage.__PB_ADMIN_API_CONFIG__` as the source
// of truth for `baseUrl`, `token` and `enabled`, overriding query-string
// values when both are present. If the test runner ever shares storage state
// with a developer who previously stored `enabled: true`, the smoke would
// start hitting a live API and fail with console errors. Force a clean state
// in every test by writing the storage key from the bootstrap script — that
// runs before any page script, including api-client.jsx.
async function forceApiDisabled(page: Page) {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        '__PB_ADMIN_API_CONFIG__',
        JSON.stringify({ baseUrl: '/api/patent-box', token: null, enabled: false }),
      );
    } catch {
      // Ignore — the test still passes ?apiEnabled=0 as a second guard.
    }
  });
}

test.describe('admin shell smoke', () => {
  test('boots the static prototype with API disabled and reaches the dashboard', async ({ page }) => {
    await forceApiDisabled(page);
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') {
        return;
      }
      // Suppress only the favicon 404 — the static prototype intentionally
      // does not ship one. Match on msg.location().url (the resource URL
      // Chromium attached to the failed-load message) rather than the free
      // text, which is not guaranteed to contain the URL across versions.
      const locationUrl = msg.location()?.url ?? '';
      if (/\/favicon\.ico(?:[?#].*)?$/i.test(locationUrl)) {
        return;
      }
      // As a belt-and-braces guard for older Chromium builds whose console
      // entries omit `location.url`, also accept the favicon path inside the
      // raw text — but only that specific resource, never a generic 404.
      const text = msg.text();
      if (locationUrl === '' && /\/favicon\.ico\b/i.test(text)) {
        return;
      }
      consoleErrors.push(text);
    });

    await page.goto('/?apiEnabled=0');

    // Babel-standalone compiles JSX in-browser; allow it a few hundred ms.
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });

    // The shell exposes a Patent Box brand mark in the sidebar — assert its presence
    // without coupling to a single string so a future copy edit does not break the smoke.
    const body = await page.locator('body').innerText();
    expect(body.toLowerCase()).toContain('patent box');

    // Hard-fail on any uncaught script error. Babel-standalone will surface JSX
    // syntax bugs through this channel.
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('exposes the API client globals on window', async ({ page }) => {
    await forceApiDisabled(page);
    await page.goto('/?apiEnabled=0');
    await page.waitForFunction(() => typeof (window as unknown as { TrackerApi?: unknown }).TrackerApi !== 'undefined', null, {
      timeout: 15_000,
    });

    const surface = await page.evaluate(() => {
      const api = (window as unknown as { TrackerApi: Record<string, unknown> }).TrackerApi;
      return Object.keys(api).filter((k) => typeof (api as Record<string, unknown>)[k] === 'function').sort();
    });

    for (const expected of [
      'getHealth',
      'getCapabilities',
      'listSessions',
      'getSession',
      'getSessionCommits',
      'getSessionEvidence',
      'getSessionDossiers',
      'renderDossier',
      'createSession',
      'dryRun',
      'validateRepository',
      'verifySessionIntegrity',
      'getDossier',
      'downloadUrl',
    ]) {
      expect(surface).toContain(expected);
    }
  });

  // Macro 6.4 interaction smoke: verifies that the session-detail page
  // renders the Verify integrity button and that dossier-row click opens
  // the drawer. Uses explicit assertions so regressions fail visibly.
  test('session detail: Verify integrity button + dossier drawer render', { timeout: 60_000 }, async ({ page }) => {
    await forceApiDisabled(page);
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const locationUrl = msg.location()?.url ?? '';
      if (/\/favicon\.ico(?:[?#].*)?$/i.test(locationUrl)) return;
      const text = msg.text();
      if (locationUrl === '' && /\/favicon\.ico\b/i.test(text)) return;
      consoleErrors.push(text);
    });

    await page.goto('/?apiEnabled=0');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#root')).not.toBeEmpty({ timeout: 15_000 });

    // The sidebar nav-item for Sessions contains an SVG icon + a <span> label
    // + an optional badge counter (e.g. "Sessions4"). Filtering by /^Sessions$/
    // fails because the full textContent includes the badge. Use page.evaluate
    // to click via the exact span text to avoid ambiguity.
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('.nav-item'))
        .find((e) => e.querySelector('span')?.textContent === 'Sessions');
      if (el) (el as HTMLElement).click();
    });
    await page.waitForLoadState('networkidle');

    // The sessions table must show at least one data row.
    await expect(page.locator('.tbl tbody tr').first()).toBeVisible({ timeout: 10_000 });

    // Open the first session. force:true bypasses any palette overlay that
    // Chromium headless may render in front of the table rows.
    await page.locator('.tbl tbody tr').first().click({ force: true });
    await page.waitForLoadState('networkidle');

    // The Verify integrity button must be visible on the detail page.
    const verifyBtn = page.getByRole('button', { name: /verify integrity/i });
    await expect(verifyBtn).toBeVisible({ timeout: 10_000 });

    // Click — with API disabled the button shows an error toast but must
    // not crash (captured in consoleErrors and asserted at the end).
    await verifyBtn.click();
    await page.waitForTimeout(400);

    // Navigate to the Dossiers tab and assert it shows fixture dossiers.
    await page.locator('.tab').filter({ hasText: /Dossiers/ }).click();
    await expect(page.locator('.dossier-row').first()).toBeVisible({ timeout: 10_000 });

    // Click the first dossier row — the DossierDrawer must open.
    await page.locator('.dossier-row').first().click({ force: true });
    await expect(page.locator('.drawer')).toBeVisible({ timeout: 5_000 });

    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });
});
