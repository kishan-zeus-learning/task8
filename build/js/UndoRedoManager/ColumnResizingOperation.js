import { Operation } from "./Operation.js";
/**
 * Represents a column resizing operation for undo/redo functionality.
 * Extends the abstract `Operation` class.
 */
export class ColumnResizingOperation extends Operation {
    /**
     * Creates an instance of ColumnResizingOperation.
     * @param {number} columnKey - The key (index) of the column that was resized.
     * @param {number} prevValue - The width of the column before the resize.
     * @param {number} newValue - The width of the column after the resize.
     * @param {ColumnData} columnsData - The map holding all column data.
     * @param {ColumnsManager} columnsManagerObject - The instance of ColumnsManager.
     * @param {TilesManager} tilesManagerObject - The instance of TilesManager.
     * @param {ColumnsCanvas} currentColumnCanvasObj - The instance of ColumnsCanvas associated with the resized column.
     */
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
    /**
     * Undoes the column resizing operation by reverting the column's width to its previous value.
     */
    undo() {
        this.changeWidth(this.prevValue);
    }
    /**
     * Redoes the column resizing operation by applying the column's new width.
     */
    redo() {
        // console.log("old : ",this.prevValue);
        // console.log("new : ",this.newValue);
        this.changeWidth(this.newValue);
    }
    /**
     * Changes the width of the specified column and triggers a re-render of affected components.
     * If the width is 100, the column data is deleted, effectively resetting it to default.
     * Otherwise, the column's width is updated in the `columnsData` map.
     * @private
     * @param {number} width - The target width for the column.
     */
    changeWidth(width) {
        if (width === 100) {
            // If the width is 100, remove the entry from columnsData to reset to default width
            this.columnsData.delete(this.columnKey);
        }
        else {
            // Otherwise, set the new width for the column
            this.columnsData.set(this.columnKey, { width: width });
        }
        // Recalculate column positions for the canvas
        this.currentColumnCanvasObj.setColumnsPositionArr();
        // Trigger re-rendering for column headers
        this.columnsManagerObject.rerender();
        // Trigger re-rendering for the main grid tiles
        this.tilesManagerObject.rerender();
    }
}
