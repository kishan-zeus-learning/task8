import { ColumnResizingOperation } from "../UndoRedoManager/ColumnResizingOperation.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
/**
 * Handles pointer-based column resizing within the spreadsheet UI.
 * Uses canvas-based hit detection and applies column resizing through the Undo/Redo system.
 */
export class ColumnsResizeEventHandler extends PointerEventHandlerBase {
    /**
     * Creates an instance of `ColumnsResizeEventHandler`.
     * @param columnsManager - Manages the column headers and dimensions.
     * @param tilesManager - Manages rendering of tiles (spreadsheet cells).
     * @param undoRedoManager - Manager for executing undoable operations.
     */
    constructor(columnsManager, tilesManager, undoRedoManager) {
        super();
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.undoRedoManager = undoRedoManager;
        this.ColumnDiv = columnsManager.columnsDivContainer;
        this.currentCanvasObj = null;
        this.columnID = null;
        this.hoverIdx = -1;
        this.columnKey = -1;
        this.newValue = columnsManager.defaultWidth;
        this.prevValue = columnsManager.defaultWidth;
    }
    /**
     * Determines whether the pointer is hovering over a column resize region.
     * @param event - The pointer event to test.
     * @returns `true` if over a resize boundary; `false` otherwise.
     */
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
    /**
     * Initiates the resize operation by capturing the initial state.
     * @param event - The pointer down event.
     */
    pointerDown(event) {
        var _a;
        this.ColumnDiv.style.cursor = "ew-resize";
        document.body.style.cursor = "ew-resize";
        this.columnKey = this.columnID * 25 + 1 + this.hoverIdx;
        this.prevValue = ((_a = this.columnsManager.columnWidths.get(this.columnKey)) === null || _a === void 0 ? void 0 : _a.width) || 100;
        this.newValue = this.prevValue;
    }
    /**
     * Applies the new width to the column as the pointer moves.
     * @param event - The pointer move event.
     */
    pointerMove(event) {
        this.currentCanvasObj.resizeColumn(event.clientX, this.hoverIdx, this.columnKey);
        this.columnsManager.resizePosition();
    }
    /**
     * Finalizes the resize operation and registers it with the undo/redo manager.
     * @param event - The pointer up event.
     */
    pointerUp(event) {
        document.body.style.cursor = "";
        this.ColumnDiv.style.cursor = "";
        const columnResizeOperation = new ColumnResizingOperation(this.columnKey, this.prevValue, this.currentCanvasObj.getNewValue(), this.currentCanvasObj.columnWidths, this.columnsManager, this.tilesManager, this.currentCanvasObj);
        this.undoRedoManager.execute(columnResizeOperation);
    }
}
