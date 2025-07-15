import { RowResizingOperation } from "../UndoRedoManager/RowResizingOperation.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
/**
 * Handles pointer events for resizing individual rows in the spreadsheet.
 */
export class RowResizeEventHandler extends PointerEventHandlerBase {
    /**
     * Initializes the RowResizeEventHandler
     * @param {RowsManager} rowsManager - Manages the rows
     * @param {TilesManager} tilesManager - Manages the tiles
     * @param {UndoRedoManager} undoRedoManager - Manages undo/redo operations
     */
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
    /**
     * Detects if a pointer event hits a resizable row area.
     * @param {PointerEvent} event - The pointer event
     * @returns {boolean} True if the target is valid for resizing
     */
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
        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetY);
        return this.hoverIdx !== -1;
    }
    /**
     * Begins the row resize operation on pointer down
     * @param {PointerEvent} event
     */
    pointerDown(event) {
        var _a;
        this.rowsManager.rowsDivContainer.style.cursor = "ns-resize";
        document.body.style.cursor = "ns-resize";
        this.rowKey = this.rowID * 25 + 1 + this.hoverIdx;
        this.prevValue = ((_a = this.rowsManager.rowHeights.get(this.rowKey)) === null || _a === void 0 ? void 0 : _a.height) || 25;
        this.newValue = this.prevValue;
    }
    /**
     * Updates the row size while dragging
     * @param {PointerEvent} event
     */
    pointerMove(event) {
        this.currentCanvasObj.resizeRow(event.clientY, this.hoverIdx, this.rowKey);
        this.rowsManager.resizePosition();
    }
    /**
     * Finalizes the resize and pushes the operation to the undo/redo stack
     * @param {PointerEvent} event
     */
    pointerUp(event) {
        console.log("calling pointerup for row resize");
        document.body.style.cursor = "";
        this.rowsManager.rowsDivContainer.style.cursor = "";
        const rowResizeOperation = new RowResizingOperation(this.rowKey, this.prevValue, this.currentCanvasObj.getNewValue(), this.currentCanvasObj.rowHeights, this.rowsManager, this.tilesManager, this.currentCanvasObj);
        this.undoRedoManager.execute(rowResizeOperation);
        // this.tilesManager.redrawRow(this.rowID!);
    }
}
