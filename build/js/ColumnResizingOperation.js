import { Operation } from "./types/Operation.js";
export class ColumnResizingOperation extends Operation {
    constructor(columnKey, prevValue, newValue, columnsData, columnsManagerObject, tilesManagerObject, currentColumnCanvasObj) {
        super();
        this.columnKey = columnKey;
        this.prevValue = prevValue;
        this.newValue = newValue;
        this.columnsData = columnsData;
        this.columnsManagerObject = columnsManagerObject;
        this.tilesManagerObject = tilesManagerObject;
        this.currentColumnCanvasObj = currentColumnCanvasObj;
    }
    undo() {
        this.changeWidth(this.prevValue);
    }
    redo() {
        this.changeWidth(this.newValue);
    }
    changeWidth(width) {
        if (width === 100)
            this.columnsData.delete(this.columnKey);
        else
            this.columnsData.set(this.columnKey, { width: width });
        this.currentColumnCanvasObj.setColumnsPositionArr();
        this.columnsManagerObject.rerender();
        this.tilesManagerObject.rerender();
    }
}
