import { defineConfig, devices } from '@playwright/test';

/**
 * Two projects, because there are two builds to keep honest:
 *
 *  - `react`  → the Vite build, served by `vite preview`
 *  - `legacy` → the original single-file HTML build, served straight off disk
 *
 * Shared specs live in tests/shared/ and run against both, so a fix in one
 * build can't silently drift from the other. Build-specific specs sit in
 * tests/react/.
 *
 * NOTE ON THE PLAYWRIGHT VERSION: @playwright/test is pinned to 1.49.1 to
 * match the Chromium build already cached in this environment. To upgrade,
 * bump the pin and run `npx playwright install chromium`.
 *
 * NOTE ON WORKERS: kept low on purpose. Each worker is a full Chromium with
 * SVG filters and blend modes compositing every frame; four at once will
 * thrash a small CI container. Raise it only on a machine with headroom.
 */
const LEGACY_DIR = '../roshni-studios-website-v4 (1)';
const VITE = 'node ./node_modules/vite/bin/vite.js';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: Number(process.env.PW_WORKERS ?? 1),
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 12_000 },

  use: {
    // Traces and screenshots are opt-in. Each failing test writes a multi-MB
    // trace zip, and a suite with several failures can fill a small container
    // disk mid-run — which takes the whole run down and loses the results you
    // were trying to capture. Turn them on deliberately when debugging:
    //   $env:PW_TRACE=1; npm test -- -g "the aurora"
    trace: process.env.PW_TRACE ? 'retain-on-failure' : 'off',
    screenshot: process.env.PW_TRACE ? 'only-on-failure' : 'off',
    video: 'off',
    actionTimeout: 15_000,
    launchOptions: {
      // the compositing path for mix-blend-mode + SVG filters is unreliable
      // under software rasterisation in containers
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    },
  },

  webServer: [
    {
      command: `${VITE} preview --port 4173 --strictPort`,
      url: 'http://127.0.0.1:4173/',
      reuseExistingServer: true,
      timeout: 90_000,
    },
    {
      // serves the original hand-built HTML files, unchanged
      command: `${VITE} preview --outDir "${LEGACY_DIR}" --port 4174 --strictPort`,
      url: 'http://127.0.0.1:4174/roshni-studios-v3.html',
      reuseExistingServer: true,
      timeout: 90_000,
    },
  ],

  projects: [
    {
      // Anchored to the tests/ directory on purpose. A bare /react\// pattern
      // also matches this project's own folder name (roshni-studios-react/),
      // which silently made the legacy project match ZERO tests — it looked
      // like both builds were covered when only one was.
      name: 'react',
      testMatch: /tests[\\/](shared|react)[\\/].*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4173' },
    },
    {
      // the original HTML build only runs the shared specs
      name: 'legacy',
      testMatch: /tests[\\/]shared[\\/].*\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4174' },
    },
  ],
});
