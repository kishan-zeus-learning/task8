// import { ResizeManager } from "./ResizeManager.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { RowsManager } from "./RowsManager.js";
import { TilesManager } from "./TilesManager.js";
import { Operation } from "./types/Operation.js";
import { RowData } from "./types/RowsColumn.js";

export class RowResizingOperation extends Operation{
    constructor(private rowKey:number,private prevValue:number,private newValue:number,private rowsData:RowData,private rowsManagerObject:RowsManager,private tilesMangerObject:TilesManager,private currentRowCanvasObj:RowsCanvas){
        super();
    }

    undo(): void {
        this.changeHeight(this.prevValue);

    }

    redo(): void {
        // this
        this.changeHeight(this.newValue);
    }

    private changeHeight(height:number){
        if(height===25) this.rowsData.delete(this.rowKey);
        else this.rowsData.set(this.rowKey,{height:height});
        this.currentRowCanvasObj.setRowsPositionArr();
        this.rowsManagerObject.rerender();
        this.tilesMangerObject.rerender();

    }
}