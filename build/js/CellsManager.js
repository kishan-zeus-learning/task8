import { Cell } from "./Cell.js";
export class CellsManager {
    constructor() {
        this.CellsMap = this.initializeMap();
    }
    initializeMap(data = null) {
        const cellsMap = new Map();
        return cellsMap;
    }
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
}
