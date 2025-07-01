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
     * @param {GlobalBoolean} ifRowResizeOn - Flag indicating if row resize is active.
     * @param {GlobalBoolean} ifRowResizePointerDown - Flag indicating if row resize is in progress.
     * @param {GlobalBoolean} ifColumnResizeOn - Flag indicating if column resize is active.
     * @param {GlobalBoolean} ifColumnPointerDown - Flag indicating if column resize is in progress.
     */
    constructor(rowsManager, tilesManager, columnsManager, ifRowResizeOn, ifRowResizePointerDown, ifColumnResizeOn, ifColumnPointerDown) {
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
    pointerUpEventHandler(event) {
        document.body.style.cursor = "default";
        // Hide row resize handles
        const rowCanvasDivs = document.querySelectorAll(".subRow");
        rowCanvasDivs.forEach(rowCanvasDiv => {
            const resizeDiv = rowCanvasDiv.lastElementChild;
            resizeDiv.style.display = "none";
        });
        if (this.ifRowResizePointerDown.value) {
            this.tilesManager.redrawRow(this.rowsManager.currentResizingRowCanvas.rowID);
            this.ifRowResizePointerDown.value = false;
        }
        // Hide column resize handles
        const columnCanvasDivs = document.querySelectorAll(".subColumn");
        columnCanvasDivs.forEach(columnCanvasDiv => {
            const resizeDiv = columnCanvasDiv.lastElementChild;
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
    pointerMove(event) {
        // Set cursor based on resize state
        if (this.ifRowResizeOn.value || this.ifRowResizePointerDown.value) {
            document.body.style.cursor = "ns-resize";
        }
        else if (this.ifColumnResizeOn.value || this.ifColumnResizePointerDown.value) {
            document.body.style.cursor = "ew-resize";
        }
        else {
            document.body.style.cursor = "default";
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
