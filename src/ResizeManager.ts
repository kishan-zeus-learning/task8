import { ColumnsManager } from "./ColumnsManager.js";
import { RowsManager } from "./RowsManager.js";
import { TilesManager } from "./TilesManager.js";
import { BooleanObj } from "./types/BooleanObj.js";
import { UndoRedoManager } from "./UndoRedoManager/UndoRedoManager.js";
import { RowResizeHandler } from "./RowResizeHandler.js";
import { ColumnResizeHandler } from "./ColumnResizeHandler.js";

/**
 * Manages resizing behavior for rows and columns.
 */
export class ResizeManager {
    /** @type {RowsManager} Manages row operations and resizing */
    readonly rowsManager: RowsManager;

    /** @type {TilesManager} Manages tile operations and updates */
    readonly tilesManager: TilesManager;

    /** @type {ColumnsManager} Manages column operations and resizing */
    readonly columnsManager: ColumnsManager;

    /** @type {BooleanObj} Indicates if row resize mode is active */
    ifRowResizeOn: BooleanObj;

    /** @type {BooleanObj} Indicates if a row is currently being resized (pointer down) */
    ifRowResizePointerDown: BooleanObj;

    /** @type {BooleanObj} Indicates if column resize mode is active */
    ifColumnResizeOn: BooleanObj;

    /** @type {BooleanObj} Indicates if a column is currently being resized (pointer down) */
    ifColumnResizePointerDown: BooleanObj;

    /** @type {UndoRedoManager} Manages undo/redo operations */
    private undoRedoManager: UndoRedoManager;

    /** @type {RowResizeHandler} Handles row resizing logic */
    private rowResizeHandler: RowResizeHandler;

    /** @type {ColumnResizeHandler} Handles column resizing logic */
    private columnResizeHandler: ColumnResizeHandler;

    /**
     * Initializes the ResizeManager with references to all required managers and global flags.
     * 
     * @param {RowsManager} rowsManager - Manager handling row operations.
     * @param {TilesManager} tilesManager - Manager handling tile redraws.
     * @param {ColumnsManager} columnsManager - Manager handling column operations.
     * @param {BooleanObj} ifRowResizeOn - Flag indicating if row resize is active.
     * @param {BooleanObj} ifRowResizePointerDown - Flag indicating if row resize is in progress.
     * @param {BooleanObj} ifColumnResizeOn - Flag indicating if column resize is active.
     * @param {BooleanObj} ifColumnPointerDown - Flag indicating if column resize is in progress.
     * @param {UndoRedoManager} undoRedoManager - Manager for undo/redo operations.
     */
    constructor(
        rowsManager: RowsManager,
        tilesManager: TilesManager,
        columnsManager: ColumnsManager,
        ifRowResizeOn: BooleanObj,
        ifRowResizePointerDown: BooleanObj,
        ifColumnResizeOn: BooleanObj,
        ifColumnPointerDown: BooleanObj,
        undoRedoManager: UndoRedoManager
    ) {
        this.undoRedoManager = undoRedoManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.columnsManager = columnsManager;
        this.ifRowResizeOn = ifRowResizeOn;
        this.ifRowResizePointerDown = ifRowResizePointerDown;
        this.ifColumnResizeOn = ifColumnResizeOn;
        this.ifColumnResizePointerDown = ifColumnPointerDown;

        // Create specialized handlers for row and column resizing
        this.rowResizeHandler = new RowResizeHandler(
            rowsManager,
            tilesManager,
            ifRowResizeOn,
            ifRowResizePointerDown,
            undoRedoManager
        );

        this.columnResizeHandler = new ColumnResizeHandler(
            columnsManager,
            tilesManager,
            ifColumnResizeOn,
            ifColumnPointerDown,
            undoRedoManager
        );
    }

    /**
     * Handles logic on pointer up (mouse release), finalizing any resize actions.
     * 
     * @param {PointerEvent} event - The pointerup event.
     */
    pointerUpEventHandler(event: PointerEvent): void {
        document.body.style.cursor = "default";

        // Delegate to specialized handlers
        // this.rowResizeHandler.handlePointerUp();
        this.columnResizeHandler.handlePointerUp();
    }

    /**
     * Handles logic on pointer move (mouse drag), performing the resize if in progress.
     * 
     * @param {PointerEvent} event - The pointermove event.
     */
    pointerMove(event: PointerEvent): void {
        // Early return if no resize operations are active
        if (!this.rowResizeHandler.isResizing() && !this.columnResizeHandler.isResizing()) {
            return;
        }

        // Delegate to specialized handlers
        // this.rowResizeHandler.handlePointerMove(event);
        this.columnResizeHandler.handlePointerMove(event);
    }
}