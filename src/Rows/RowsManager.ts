import { RowData } from "../types/RowsColumn.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates.js";

/**
 * Manages a scrolling set of visible row canvases, enabling efficient rendering
 * and resizing behavior for a large number of rows by dynamically mounting and unmounting row blocks.
 */
export class RowsManager {
    /** @type {RowData} Map of row indices to custom row height values */
    readonly rowHeights: RowData;

    /** @type {number} The index of the first visible row block */
    private startRowIdx: number;

    /** @type {number} Number of row blocks currently visible */
    readonly visibleRowCnt: number;

    /** @type {number[][]} Stores the prefix sum arrays for row positions in each visible block */
    readonly rowsPositionPrefixSumArr: number[][];

    /** @type {RowsCanvas[]} Array of currently visible RowsCanvas instances */
    readonly visibleRows: RowsCanvas[];

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

    /** @type {MultipleSelectionCoordinates} Shared selection coordinates for row highlighting */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @type {number} The current total scroll height of the visible rows in pixels. */
    private scrollHeight: number;

    /** @type {number} The starting top pixel position of the first visible row block. */
    private scrollHeightStart: number;

    /**
     * Initializes a scrollable manager for row canvas blocks.
     * @param {RowData} rowHeights - Map of row custom heights.
     * @param {number} startRowIdx - Initial starting row block index.
     * @param {number} visibleRowCnt - Number of row blocks to render at once.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object containing selection range coordinates.
     * @param {number} [rowCanvasLimit=40000] - Maximum number of row blocks.
     * @param {number} [defaultHeight=25] - Default row height (pixels).
     * @param {number} [defaultWidth=50] - Default row width (pixels).
     */
    constructor(
        rowHeights: RowData,
        startRowIdx: number,
        visibleRowCnt: number,
        selectionCoordinates: MultipleSelectionCoordinates,
        rowCanvasLimit: number = 40000,
        defaultHeight: number = 25,
        defaultWidth: number = 50,
    ) {
        this.rowHeights = rowHeights;
        this.startRowIdx = startRowIdx;
        this.rowCanvasLimit = rowCanvasLimit;
        this.visibleRowCnt = visibleRowCnt;
        this.selectionCoordinates = selectionCoordinates;
        this.rowsPositionPrefixSumArr = [];
        this.rowsDivArr = [];
        this.visibleRows = [];
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.scrollHeight = 0;
        this.scrollHeightStart = 0;
        this.rowsDivContainer = document.getElementById("rowsColumn") as HTMLDivElement;
        this.reload(0, 0);
    }

    /**
     * Scrolls row view down by one block and mounts a new row at the bottom.
     * @returns {boolean} True if scrolling occurred, false if at the bottommost limit.
     */
    scrollDown(): boolean {
        if (this.startRowIdx >= (this.rowCanvasLimit - 1 - this.visibleRowCnt)) return false;
        this.unmountRowTop();
        this.startRowIdx++;
        this.mountRowBottom();
        return true;
    }

    /**
     * Scrolls row view up by one block and mounts a new row at the top.
     * @returns {boolean} True if scrolling occurred, false if at the topmost limit.
     */
    scrollUp(): boolean {
        if (this.startRowIdx === 0) return false;
        this.unmountRowBottom();
        this.startRowIdx--;
        this.mountRowTop();
        return true;
    }

    /**
     * Reloads all visible row canvases based on a new starting index and position.
     * This is typically used for "fast scroll" scenarios where a large jump occurs.
     * @param {number} startIdx - The new starting row block index.
     * @param {number} startPosition - The new starting top pixel position.
     */
    reload(startIdx: number, startPosition: number): void {
        const prevHeight = this.scrollHeight; // Store previous height for container adjustment

        // Clamp startIdx to valid range
        startIdx = Math.max(0, startIdx);
        startIdx = Math.min(startIdx, this.rowCanvasLimit - this.visibleRowCnt);

        startPosition = Math.max(startPosition, 0); // Ensure startPosition is not negative

        this.rowsDivContainer.replaceChildren(); // Clear existing DOM elements
        this.visibleRows.splice(0, this.visibleRows.length); // Clear visibleRows array
        this.rowsDivArr.splice(0, this.rowsDivArr.length); // Clear rowsDivArr array
        this.startRowIdx = startIdx; // Set new starting row index
        this.rowsPositionPrefixSumArr.splice(0, this.rowsPositionPrefixSumArr.length); // Clear prefix sum array
        this.scrollHeightStart = startPosition; // Set new starting scroll height
        this.scrollHeight = this.scrollHeightStart; // Initialize current scroll height

        // Create and append new visible row canvases
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;

            const canvas = new RowsCanvas(
                rowIdx,
                this.rowHeights,
                this.defaultWidth,
                this.defaultHeight,
                this.selectionCoordinates
            );

            this.visibleRows.push(canvas);
            this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
            this.rowsDivArr.push(canvas.rowCanvasDiv);
            this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
            canvas.rowCanvasDiv.style.top = `${this.scrollHeight}px`; // Position the row canvas
            this.scrollHeight += canvas.rowsPositionArr[24]; // Accumulate total scroll height
        }

        // Adjust the container's height to accommodate the new content
        this.rowsDivContainer.style.height = `${Math.max(prevHeight, this.scrollHeight)}px`;
    }

    /**
     * Mounts a new row block at the bottom during scroll down.
     */
    private mountRowBottom(): void {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        const canvas = new RowsCanvas(
            rowIdx,
            this.rowHeights,
            this.defaultWidth,
            this.defaultHeight,
            this.selectionCoordinates
        );
        this.visibleRows.push(canvas);
        this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
        this.rowsDivArr.push(canvas.rowCanvasDiv);
        this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
        canvas.rowCanvasDiv.style.top = `${this.scrollHeight}px`;
        this.scrollHeight += canvas.rowsPositionArr[24];
        this.rowsDivContainer.style.height = `${this.scrollHeight}px`;
    }

    /**
     * Mounts a new row block at the top during scroll up.
     */
    private mountRowTop(): void {
        const rowIdx = this.startRowIdx;
        const canvas = new RowsCanvas(
            rowIdx,
            this.rowHeights,
            this.defaultWidth,
            this.defaultHeight,
            this.selectionCoordinates
        );
        this.visibleRows.unshift(canvas); // Add to the beginning of the array
        this.rowsPositionPrefixSumArr.unshift(canvas.rowsPositionArr);
        this.rowsDivArr.unshift(canvas.rowCanvasDiv);
        this.rowsDivContainer.prepend(canvas.rowCanvasDiv); // Add to the beginning of the DOM
        this.scrollHeightStart -= canvas.rowsPositionArr[24]; // Adjust starting scroll height
        canvas.rowCanvasDiv.style.top = `${this.scrollHeightStart}px`; // Position the new row
    }

    /**
     * Unmounts the topmost row block and adjusts margin to simulate scroll down.
     */
    private unmountRowTop(): void {
        this.scrollHeightStart += this.visibleRows[0].rowsPositionArr[24]; // Adjust starting scroll height
        this.rowsDivContainer.removeChild(this.rowsDivArr[0]); // Remove from DOM
        this.rowsDivArr.shift(); // Remove from array
        this.rowsPositionPrefixSumArr.shift(); // Remove from prefix sum array
        this.visibleRows.shift(); // Remove from visibleRows array
    }

    /**
     * Unmounts the bottommost row block during scroll up.
     */
    private unmountRowBottom(): void {
        this.scrollHeight -= this.visibleRows[this.visibleRowCnt - 1].rowsPositionArr[24]; // Adjust total scroll height
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]); // Remove from DOM
        this.rowsDivArr.pop(); // Remove from array
        this.rowsPositionPrefixSumArr.pop(); // Remove from prefix sum array
        this.visibleRows.pop(); // Remove from visibleRows array
    }

    /**
     * Redraws all currently visible rows.
     * Typically used after selection change or resizing.
     */
    rerender(): void {
        for (let row of this.visibleRows) {
            row.drawCanvas();
        }
    }

    /**
     * Gets the row canvas by global row ID if it's currently visible.
     * @param {number} rowID - The global row index.
     * @returns {RowsCanvas|null} Matching row canvas or null if out of bounds.
     */
    getCurrentRowCanvas(rowID: number): RowsCanvas | null {
        const arrIdx = rowID - this.visibleRows[0].rowID;
        if (arrIdx >= 0 && arrIdx < this.visibleRows.length) return this.visibleRows[arrIdx];
        // In a production environment, consider more robust error handling or logging.
        // alert("something went wrong inside rows manager"); // Removed alert as per instructions
        console.error("Error: getCurrentRowCanvas - rowID is out of visible range.");
        return null;
    }

    /**
     * Recalculates and updates the top positions of all visible row canvases,
     * typically called after a resize event that changes row heights.
     */
    resizePosition() {
        this.scrollHeight = this.scrollHeightStart + this.visibleRows[0].rowsPositionArr[24]; // Start accumulating from the first row's height
        for (let i = 1; i < this.visibleRowCnt; i++) {
            this.visibleRows[i].rowCanvasDiv.style.top = `${this.scrollHeight}px`;
            this.scrollHeight += this.visibleRows[i].rowsPositionArr[24];
        }
    }

    /**
     * Resets the scroll height of the rows container, typically called when scrolling to the very top.
     */
    resetScrollTop() {
        this.rowsDivContainer.style.height = `${this.scrollHeight}px`;
    }

    /**
     * Gets the starting top pixel position of the first visible row.
     * @returns {number} The top pixel position.
     */
    getStartTop(): number {
        return this.scrollHeightStart;
    }

    /**
     * Gets the current total scroll height of the visible rows.
     * @returns {number} The total scroll height in pixels.
     */
    getScrollHeight(): number {
        return this.scrollHeight;
    }

    /**
     * Gets the global index of the first visible row block.
     * @returns {number} The starting row index.
     */
    getStartRowIdx(): number {
        return this.startRowIdx;
    }
}