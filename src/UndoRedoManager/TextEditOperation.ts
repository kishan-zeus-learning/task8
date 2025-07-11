import { CellsManager } from "../CellsManager.js";
import { Operation } from "./Operation.js";
import { TilesManager } from "../TilesManager.js";

/**
 * Represents a text edit operation that supports undo and redo functionality.
 * Extends the Operation base class.
 */
export class TextEditOperation extends Operation {
    
    /**
     * Initializes the TextEditOperation object.
     * @param {CellsManager} cellsManager - Manages updates to the spreadsheet cells.
     * @param {number} row - The row index of the edited cell.
     * @param {number} col - The column index of the edited cell.
     * @param {string} prevValue - The previous text value in the cell.
     * @param {string} newValue - The new text value to set in the cell.
     * @param {TilesManager} tilesManager - Manages the re-rendering of the UI/tiles.
     */
    constructor(
        private cellsManager: CellsManager,
        private row: number,
        private col: number,
        private prevValue: string,
        private newValue: string,
        private tilesManager: TilesManager
    ) {
        super();

        /** @type {CellsManager} Handles cell data updates */
        this.cellsManager = cellsManager;

        /** @type {number} Row index of the cell being edited */
        this.row = row;

        /** @type {number} Column index of the cell being edited */
        this.col = col;

        /** @type {string} Previous value of the cell before edit */
        this.prevValue = prevValue;

        /** @type {string} New value of the cell after edit */
        this.newValue = newValue;

        /** @type {TilesManager} Manages UI tile rendering */
        this.tilesManager = tilesManager;
    }

    /**
     * Undoes the text edit operation by restoring the previous value.
     */
    undo() {
        this.cellsManager.manageCellUpdate(this.row, this.col, this.prevValue);
        this.tilesManager.rerender();
    }

    /**
     * Redoes the text edit operation by applying the new value again.
     */
    redo() {
        this.cellsManager.manageCellUpdate(this.row, this.col, this.newValue);
        this.tilesManager.rerender();
    }
}
