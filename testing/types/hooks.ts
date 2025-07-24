import { MultipleSelectionCoordinates } from "./MultipleSelectionCoordinates";
import { PointerPosition } from "./PointerPosition";

export interface TestHooks {
  getSelectedCells: () => MultipleSelectionCoordinates;
  getSelectedCoordinates: (
    startRow: number,
    endRow: number,
    startColumn: number,
    endColumn: number
  ) => PointerPosition;
  
  getRowResizingCoordinate: (rowNum: number) => PointerPosition; 
}
