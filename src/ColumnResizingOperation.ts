import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";
import { ColumnData } from "./types/ColumnRows.js";
import { Operation } from "./types/Operation.js";

export class ColumnResizingOperation extends Operation{
    constructor(
        private columnKey:number,
        private prevValue:number,
        private newValue:number,
        private columnsData:ColumnData,
        private columnsManagerObject:ColumnsManager,
        private tilesManagerObject:TilesManager,
        private currentColumnCanvasObj:ColumnsCanvas
    ){
        super();
    }

    undo():void{
        this.changeWidth(this.prevValue);
    }

    redo(): void {
        this.changeWidth(this.newValue);
    }

    private changeWidth(width:number){
        if(width===100) this.columnsData.delete(this.columnKey);
        else this.columnsData.set(this.columnKey,{width:width});
        this.currentColumnCanvasObj.setColumnsPositionArr();
        this.columnsManagerObject.rerender();
        this.tilesManagerObject.rerender();
    }
}