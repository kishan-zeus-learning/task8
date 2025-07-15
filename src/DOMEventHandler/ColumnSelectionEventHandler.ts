import { ColumnsCanvas } from "../Columns/ColumnsCanvas";
import { ColumnsManager } from "../Columns/ColumnsManager";
import { RowsManager } from "../Rows/RowsManager";
import { TilesManager } from "../Tiles/TilesManager";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

/**
 * Handles mouse-based column selection including drag-selection and auto-scrolling.
 * Extends {@link PointerEventHandlerBase}.
 */
export class ColumnSelectionEventHandler extends PointerEventHandlerBase {
    /** @private */
    private ColumnDiv: HTMLDivElement = document.getElementById("columnsRow") as HTMLDivElement;

    /** @private */
    private sheetDiv: HTMLDivElement = document.getElementById("sheet") as HTMLDivElement;

    /** @private */
    private rowsManager: RowsManager;

    /** @private */
    private columnsManager: ColumnsManager;

    /** @private */
    private tilesManager: TilesManager;

    /** @private */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @private */
    private currentCanvasObj: ColumnsCanvas | null = null;

    /** @private */
    private columnID: number | null = null;

    /** 
     * The index of the column edge being hovered over (used for hit testing).
     * If `-1`, no resize region is under the pointer.
     * @private 
     */
    private hoverIdx: number = -1;

    /** @private */
    private coordinateX: number = 0;

    /** @private */
    private coordinateY: number = 0;

    /** 
     * Whether column selection is currently active.
     * @private 
     */
    private ifSelectionOn: boolean = false;

    /** 
     * ID of the active `requestAnimationFrame` loop for auto-scrolling.
     * Null when no auto-scroll is running.
     * @private 
     */
    private scrollID: number | null = null;

    /**
     * The maximum distance from the edge that triggers auto-scroll.
     * @readonly
     */
    readonly maxDistance: number = 100;

    /**
     * The maximum scroll speed in pixels per frame.
     * @readonly
     */
    readonly maxSpeed: number = 10;

    /**
     * Constructs a `ColumnSelectionEventHandler`.
     * @param rowsManager - Reference to the `RowsManager`.
     * @param columnsManager - Reference to the `ColumnsManager`.
     * @param tilesManager - Reference to the `TilesManager`.
     * @param selectionCoordinates - Shared object tracking selection boundaries.
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

        this.autoScroll = this.autoScroll.bind(this);
    }

    /**
     * Determines if this handler should activate for the current pointer event.
     * Returns `true` only if pointer is inside a column header but NOT on a resizable edge.
     */
    hitTest(event: PointerEvent): boolean {
        const currentElement = event.target;
        if (!(currentElement instanceof HTMLCanvasElement)) return false;
        if (!this.ColumnDiv.contains(currentElement)) return false;

        this.columnID = parseInt(currentElement.getAttribute("col") as string);
        this.currentCanvasObj = this.columnsManager.getCurrentColumnCanvas(this.columnID);

        if (!this.currentCanvasObj) return false;

        const offsetX = event.clientX - currentElement.getBoundingClientRect().left;
        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetX);

        return this.hoverIdx === -1;
    }

    /**
     * Begins column selection.
     */
    pointerDown(event: PointerEvent): void {
        document.body.style.cursor = "url('./img/ArrowDown.png'), auto";
        this.ifSelectionOn = true;

        const startColumn = this.getColumn(this.currentCanvasObj!.columnCanvas, event.clientX);
        if (!startColumn) return alert("Invalid column canvas element");

        this.selectionCoordinates.selectionStartColumn = startColumn;
        this.selectionCoordinates.selectionEndColumn = startColumn;
        this.selectionCoordinates.selectionStartRow = 1;
        this.selectionCoordinates.selectionEndRow = 1000000;

        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;

        this.rerender();
        this.startAutoScroll();
    }

    /**
     * Tracks pointer coordinates during active selection.
     */
    pointerMove(event: PointerEvent): void {
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }

    /**
     * Finalizes selection.
     */
    pointerUp(_event: PointerEvent): void {
        this.ifSelectionOn = false;
        document.body.style.cursor = "";
    }

    /**
     * Re-renders rows, columns, and tiles to reflect selection changes.
     * @private
     */
    private rerender(): void {
        this.rowsManager.rerender();
        this.columnsManager.rerender();
        this.tilesManager.rerender();
    }

    /**
     * Starts the auto-scroll loop if not already running.
     * @private
     */
    private startAutoScroll(): void {
        if (this.scrollID !== null) return;
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    /**
     * Auto-scrolls the viewport when pointer is near the edge of the sheet.
     * Also updates the selection range in real-time.
     * @private
     */
    private autoScroll(): void {
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

        const canvasX = Math.min(
            rect.right - 18,
            Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth)
        );
        const canvasY = 216 + this.columnsManager.defaultHeight / 2;

        const endColumn = this.getColumn(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX);
        if (endColumn) this.selectionCoordinates.selectionEndColumn = endColumn;

        this.rerender();
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    /**
     * Calculates scroll speed based on distance from the edge.
     * @private
     */
    private calculateSpeed(distance: number): number {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }

    /**
     * Gets the column index under a given X coordinate in a canvas element.
     * @private
     */
    private getColumn(canvas: HTMLElement, clientX: number): number | null {
        if (!canvas || canvas.tagName !== "CANVAS") return null;

        const rect = canvas.getBoundingClientRect();
        const offsetX = clientX - rect.left;

        const currentCol = parseInt(canvas.getAttribute("col") as string);
        const arrIdx = currentCol - this.columnsManager.visibleColumns[0].columnID;
        const colBlock = this.columnsManager.visibleColumns[arrIdx];

        return currentCol * 25 + this.binarySearchUpperBound(colBlock.columnsPositionArr, offsetX) + 1;
    }

    /**
     * Binary search helper to find the upper bound index for a position.
     * @private
     */
    private binarySearchUpperBound(arr: number[], target: number): number {
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
