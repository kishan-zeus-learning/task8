import { CellsMap } from "../types/CellsMap.js";
import { Cell } from "./Cell.js";

/**
 * Manages the creation, update, and retrieval of cell data in a sparse 2D grid format.
 * This class uses a nested Map structure to efficiently store and access cell information,
 * where only cells with non-empty values are explicitly stored.
 */
export class CellsManager {
    /**
     * @type {CellsMap} A nested map structure representing the spreadsheet grid:
     * - Outer Map Key: Row number (number)
     * - Outer Map Value: An inner Map (Map<number, Cell>)
     * - Inner Map Key: Column number (number)
     * - Inner Map Value: Cell instance (Cell) containing the cell’s value and properties.
     */
    CellsMap: CellsMap;

    /**
     * Constructs a new instance of CellsManager.
     * @param {CellsMap} CellsMap - An initial nested map structure holding existing cell data.
     */
    constructor(CellsMap: CellsMap) {
        this.CellsMap = CellsMap;
    }

    /**
     * Updates an existing cell or creates a new one at the specified row and column.
     * If the `value` provided is an empty string, the cell will be deleted from the map.
     * If the cell already exists, its value is updated. If it does not exist, a new `Cell` instance is created.
     * @param {number} row - The row index of the cell to manage.
     * @param {number} col - The column index of the cell to manage.
     * @param {string} [value=""] - The new value for the cell. An empty string triggers cell deletion.
     */
    manageCellUpdate(row: number, col: number, value: string = ""): void {
        if (value === "") {
            // If the value is an empty string, attempt to delete the cell.
            const currentRow = this.CellsMap.get(row);
            if (!currentRow) {
                // If the row doesn't exist, there's nothing to delete.
                return;
            }

            currentRow.delete(col); // Delete the cell from the inner map.

            // If the row (inner map) becomes empty after deletion, remove the row itself from the outer map.
            if (currentRow.size === 0) {
                this.CellsMap.delete(row);
            }
            return; // Exit after handling deletion.
        }

        // If the value is not empty, proceed to update or create the cell.
        let currentRow = this.CellsMap.get(row);
        if (!currentRow) {
            // If the row does not exist, create a new Map for it and add it to the CellsMap.
            currentRow = new Map<number, Cell>();
            this.CellsMap.set(row, currentRow);
        }

        // Check if the cell already exists in the current row.
        const existingCell = currentRow.get(col);
        if (existingCell) {
            // If the cell exists, simply update its value.
            existingCell.setValue(value);
        } else {
            // If the cell does not exist, create a new Cell instance and add it to the inner map.
            const newCell = new Cell(row, col, value);
            currentRow.set(col, newCell);
        }
    }

    /**
     * Retrieves the value of a cell at the specified row and column.
     * Returns an empty string if the cell or its containing row does not exist in the `CellsMap`.
     * @param {number} row - The row index of the cell to retrieve.
     * @param {number} col - The column index of the cell to retrieve.
     * @returns {string} The current value of the cell, or an empty string if the cell is not found.
     */
    getCellValue(row: number, col: number): string {
        const currentRow = this.CellsMap.get(row);
        if (!currentRow) {
            // If the row does not exist, no cells exist in that row.
            return "";
        }

        const cell = currentRow.get(col);
        if (!cell) {
            // If the cell does not exist within the row.
            return "";
        }

        return cell.getValue(); // Return the value of the found cell.
    }
}