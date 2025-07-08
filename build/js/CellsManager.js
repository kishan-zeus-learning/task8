import { Cell } from "./Cell.js";
/**
 * Manages the creation, update, and retrieval of cell data
 */
export class CellsManager {
    constructor(CellsMap) {
        this.CellsMap = CellsMap;
    }
    /**
     * Updates or deletes a cell at the given row and column
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} value - New value for the cell (if empty, cell will be deleted)
     */
    manageCellUpdate(row, col, value = "") {
        if (value === "") {
            const currentRow = this.CellsMap.get(row);
            if (!currentRow)
                return;
            currentRow.delete(col);
            if (currentRow.size === 0) {
                this.CellsMap.delete(row);
            }
            return;
        }
        let currentRow = this.CellsMap.get(row);
        if (!currentRow) {
            currentRow = new Map();
            this.CellsMap.set(row, currentRow);
        }
        const existingCell = currentRow.get(col);
        if (existingCell) {
            existingCell.setValue(value);
        }
        else {
            const newCell = new Cell(row, col, value);
            currentRow.set(col, newCell);
        }
    }
    /**
     * Retrieves the value of a cell at the specified position
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @returns {string} Cell value or empty string if none exists
     */
    getCellValue(row, col) {
        const currentRow = this.CellsMap.get(row);
        if (!currentRow)
            return "";
        const cell = currentRow.get(col);
        if (!cell)
            return "";
        return cell.getValue();
    }
}
