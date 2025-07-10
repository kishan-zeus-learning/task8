import { RowResizingOperation } from "./RowResizingOperation.js";
import { RowsManager } from "./RowsManager.js";
import { TilesManager } from "./TilesManager.js";
import { BooleanObj } from "./types/BooleanObj.js";
import { UndoRedoManager } from "./UndoRedoManager.js";

/**
 * Handles row resizing operations and events.
 */
export class RowResizeHandler {
    /** @type {RowsManager} Manages row operations and resizing */
    private readonly rowsManager: RowsManager;

    /** @type {TilesManager} Manages tile operations and updates */
    private readonly tilesManager: TilesManager;

    /** @type {BooleanObj} Indicates if row resize mode is active */
    private readonly ifRowResizeOn: BooleanObj;

    /** @type {BooleanObj} Indicates if a row is currently being resized (pointer down) */
    private readonly ifRowResizePointerDown: BooleanObj;

    /** @type {UndoRedoManager} Manages undo/redo operations */
    private readonly undoRedoManager: UndoRedoManager;

    /**
     * Initializes the RowResizeHandler.
     * 
     * @param {RowsManager} rowsManager - Manager handling row operations.
     * @param {TilesManager} tilesManager - Manager handling tile redraws.
     * @param {BooleanObj} ifRowResizeOn - Flag indicating if row resize is active.
     * @param {BooleanObj} ifRowResizePointerDown - Flag indicating if row resize is in progress.
     * @param {UndoRedoManager} undoRedoManager - Manager for undo/redo operations.
     */
    constructor(
        rowsManager: RowsManager,
        tilesManager: TilesManager,
        ifRowResizeOn: BooleanObj,
        ifRowResizePointerDown: BooleanObj,
        undoRedoManager: UndoRedoManager
    ) {
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.ifRowResizeOn = ifRowResizeOn;
        this.ifRowResizePointerDown = ifRowResizePointerDown;
        this.undoRedoManager = undoRedoManager;
    }

    /**
     * Handles row resize logic on pointer up event.
     */
    handlePointerUp(): void {
        // Hide row resize handles
        const rowCanvasDivs = document.querySelectorAll(".subRow") as NodeListOf<HTMLDivElement>;
        rowCanvasDivs.forEach(rowCanvasDiv => {
            const resizeDiv = rowCanvasDiv.lastElementChild as HTMLDivElement;
            resizeDiv.style.display = "none";
        });

        if (this.ifRowResizePointerDown.value) {
            const rowResizeOperation = new RowResizingOperation(
                this.rowsManager.currentResizingRowCanvas.getRowKey(),
                this.rowsManager.currentResizingRowCanvas.getPrevValue(),
                this.rowsManager.currentResizingRowCanvas.getNewValue(),
                this.rowsManager.currentResizingRowCanvas.rowHeights,
                this.rowsManager,
                this.tilesManager,
                this.rowsManager.currentResizingRowCanvas
            );

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
    handlePointerMove(event: PointerEvent): void {
        if (this.ifRowResizePointerDown.value) {
            this.rowsManager.currentResizingRowCanvas.resizeRow(event.clientY);
        }
    }

    /**
     * Checks if row resize is active or in progress.
     * 
     * @returns {boolean} True if row resize is active or pointer is down.
     */
    isResizing(): boolean {
        return this.ifRowResizeOn.value || this.ifRowResizePointerDown.value;
    }
}