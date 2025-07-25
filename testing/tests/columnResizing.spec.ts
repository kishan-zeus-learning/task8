import {test,expect, Page} from "@playwright/test";
import type { TestHooks } from "../types/hooks";

declare global{
    interface Window{
        testHooks?:TestHooks
    }
}

async function scrollInSteps(page:Page,scrollX:number,step=1000){
    while(scrollX>step){
        await page.mouse.wheel(step,0);
        scrollX-=step;
    }

    if(scrollX>0){
        await page.mouse.wheel(scrollX,0);
    }
}


test(">> Column Resizing",async({page})=>{
    const column=2;
    const deltaSize=50;

    await page.goto("http://localhost:5501/build/index.html?testing=true");

    const columnPos = await page.evaluate(({column})=>{
        return window.testHooks!.getColumnResizingCoordinate(column);
    },{column});

    const previousWidth = await page.evaluate(({column})=>{
        return window.testHooks!.getColumnWidth(column);
    },{column});

    console.log("column resizing coordinates",columnPos);


    await page.mouse.move(columnPos.selectionStartX-20,columnPos.selectionStartY+5);
    await scrollInSteps(page,columnPos.scrollX);

    await page.mouse.move(columnPos.selectionStartX,columnPos.selectionStartY + 5);

    await page.mouse.down();

    
    await page.mouse.move(columnPos.selectionStartX+deltaSize,columnPos.selectionStartY + 5);
    
    await page.mouse.up();

    const newWidth=await page.evaluate(({column})=>{
        return window.testHooks!.getColumnWidth(column);
    },{column});

    expect(newWidth).toBeGreaterThanOrEqual(50);
    expect(newWidth).toBeLessThanOrEqual(500);

    if(previousWidth+deltaSize<50){
        expect(newWidth).toBe(50);
    }else if(previousWidth+deltaSize>500){
        expect(newWidth).toBe(500);
    }else{
        expect(newWidth-previousWidth).toBe(deltaSize);
    }
});