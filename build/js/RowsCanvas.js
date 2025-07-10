/**
 * Represents a canvas-based rendering of a block of 25 rows.
 * Handles row drawing, resizing, and rendering optimizations.
 */
export class RowsCanvas {
    /**
     * Initializes the RowsCanvas with layout and resize behavior.
     * @param {number} rowID - Index of this row block.
     * @param {RowData} rowHeights - Custom height map.
     * @param {number} defaultWidth - Default width of rows.
     * @param {number} defaultHeight - Default height of rows.
     * @param {BooleanObj} ifResizeOn - Shared global boolean for resize indicator.
     * @param {BooleanObj} ifResizePointerDown - Shared global boolean for pointer down.
     * @param {NumberObj} currentResizingRow - Shared global row ID during resizing.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object containing current selection coordinates.
     */
    constructor(rowID, rowHeights, defaultWidth, defaultHeight, ifResizeOn, ifResizePointerDown, currentResizingRow, selectionCoordinates) {
        /** @type {HTMLCanvasElement} The canvas element used to render rows */
        this.rowCanvas = document.createElement("canvas");
        /** @type {HTMLDivElement} The horizontal resize UI indicator element */
        this.resizeDiv = document.createElement("div");
        /** @type {number} Index of the row currently being hovered near a resize boundary */
        this.hoverIdx = -1;
        /** @type {number} Stores the height of the row *before* a resize operation for undo functionality. */
        this.prevValue = 25;
        /** @type {number} Stores the height of the row *after* a resize operation for undo functionality. */
        this.newValue = 25;
        /** @type {number} Stores the key (index) of the row being resized for undo functionality. */
        this.rowKey = -1;
        this.rowHeights = rowHeights;
        this.rowID = rowID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsPositionArr = []; // Initialized as an empty array
        this.currentResizingRow = currentResizingRow;
        this.ifResizeOn = ifResizeOn;
        this.ifResizePointerDown = ifResizePointerDown;
        this.selectionCoordinates = selectionCoordinates;
        this.setRowsPositionArr(); // Calculate initial row positions
        this.rowCanvasDiv = this.createRowCanvas(); // Create the DOM elements for the row canvas
        this.handleResize(); // Attach event listeners for row resizing
    }
    /**
     * Gets the previous height value of the row being resized.
     * @returns {number} The previous height.
     */
    getPrevValue() {
        return this.prevValue;
    }
    /**
     * Gets the new height value of the row after resizing.
     * @returns {number} The new height.
     */
    getNewValue() {
        return this.newValue;
    }
    /**
     * Gets the key (index) of the row being resized.
     * @returns {number} The row key.
     */
    getRowKey() {
        return this.rowKey;
    }
    /**
     * Adds resize behavior and hover logic to row borders.
     * This method sets up event listeners for pointer interactions (down, move, out)
     * to manage the visual resize indicator and update state variables for resizing.
     */
    handleResize() {
        this.rowCanvasDiv.addEventListener("pointerdown", (event) => {
            var _a;
            if (event.button === 1) { // Ignore middle-click
                return;
            }
            this.hoverIdx = this.binarySearchRange(event.offsetY); // Determine which row boundary is hovered
            if (this.hoverIdx !== -1) {
                this.ifResizePointerDown.value = true; // Set flag when pointer is down on a resizable edge
                const rowKey = this.rowID * 25 + 1 + this.hoverIdx; // Calculate global row key
                // Store previous and current height for undo/redo
                this.prevValue = ((_a = this.rowHeights.get(rowKey)) === null || _a === void 0 ? void 0 : _a.height) || 25;
                this.newValue = this.prevValue;
                this.rowKey = rowKey; // Store the row key
            }
        });
        this.rowCanvasDiv.addEventListener("pointermove", (event) => {
            if (this.ifResizePointerDown.value) {
                // If resize is active and pointer is down, indicate which row canvas is involved
                this.currentResizingRow.value = this.rowID;
                return;
            }
            this.hoverIdx = this.binarySearchRange(event.offsetY); // Find hovered row boundary
            if (this.hoverIdx !== -1) {
                this.ifResizeOn.value = true; // Indicate that resizing is possible
                this.resizeDiv.style.display = "block"; // Show the resize handle
                // Position the resize handle at the row boundary
                this.resizeDiv.style.top = `${this.rowsPositionArr[this.hoverIdx] - 1.5}px`;
                this.resizeDiv.style.zIndex = `10`; // Bring resize handle to front
            }
            else {
                if (!this.ifResizePointerDown.value) {
                    // Hide resize handle if not hovering and not currently resizing
                    if (this.resizeDiv)
                        this.resizeDiv.style.display = "none";
                }
                this.ifResizeOn.value = false; // Indicate that resizing is not possible
            }
        });
        this.rowCanvasDiv.addEventListener("pointerout", (event) => {
            if (!this.ifResizePointerDown.value) {
                // Hide resize handle when pointer leaves if not actively resizing
                if (this.resizeDiv)
                    this.resizeDiv.style.display = "none";
            }
            this.ifResizeOn.value = false; // Reset resize active flag
        });
    }
    /**
     * Resizes a specific row when dragged, clamps height, and redraws.
     * Updates the `resizeDiv`'s position and calls `changeHeight` to update row data.
     * @param {number} newPosition - The new Y-coordinate of the mouse relative to the viewport.
     */
    resizeRow(newPosition) {
        // Convert viewport position to position relative to the row canvas div
        newPosition = newPosition - this.rowCanvasDiv.getBoundingClientRect().top;
        let newHeight = 25; // Initialize with default
        if (this.hoverIdx !== 0) {
            // Calculate new height based on the previous row boundary
            newHeight = newPosition - this.rowsPositionArr[this.hoverIdx - 1];
        }
        else {
            // If it's the first row, new height is simply the new position
            newHeight = newPosition;
        }
        // Clamp the new height to ensure it stays within reasonable bounds
        newHeight = Math.max(25, newHeight);
        newHeight = Math.min(500, newHeight);
        // Update the visual position of the resize handle
        if (this.hoverIdx !== 0) {
            this.resizeDiv.style.top = `${this.rowsPositionArr[this.hoverIdx - 1] + newHeight}px`;
        }
        else {
            this.resizeDiv.style.top = `${newHeight}px`;
        }
        // Calculate the global row key for the resized row
        this.rowKey = this.rowID * 25 + this.hoverIdx + 1;
        this.changeHeight(newHeight, this.rowKey); // Apply the height change and trigger redraw
    }
    /**
     * Updates the height of a specific row in `rowHeights` and redraws the canvas.
     * If `newHeight` is equal to `defaultHeight`, the entry for the row is removed,
     * effectively resetting it to the default.
     * @param {number} newHeight - The new height to set for the row.
     * @param {number} rowKey - The key (index) of the row to update.
     */
    changeHeight(newHeight, rowKey) {
        this.newValue = newHeight; // Store the new value for undo/redo
        if (newHeight === 25) {
            this.rowHeights.delete(rowKey); // If default height, remove entry
        }
        else {
            this.rowHeights.set(rowKey, { height: newHeight }); // Otherwise, set custom height
        }
        this.setRowsPositionArr(); // Recalculate row positions
        this.drawCanvas(); // Redraw the canvas to reflect changes
    }
    /**
     * Finds the row index near the given vertical coordinate using binary search.
     * This helps in identifying if the pointer is near a resizable edge.
     * @param {number} num - The Y offset to check within the canvas.
     * @returns {number} Row index if found near boundary (within +/- 5 pixels), else -1.
     */
    binarySearchRange(num) {
        let start = 0;
        let end = 24; // There are 25 rows per canvas (0-24 index)
        let mid;
        while (start <= end) {
            mid = Math.floor((start + end) / 2);
            // Check if num is within a +/- 5 pixel range of the boundary
            if (Math.abs(num - this.rowsPositionArr[mid]) <= 5) {
                return mid;
            }
            else if (num > this.rowsPositionArr[mid]) {
                start = mid + 1;
            }
            else {
                end = mid - 1;
            }
        }
        return -1; // No boundary found in range
    }
    /**
     * Recalculates and stores vertical positions of rows using prefix sum.
     * This array is crucial for rendering rows and determining click/hover positions.
     */
    setRowsPositionArr() {
        let startNum = this.rowID * 25 + 1; // Global starting row number for this canvas
        let prefixSum = 0;
        this.rowsPositionArr.length = 0; // Clear the array before repopulating
        for (let i = 0; i < 25; i++) { // Iterate through 25 rows handled by this canvas
            const rowData = this.rowHeights.get(i + startNum); // Get custom height if exists
            if (rowData) {
                prefixSum += rowData.height; // Add custom height
            }
            else {
                prefixSum += this.defaultHeight; // Add default height
            }
            this.rowsPositionArr.push(prefixSum); // Store cumulative height
        }
    }
    /**
     * Creates and initializes the DOM structure for a single row block.
     * It creates a container div (`rowCanvasDiv`) which holds the `rowCanvas`
     * and the `resizeDiv` elements.
     * @returns {HTMLDivElement} The created row canvas container div.
     */
    createRowCanvas() {
        const rowDiv = document.createElement("div");
        rowDiv.id = `row${this.rowID}`; // Assign unique ID
        rowDiv.classList.add("subRow"); // Add base class for styling
        this.rowCanvas.setAttribute("row", `${this.rowID}`); // Set custom attribute for row ID
        this.drawCanvas(); // Initial draw of the canvas
        rowDiv.appendChild(this.rowCanvas); // Add canvas to the container div
        this.resizeDiv.classList.add("RowResizeDiv"); // Add class for styling the resize handle
        rowDiv.appendChild(this.resizeDiv); // Add resize handle to the container div
        return rowDiv;
    }
    /**
     * Draws row numbers and horizontal lines on the canvas.
     * This method handles selection highlighting and ensures sharp rendering using device pixel ratio.
     */
    drawCanvas() {
        if (!this.rowCanvas)
            return; // Ensure canvas element exists
        // Determine the effective selection range for rows and columns on this canvas
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        // Set canvas dimensions based on device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        this.rowCanvas.width = this.defaultWidth * dpr;
        this.rowCanvas.height = this.rowsPositionArr[24] * dpr; // Total height of 25 rows
        this.rowCanvas.style.width = `${this.defaultWidth}px`;
        this.rowCanvas.style.height = `${this.rowsPositionArr[24]}px`;
        let widthOffset = 0; // Used for adjusting line width when selected
        const ctx = this.rowCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.defaultWidth, this.rowsPositionArr[24]); // Clear previous drawings
        ctx.scale(dpr, dpr); // Apply DPR scaling
        // Fill background
        ctx.fillStyle = "#f5f5f5"; // Light grey background
        ctx.fillRect(0, 0, this.defaultWidth, this.rowsPositionArr[24]);
        // === Draw Right Border First ===
        ctx.beginPath();
        ctx.strokeStyle = "#ddd"; // Light grey border
        ctx.moveTo(this.defaultWidth - 0.5, 0);
        ctx.lineTo(this.defaultWidth - 0.5, this.rowsPositionArr[24]);
        ctx.stroke();
        // === Text and grid line setup ===
        ctx.font = '14px Arial';
        ctx.lineWidth = 1;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        let startNum = this.rowID * 25 + 1; // The starting global row number for this canvas (e.g., 1, 26, 51...)
        const offset = 0.5 / dpr; // Pixel perfect alignment for lines
        for (let i = 0; i < 25; i++) { // Loop through 25 rows on this canvas
            const yTop = (i === 0) ? 0 : this.rowsPositionArr[i - 1]; // Top edge of the current row
            const yBottom = this.rowsPositionArr[i]; // Bottom edge of the current row
            const yPos = Math.round(yBottom - (yBottom - yTop) / 2 + 1); // Vertical center for text
            const rowIndex = i + startNum; // Global row index (1-based)
            // Handle selection styling if the current row is selected
            if (this.ifSelected(rowIndex)) {
                widthOffset = 2; // Adjust for thicker right border
                if (this.ifSelectedWhole()) {
                    // If entire rows are selected (from column 1 to last column)
                    ctx.fillStyle = "#107C41"; // Dark green fill
                    ctx.fillRect(0, yTop, this.defaultWidth, yBottom - yTop);
                    ctx.fillStyle = "#ffffff"; // White text
                    ctx.strokeStyle = "#ffffff"; // White stroke for inner lines
                }
                else {
                    // If only part of the rows are selected
                    ctx.fillStyle = "#CAEAD8"; // Light green fill
                    ctx.fillRect(0, yTop, this.defaultWidth, yBottom - yTop);
                    // Draw a thicker right border for partial selection
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#107C41"; // Dark green border
                    ctx.moveTo(this.defaultWidth - 1, yTop);
                    ctx.lineTo(this.defaultWidth - 1, yBottom);
                    ctx.stroke();
                    ctx.beginPath(); // Reset path for text and inner lines
                    ctx.lineWidth = 1;
                    ctx.fillStyle = "#0F703B"; // Darker green text
                    ctx.strokeStyle = "#A0D8B9"; // Lighter green stroke for inner lines
                }
            }
            else {
                // Default styling for unselected rows
                ctx.fillStyle = "#616161"; // Grey text
                ctx.strokeStyle = "#ddd"; // Light grey stroke
                widthOffset = 0;
            }
            // Draw horizontal grid line for each row
            ctx.beginPath();
            ctx.moveTo(0, this.rowsPositionArr[i] - offset);
            ctx.lineTo(this.defaultWidth - widthOffset, this.rowsPositionArr[i] - offset);
            ctx.stroke();
            // Draw row number
            ctx.fillText(`${rowIndex}`, this.defaultWidth - 5, yPos);
        }
        // Draw the bottommost selection border if applicable
        ctx.beginPath();
        if (this.ifSelectedWhole()) {
            // For whole row selection, apply dark green border
            if (canvasEndRow <= this.rowID * 25 + 25 && canvasEndRow >= this.rowID * 25 + 1 &&
                (canvasEndRow === this.selectionCoordinates.selectionStartRow || canvasEndRow === this.selectionCoordinates.selectionEndRow)) {
                const lastIdx = (canvasEndRow - 1) % 25; // Index within this canvas
                ctx.strokeStyle = "#107C41"; // Dark green
                ctx.lineWidth = 2;
                ctx.moveTo(0, this.rowsPositionArr[lastIdx] - 1);
                ctx.lineTo(this.defaultWidth, this.rowsPositionArr[lastIdx] - 1);
            }
        }
        else {
            // For partial row selection, apply lighter green border
            if (canvasStartRow <= this.rowID * 25 + 25 && canvasStartRow >= this.rowID * 25 + 1 &&
                (canvasStartRow === this.selectionCoordinates.selectionStartRow || canvasStartRow === this.selectionCoordinates.selectionEndRow)) {
                const firstIdx = (canvasStartRow - 1) % 25; // Index within this canvas
                ctx.strokeStyle = "#A0D8B9"; // Lighter green
                ctx.lineWidth = 1;
                ctx.moveTo(0, (firstIdx === 0) ? 0 : this.rowsPositionArr[firstIdx - 1]);
                ctx.lineTo(this.defaultWidth, (firstIdx === 0) ? 0 : this.rowsPositionArr[firstIdx - 1]);
            }
        }
        ctx.stroke(); // Final stroke for the bottommost selection border
    }
    /**
     * Checks if a given row number is within the current selection range.
     * @private
     * @param {number} num - The global row number to check.
     * @returns {boolean} True if the row is selected, false otherwise.
     */
    ifSelected(num) {
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        return num >= canvasStartRow && num <= canvasEndRow;
    }
    /**
     * Checks if the entire column range (from column 1 to 1000) is selected.
     * This is used to determine if a "whole row" selection style should be applied.
     * @private
     * @returns {boolean} True if the entire column range is selected, false otherwise.
     */
    ifSelectedWhole() {
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        return canvasStartColumn === 1 && canvasEndColumn === 1000; // Assuming 1000 is the max column for "whole" selection
    }
}
