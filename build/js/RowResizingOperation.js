import { Operation } from "./types/Operation.js";
export class RowResizingOperation extends Operation {
    constructor(rowKey, prevValue, newValue, rowsData, rowsManagerObject, tilesMangerObject, currentRowCanvasObj) {
        super();
        this.rowKey = rowKey;
        this.prevValue = prevValue;
        this.newValue = newValue;
        this.rowsData = rowsData;
        this.rowsManagerObject = rowsManagerObject;
        this.tilesMangerObject = tilesMangerObject;
        this.currentRowCanvasObj = currentRowCanvasObj;
    }
    undo() {
        this.changeHeight(this.prevValue);
    }
    redo() {
        // this
        this.changeHeight(this.newValue);
    }
    changeHeight(height) {
        if (height === 25)
            this.rowsData.delete(this.rowKey);
        else
            this.rowsData.set(this.rowKey, { height: height });
        this.currentRowCanvasObj.setRowsPositionArr();
        this.rowsManagerObject.rerender();
        this.tilesMangerObject.rerender();
    }
}
