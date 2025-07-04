import { CellsMap } from "./types/CellsMap.js";
import { Cell } from "./Cell.js";
export class CellsManager {
    CellsMap: CellsMap;
    constructor() {
        this.CellsMap = this.initializeMap();
    }

    private initializeMap(data:JSON|null=null){
        const cellsMap=new Map();
        return cellsMap;
    }

    manageCellUpdate(row: number, col: number, value: string = "") {
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

}