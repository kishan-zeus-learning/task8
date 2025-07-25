import { MultipleSelectionCoordinates } from "./MultipleSelectionCoordinates";
import { PointerPosition } from "./PointerPositionTesting";
import { RowResizingTesting } from "./RowResizingTesting";
import {ColumnResizingTesting} from "./ColumnResizingTesting"

export interface TestHooks {
  getSelectedCells: ()=> MultipleSelectionCoordinates,
      getSelectedCoordinates: (startRow:number,endRow:number,startColumn:number,endColumn:number)=> PointerPosition,
       getRowResizingCoordinate: (rowNum: number) => RowResizingTesting,

       getColumnResizingCoordinate:(columnNum:number)=>ColumnResizingTesting,

       getRowHeight:(rowNum:number) => number,

       getColumnWidth:(columnNum:number) => number,
}
