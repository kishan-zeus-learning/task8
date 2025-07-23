import { CellsMap } from "./types/CellsMap";
import { ColumnData } from "./types/ColumnRows";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";
import { RowData } from "./types/RowsColumn";

declare global {
  interface Window {
    testHooks?: {
      getSelectedCells: ()=> MultipleSelectionCoordinates;
    },
    abc:string
  }
}

export class TestingMethods{
    private selectedCells:MultipleSelectionCoordinates;
    private cellData:CellsMap;
    private rowsData:RowData;
    private columnsData:ColumnData;

    constructor(selectedCells:MultipleSelectionCoordinates,cellData:CellsMap,rowsData:RowData,columnsData:ColumnData){
        this.selectedCells=selectedCells;
        this.cellData=cellData;
        this.rowsData=rowsData;
        this.columnsData=columnsData;

        const params = new URLSearchParams(window.location.search);
        // console.log(params.get());
        if (params.get("testing") === "true") {
            console.log("inside if statement for the test hooks");
            console.log("this.selectedCells",this.selectedCells);
            window.testHooks={
                getSelectedCells:() =>  this.selectedCells,
            }

            window.abc="kishan kumar";
        }else{
            console.log("testing false");
        }
    }


}