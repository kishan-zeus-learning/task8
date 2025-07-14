import { ColumnsCanvas } from "../ColumnsCanvas.js";
import { ColumnsManager } from "../ColumnsManager.js";
import { TilesManager } from "../TilesManager.js";
import { ColumnResizingOperation } from "../UndoRedoManager/ColumnResizingOperation.js";
import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

/**
 * Handles pointer-based column resizing within the spreadsheet UI.
 * Uses canvas-based hit detection and applies column resizing through the Undo/Redo system.
 */
export class ColumnsResizeEventHandler extends PointerEventHandlerBase {
    /**
     * @private
     * The DOM container for all column header canvases.
     */
    private ColumnDiv: HTMLDivElement;

    /**
     * @private
     * Manager responsible for handling column-related rendering and logic.
     */
    private columnsManager: ColumnsManager;

    /**
     * @private
     * Manager for managing and redrawing spreadsheet tiles (cells).
     */
    private tilesManager: TilesManager;

    /**
     * @private
     * Undo/Redo manager used to store and execute resize operations.
     */
    private undoRedoManager: UndoRedoManager;

    /**
     * @private
     * Reference to the canvas currently being resized.
     */
    private currentCanvasObj: ColumnsCanvas | null;

    /**
     * @private
     * The column ID (canvas block) currently being interacted with.
     */
    private columnID: number | null;

    /**
     * @private
     * Index of the column within the canvas being resized.
     */
    private hoverIdx: number;

    /**
     * @private
     * Unique key identifying the resized column.
     */
    private columnKey: number;

    /**
     * @private
     * The width of the column before resizing began.
     */
    private prevValue: number;

    /**
     * @private
     * The width of the column after resizing.
     */
    private newValue: number;

    /**
     * Creates an instance of `ColumnsResizeEventHandler`.
     * @param columnsManager - Manages the column headers and dimensions.
     * @param tilesManager - Manages rendering of tiles (spreadsheet cells).
     * @param undoRedoManager - Manager for executing undoable operations.
     */
    constructor(
        columnsManager: ColumnsManager,
        tilesManager: TilesManager,
        undoRedoManager: UndoRedoManager
    ) {
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
    hitTest(event: PointerEvent): boolean {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement)) return false;
        if (!this.ColumnDiv.contains(currentElement)) return false;

        this.columnID = parseInt(currentElement.getAttribute("col") as string);
        this.currentCanvasObj = this.columnsManager.getCurrentColumnCanvas(this.columnID);

        if (!this.currentCanvasObj) return false;

        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetX = event.clientX - currentCanvasRect.left;

        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetX);

        return this.hoverIdx !== -1;
    }

    /**
     * Initiates the resize operation by capturing the initial state.
     * @param event - The pointer down event.
     */
    pointerDown(event: PointerEvent): void {
        this.ColumnDiv.style.cursor="ew-resize";
        document.body.style.cursor="ew-resize";
        this.columnKey = (this.columnID as number) * 25 + 1 + this.hoverIdx;
        this.prevValue = this.columnsManager.columnWidths.get(this.columnKey)?.width || 100;
        this.newValue = this.prevValue;
    }

    /**
     * Applies the new width to the column as the pointer moves.
     * @param event - The pointer move event.
     */
    pointerMove(event: PointerEvent): void {
        this.currentCanvasObj!.resizeColumn(event.clientX, this.hoverIdx, this.columnKey);
    }

    /**
     * Finalizes the resize operation and registers it with the undo/redo manager.
     * @param event - The pointer up event.
     */
    pointerUp(event: PointerEvent): void {
        document.body.style.cursor = "";
        this.ColumnDiv.style.cursor="";

        const columnResizeOperation = new ColumnResizingOperation(
            this.columnKey,
            this.prevValue,
            this.currentCanvasObj!.getNewValue(),
            this.currentCanvasObj!.columnWidths,
            this.columnsManager,
            this.tilesManager,
            this.currentCanvasObj!
        );

        this.undoRedoManager.execute(columnResizeOperation);
        this.tilesManager.redrawColumn(this.columnID!);
    }
}
