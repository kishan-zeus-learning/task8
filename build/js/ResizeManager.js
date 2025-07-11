import { RowResizeHandler } from "./RowResizeHandler.js";
import { ColumnResizeHandler } from "./ColumnResizeHandler.js";
/**
 * Manages resizing behavior for rows and columns.
 */
export class ResizeManager {
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
    constructor(rowsManager, tilesManager, columnsManager, ifRowResizeOn, ifRowResizePointerDown, ifColumnResizeOn, ifColumnPointerDown, undoRedoManager) {
        this.undoRedoManager = undoRedoManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.columnsManager = columnsManager;
        this.ifRowResizeOn = ifRowResizeOn;
        this.ifRowResizePointerDown = ifRowResizePointerDown;
        this.ifColumnResizeOn = ifColumnResizeOn;
        this.ifColumnResizePointerDown = ifColumnPointerDown;
        // Create specialized handlers for row and column resizing
        this.rowResizeHandler = new RowResizeHandler(rowsManager, tilesManager, ifRowResizeOn, ifRowResizePointerDown, undoRedoManager);
        this.columnResizeHandler = new ColumnResizeHandler(columnsManager, tilesManager, ifColumnResizeOn, ifColumnPointerDown, undoRedoManager);
    }
    /**
     * Handles logic on pointer up (mouse release), finalizing any resize actions.
     *
     * @param {PointerEvent} event - The pointerup event.
     */
    pointerUpEventHandler(event) {
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
    pointerMove(event) {
        // Early return if no resize operations are active
        if (!this.rowResizeHandler.isResizing() && !this.columnResizeHandler.isResizing()) {
            return;
        }
        // Delegate to specialized handlers
        // this.rowResizeHandler.handlePointerMove(event);
        this.columnResizeHandler.handlePointerMove(event);
    }
}
