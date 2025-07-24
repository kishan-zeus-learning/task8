import {test,expect} from "@playwright/test";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates";
import { PointerPosition } from "../types/PointerPosition";
import type { TestHooks } from "../types/hooks";

declare global {
  interface Window {
    testHooks?: TestHooks;
  }
}


test("Row Resizing",async({page})=>{
    
})