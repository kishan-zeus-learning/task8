import { ColumnsCanvas } from "../Columns/ColumnsCanvas.js";
import { ColumnsManager } from "../Columns/ColumnsManager.js";
import { TilesManager } from "../Tiles/TilesManager.js";
import { ColumnData } from "../types/ColumnRows.js";
import { Operation } from "./Operation.js";

/**
 * Represents a column resizing operation for undo/redo functionality.
 * Extends the abstract `Operation` class.
 */
export class ColumnResizingOperation extends Operation {
    /**
     * @private
     * @type {number} The key (index) of the column being resized.
     */
    private columnKey: number;

    /**
     * @private
     * @type {number} The previous width of the column before the resize operation.
     */
    private prevValue: number;

    /**
     * @private
     * @type {number} The new width of the column after the resize operation.
     */
    private newValue: number;

    /**
     * @private
     * @type {ColumnData} A map containing data for all columns.
     */
    private columnsData: ColumnData;

    /**
     * @private
     * @type {ColumnsManager} The ColumnsManager instance responsible for column-related operations.
     */
    private columnsManagerObject: ColumnsManager;

    /**
     * @private
     * @type {TilesManager} The TilesManager instance responsible for cell rendering.
     */
    private tilesManagerObject: TilesManager;

    /**
     * @private
     * @type {ColumnsCanvas} The ColumnsCanvas instance for drawing column headers.
     */
    private currentColumnCanvasObj: ColumnsCanvas;

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
    constructor(
        columnKey: number,
        prevValue: number,
        newValue: number,
        columnsData: ColumnData,
        columnsManagerObject: ColumnsManager,
        tilesManagerObject: TilesManager,
        currentColumnCanvasObj: ColumnsCanvas
    ) {
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
    undo(): void {
        this.changeWidth(this.prevValue);
        this.columnsManagerObject.resizePosition();
    }

    /**
     * Redoes the column resizing operation by applying the column's new width.
     */
    redo(): void {
        this.changeWidth(this.newValue);
        this.columnsManagerObject.resizePosition();
    }

    /**
     * Changes the width of the specified column and triggers a re-render of affected components.
     * If the width is 100, the column data is deleted, effectively resetting it to default.
     * Otherwise, the column's width is updated in the `columnsData` map.
     * @private
     * @param {number} width - The target width for the column.
     */
    private changeWidth(width: number) {
        if (width === 100) {
            // If the width is 100, remove the entry from columnsData to reset to default width
            this.columnsData.delete(this.columnKey);
        } else {
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