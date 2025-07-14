import { CellsMap } from "./types/CellsMap.js";
import { Cell } from "./Cell.js";

/**
 * Manages the creation, update, and retrieval of cell data in a sparse 2D grid format.
 */
export class CellsManager {
    /**
     * A nested map structure:
     * - Outer map key: row number
     * - Inner map key: column number
     * - Value: Cell instance containing the cell’s value
     */
    CellsMap: CellsMap;

    /**
     * Constructs a new instance of CellsManager.
     * @param {CellsMap} CellsMap - A nested map structure holding all cell data.
     */
    constructor(CellsMap: CellsMap) {
        this.CellsMap = CellsMap;
    }

    /**
     * Updates or deletes a cell at the given row and column.
     * - If `value` is an empty string, the cell is deleted.
     * - If the cell exists, it updates the value.
     * - If it doesn't exist, it creates a new Cell.
     * @param {number} row - Row index.
     * @param {number} col - Column index.
     * @param {string} value - New value for the cell. If empty, the cell will be deleted.
     */
    manageCellUpdate(row: number, col: number, value: string = ""): void {
        if (value === "") {
            // Delete cell if value is empty
            const currentRow = this.CellsMap.get(row);
            if (!currentRow) return;

            currentRow.delete(col);

            // Remove row if it's now empty
            if (currentRow.size === 0) {
                this.CellsMap.delete(row);
            }
            return;
        }

        // Retrieve or create the row
        let currentRow = this.CellsMap.get(row);
        if (!currentRow) {
            currentRow = new Map<number, Cell>();
            this.CellsMap.set(row, currentRow);
        }

        // Update cell value if it exists, otherwise create a new Cell
        const existingCell = currentRow.get(col);
        if (existingCell) {
            existingCell.setValue(value);
        } else {
            const newCell = new Cell(row, col, value);
            currentRow.set(col, newCell);
        }
    }

    /**
     * Retrieves the value of a cell at the specified row and column.
     * Returns an empty string if the cell doesn't exist.
     * @param {number} row - Row index.
     * @param {number} col - Column index.
     * @returns {string} The cell value, or an empty string if the cell is not present.
     */
    getCellValue(row: number, col: number): string {
        const currentRow = this.CellsMap.get(row);
        if (!currentRow) return "";

        const cell = currentRow.get(col);
        if (!cell) return "";

        return cell.getValue();
    }
}