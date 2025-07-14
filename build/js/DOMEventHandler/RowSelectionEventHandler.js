import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
/**
 * Handles pointer events for row selection including dragging and auto-scrolling.
 */
export class RowSelectionEventHandler extends PointerEventHandlerBase {
    /**
     * Initializes the RowSelectionEventHandler
     * @param {RowsManager} rowsManager - Manages the rows
     * @param {ColumnsManager} columnsManager - Manages the columns
     * @param {TilesManager} tilesManager - Manages the tiles
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Selection state tracker
     */
    constructor(rowsManager, columnsManager, tilesManager, selectionCoordinates) {
        super();
        /** @type {HTMLDivElement} Container div for the row labels/headers */
        this.RowDiv = document.getElementById("rowsColumn");
        /** @type {number} X-coordinate of the current pointer (used for auto-scroll) */
        this.coordinateX = 0;
        /** @type {number} Y-coordinate of the current pointer (used for auto-scroll) */
        this.coordinateY = 0;
        /** @type {boolean} Flag indicating whether selection is currently active */
        this.ifSelectionOn = false;
        /** @type {number | null} RequestAnimationFrame ID for auto-scrolling */
        this.scrollID = null;
        /** @readonly @type {number} Maximum distance for auto-scroll acceleration calculation */
        this.maxDistance = 100;
        /** @readonly @type {number} Maximum auto-scroll speed in pixels per frame */
        this.maxSpeed = 10;
        /** @type {HTMLDivElement} Reference to the main scrollable sheet container */
        this.sheetDiv = document.getElementById("sheet");
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.selectionCoordinates = selectionCoordinates;
        this.currentCanvasObj = null;
        this.rowID = null;
        this.hoverIdx = -1;
        this.autoScroll = this.autoScroll.bind(this);
    }
    /**
     * Checks if a pointer event occurred inside a valid row canvas
     * @param {PointerEvent} event - The pointer event
     * @returns {boolean} True if the event hit a valid target
     */
    hitTest(event) {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement))
            return false;
        if (!this.RowDiv.contains(currentElement))
            return false;
        this.rowID = parseInt(currentElement.getAttribute("row"));
        this.currentCanvasObj = this.rowsManager.getCurrentRowCanvas(this.rowID);
        if (!this.currentCanvasObj)
            return false;
        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetY = event.clientY - currentCanvasRect.top;
        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetY);
        return this.hoverIdx === -1;
    }
    /**
     * Handles pointer down event to initiate row selection
     * @param {PointerEvent} event
     */
    pointerDown(event) {
        document.body.style.cursor = "url('./img/ArrowRight.png'), auto";
        const startRow = this.getRow(this.currentCanvasObj.rowCanvas, event.clientX, event.clientY);
        if (!startRow) {
            alert("Not a valid canvas element in row pointer down");
            return;
        }
        this.selectionCoordinates.selectionStartRow = startRow;
        this.selectionCoordinates.selectionEndRow = startRow;
        this.selectionCoordinates.selectionStartColumn = 1;
        this.selectionCoordinates.selectionEndColumn = 1000;
        this.ifSelectionOn = true;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
        this.rerender();
        this.startAutoScroll();
    }
    /**
     * Handles pointer move event to track mouse movement
     * @param {PointerEvent} event
     */
    pointerMove(event) {
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }
    /**
     * Handles pointer up event to stop selection
     * @param {PointerEvent} event
     */
    pointerUp(event) {
        this.ifSelectionOn = false;
        document.body.style.cursor = "";
    }
    /**
     * Triggers rerender on rows, columns, and tiles
     */
    rerender() {
        this.rowsManager.rerender();
        this.columnsManager.rerender();
        this.tilesManager.rerender();
    }
    /**
     * Starts the auto-scrolling mechanism
     */
    startAutoScroll() {
        if (this.scrollID !== null)
            return;
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }
    /**
     * Performs auto-scrolling based on cursor position
     */
    autoScroll() {
        if (!this.ifSelectionOn) {
            this.scrollID = null;
            return;
        }
        const rect = this.sheetDiv.getBoundingClientRect();
        let dx = 0, dy = 0;
        if (this.coordinateY > rect.bottom - 30) {
            dy = this.calculateSpeed(this.coordinateY - rect.bottom + 30);
        }
        else if (this.coordinateY < rect.top) {
            dy = -this.calculateSpeed(rect.top - this.coordinateY);
        }
        if (this.coordinateX > rect.right - 30) {
            dx = this.calculateSpeed(this.coordinateX - rect.right + 30);
        }
        else if (this.coordinateX < rect.left + 50) {
            dx = -this.calculateSpeed(rect.left + 50 - this.coordinateX);
        }
        this.sheetDiv.scrollBy(dx, dy);
        const canvasX = this.rowsManager.defaultWidth / 2;
        const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
        const endRow = this.getRow(document.elementFromPoint(canvasX, canvasY), canvasX, canvasY);
        if (endRow)
            this.selectionCoordinates.selectionEndRow = endRow;
        this.rerender();
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }
    /**
     * Calculates scroll speed based on distance from edge
     * @param {number} distance
     * @returns {number} Scroll speed
     */
    calculateSpeed(distance) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }
    /**
     * Determines the row based on canvas and pointer coordinates
     * @param {HTMLElement} canvas
     * @param {number} clientX
     * @param {number} clientY
     * @returns {number | null} Row number or null
     */
    getRow(canvas, clientX, clientY) {
        if (!canvas || canvas.tagName !== "CANVAS")
            return null;
        const rect = canvas.getBoundingClientRect();
        const offsetY = clientY - rect.top;
        const currentRow = parseInt(canvas.getAttribute('row'));
        const arrIdx = currentRow - this.rowsManager.visibleRows[0].rowID;
        const rowBlock = this.rowsManager.visibleRows[arrIdx];
        return currentRow * 25 + this.binarySearchUpperBound(rowBlock.rowsPositionArr, offsetY) + 1;
    }
    /**
     * Returns upper bound index from a sorted array using binary search
     * @param {number[]} arr
     * @param {number} target
     * @returns {number} Index
     */
    binarySearchUpperBound(arr, target) {
        let start = 0, end = 24, ans = -1;
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            if (arr[mid] >= target) {
                ans = mid;
                end = mid - 1;
            }
            else {
                start = mid + 1;
            }
        }
        return ans === -1 ? 24 : ans;
    }
}
