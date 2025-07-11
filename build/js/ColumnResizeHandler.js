import { ColumnResizingOperation } from "./UndoRedoManager/ColumnResizingOperation.js";
/**
 * Handles column resizing operations and events.
 */
export class ColumnResizeHandler {
    /**
     * Initializes the ColumnResizeHandler.
     *
     * @param {ColumnsManager} columnsManager - Manager handling column operations.
     * @param {TilesManager} tilesManager - Manager handling tile redraws.
     * @param {BooleanObj} ifColumnResizeOn - Flag indicating if column resize is active.
     * @param {BooleanObj} ifColumnResizePointerDown - Flag indicating if column resize is in progress.
     * @param {UndoRedoManager} undoRedoManager - Manager for undo/redo operations.
     */
    constructor(columnsManager, tilesManager, ifColumnResizeOn, ifColumnResizePointerDown, undoRedoManager) {
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.ifColumnResizeOn = ifColumnResizeOn;
        this.ifColumnResizePointerDown = ifColumnResizePointerDown;
        this.undoRedoManager = undoRedoManager;
    }
    /**
     * Handles column resize logic on pointer up event.
     */
    handlePointerUp() {
        // Hide column resize handles
        const columnCanvasDivs = document.querySelectorAll(".subColumn");
        columnCanvasDivs.forEach(columnCanvasDiv => {
            const resizeDiv = columnCanvasDiv.lastElementChild;
            resizeDiv.style.display = "none";
        });
        if (this.ifColumnResizePointerDown.value) {
            const columnResizeOperation = new ColumnResizingOperation(this.columnsManager.currentResizingColumnCanvas.getColumnKey(), this.columnsManager.currentResizingColumnCanvas.getPrevValue(), this.columnsManager.currentResizingColumnCanvas.getNewValue(), this.columnsManager.currentResizingColumnCanvas.columnWidths, this.columnsManager, this.tilesManager, this.columnsManager.currentResizingColumnCanvas);
            this.undoRedoManager.execute(columnResizeOperation);
            this.tilesManager.redrawColumn(this.columnsManager.currentResizingColumnCanvas.columnID);
            this.ifColumnResizePointerDown.value = false;
        }
    }
    /**
     * Handles column resize logic on pointer move event.
     *
     * @param {PointerEvent} event - The pointermove event.
     */
    handlePointerMove(event) {
        if (this.ifColumnResizePointerDown.value) {
            // this.columnsManager.currentResizingColumnCanvas.resizeColumn(event.clientX);
        }
    }
    /**
     * Checks if column resize is active or in progress.
     *
     * @returns {boolean} True if column resize is active or pointer is down.
     */
    isResizing() {
        return this.ifColumnResizeOn.value || this.ifColumnResizePointerDown.value;
    }
}
