import { test, expect, Page } from "@playwright/test";
import type { TestHooks } from "../types/hooks";

declare global {
  interface Window {
    testHooks?: TestHooks
  }
}

async function scrollInSteps(page:Page, scrollY: number, step = 400) {
  while (scrollY > step) {
    await page.mouse.wheel(0, step);
    scrollY -= step;
  }

  if (scrollY > 0) {
    await page.mouse.wheel(0, scrollY);
  }
}
test(">> Row Resizing", async ({ page }) => {
  const row = 35;
  const deltaSize=50;
  await page.goto("http://localhost:5501/build/index.html?testing=true");

  const rowPos = await page.evaluate(({ row }) => {
    return window.testHooks!.getRowResizingCoordinate(row);
  }, { row });


  const previousHeight= await page.evaluate(({row})=>{
    return window.testHooks!.getRowHeight(row);
  },{row});



  console.log("row resizing coordinates",rowPos);

  await page.mouse.move(5,rowPos.selectionStartY-20);
  await scrollInSteps(page,rowPos.scrollY);

  await page.mouse.move(5,rowPos.selectionStartY);

  await page.mouse.down();
  await page.mouse.move(5,rowPos.selectionStartY+deltaSize);
  
  await page.mouse.up();
  

  const newHeight= await page.evaluate(({row})=>{
    return window.testHooks!.getRowHeight(row);
  },{row});


  expect(newHeight).toBeGreaterThanOrEqual(25);
  expect(newHeight).toBeLessThanOrEqual(500);

  if(previousHeight+deltaSize<25){
    expect(newHeight).toBe(25);
  }else if(previousHeight+deltaSize>500){
    expect(newHeight).toBe(500);
  }else{
    expect(newHeight-previousHeight).toBe(deltaSize);
  }


});