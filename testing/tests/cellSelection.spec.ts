import { test, expect, Page } from "@playwright/test";
import { MultipleSelectionCoordinates} from "../types/MultipleSelectionCoordinates";

import type { TestHooks } from "../types/hooks";


declare global {
  interface Window {
    testHooks?: TestHooks;
  }
}

// Utility: Scroll in chunks (used for large grids)
async function scrollInSteps(page:Page, scrollX: number, scrollY: number, stepX = 1000, stepY = 400) {
  while (scrollY > stepY) {
    await page.mouse.wheel(0, stepY);
    scrollY -= stepY;
  }
  if (scrollY > 0) {
    await page.mouse.wheel(0, scrollY);
  }

  while (scrollX > stepX) {
    await page.mouse.wheel(stepX, 0);
    scrollX -= stepX;
  }
  if (scrollX > 0) {
    await page.mouse.wheel(scrollX, 0);
  }
}

test(">> Single cell selection", async ({ page }) => {
  const row = 1000;
  const col = 950;

  await page.goto("http://localhost:5501/build/index.html?testing=true");

  // // Wait until the hook is available
  // await page.waitForFunction(() =>
  //   typeof window.testHooks?.getSelectedCoordinates === "function"
  // );

  // Get screen coordinates and scroll values for the cell
  const cellPos = await page.evaluate(
    ({ row, col }) =>
      window.testHooks!.getSelectedCoordinates(row, row, col, col),
    { row, col }
  );

  console.log("Cell coordinates:", cellPos);

  // Move near the target (to simulate drag start from outside)
  await page.mouse.move(cellPos.selectionStartX - 20, cellPos.selectionStartY - 20);

  // Scroll down and right to reach the cell
  await scrollInSteps(page, cellPos.scrollX, cellPos.scrollY);

  // Move and click the actual target cell
  await page.mouse.move(cellPos.selectionStartX, cellPos.selectionStartY);
  await page.mouse.down();
  await page.mouse.up();

  // Verify selected cell
  const actualSelection = await page.evaluate(() =>
    window.testHooks!.getSelectedCells()
  );

  const expectedSelection: MultipleSelectionCoordinates = {
    selectionStartRow: row,
    selectionEndRow: row,
    selectionStartColumn: col,
    selectionEndColumn: col,
  };

  expect(actualSelection).toEqual(expectedSelection);
});
