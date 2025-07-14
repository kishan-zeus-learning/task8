import { RowsCanvas } from "../RowsCanvas.js";
import { RowsManager } from "../RowsManager.js";
import { TilesManager } from "../TilesManager.js";
import { RowResizingOperation } from "../UndoRedoManager/RowResizingOperation.js";
import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

/**
 * Handles pointer events for resizing individual rows in the spreadsheet.
 */
export class RowResizeEventHandler extends PointerEventHandlerBase {
    /** @type {HTMLDivElement} Reference to the row container element */
    private RowDiv: HTMLDivElement;

    /** @type {RowsManager} Manages visible row elements and row-related operations */
    private rowsManager: RowsManager;

    /** @type {TilesManager} Manages cell tiles and coordinates with row and column updates */
    private tilesManager: TilesManager;

    /** @type {UndoRedoManager} Manages undo and redo history for row edits */
    private undoRedoManager: UndoRedoManager;

    /** @type {RowsCanvas | null} The current row canvas being interacted with */
    private currentCanvasObj: RowsCanvas | null;

    /** @type {number | null} The ID of the row currently selected or modified */
    private rowID: number | null;

    /** @type {number} The index of the row currently hovered over */
    private hoverIdx: number;

    /** @type {number} The key/index used for identifying a specific row */
    private rowKey: number;

    /** @type {number} New value set for the row (e.g., height or data) */
    private newValue: number;

    /** @type {number} Previous value before the row edit, used for undo */
    private prevValue: number;


    /**
     * Initializes the RowResizeEventHandler
     * @param {RowsManager} rowsManager - Manages the rows
     * @param {TilesManager} tilesManager - Manages the tiles
     * @param {UndoRedoManager} undoRedoManager - Manages undo/redo operations
     */
    constructor(
        rowsManager: RowsManager,
        tilesManager: TilesManager,
        undoRedoManager: UndoRedoManager
    ) {
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
    hitTest(event: PointerEvent): boolean {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement)) return false;
        if (!this.RowDiv.contains(currentElement)) return false;

        this.rowID = parseInt(currentElement.getAttribute("row") as string);
        this.currentCanvasObj = this.rowsManager.getCurrentRowCanvas(this.rowID);
        if (!this.currentCanvasObj) return false;

        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetY = event.clientY - currentCanvasRect.top;
        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetY);

        return this.hoverIdx !== -1;
    }

    /**
     * Begins the row resize operation on pointer down
     * @param {PointerEvent} event
     */
    pointerDown(event: PointerEvent): void {
        this.rowsManager.rowsDivContainer.style.cursor="ns-resize";
        document.body.style.cursor="ns-resize";
        this.rowKey = (this.rowID as number) * 25 + 1 + this.hoverIdx;
        this.prevValue = this.rowsManager.rowHeights.get(this.rowKey)?.height || 25;
        this.newValue = this.prevValue;
    }

    /**
     * Updates the row size while dragging
     * @param {PointerEvent} event
     */
    pointerMove(event: PointerEvent): void {
        this.currentCanvasObj!.resizeRow(event.clientY, this.hoverIdx, this.rowKey);
    }

    /**
     * Finalizes the resize and pushes the operation to the undo/redo stack
     * @param {PointerEvent} event
     */
    pointerUp(event: PointerEvent): void {
        document.body.style.cursor = "";
        this.rowsManager.rowsDivContainer.style.cursor="";
        const rowResizeOperation = new RowResizingOperation(
            this.rowKey,
            this.prevValue,
            this.currentCanvasObj!.getNewValue(),
            this.currentCanvasObj!.rowHeights,
            this.rowsManager,
            this.tilesManager,
            this.currentCanvasObj!
        );

        this.undoRedoManager.execute(rowResizeOperation);
        this.tilesManager.redrawRow(this.rowID!);
    }
}
