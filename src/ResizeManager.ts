import { ColumnResizingOperation } from "./ColumnResizingOperation.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { RowResizingOperation } from "./RowResizingOperation.js";
import { RowsManager } from "./RowsManager.js";
import { TilesManager } from "./TilesManager.js";
import { BooleanObj } from "./types/BooleanObj.js";
import { UndoRedoManager } from "./UndoRedoManager.js";

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

    private undoRedoManager:UndoRedoManager;

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
     */
    constructor(
        rowsManager: RowsManager,
        tilesManager: TilesManager,
        columnsManager: ColumnsManager,
        ifRowResizeOn: BooleanObj,
        ifRowResizePointerDown: BooleanObj,
        ifColumnResizeOn: BooleanObj,
        ifColumnPointerDown: BooleanObj,
        undoRedoManager:UndoRedoManager
    ) {
        this.undoRedoManager=undoRedoManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.columnsManager = columnsManager;
        this.ifRowResizeOn = ifRowResizeOn;
        this.ifRowResizePointerDown = ifRowResizePointerDown;
        this.ifColumnResizeOn = ifColumnResizeOn;
        this.ifColumnResizePointerDown = ifColumnPointerDown;
    }

    /**
     * Handles logic on pointer up (mouse release), finalizing any resize actions.
     * 
     * @param {Event} event - The pointerup event.
     */
    pointerUpEventHandler(event: PointerEvent) {
        document.body.style.cursor = "default";

        // Hide row resize handles
        const rowCanvasDivs = document.querySelectorAll(".subRow") as NodeListOf<HTMLDivElement>;
        rowCanvasDivs.forEach(rowCanvasDiv => {
            const resizeDiv = rowCanvasDiv.lastElementChild as HTMLDivElement;
            resizeDiv.style.display = "none";
        });

        if (this.ifRowResizePointerDown.value) {
            const rowResizeOperation= new RowResizingOperation(
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

        // Hide column resize handles
        const columnCanvasDivs = document.querySelectorAll(".subColumn") as NodeListOf<HTMLDivElement>;
        columnCanvasDivs.forEach(columnCanvasDiv => {
            const resizeDiv = columnCanvasDiv.lastElementChild as HTMLDivElement;
            resizeDiv.style.display = "none";
        });

        if (this.ifColumnResizePointerDown.value) {

            const ColumnResizeOperationObject= new ColumnResizingOperation(
                this.columnsManager.currentResizingColumnCanvas.getColumnKey(),
                this.columnsManager.currentResizingColumnCanvas.getPrevValue(),
                this.columnsManager.currentResizingColumnCanvas.getNewValue(),
                this.columnsManager.currentResizingColumnCanvas.columnWidths,
                this.columnsManager,
                this.tilesManager,
                this.columnsManager.currentResizingColumnCanvas
            );

            this.undoRedoManager.execute(ColumnResizeOperationObject);
            
            this.tilesManager.redrawColumn(this.columnsManager.currentResizingColumnCanvas.columnID);
            this.ifColumnResizePointerDown.value = false;
        }
    }

    /**
     * Handles logic on pointer move (mouse drag), performing the resize if in progress.
     * 
     * @param {PointerEvent} event - The pointermove event.
     */
    pointerMove(event: PointerEvent) {

        if(!this.ifRowResizeOn.value && !this.ifRowResizePointerDown.value && !this.ifColumnResizeOn.value && !this.ifColumnResizePointerDown.value) return ;

        // Resize row if active
        if (this.ifRowResizePointerDown.value) {
            // console.log(event.clientY);
            this.rowsManager.currentResizingRowCanvas.resizeRow(event.clientY);
        }

        // Resize column if active
        if (this.ifColumnResizePointerDown.value) {
            this.columnsManager.currentResizingColumnCanvas.resizeColumn(event.clientX);
        }
    }
}