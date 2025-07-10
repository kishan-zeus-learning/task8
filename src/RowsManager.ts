import { RowData } from "./types/RowsColumn.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { BooleanObj } from "./types/BooleanObj.js";
import { NumberObj } from "./types/NumberObj.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";
import { UndoRedoManager } from "./UndoRedoManager.js";

/**
 * Manages a scrolling set of visible row canvases, enabling efficient rendering
 * and resizing behavior for a large number of rows by dynamically mounting and unmounting row blocks.
 */
export class RowsManager {
    /** @type {RowData} Map of row indices to custom row height values */
    private rowHeights: RowData;

    /** @type {number} The index of the first visible row block */
    private startRowIdx: number;

    /** @type {number} Number of row blocks currently visible */
    private visibleRowCnt: number;

    /** @type {number[][]} Stores the prefix sum arrays for row positions in each visible block */
    readonly rowsPositionPrefixSumArr: number[][];

    /** @type {RowsCanvas[]} Array of currently visible RowsCanvas instances */
    readonly visibleRows: RowsCanvas[];

    /** @type {NumberObj} Global shared variable representing vertical scroll offset in pixels */
    readonly marginTop: NumberObj;

    /** @type {HTMLDivElement[]} DOM references to currently visible row block divs */
    private rowsDivArr: HTMLDivElement[];

    /** @type {HTMLDivElement} Container element that holds all the visible row divs */
    readonly rowsDivContainer: HTMLDivElement;

    /** @type {number} Default height for a single row */
    readonly defaultHeight: number;

    /** @type {number} Default width for a single row */
    readonly defaultWidth: number;

    /** @type {number} Maximum row canvas blocks (hard limit for scrolling) */
    private rowCanvasLimit: number;

    /** @type {BooleanObj} Shared boolean flag for showing resize indicator line */
    private _ifResizeOn: BooleanObj;

    /** @type {BooleanObj} Shared boolean flag to track if pointer is down during resize */
    private _ifResizePointerDown: BooleanObj;

    /** @type {NumberObj} Currently active resizing row block index */
    private currentResizingRow: NumberObj;

    /** @type {MultipleSelectionCoordinates} Shared selection coordinates for row highlighting */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @type {UndoRedoManager} Instance of UndoRedoManager for managing undo/redo operations */
    private undoRedoManager: UndoRedoManager;

    /**
     * Initializes a scrollable manager for row canvas blocks
     * @param {RowData} rowHeights - Map of row custom heights.
     * @param {number} startRowIdx - Initial starting row block index.
     * @param {number} visibleRowCnt - Number of row blocks to render at once.
     * @param {BooleanObj} ifResizeOn - Shared boolean controlling resize line visibility.
     * @param {BooleanObj} ifResizePointerDown - Shared boolean indicating pointer press during resize.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object containing selection range coordinates.
     * @param {UndoRedoManager} undoRedoManager - Instance of the UndoRedoManager.
     * @param {number} [rowCanvasLimit=40000] - Maximum number of row blocks.
     * @param {number} [defaultHeight=25] - Default row height (pixels).
     * @param {number} [defaultWidth=50] - Default row width (pixels).
     * @param {NumberObj} [marginTop={ value: 0 }] - Global object for managing vertical scroll offset.
     */
    constructor(
        rowHeights: RowData,
        startRowIdx: number,
        visibleRowCnt: number,
        ifResizeOn: BooleanObj,
        ifResizePointerDown: BooleanObj,
        selectionCoordinates: MultipleSelectionCoordinates,
        undoRedoManager: UndoRedoManager,
        rowCanvasLimit: number = 40000,
        defaultHeight: number = 25,
        defaultWidth: number = 50,
        marginTop: NumberObj = { value: 0 }
    ) {
        this.rowHeights = rowHeights;
        this.undoRedoManager = undoRedoManager;
        this._ifResizeOn = ifResizeOn;
        this.currentResizingRow = { value: -1 }; // Initialize with a default invalid value
        this._ifResizePointerDown = ifResizePointerDown;
        this.startRowIdx = startRowIdx;
        this.rowCanvasLimit = rowCanvasLimit;
        this.visibleRowCnt = visibleRowCnt;
        this.selectionCoordinates = selectionCoordinates;
        this.rowsPositionPrefixSumArr = []; // Initialize empty array for prefix sums
        this.rowsDivArr = []; // Initialize empty array for row div elements
        this.visibleRows = []; // Initialize empty array for visible RowsCanvas instances
        this.marginTop = marginTop;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        // Get the DOM element for the rows container
        this.rowsDivContainer = document.getElementById("rowsColumn") as HTMLDivElement;
        this.initialLoad(); // Perform initial loading of row canvases
    }

    /**
     * Returns the RowsCanvas currently being resized.
     * This getter determines which of the visible row canvases is being interacted with for resizing.
     * @returns {RowsCanvas} The RowsCanvas instance currently being resized.
     */
    get currentResizingRowCanvas(): RowsCanvas {
        let idx = 0;
        // Calculate the index within the visibleRows array based on the currentResizingRow value
        if (this.currentResizingRow.value === -1) {
            // alert("something went wrong"); // Consider using a more robust error handling mechanism
        } else {
            idx = this.currentResizingRow.value - this.visibleRows[0].rowID;
        }
        return this.visibleRows[idx];
    }

    /**
     * Scrolls row view down by one block and mounts a new row at the bottom.
     * @returns {boolean} True if scrolling occurred, false if at the bottommost limit.
     */
    scrollDown(): boolean {
        // Check if already at the bottommost scroll limit
        if (this.startRowIdx === (this.rowCanvasLimit - 1 - this.visibleRowCnt)) return false;
        this.unmountRowTop(); // Remove the topmost row canvas from DOM and array
        this.startRowIdx++; // Increment the starting row index
        this.mountRowBottom(); // Add a new row canvas to the bottom
        return true;
    }

    /**
     * Scrolls row view up by one block and mounts a new row at the top.
     * @returns {boolean} True if scrolling occurred, false if at the topmost limit.
     */
    scrollUp(): boolean {
        // Check if already at the topmost scroll limit
        if (this.startRowIdx === 0) return false;
        this.unmountRowBottom(); // Remove the bottommost row canvas from DOM and array
        this.startRowIdx--; // Decrement the starting row index
        this.mountRowTop(); // Add a new row canvas to the top
        return true;
    }

    /**
     * Loads all visible row canvases on initial render.
     * This method is called once during the constructor.
     */
    private initialLoad(): void {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = i + this.startRowIdx; // Calculate the global row group index
            // Create a new RowsCanvas instance
            const canvas = new RowsCanvas(
                rowIdx,
                this.rowHeights,
                this.defaultWidth,
                this.defaultHeight,
                this._ifResizeOn,
                this._ifResizePointerDown,
                this.currentResizingRow,
                this.selectionCoordinates,
            );

            this.visibleRows.push(canvas); // Add to the array of visible canvases
            this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr); // Store its prefix sum array
            this.rowsDivArr.push(canvas.rowCanvasDiv); // Store its div element
            this.rowsDivContainer.appendChild(canvas.rowCanvasDiv); // Append to the DOM container
        }
    }

    /**
     * Adds a new row block to the bottom of the view.
     * This is typically called during vertical scrolling down.
     */
    private mountRowBottom(): void {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1; // Calculate the index for the new row group

        // Create a new RowsCanvas instance for the new row group
        const canvas = new RowsCanvas(
            rowIdx,
            this.rowHeights,
            this.defaultWidth,
            this.defaultHeight,
            this._ifResizeOn,
            this._ifResizePointerDown,
            this.currentResizingRow,
            this.selectionCoordinates,
        );

        this.visibleRows.push(canvas); // Add to the end of the visible canvases array
        this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr); // Add its prefix sum array
        this.rowsDivArr.push(canvas.rowCanvasDiv); // Add its div element
        this.rowsDivContainer.appendChild(canvas.rowCanvasDiv); // Append to the DOM container
    }

    /**
     * Adds a new row block to the top of the view.
     * This is typically called during vertical scrolling up.
     */
    private mountRowTop(): void {
        const rowIdx = this.startRowIdx; // The index for the new row group

        // Create a new RowsCanvas instance for the new row group
        const canvas = new RowsCanvas(
            rowIdx,
            this.rowHeights,
            this.defaultWidth,
            this.defaultHeight,
            this._ifResizeOn,
            this._ifResizePointerDown,
            this.currentResizingRow,
            this.selectionCoordinates,
        );

        this.visibleRows.unshift(canvas); // Add to the beginning of the visible canvases array
        this.rowsPositionPrefixSumArr.unshift(canvas.rowsPositionArr); // Add its prefix sum array to the beginning
        this.rowsDivArr.unshift(canvas.rowCanvasDiv); // Add its div element to the beginning
        this.rowsDivContainer.prepend(canvas.rowCanvasDiv); // Prepend to the DOM container

        // Adjust the top margin to maintain visual continuity during top scroll
        this.marginTop.value -= this.rowsPositionPrefixSumArr[0][24]; // Subtract the total height of the newly added canvas
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`; // Apply the new margin
    }

    /**
     * Removes the topmost row block from the view.
     * This is typically called during vertical scrolling down.
     */
    private unmountRowTop(): void {
        // Add the height of the unmounted canvas to the top margin to simulate scrolling
        this.marginTop.value += this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`; // Apply the new margin

        this.rowsDivContainer.removeChild(this.rowsDivArr[0]); // Remove the first child (topmost canvas) from the DOM
        this.rowsDivArr.shift(); // Remove from the array of row div elements
        this.rowsPositionPrefixSumArr.shift(); // Remove its prefix sum array
        this.visibleRows.shift(); // Remove from the array of visible canvases
    }

    /**
     * Removes the bottommost row block from the view.
     * This is typically called during vertical scrolling up.
     */
    private unmountRowBottom(): void {
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]); // Remove the last child (bottommost canvas) from the DOM
        this.rowsDivArr.pop(); // Remove from the array of row div elements
        this.rowsPositionPrefixSumArr.pop(); // Remove its prefix sum array
        this.visibleRows.pop(); // Remove from the array of visible canvases
    }

    /**
     * Redraws all currently visible rows.
     * This is called when the display needs to be updated, e.g., after selection changes or resizing.
     */
    rerender(): void {
        for (let row of this.visibleRows) {
            row.drawCanvas(); // Call drawCanvas method on each visible RowsCanvas instance
        }
    }
}