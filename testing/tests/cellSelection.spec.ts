import {test,expect} from "@playwright/test";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates";
import { PointerPosition } from "../types/pointerPosition";


declare global {
  interface Window {
    testHooks?: {
      getSelectedCells: () => MultipleSelectionCoordinates 
      ,
      getCoordinates:()=>PointerPosition
    }
  }
}

test("Single cell selection",async({page})=>{
    await page.goto("http://localhost:5501/build/index.html?testing=true");

    
    
    
    
    
    const selectedCoordinates = await page.evaluate(() => {
        return window.testHooks?.getSelectedCells();
    });

    const expectedCoordinates:MultipleSelectionCoordinates={
        selectionStartRow:1,
        selectionEndRow:1,
        selectionStartColumn:1,
        selectionEndColumn:1
    };

    expect(selectedCoordinates).toEqual(expectedCoordinates);
 
})