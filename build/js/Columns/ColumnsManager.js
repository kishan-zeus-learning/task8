import { ColumnsCanvas } from "./ColumnsCanvas.js";
/**
 * Manages the creation, rendering, and scrolling of column canvases.
 * Handles dynamic mounting and unmounting of ColumnsCanvas blocks for performance.
 */
export class ColumnsManager {
    /**
     * Initializes a ColumnsManager instance.
     * @param {ColumnData} columnWidths - Map that stores custom column widths keyed by column index.
     * @param {number} startColumnIdx - Initial index of the first visible column group.
     * @param {number} visibleColumnCnt - Number of column groups visible initially.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object containing selection range coordinates.
     * @param {number} [columnCanvasLimit=40] - Maximum number of column canvas groups.
     * @param {number} [defaultHeight=25] - Default height for column headers.
     * @param {number} [defaultWidth=100] - Default width for columns.
     */
    constructor(columnWidths, startColumnIdx, visibleColumnCnt, selectionCoordinates, columnCanvasLimit = 40, defaultHeight = 25, defaultWidth = 100) {
        this.columnWidths = columnWidths;
        this.startColumnIdx = startColumnIdx;
        this.visibleColumnCnt = visibleColumnCnt;
        this.columnCanvasLimit = columnCanvasLimit;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.selectionCoordinates = selectionCoordinates;
        this.scrollWidth = 0;
        this.scrollWidthStart = 0;
        this.visibleColumns = [];
        this.visibleColumnsPrefixSumArr = [];
        this.columnsDivContainer = document.getElementById("columnsRow");
        this.reload(0, 0); // Load initial column canvases
    }
    /**
     * Reloads all visible column canvases based on a new starting index and position.
     * This is typically used for "fast scroll" scenarios where a large jump occurs.
     * @param {number} startIdx - The new starting column block index.
     * @param {number} startPosition - The new starting left pixel position.
     */
    reload(startIdx, startPosition) {
        startIdx = Math.max(0, startIdx);
        startPosition = Math.max(0, startPosition);
        this.columnsDivContainer.replaceChildren(); // Clear existing DOM elements
        this.visibleColumns.splice(0, this.visibleColumns.length); // Clear visibleColumns array
        this.startColumnIdx = startIdx; // Set new starting column index
        this.visibleColumnsPrefixSumArr.splice(0, this.visibleColumnsPrefixSumArr.length); // Clear prefix sum array
        this.scrollWidthStart = startPosition; // Set new starting scroll width
        this.scrollWidth = startPosition; // Initialize current scroll width
        // Create and append new visible column canvases
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const columnIdx = this.startColumnIdx + j;
            const canvas = new ColumnsCanvas(columnIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
            this.visibleColumns.push(canvas);
            this.visibleColumnsPrefixSumArr.push(canvas.columnsPositionArr);
            this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
            canvas.columnCanvasDiv.style.left = `${this.scrollWidth}px`; // Position the column canvas
            this.scrollWidth += canvas.columnsPositionArr[24]; // Accumulate total scroll width
            this.columnsDivContainer.style.width = `${this.scrollWidth}px`; // Adjust container width
        }
    }
    /**
     * Scrolls right by removing the leftmost canvas and adding a new one on the right.
     * @returns {boolean} True if scroll occurred, false if already at the rightmost limit.
     */
    scrollRight() {
        if (this.startColumnIdx === (this.columnCanvasLimit - 1 - this.visibleColumnCnt))
            return false;
        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
        return true;
    }
    /**
     * Scrolls left by removing the rightmost canvas and adding a new one on the left.
     * @returns {boolean} True if scroll occurred, false if already at the leftmost limit.
     */
    scrollLeft() {
        if (this.startColumnIdx === 0)
            return false;
        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
        return true;
    }
    /**
     * Mounts a new column canvas group to the right end of the visible list.
     */
    mountColumnRight() {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1;
        const canvas = new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
        this.visibleColumns.push(canvas);
        this.visibleColumnsPrefixSumArr.push(canvas.columnsPositionArr);
        this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
        canvas.columnCanvasDiv.style.left = `${this.scrollWidth}px`;
        this.scrollWidth += canvas.columnsPositionArr[24];
        this.columnsDivContainer.style.width = `${this.scrollWidth}px`;
    }
    /**
     * Mounts a new column canvas group to the left end of the visible list and adjusts positioning.
     */
    mountColumnLeft() {
        const columnIdx = this.startColumnIdx;
        const canvas = new ColumnsCanvas(columnIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
        this.visibleColumns.unshift(canvas); // Add to the beginning of the array
        this.visibleColumnsPrefixSumArr.unshift(canvas.columnsPositionArr);
        this.columnsDivContainer.prepend(canvas.columnCanvasDiv); // Add to the beginning of the DOM
        this.scrollWidthStart -= canvas.columnsPositionArr[24]; // Adjust starting scroll width
        canvas.columnCanvasDiv.style.left = `${this.scrollWidthStart}px`; // Position the new column
    }
    /**
     * Unmounts the leftmost canvas from the DOM and adjusts the starting scroll width.
     */
    unmountColumnLeft() {
        // The index for width adjustment should be based on the element being removed, which is the current first element (visibleColumns[0])
        // The previous logic was incorrect, using visibleColumnCnt-1
        this.scrollWidthStart += this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvasDiv);
        this.visibleColumns.shift();
        this.visibleColumnsPrefixSumArr.shift();
    }
    /**
     * Unmounts the rightmost canvas from the DOM and adjusts the total scroll width.
     */
    unmountColumnRight() {
        // Adjust the total scroll width by subtracting the width of the column being removed.
        // This should be done before popping the element from the array.
        this.scrollWidth -= this.visibleColumns[this.visibleColumns.length - 1].columnsPositionArr[24];
        const canvas = this.visibleColumns.pop(); // Remove from array
        if (canvas) {
            this.columnsDivContainer.removeChild(canvas.columnCanvasDiv); // Remove from DOM
            this.visibleColumnsPrefixSumArr.pop(); // Remove from prefix sum array
        }
    }
    /**
     * Redraws all currently visible columns.
     * Typically used after selection change or resizing.
     */
    rerender() {
        for (let column of this.visibleColumns) {
            column.drawCanvas();
        }
    }
    /**
     * Gets the ColumnsCanvas instance for the specified column group ID if it's currently visible.
     * @param {number} columnID - The global group ID (0-based) of the column canvas to retrieve.
     * @returns {ColumnsCanvas|null} The matching ColumnsCanvas instance, or null if out of bounds.
     */
    getCurrentColumnCanvas(columnID) {
        const arrIdx = columnID - this.visibleColumns[0].columnID;
        if (arrIdx >= 0 && arrIdx < this.visibleColumns.length)
            return this.visibleColumns[arrIdx];
        // In a production environment, consider more robust error handling or logging.
        // alert("something went wrong inside columns manager"); // Removed alert as per instructions
        console.error("Error: getCurrentColumnCanvas - columnID is out of visible range.");
        return null;
    }
    /**
     * Recalculates and updates the left positions of all visible column canvases,
     * typically called after a resize event that changes column widths.
     */
    resizePosition() {
        this.scrollWidth = this.scrollWidthStart + this.visibleColumns[0].columnsPositionArr[24]; // Start accumulating from the first column's width
        for (let i = 1; i < this.visibleColumnCnt; i++) {
            this.visibleColumns[i].columnCanvasDiv.style.left = `${this.scrollWidth}px`;
            this.scrollWidth += this.visibleColumns[i].columnsPositionArr[24];
        }
    }
    /**
     * Resets the scroll width of the columns container, typically called when scrolling to the very left.
     */
    resetScrollLeft() {
        this.columnsDivContainer.style.width = `${this.scrollWidth}px`;
    }
    /**
     * Gets the starting left pixel position of the first visible column.
     * @returns {number} The left pixel position.
     */
    getStartLeft() {
        return this.scrollWidthStart;
    }
    /**
     * Gets the current total scroll width of the visible columns.
     * @returns {number} The total scroll width in pixels.
     */
    getScrollWidth() {
        return this.scrollWidth;
    }
    /**
     * Gets the global index of the first visible column block.
     * @returns {number} The starting column index.
     */
    getStartColIdx() {
        return this.startColumnIdx;
    }
}
