import { ColumnsManager } from "../Columns/ColumnsManager.js";
import { RowsCanvas } from "../Rows/RowsCanvas.js";
import { RowsManager } from "../Rows/RowsManager.js";
import { TilesManager } from "../Tiles/TilesManager.js";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

/**
 * Handles pointer events for row selection including dragging and auto-scrolling.
 */
export class RowSelectionEventHandler extends PointerEventHandlerBase {
    /** @type {HTMLDivElement} Container div for the row labels/headers */
    private RowDiv = document.getElementById("rowsColumn") as HTMLDivElement;

    /** @type {RowsManager} Manages the state and rendering of visible rows */
    private rowsManager: RowsManager;

    /** @type {ColumnsManager} Manages the state and rendering of visible columns */
    private columnsManager: ColumnsManager;

    /** @type {TilesManager} Manages the rendering and interaction of cell tiles */
    private tilesManager: TilesManager;

    /** @type {MultipleSelectionCoordinates} Tracks selection start and end positions */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @type {RowsCanvas | null} Currently interacted row canvas object */
    private currentCanvasObj: RowsCanvas | null;

    /** @type {number | null} ID of the row being selected or hovered */
    private rowID: number | null;

    /** @type {number} Index of the row currently being hovered over */
    private hoverIdx: number;

    /** @type {number} X-coordinate of the current pointer (used for auto-scroll) */
    private coordinateX: number = 0;

    /** @type {number} Y-coordinate of the current pointer (used for auto-scroll) */
    private coordinateY: number = 0;

    /** @type {boolean} Flag indicating whether selection is currently active */
    private ifSelectionOn: boolean = false;

    /** @type {number | null} RequestAnimationFrame ID for auto-scrolling */
    private scrollID: number | null = null;

    /** @readonly @type {number} Maximum distance for auto-scroll acceleration calculation */
    readonly maxDistance: number = 100;

    /** @readonly @type {number} Maximum auto-scroll speed in pixels per frame */
    readonly maxSpeed: number = 10;

    /** @type {HTMLDivElement} Reference to the main scrollable sheet container */
    private sheetDiv: HTMLDivElement = document.getElementById("sheet") as HTMLDivElement;


    /**
     * Initializes the RowSelectionEventHandler
     * @param {RowsManager} rowsManager - Manages the rows
     * @param {ColumnsManager} columnsManager - Manages the columns
     * @param {TilesManager} tilesManager - Manages the tiles
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Selection state tracker
     */
    constructor(
        rowsManager: RowsManager,
        columnsManager: ColumnsManager,
        tilesManager: TilesManager,
        selectionCoordinates: MultipleSelectionCoordinates
    ) {
        super();
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

        return this.hoverIdx === -1;
    }

    /**
     * Handles pointer down event to initiate row selection
     * @param {PointerEvent} event
     */
    pointerDown(event: PointerEvent): void {
        document.body.style.cursor = "url('./img/ArrowRight.png'), auto";

        const startRow = this.getRow(this.currentCanvasObj!.rowCanvas, event.clientX, event.clientY);
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
    pointerMove(event: PointerEvent): void {
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }

    /**
     * Handles pointer up event to stop selection
     * @param {PointerEvent} event
     */
    pointerUp(event: PointerEvent): void {
        this.ifSelectionOn = false;
        document.body.style.cursor = "";
    }

    /**
     * Triggers rerender on rows, columns, and tiles
     */
    private rerender() {
        this.rowsManager.rerender();
        this.columnsManager.rerender();
        this.tilesManager.rerender();
    }

    /**
     * Starts the auto-scrolling mechanism
     */
    private startAutoScroll() {
        if (this.scrollID !== null) return;
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    /**
     * Performs auto-scrolling based on cursor position
     */
    private autoScroll() {
        if (!this.ifSelectionOn) {
            this.scrollID = null;
            return;
        }

        const rect = this.sheetDiv.getBoundingClientRect();
        let dx = 0, dy = 0;

        if (this.coordinateY > rect.bottom - 30) {
            dy = this.calculateSpeed(this.coordinateY - rect.bottom + 30);
        } else if (this.coordinateY < rect.top) {
            dy = -this.calculateSpeed(rect.top - this.coordinateY);
        }

        if (this.coordinateX > rect.right - 30) {
            dx = this.calculateSpeed(this.coordinateX - rect.right + 30);
        } else if (this.coordinateX < rect.left + 50) {
            dx = -this.calculateSpeed(rect.left + 50 - this.coordinateX);
        }

        this.sheetDiv.scrollBy(dx, dy);

        const canvasX = this.rowsManager.defaultWidth / 2;
        const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
        const endRow = this.getRow(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX, canvasY);
        if (endRow) this.selectionCoordinates.selectionEndRow = endRow;

        this.rerender();
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    /**
     * Calculates scroll speed based on distance from edge
     * @param {number} distance
     * @returns {number} Scroll speed
     */
    private calculateSpeed(distance: number) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }

    /**
     * Determines the row based on canvas and pointer coordinates
     * @param {HTMLElement} canvas
     * @param {number} clientX
     * @param {number} clientY
     * @returns {number | null} Row number or null
     */
    private getRow(canvas: HTMLElement, clientX: number, clientY: number) {
        if (!canvas || canvas.tagName !== "CANVAS") return null;

        const rect = canvas.getBoundingClientRect();
        const offsetY = clientY - rect.top;
        const currentRow = parseInt(canvas.getAttribute('row') as string);
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
    private binarySearchUpperBound(arr: number[], target: number) {
        let start = 0, end = 24, ans = -1;
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            if (arr[mid] >= target) {
                ans = mid;
                end = mid - 1;
            } else {
                start = mid + 1;
            }
        }
        return ans === -1 ? 24 : ans;
    }
}
