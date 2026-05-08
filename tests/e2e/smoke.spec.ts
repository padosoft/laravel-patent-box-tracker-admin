import { test, expect } from '@playwright/test';

test.describe('admin shell smoke', () => {
  test('boots the static prototype with API disabled and reaches the dashboard', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
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
});
