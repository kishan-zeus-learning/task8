import { ColumnResizingOperation } from "../UndoRedoManager/ColumnResizingOperation.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
export class ColumnsResizeEventHandler extends PointerEventHandlerBase {
    constructor(columnsManager, tilesManager, undoRedoManager) {
        super();
        this.ColumnDiv = document.getElementById("columnsRow");
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.undoRedoManager = undoRedoManager;
        this.currentCanvasObj = null;
        this.columnID = null;
        this.hoverIdx = -1;
        this.columnKey = -1;
        this.newValue = columnsManager.defaultWidth;
        this.prevValue = columnsManager.defaultWidth;
    }
    hitTest(event) {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement))
            return false;
        if (!this.ColumnDiv.contains(currentElement))
            return false;
        this.columnID = parseInt(currentElement.getAttribute("col"));
        this.currentCanvasObj = this.columnsManager.getCurrentColumnCanvas(this.columnID);
        if (!this.currentCanvasObj)
            return false;
        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetX = event.clientX - currentCanvasRect.left;
        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetX);
        return this.hoverIdx !== -1;
    }
    pointerDown(event) {
        var _a;
        document.body.style.cursor = "ew-resize";
        this.columnKey = this.columnID * 25 + 1 + this.hoverIdx;
        this.prevValue = ((_a = this.columnsManager.columnWidths.get(this.columnKey)) === null || _a === void 0 ? void 0 : _a.width) || 100;
        this.newValue = this.prevValue;
    }
    pointerMove(event) {
        this.currentCanvasObj.resizeColumn(event.clientX, this.hoverIdx, this.columnKey);
    }
    pointerUp(event) {
        document.body.style.cursor = "";
        const columnResizeOperation = new ColumnResizingOperation(this.columnKey, this.prevValue, this.currentCanvasObj.getNewValue(), this.currentCanvasObj.columnWidths, this.columnsManager, this.tilesManager, this.currentCanvasObj);
        this.undoRedoManager.execute(columnResizeOperation);
        this.tilesManager.redrawColumn(this.columnID);
    }
}
