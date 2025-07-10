import { Operation } from "./types/Operation.js";
/**
 * Represents a row resizing operation, designed to be used with an Undo/Redo manager.
 * This class extends the `Operation` abstract class, providing `undo` and `redo` capabilities.
 */
export class RowResizingOperation extends Operation {
    /**
     * Constructs a new `RowResizingOperation`.
     * @param {number} rowKey - The unique identifier for the row that was resized.
     * @param {number} prevValue - The height of the row before the resize.
     * @param {number} newValue - The new height of the row after the resize.
     * @param {RowData} rowsData - The data structure holding all row heights.
     * @param {RowsManager} rowsManagerObject - The manager responsible for row-related operations.
     * @param {TilesManager} tilesMangerObject - The manager responsible for cell/tile rendering.
     * @param {RowsCanvas} currentRowCanvasObj - The specific `RowsCanvas` instance where the resize occurred.
     */
    constructor(rowKey, prevValue, newValue, rowsData, rowsManagerObject, tilesMangerObject, currentRowCanvasObj) {
        super(); // Call the constructor of the parent `Operation` class
        this.rowKey = rowKey;
        this.prevValue = prevValue;
        this.newValue = newValue;
        this.rowsData = rowsData;
        this.rowsManagerObject = rowsManagerObject;
        this.tilesMangerObject = tilesMangerObject;
        this.currentRowCanvasObj = currentRowCanvasObj;
    }
    /**
     * Undoes the row resizing operation.
     * This method reverts the row's height to its `prevValue`.
     */
    undo() {
        this.changeHeight(this.prevValue);
    }
    /**
     * Redoes the row resizing operation.
     * This method reapplies the row's height to its `newValue`.
     */
    redo() {
        this.changeHeight(this.newValue);
    }
    /**
     * Internal method to apply the height change to a specific row.
     * It updates the `rowsData` map and triggers re-rendering of relevant components.
     * If the `height` is 25 (default height), the row's custom entry is deleted from `rowsData`.
     * Otherwise, the new custom height is set.
     * @private
     * @param {number} height - The target height to set for the row.
     */
    changeHeight(height) {
        if (height === 25) {
            // If height is default, remove the custom entry to optimize memory
            this.rowsData.delete(this.rowKey);
        }
        else {
            // Otherwise, set the custom height for the row
            this.rowsData.set(this.rowKey, { height: height });
        }
        // Recalculate row positions in the affected canvas
        this.currentRowCanvasObj.setRowsPositionArr();
        // Trigger a re-render of the row headers
        this.rowsManagerObject.rerender();
        // Trigger a re-render of the main grid tiles (cells)
        this.tilesMangerObject.rerender();
    }
}
