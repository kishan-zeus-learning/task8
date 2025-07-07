import { CellsManager } from "./CellsManager";
import { Operation } from "./types/Operation";
import { TilesManager } from "./TilesManager";
export class TextEditOperation extends Operation {
    constructor(
        private cellsManager: CellsManager,
        private row: number,
        private col: number,
        private prevValue: string,
        private newValue: string,
        private tilesManager:TilesManager
    ) {
        super();
    }

    undo() {
        this.cellsManager.manageCellUpdate(this.row, this.col, this.prevValue);
        this.tilesManager.rerender();
    }

    redo() {
        this.cellsManager.manageCellUpdate(this.row, this.col, this.newValue);
        this.tilesManager.rerender();
    }
}