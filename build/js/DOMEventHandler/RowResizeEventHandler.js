import { RowResizingOperation } from "../UndoRedoManager/RowResizingOperation.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
export class RowResizeEventHandler extends PointerEventHandlerBase {
    constructor(rowsManager, tilesManager, undoRedoManager) {
        super();
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.undoRedoManager = undoRedoManager;
        this.RowDiv = rowsManager.rowsDivContainer;
        this.currentCanvasObj = null;
        this.rowID = null;
        this.hoverIdx = -1;
        this.rowKey = -1;
        this.newValue = rowsManager.defaultHeight;
        this.prevValue = rowsManager.defaultHeight;
    }
    hitTest(event) {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement))
            return false;
        if (!this.RowDiv.contains(currentElement))
            return false;
        this.rowID = parseInt(currentElement.getAttribute("row"));
        this.currentCanvasObj = this.rowsManager.getCurrentRowCanvas(this.rowID);
        if (!this.currentCanvasObj)
            return false;
        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetY = event.clientY - currentCanvasRect.top;
        // this.currentCanvasObj=currentCanvas;
        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetY);
        return this.hoverIdx !== -1;
    }
    pointerDown(event) {
        var _a;
        document.body.style.cursor = "ns-resize";
        this.rowKey = this.rowID * 25 + 1 + this.hoverIdx;
        this.prevValue = ((_a = this.rowsManager.rowHeights.get(this.rowKey)) === null || _a === void 0 ? void 0 : _a.height) || 25;
        this.newValue = this.prevValue;
    }
    pointerMove(event) {
        this.currentCanvasObj.resizeRow(event.clientY, this.hoverIdx, this.rowKey);
    }
    pointerUp(event) {
        document.body.style.cursor = "";
        const rowResizeOperation = new RowResizingOperation(this.rowKey, this.prevValue, this.currentCanvasObj.getNewValue(), this.currentCanvasObj.rowHeights, this.rowsManager, this.tilesManager, this.currentCanvasObj);
        this.undoRedoManager.execute(rowResizeOperation);
        this.tilesManager.redrawRow(this.rowID);
    }
}
