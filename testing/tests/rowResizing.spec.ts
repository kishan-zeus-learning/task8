import {test,expect} from "@playwright/test";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates";
import { PointerPosition } from "../types/PointerPosition";

declare global {
  interface Window {
    testHooks?: {
      getSelectedCells: () => MultipleSelectionCoordinates;
      getSelectedCoordinates: (
        startRow: number,
        endRow: number,
        startColumn: number,
        endColumn: number
      ) => PointerPosition;
    };
  }
}
