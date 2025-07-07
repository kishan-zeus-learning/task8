import { CellsMap } from "./types/CellsMap.js";
import { Cell } from "./Cell.js";

/**
 * Manages the creation, update, and retrieval of cell data
 */
export class CellsManager {
    /**
     * A map of rows to columns containing cells with data
     */
    CellsMap: CellsMap;

    constructor() {
        this.CellsMap = this.initializeMap();
    }

    /**
     * Initializes the cell map, optionally from provided JSON data
     * @param {JSON | null} data - Optional initial data (not implemented yet)
     * @returns {CellsMap} A nested Map representing spreadsheet cells
     */
    private initializeMap(data: JSON | null = null): CellsMap {
        // TODO: Deserialize from data if needed
        return new Map<number, Map<number, Cell>>();
    }

    /**
     * Updates or deletes a cell at the given row and column
     * @param {number} row - Row index
     * @param {number} col - Column index
     * @param {string} value - New value for the cell (if empty, cell will be deleted)
     */
    manageCellUpdate(row: number, col: number, value: string = ""): void {
        if (value === "") {
            const currentRow = this.CellsMap.get(row);
            if (!currentRow) return;

            currentRow.delete(col);
            if (currentRow.size === 0) {
                this.CellsMap.delete(row);
            }
            return;
        }

        let currentRow = this.CellsMap.get(row);
        if (!currentRow) {
            currentRow = new Map<number, Cell>();
            this.CellsMap.set(row, currentRow);
        }

        const existingCell = currentRow.get(col);
        if (existingCell) {
            existingCell.setValue(value);
        } else {
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
    getCellValue(row: number, col: number): string {
        const currentRow = this.CellsMap.get(row);
        if (!currentRow) return "";

        const cell = currentRow.get(col);
        if (!cell) return "";

        return cell.getValue();
    }
}
