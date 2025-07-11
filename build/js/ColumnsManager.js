import { ColumnsCanvas } from "./ColumnsCanvas.js";
/**
 * Manages the creation, rendering, and scrolling of column canvases.
 * Handles dynamic mounting and unmounting of ColumnsCanvas blocks for performance.
 */
export class ColumnsManager {
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
    constructor(columnWidths, startColumnIdx, visibleColumnCnt, ifResizeOn, ifResizePointerDown, selectionCoordinates, columnCanvasLimit = 40, defaultHeight = 25, defaultWidth = 100, marginLeft = { value: 0 }) {
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
        this.columnsDivContainer = document.getElementById("columnsRow");
        this.initialLoad(); // Perform initial loading of column canvases
    }
    /**
     * Returns the ColumnsCanvas instance for the currently resizing column group.
     * This getter determines which of the visible column canvases is being interacted with for resizing.
     * @returns {ColumnsCanvas} The ColumnsCanvas instance currently being resized.
     */
    get currentResizingColumnCanvas() {
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
    scrollRight() {
        // Check if already at the rightmost scroll limit
        if (this.startColumnIdx === (this.columnCanvasLimit - 1 - this.visibleColumnCnt))
            return false;
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
    scrollLeft() {
        // Check if already at the leftmost scroll limit
        if (this.startColumnIdx === 0)
            return false;
        this.unmountColumnRight(); // Remove the rightmost column canvas from DOM and array
        this.startColumnIdx--; // Decrement the starting column index
        this.mountColumnLeft(); // Add a new column canvas to the left
        return true;
    }
    /**
     * Performs the initial loading and rendering of visible column canvas groups.
     * This method is called once during the constructor.
     */
    initialLoad() {
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = j + this.startColumnIdx; // Calculate the global column group index
            // Create a new ColumnsCanvas instance
            const canvas = new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingColumn, this.selectionCoordinates);
            this.visibleColumns.push(canvas); // Add to the array of visible canvases
            this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr); // Store its prefix sum array
            this.columnsDivContainer.appendChild(canvas.columnCanvasDiv); // Append to the DOM container
        }
    }
    /**
     * Mounts a new ColumnsCanvas instance to the right of the currently visible columns.
     * This is typically called during horizontal scrolling to the right.
     */
    mountColumnRight() {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1; // Calculate the index for the new column group
        // Create a new ColumnsCanvas instance for the new column group
        const canvas = new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingColumn, this.selectionCoordinates);
        this.visibleColumns.push(canvas); // Add to the end of the visible canvases array
        this.columnsDivContainer.appendChild(canvas.columnCanvasDiv); // Append to the DOM container
        this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr); // Add its prefix sum array
    }
    /**
     * Mounts a new ColumnsCanvas instance to the left of the currently visible columns.
     * This is typically called during horizontal scrolling to the left.
     */
    mountColumnLeft() {
        const columnIdx = this.startColumnIdx; // The index for the new column group
        // Create a new ColumnsCanvas instance for the new column group
        const canvas = new ColumnsCanvas(columnIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingColumn, this.selectionCoordinates);
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
    unmountColumnLeft() {
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
    unmountColumnRight() {
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
    rerender() {
        for (let column of this.visibleColumns) {
            column.drawCanvas(); // Call drawCanvas method on each visible ColumnsCanvas instance
        }
    }
    getCurrentColumnCanvas(columnID) {
        const arrIdx = columnID - this.visibleColumns[0].columnID;
        if (arrIdx >= 0 && arrIdx < this.visibleColumns.length)
            return this.visibleColumns[arrIdx];
        alert("something went wrong inside columns manager");
        return null;
    }
}
