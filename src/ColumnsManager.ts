import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { ColumnData } from "./types/ColumnRows.js";
import { BooleanObj } from "./types/BooleanObj.js";
import { NumberObj } from "./types/NumberObj.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";

/**
 * Manages the creation, rendering, and scrolling of column canvases.
 * Handles dynamic mounting and unmounting of ColumnsCanvas blocks for performance.
 */
export class ColumnsManager {
    /** @type {ColumnData} Map that stores custom column widths keyed by column index */
    columnWidths: ColumnData;

    /** @type {number} Index of the first visible column group (each group = 25 columns) */
    private startColumnIdx: number;

    /** @type {number} Number of column groups visible at any time */
    private visibleColumnCnt: number;

    /** @type {number[][]} Prefix sum arrays storing x-positions of each column in visible groups */
    readonly visibleColumnsPrefixSum: number[][];

    /** @type {ColumnsCanvas[]} Array of visible ColumnsCanvas instances */
    readonly visibleColumns: ColumnsCanvas[];

    /** @type {NumberObj} Shared global number used to track the left margin of the columns container */
    readonly marginLeft: NumberObj;

    /** @type {HTMLDivElement} HTML container where column canvas divs are mounted */
    readonly columnsDivContainer: HTMLDivElement;

    /** @type {number} Default height for each column header */
    readonly defaultHeight: number;

    /** @type {number} Default width for each column */
    readonly defaultWidth: number;

    /** @type {number} Max number of ColumnsCanvas groups allowed (used for scroll bounds) */
    private columnCanvasLimit: number;

    /** @type {BooleanObj} Global flag used to show/hide the resize line on hover */
    private _ifResizeOn: BooleanObj;

    /** @type {BooleanObj} Global flag indicating if pointer is down during a resize operation */
    private _ifResizePointerDown: BooleanObj;

    /** @type {NumberObj} Global number tracking the currently resizing column group index */
    private currentResizingColumn: NumberObj;

    /** @type {MultipleSelectionCoordinates} Shared selection coordinates for column highlighting */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /**
     * Creates an instance of ColumnsManager.
     * @param {ColumnData} columnWidths - Map that stores custom column widths keyed by column index.
     * @param {number} startColumnIdx - Initial index of the first visible column group.
     * @param {number} visibleColumnCnt - Number of column groups visible initially.
     * @param {BooleanObj} ifResizeOn - Boolean object to control resize hover state.
     * @param {BooleanObj} ifResizePointerDown - Boolean object to control resize pointer down state.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object containing selection range coordinates.
     * @param {number} [columnCanvasLimit=40] - Maximum number of column canvas groups.
     * @param {number} [defaultHeight=25] - Default height for column headers.
     * @param {number} [defaultWidth=100] - Default width for columns.
     * @param {NumberObj} [marginLeft={ value: 0 }] - Initial left margin for the columns container.
     */
    constructor(
        columnWidths: ColumnData,
        startColumnIdx: number,
        visibleColumnCnt: number,
        ifResizeOn: BooleanObj,
        ifResizePointerDown: BooleanObj,
        selectionCoordinates: MultipleSelectionCoordinates,
        columnCanvasLimit: number = 40,
        defaultHeight: number = 25,
        defaultWidth: number = 100,
        marginLeft: NumberObj = { value: 0 }
    ) {
        this.columnWidths = columnWidths;
        this._ifResizeOn = ifResizeOn;
        this.currentResizingColumn = { value: -1 }; // Initialize with a default invalid value
        this._ifResizePointerDown = ifResizePointerDown;
        this.startColumnIdx = startColumnIdx;
        this.columnCanvasLimit = columnCanvasLimit;
        this.visibleColumnCnt = visibleColumnCnt;
        this.visibleColumnsPrefixSum = []; // Initialize empty array for prefix sums
        this.visibleColumns = []; // Initialize empty array for visible ColumnCanvas instances
        this.marginLeft = marginLeft;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.selectionCoordinates = selectionCoordinates;
        // Get the DOM element for the columns container
        this.columnsDivContainer = document.getElementById("columnsRow") as HTMLDivElement;
        this.initialLoad(); // Perform initial loading of column canvases
    }

    /**
     * Returns the ColumnsCanvas instance for the currently resizing column group.
     * This getter determines which of the visible column canvases is being interacted with for resizing.
     * @returns {ColumnsCanvas} The ColumnsCanvas instance currently being resized.
     */
    get currentResizingColumnCanvas(): ColumnsCanvas {
        let idx = 0;
        // Calculate the index within the visibleColumns array based on the currentResizingColumn value
        if (this.currentResizingColumn.value !== -1) {
            idx = this.currentResizingColumn.value - this.visibleColumns[0].columnID;
        }
        return this.visibleColumns[idx];
    }

    /**
     * Scrolls the columns display to the right by unmounting the leftmost column group
     * and mounting a new column group on the right.
     * @returns {boolean} True if scrolling occurred, false if at the rightmost limit.
     */
    scrollRight(): boolean {
        // Check if already at the rightmost scroll limit
        if (this.startColumnIdx === (this.columnCanvasLimit - 1 - this.visibleColumnCnt)) return false;
        this.unmountColumnLeft(); // Remove the leftmost column canvas from DOM and array
        this.startColumnIdx++; // Increment the starting column index
        this.mountColumnRight(); // Add a new column canvas to the right
        return true;
    }

    /**
     * Scrolls the columns display to the left by unmounting the rightmost column group
     * and mounting a new column group on the left.
     * @returns {boolean} True if scrolling occurred, false if at the leftmost limit.
     */
    scrollLeft(): boolean {
        // Check if already at the leftmost scroll limit
        if (this.startColumnIdx === 0) return false;
        this.unmountColumnRight(); // Remove the rightmost column canvas from DOM and array
        this.startColumnIdx--; // Decrement the starting column index
        this.mountColumnLeft(); // Add a new column canvas to the left
        return true;
    }

    /**
     * Performs the initial loading and rendering of visible column canvas groups.
     * This method is called once during the constructor.
     */
    private initialLoad(): void {
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = j + this.startColumnIdx; // Calculate the global column group index
            // Create a new ColumnsCanvas instance
            const canvas = new ColumnsCanvas(
                colIdx,
                this.columnWidths,
                this.defaultWidth,
                this.defaultHeight,
                this._ifResizeOn,
                this._ifResizePointerDown,
                this.currentResizingColumn,
                this.selectionCoordinates
            );
            this.visibleColumns.push(canvas); // Add to the array of visible canvases
            this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr); // Store its prefix sum array
            this.columnsDivContainer.appendChild(canvas.columnCanvasDiv); // Append to the DOM container
        }
    }

    /**
     * Mounts a new ColumnsCanvas instance to the right of the currently visible columns.
     * This is typically called during horizontal scrolling to the right.
     */
    private mountColumnRight(): void {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1; // Calculate the index for the new column group
        // Create a new ColumnsCanvas instance for the new column group
        const canvas = new ColumnsCanvas(
            colIdx,
            this.columnWidths,
            this.defaultWidth,
            this.defaultHeight,
            this._ifResizeOn,
            this._ifResizePointerDown,
            this.currentResizingColumn,
            this.selectionCoordinates
        );
        this.visibleColumns.push(canvas); // Add to the end of the visible canvases array
        this.columnsDivContainer.appendChild(canvas.columnCanvasDiv); // Append to the DOM container
        this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr); // Add its prefix sum array
    }

    /**
     * Mounts a new ColumnsCanvas instance to the left of the currently visible columns.
     * This is typically called during horizontal scrolling to the left.
     */
    private mountColumnLeft(): void {
        const columnIdx = this.startColumnIdx; // The index for the new column group
        // Create a new ColumnsCanvas instance for the new column group
        const canvas = new ColumnsCanvas(
            columnIdx,
            this.columnWidths,
            this.defaultWidth,
            this.defaultHeight,
            this._ifResizeOn,
            this._ifResizePointerDown,
            this.currentResizingColumn,
            this.selectionCoordinates
        );
        this.visibleColumns.unshift(canvas); // Add to the beginning of the visible canvases array
        this.columnsDivContainer.prepend(canvas.columnCanvasDiv); // Prepend to the DOM container
        this.visibleColumnsPrefixSum.unshift(canvas.columnsPositionArr); // Add its prefix sum array to the beginning

        // Adjust the left margin to maintain visual continuity during left scroll
        this.marginLeft.value -= canvas.columnsPositionArr[24]; // Subtract the total width of the newly added canvas
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`; // Apply the new margin
    }

    /**
     * Unmounts (removes) the leftmost ColumnsCanvas instance from the display.
     * This is typically called during horizontal scrolling to the right.
     */
    private unmountColumnLeft(): void {
        // Add the width of the unmounted canvas to the left margin to simulate scrolling
        this.marginLeft.value += this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`; // Apply the new margin
        // Remove the first child (leftmost canvas) from the DOM
        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvasDiv);
        this.visibleColumns.shift(); // Remove from the array of visible canvases
        this.visibleColumnsPrefixSum.shift(); // Remove its prefix sum array
    }

    /**
     * Unmounts (removes) the rightmost ColumnsCanvas instance from the display.
     * This is typically called during horizontal scrolling to the left.
     */
    private unmountColumnRight(): void {
        const canvas = this.visibleColumns.pop(); // Remove the last canvas from the array
        if (canvas) {
            this.columnsDivContainer.removeChild(canvas.columnCanvasDiv); // Remove from the DOM
            this.visibleColumnsPrefixSum.pop(); // Remove its prefix sum array
        }
    }

    /**
     * Redraws all currently visible columns.
     * This is called when the display needs to be updated, e.g., after selection changes or resizing.
     */
    rerender(): void {
        for (let column of this.visibleColumns) {
            column.drawCanvas(); // Call drawCanvas method on each visible ColumnsCanvas instance
        }
    }

    getCurrentColumnCanvas(columnID:number):ColumnsCanvas|null{

        const arrIdx=columnID - this.visibleColumns[0].columnID;

        if(arrIdx>=0 && arrIdx<this.visibleColumns.length) return this.visibleColumns[arrIdx];

        alert("something went wrong inside columns manager");
        return null;
    }
}