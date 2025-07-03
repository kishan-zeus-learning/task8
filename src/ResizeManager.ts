import { ColumnsManager } from "./ColumnsManager";
import { RowsManager } from "./RowsManager";
import { TilesManager } from "./TilesManager";
import { GlobalBoolean } from "./types/GlobalBoolean";

/**
 * Manages resizing behavior for rows and columns.
 */
export class ResizeManager {
    /** @type {RowsManager} Manages row operations and resizing */
    private rowsManager: RowsManager;

    /** @type {TilesManager} Manages tile operations and updates */
    private tilesManager: TilesManager;

    /** @type {ColumnsManager} Manages column operations and resizing */
    private columnsManager: ColumnsManager;

    /** @type {GlobalBoolean} Indicates if row resize mode is active */
    private ifRowResizeOn: GlobalBoolean;

    /** @type {GlobalBoolean} Indicates if a row is currently being resized (pointer down) */
    private ifRowResizePointerDown: GlobalBoolean;

    /** @type {GlobalBoolean} Indicates if column resize mode is active */
    private ifColumnResizeOn: GlobalBoolean;

    /** @type {GlobalBoolean} Indicates if a column is currently being resized (pointer down) */
    private ifColumnResizePointerDown: GlobalBoolean;

    /**
     * Initializes the ResizeManager with references to all required managers and global flags.
     * 
     * @param {RowsManager} rowsManager - Manager handling row operations.
     * @param {TilesManager} tilesManager - Manager handling tile redraws.
     * @param {ColumnsManager} columnsManager - Manager handling column operations.
     * @param {GlobalBoolean} ifRowResizeOn - Flag indicating if row resize is active.
     * @param {GlobalBoolean} ifRowResizePointerDown - Flag indicating if row resize is in progress.
     * @param {GlobalBoolean} ifColumnResizeOn - Flag indicating if column resize is active.
     * @param {GlobalBoolean} ifColumnPointerDown - Flag indicating if column resize is in progress.
     */
    constructor(
        rowsManager: RowsManager,
        tilesManager: TilesManager,
        columnsManager: ColumnsManager,
        ifRowResizeOn: GlobalBoolean,
        ifRowResizePointerDown: GlobalBoolean,
        ifColumnResizeOn: GlobalBoolean,
        ifColumnPointerDown: GlobalBoolean
    ) {
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
        // console.log("i don't know why i am getting triggered");
        // Set cursor based on resize state
        // console.log(this.ifRowResizeOn,this.ifRowResizePointerDown);
        if (this.ifRowResizeOn.value || this.ifRowResizePointerDown.value) {
            document.body.style.cursor = "ns-resize";
        } else if (this.ifColumnResizeOn.value || this.ifColumnResizePointerDown.value) {
            document.body.style.cursor = "ew-resize";
        } else {
            document.body.style.cursor = "default";
            return ;
        }

        // Resize row if active
        if (this.ifRowResizePointerDown.value) {
            console.log(event.clientY);
            this.rowsManager.currentResizingRowCanvas.resizeRow(event.clientY);
        }

        // Resize column if active
        if (this.ifColumnResizePointerDown.value) {
            this.columnsManager.currentResizingColumnCanvas.resizeColumn(event.clientX);
        }
    }
}
