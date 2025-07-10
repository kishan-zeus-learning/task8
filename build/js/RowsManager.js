import { RowsCanvas } from "./RowsCanvas.js";
/**
 * Manages a scrolling set of visible row canvases, enabling efficient rendering
 * and resizing behavior for a large number of rows by dynamically mounting and unmounting row blocks.
 */
export class RowsManager {
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
    constructor(rowHeights, startRowIdx, visibleRowCnt, ifResizeOn, ifResizePointerDown, selectionCoordinates, undoRedoManager, rowCanvasLimit = 40000, defaultHeight = 25, defaultWidth = 50, marginTop = { value: 0 }) {
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
        this.rowsDivContainer = document.getElementById("rowsColumn");
        this.initialLoad(); // Perform initial loading of row canvases
    }
    /**
     * Returns the RowsCanvas currently being resized.
     * This getter determines which of the visible row canvases is being interacted with for resizing.
     * @returns {RowsCanvas} The RowsCanvas instance currently being resized.
     */
    get currentResizingRowCanvas() {
        let idx = 0;
        // Calculate the index within the visibleRows array based on the currentResizingRow value
        if (this.currentResizingRow.value === -1) {
            // alert("something went wrong"); // Consider using a more robust error handling mechanism
        }
        else {
            idx = this.currentResizingRow.value - this.visibleRows[0].rowID;
        }
        return this.visibleRows[idx];
    }
    /**
     * Scrolls row view down by one block and mounts a new row at the bottom.
     * @returns {boolean} True if scrolling occurred, false if at the bottommost limit.
     */
    scrollDown() {
        // Check if already at the bottommost scroll limit
        if (this.startRowIdx === (this.rowCanvasLimit - 1 - this.visibleRowCnt))
            return false;
        this.unmountRowTop(); // Remove the topmost row canvas from DOM and array
        this.startRowIdx++; // Increment the starting row index
        this.mountRowBottom(); // Add a new row canvas to the bottom
        return true;
    }
    /**
     * Scrolls row view up by one block and mounts a new row at the top.
     * @returns {boolean} True if scrolling occurred, false if at the topmost limit.
     */
    scrollUp() {
        // Check if already at the topmost scroll limit
        if (this.startRowIdx === 0)
            return false;
        this.unmountRowBottom(); // Remove the bottommost row canvas from DOM and array
        this.startRowIdx--; // Decrement the starting row index
        this.mountRowTop(); // Add a new row canvas to the top
        return true;
    }
    /**
     * Loads all visible row canvases on initial render.
     * This method is called once during the constructor.
     */
    initialLoad() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = i + this.startRowIdx; // Calculate the global row group index
            // Create a new RowsCanvas instance
            const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow, this.selectionCoordinates);
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
    mountRowBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1; // Calculate the index for the new row group
        // Create a new RowsCanvas instance for the new row group
        const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow, this.selectionCoordinates);
        this.visibleRows.push(canvas); // Add to the end of the visible canvases array
        this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr); // Add its prefix sum array
        this.rowsDivArr.push(canvas.rowCanvasDiv); // Add its div element
        this.rowsDivContainer.appendChild(canvas.rowCanvasDiv); // Append to the DOM container
    }
    /**
     * Adds a new row block to the top of the view.
     * This is typically called during vertical scrolling up.
     */
    mountRowTop() {
        const rowIdx = this.startRowIdx; // The index for the new row group
        // Create a new RowsCanvas instance for the new row group
        const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow, this.selectionCoordinates);
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
    unmountRowTop() {
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
    unmountRowBottom() {
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]); // Remove the last child (bottommost canvas) from the DOM
        this.rowsDivArr.pop(); // Remove from the array of row div elements
        this.rowsPositionPrefixSumArr.pop(); // Remove its prefix sum array
        this.visibleRows.pop(); // Remove from the array of visible canvases
    }
    /**
     * Redraws all currently visible rows.
     * This is called when the display needs to be updated, e.g., after selection changes or resizing.
     */
    rerender() {
        for (let row of this.visibleRows) {
            row.drawCanvas(); // Call drawCanvas method on each visible RowsCanvas instance
        }
    }
}
