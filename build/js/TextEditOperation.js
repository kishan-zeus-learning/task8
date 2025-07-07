import { Operation } from "./types/Operation";
export class TextEditOperation extends Operation {
    constructor(cellsManager, row, col, prevValue, newValue, tilesManager) {
        super();
        this.cellsManager = cellsManager;
        this.row = row;
        this.col = col;
        this.prevValue = prevValue;
        this.newValue = newValue;
        this.tilesManager = tilesManager;
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
