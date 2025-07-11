import { RowResizingOperation } from "./UndoRedoManager/RowResizingOperation.js";
/**
 * Handles row resizing operations and events.
 */
export class RowResizeHandler {
    /**
     * Initializes the RowResizeHandler.
     *
     * @param {RowsManager} rowsManager - Manager handling row operations.
     * @param {TilesManager} tilesManager - Manager handling tile redraws.
     * @param {BooleanObj} ifRowResizeOn - Flag indicating if row resize is active.
     * @param {BooleanObj} ifRowResizePointerDown - Flag indicating if row resize is in progress.
     * @param {UndoRedoManager} undoRedoManager - Manager for undo/redo operations.
     */
    constructor(rowsManager, tilesManager, ifRowResizeOn, ifRowResizePointerDown, undoRedoManager) {
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.ifRowResizeOn = ifRowResizeOn;
        this.ifRowResizePointerDown = ifRowResizePointerDown;
        this.undoRedoManager = undoRedoManager;
    }
    /**
     * Handles row resize logic on pointer up event.
     */
    handlePointerUp() {
        // Hide row resize handles
        const rowCanvasDivs = document.querySelectorAll(".subRow");
        rowCanvasDivs.forEach(rowCanvasDiv => {
            const resizeDiv = rowCanvasDiv.lastElementChild;
            resizeDiv.style.display = "none";
        });
        if (this.ifRowResizePointerDown.value) {
            const rowResizeOperation = new RowResizingOperation(this.rowsManager.currentResizingRowCanvas.getRowKey(), this.rowsManager.currentResizingRowCanvas.getPrevValue(), this.rowsManager.currentResizingRowCanvas.getNewValue(), this.rowsManager.currentResizingRowCanvas.rowHeights, this.rowsManager, this.tilesManager, this.rowsManager.currentResizingRowCanvas);
            this.undoRedoManager.execute(rowResizeOperation);
            this.tilesManager.redrawRow(this.rowsManager.currentResizingRowCanvas.rowID);
            this.ifRowResizePointerDown.value = false;
        }
    }
    /**
     * Handles row resize logic on pointer move event.
     *
     * @param {PointerEvent} event - The pointermove event.
     */
    handlePointerMove(event) {
        if (this.ifRowResizePointerDown.value) {
            // this.rowsManager.currentResizingRowCanvas.resizeRow(event.clientY);
        }
    }
    /**
     * Checks if row resize is active or in progress.
     *
     * @returns {boolean} True if row resize is active or pointer is down.
     */
    isResizing() {
        return this.ifRowResizeOn.value || this.ifRowResizePointerDown.value;
    }
}
