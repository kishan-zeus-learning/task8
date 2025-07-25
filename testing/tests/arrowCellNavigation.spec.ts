import { test, expect, Page } from "@playwright/test";
import type { TestHooks } from "../types/hooks";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates";

declare global {
  interface Window {
    testHooks?: TestHooks;
  }
}

async function getCurrentCoordinates(page: Page): Promise<MultipleSelectionCoordinates> {
  return await page.evaluate(() => window.testHooks!.getSelectedCells());
}

test.describe("Arrow Key Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5501/build/index.html?testing=true");
  });

  test.afterEach(async({page})=>{
    await page.waitForTimeout(3000);
  })

  test("Initial selection is at (1,1)", async ({ page }) => {
    const coords = await getCurrentCoordinates(page);
    expect(coords).toEqual({
      selectionStartRow: 1,
      selectionEndRow: 1,
      selectionStartColumn: 1,
      selectionEndColumn: 1
    });
  });

  test("ArrowDown moves selection one row down", async ({ page }) => {
    await page.keyboard.press("ArrowDown");
    const coords = await getCurrentCoordinates(page);
    expect(coords.selectionStartRow).toBe(2);
    expect(coords.selectionEndRow).toBe(2);
  });

  test("ArrowRight moves selection one column right", async ({ page }) => {
    await page.keyboard.press("ArrowRight");
    const coords = await getCurrentCoordinates(page);
    expect(coords.selectionStartColumn).toBe(2);
    expect(coords.selectionEndColumn).toBe(2);
  });

  test("ArrowUp from (1,1) does not move selection up", async ({ page }) => {
    await page.keyboard.press("ArrowUp");
    const coords = await getCurrentCoordinates(page);
    expect(coords.selectionStartRow).toBe(1);
    expect(coords.selectionEndRow).toBe(1);
  });

  test("ArrowLeft from (1,1) does not move selection left", async ({ page }) => {
    await page.keyboard.press("ArrowLeft");
    const coords = await getCurrentCoordinates(page);
    expect(coords.selectionStartColumn).toBe(1);
    expect(coords.selectionEndColumn).toBe(1);
  });

  test("ArrowDown + ArrowRight moves selection to (2,2)", async ({ page }) => {
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");
    const coords = await getCurrentCoordinates(page);
    expect(coords).toEqual({
      selectionStartRow: 2,
      selectionEndRow: 2,
      selectionStartColumn: 2,
      selectionEndColumn: 2
    });
  });

  // ────────────── Extended Shift Selection ──────────────

  test("Shift+ArrowRight expands selection across 3 columns", async ({ page }) => {
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.up("Shift");

    const coords = await getCurrentCoordinates(page);
    expect(coords.selectionStartColumn).toBe(1);
    expect(coords.selectionEndColumn).toBe(4);
    expect(coords.selectionStartRow).toBe(1);
    expect(coords.selectionEndRow).toBe(1);
  });

  test("Shift+ArrowDown expands selection across 3 rows", async ({ page }) => {
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.up("Shift");

    const coords = await getCurrentCoordinates(page);
    expect(coords.selectionStartRow).toBe(1);
    expect(coords.selectionEndRow).toBe(4);
    expect(coords.selectionStartColumn).toBe(1);
    expect(coords.selectionEndColumn).toBe(1);
  });

  test("Shift+ArrowLeft shrinks selection from col 4 to col 1", async ({ page }) => {
    
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");

    
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.up("Shift");

    const coords = await getCurrentCoordinates(page);
    expect(coords.selectionStartColumn).toBe(4);
    expect(coords.selectionEndColumn).toBe(1);
    expect(coords.selectionStartRow).toBe(1);
    expect(coords.selectionEndRow).toBe(1);
  });

  test("Shift+ArrowUp shrinks selection from row 4 to row 1", async ({ page }) => {
    
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");

    
    await page.keyboard.down("Shift");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.up("Shift");

    const coords = await getCurrentCoordinates(page);
    expect(coords.selectionStartRow).toBe(4);
    expect(coords.selectionEndRow).toBe(1);
    expect(coords.selectionStartColumn).toBe(1);
    expect(coords.selectionEndColumn).toBe(1);
  });
});
