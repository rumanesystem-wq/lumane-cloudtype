import { expect, test, type Page } from '@playwright/test';

const viewports = [
  { name: '360', width: 360, height: 800, minimumDocumentHeight: 1850 },
  { name: '390', width: 390, height: 844, minimumDocumentHeight: 1800 },
  { name: '768', width: 768, height: 1024, minimumDocumentHeight: 1700 },
  { name: '1024', width: 1024, height: 768, minimumDocumentHeight: 1150 },
  { name: '1440', width: 1440, height: 1000, minimumDocumentHeight: 1150 },
];

async function waitForStableDocumentHeight(page: Page, minimumHeight: number) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight), { timeout: 10_000 }).toBeGreaterThanOrEqual(minimumHeight);
  let previousHeight = -1;
  let stableIntervals = 0;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    await page.waitForTimeout(100);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    stableIntervals = height === previousHeight ? stableIntervals + 1 : 0;
    previousHeight = height;
    if (stableIntervals >= 3) return height;
  }
  throw new Error(`Document height did not stabilize above ${minimumHeight}px.`);
}

for (const viewport of viewports) {
  test(`${viewport.name}px viewport passes interaction and visual checks`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    const undersizedTargets = await page.locator('button, a, input, textarea, select').evaluateAll((elements) => elements.filter((element) => {
      const box = element.getBoundingClientRect();
      return box.width < 44 || box.height < 44;
    }).map((element) => element.textContent?.trim() || element.getAttribute('aria-label')));
    expect(undersizedTargets).toEqual([]);

    const normalLoadingDemoWidth = await page.getByRole('button', { name: '동기화' }).evaluate((element) => element.getBoundingClientRect().width);
    const busyLoadingDemoWidth = await page.getByRole('button', { name: '처리 중…' }).evaluate((element) => element.getBoundingClientRect().width);
    expect(busyLoadingDemoWidth).toBe(normalLoadingDemoWidth);

    const trigger = page.getByRole('button', { name: '새 상담 메모' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: '상담 메모 추가' });
    await expect(dialog.getByLabel('메모')).toBeFocused();
    await expect(dialog).toBeInViewport();
    await dialog.getByRole('button', { name: '메모 저장' }).focus();
    await page.keyboard.press('Tab');
    await expect(dialog.getByLabel('메모')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(dialog.getByRole('button', { name: '메모 저장' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();

    await page.getByRole('button', { name: '저장하기' }).click();
    await expect(page.locator('.error-summary')).toBeFocused();
    await page.getByRole('link', { name: '고객 이름을 입력해 주세요.' }).click();
    await expect(page.getByLabel('고객 이름')).toBeFocused();
    await page.getByRole('button', { name: '다시 시도' }).click();
    await expect(page.getByText('재시도 1회')).toBeVisible();

    const reducedMotionDuration = await page.locator('.button').first().evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(reducedMotionDuration)).toBeLessThanOrEqual(0.00001);

    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('heading', { name: '상담 운영 쇼케이스' })).toBeVisible();
    await page.evaluate(() => scrollTo(0, 0));
    const stableDocumentHeight = await waitForStableDocumentHeight(page, viewport.minimumDocumentHeight);
    expect(stableDocumentHeight).toBeGreaterThan(viewport.height);
    await expect(page).toHaveScreenshot(`showcase-${viewport.name}.png`, { fullPage: true });
    await page.screenshot({ path: testInfo.outputPath(`showcase-${viewport.name}.png`), fullPage: true, animations: 'disabled' });
  });
}
