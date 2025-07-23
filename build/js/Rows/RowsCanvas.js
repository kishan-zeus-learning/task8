/**
 * Represents a canvas-based rendering of a block of 25 rows.
 * Handles row drawing, resizing, and rendering optimizations.
 */
export class RowsCanvas {
    /**
     * Constructs a new RowsCanvas block for rendering 25 rows.
     * @param {number} rowID - ID of this block (zero-based index of blocks)
     * @param {RowData} rowHeights - Map of individual row heights
     * @param {number} defaultWidth - Default width of the canvas area
     * @param {number} defaultHeight - Default height for each row
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Current selection state in spreadsheet
     */
    constructor(rowID, rowHeights, defaultWidth, defaultHeight, selectionCoordinates) {
        /** @type {HTMLCanvasElement} Canvas element where the rows are rendered */
        this.rowCanvas = document.createElement("canvas");
        /** @type {HTMLDivElement} Div element used as a visual resize handle */
        this.resizeDiv = document.createElement("div");
        /** @type {number} Current resized row height value */
        this.newValue = 25;
        this.rowHeights = rowHeights;
        this.rowID = rowID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsPositionArr = [];
        this.selectionCoordinates = selectionCoordinates;
        this.setRowsPositionArr(); // Populate initial cumulative row heights
        this.rowCanvasDiv = this.createRowCanvas(); // Create DOM structure with canvas and resize div
    }
    /**
     * Returns the current new row height after resizing.
     * @returns {number} The current new height value.
     */
    getNewValue() {
        return this.newValue;
    }
    /**
     * Called during a drag operation to resize a row.
     * Calculates new height based on drag position and updates visuals.
     * @param {number} newPosition - Y coordinate of the drag event relative to the viewport.
     * @param {number} hoverIdx - Index of the hovered row within this block (0-24).
     * @param {number} rowKey - The global unique key of the row being resized (calculated internally).
     */
    resizeRow(newPosition, hoverIdx, rowKey) {
        // Calculate relative position inside the canvas container
        newPosition = newPosition - this.rowCanvasDiv.getBoundingClientRect().top;
        let newHeight;
        // Calculate new height based on hovered row boundary or absolute position
        if (hoverIdx !== 0) {
            newHeight = newPosition - this.rowsPositionArr[hoverIdx - 1];
        }
        else {
            newHeight = newPosition;
        }
        // Clamp the new height within reasonable bounds (min 25px, max 500px)
        newHeight = Math.max(25, Math.min(500, newHeight));
        // Move the resize handle visually
        if (hoverIdx !== 0) {
            this.resizeDiv.style.top = `${this.rowsPositionArr[hoverIdx - 1] + newHeight}px`;
        }
        else {
            this.resizeDiv.style.top = `${newHeight}px`;
        }
        // Compute global row key from block ID and hover index
        rowKey = this.rowID * 25 + hoverIdx + 1;
        this.changeHeight(newHeight, rowKey);
    }
    /**
     * Modifies the height of a row and triggers re-rendering of the canvas.
     * Updates the `rowHeights` map and recalculates row positions.
     * @param {number} newHeight - New height value to apply.
     * @param {number} rowKey - Unique row identifier in `rowHeights` map.
     */
    changeHeight(newHeight, rowKey) {
        this.newValue = newHeight;
        // Remove from map if height is default (25), else update map
        if (newHeight === 25) {
            this.rowHeights.delete(rowKey);
        }
        else {
            this.rowHeights.set(rowKey, { height: newHeight });
        }
        // Recompute cumulative positions and redraw the canvas
        this.setRowsPositionArr();
        this.drawCanvas();
    }
    /**
     * Finds the row boundary index within a ±5 pixel range of a given Y coordinate.
     * Used to detect if the user is hovering near a row boundary for resizing.
     * @param {number} num - Y coordinate to test (relative to the canvas block's top).
     * @returns {number} Index of the row boundary (0-24) or -1 if none found within the threshold.
     */
    binarySearchRange(num) {
        let start = 0;
        let end = 24;
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
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
        return -1;
    }
    /**
     * Calculates the cumulative sum of row heights and stores them in `rowsPositionArr`.
     * It uses the `defaultHeight` for rows without an explicit custom height in the `rowHeights` map.
     */
    setRowsPositionArr() {
        const startNum = this.rowID * 25 + 1; // Global row number for the first row in this block
        let prefixSum = 0;
        this.rowsPositionArr.length = 0; // Reset array
        for (let i = 0; i < 25; i++) {
            const rowData = this.rowHeights.get(i + startNum);
            prefixSum += rowData ? rowData.height : this.defaultHeight;
            this.rowsPositionArr.push(prefixSum);
        }
    }
    /**
     * Creates the main container div that holds the canvas and the resize div elements.
     * Sets appropriate attributes and styles for these elements, then draws the initial canvas content.
     * @returns {HTMLDivElement} The constructed HTMLDivElement representing the row canvas block.
     */
    createRowCanvas() {
        const rowDiv = document.createElement("div");
        rowDiv.id = `row${this.rowID}`;
        rowDiv.classList.add("subRow"); // Assign CSS class for styling
        this.rowCanvas.setAttribute("row", `${this.rowID}`); // Custom attribute for row block identification
        this.drawCanvas(); // Initial drawing of the canvas content
        rowDiv.appendChild(this.rowCanvas); // Add canvas to the container div
        this.resizeDiv.classList.add("RowResizeDiv"); // Assign CSS class for the resize handle
        rowDiv.appendChild(this.resizeDiv); // Add resize handle to the container div
        return rowDiv;
    }
    /**
     * Draws the 25 rows within this canvas, including row numbers, grid lines, and selection highlights.
     * Handles scaling for device pixel ratio to ensure crisp rendering on high-DPI screens.
     */
    drawCanvas() {
        if (!this.rowCanvas)
            return; // Exit if canvas element is not available
        const dpr = window.devicePixelRatio || 1; // Get device pixel ratio
        const canvasWidth = this.defaultWidth;
        const canvasHeight = this.rowsPositionArr[24]; // Total height of 25 rows
        // Set canvas pixel dimensions, scaled by DPR for clarity
        this.rowCanvas.width = canvasWidth * dpr;
        this.rowCanvas.height = canvasHeight * dpr;
        // Set CSS dimensions to control actual display size
        this.rowCanvas.style.width = `${canvasWidth}px`;
        this.rowCanvas.style.height = `${canvasHeight}px`;
        const ctx = this.rowCanvas.getContext("2d");
        ctx.scale(dpr, dpr); // Scale context to match DPR
        ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear previous drawings
        // Determine the overall selected row range to check for intersections
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        // Draw background
        ctx.fillStyle = "#f5f5f5"; // Light gray background
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        // Draw right border line (subtle separation)
        ctx.beginPath();
        ctx.strokeStyle = "#ddd"; // Light gray border
        ctx.lineWidth = 1;
        ctx.moveTo(canvasWidth - 0.5, 0); // Use 0.5 for crisp single-pixel lines
        ctx.lineTo(canvasWidth - 0.5, canvasHeight);
        ctx.stroke();
        // Setup text style for row numbers
        ctx.font = '14px Arial';
        ctx.lineWidth = 1;
        ctx.textAlign = "right"; // Align text to the right
        ctx.textBaseline = "middle"; // Vertically center text
        const offset = 0.5; // Offset for crisp lines
        const startNum = this.rowID * 25 + 1; // Global row number for the first row in this block
        // Iterate through each of the 25 rows in this block
        for (let i = 0; i < 25; i++) {
            const yTop = (i === 0) ? 0 : this.rowsPositionArr[i - 1]; // Top Y coordinate of the current row
            const yBottom = this.rowsPositionArr[i]; // Bottom Y coordinate of the current row
            const yPos = Math.round(yBottom - (yBottom - yTop) / 2 + 1); // Vertical center for text positioning
            const rowIndex = i + startNum; // Global row index
            let widthOffset = 0; // Used to adjust line drawing for selection highlight
            // Check if the current row is within the selected range
            if (this.ifSelected(rowIndex)) {
                widthOffset = 2; // Offset for thicker border when selected
                // Check if the entire spreadsheet row (all columns) is selected
                if (this.ifSelectedWhole()) {
                    // Full row selection style
                    ctx.fillStyle = "#107C41"; // Dark green fill
                    ctx.fillRect(0, yTop, canvasWidth, yBottom - yTop);
                    ctx.fillStyle = "#ffffff"; // White text
                    ctx.strokeStyle = "#ffffff"; // White lines
                }
                else {
                    // Partial row selection style (only some columns selected)
                    ctx.fillStyle = "#CAEAD8"; // Light green fill
                    ctx.fillRect(0, yTop, canvasWidth, yBottom - yTop);
                    // Draw distinct right border for partial selection
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#107C41"; // Dark green border
                    ctx.moveTo(canvasWidth - 1, yTop);
                    ctx.lineTo(canvasWidth - 1, yBottom);
                    ctx.stroke();
                    // Reset fill and stroke for text and grid lines
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.fillStyle = "#0F703B"; // Darker green text
                    ctx.strokeStyle = "#A0D8B9"; // Lighter green grid lines
                }
            }
            else {
                // Default unselected style
                ctx.fillStyle = "#616161"; // Gray text
                ctx.strokeStyle = "#ddd"; // Light gray grid lines
            }
            // Draw horizontal grid line for each row boundary
            ctx.beginPath();
            ctx.moveTo(0, this.rowsPositionArr[i] - offset);
            ctx.lineTo(canvasWidth - widthOffset, this.rowsPositionArr[i] - offset);
            ctx.stroke();
            // Draw row number text
            ctx.fillText(`${rowIndex}`, canvasWidth - 5, yPos);
        }
        // Draw bottom border highlight if the selection ends on this block's last row
        // or starts on this block's first row (for single-row selection visibility)
        ctx.beginPath();
        if (this.ifSelectedWhole()) {
            // If whole rows are selected
            if (canvasEndRow <= this.rowID * 25 + 25 && // Selection ends within or before this block
                canvasEndRow >= this.rowID * 25 + 1 && // Selection ends within or after this block
                (canvasEndRow === this.selectionCoordinates.selectionStartRow ||
                    canvasEndRow === this.selectionCoordinates.selectionEndRow) // Check if this is the actual end row of selection
            ) {
                const lastIdx = (canvasEndRow - 1) % 25; // Index of the last selected row in this block
                ctx.strokeStyle = "#107C41"; // Dark green border
                ctx.lineWidth = 2;
                ctx.moveTo(0, this.rowsPositionArr[lastIdx] - 1);
                ctx.lineTo(canvasWidth, this.rowsPositionArr[lastIdx] - 1);
            }
        }
        else {
            // If partial columns are selected
            if (canvasStartRow <= this.rowID * 25 + 25 && // Selection starts within or before this block
                canvasStartRow >= this.rowID * 25 + 1 && // Selection starts within or after this block
                (canvasStartRow === this.selectionCoordinates.selectionStartRow ||
                    canvasStartRow === this.selectionCoordinates.selectionEndRow) // Check if this is the actual start row of selection
            ) {
                const firstIdx = (canvasStartRow - 1) % 25; // Index of the first selected row in this block
                ctx.strokeStyle = "#A0D8B9"; // Lighter green border
                ctx.lineWidth = 1;
                ctx.moveTo(0, firstIdx === 0 ? 0 : this.rowsPositionArr[firstIdx - 1]);
                ctx.lineTo(canvasWidth, firstIdx === 0 ? 0 : this.rowsPositionArr[firstIdx - 1]);
            }
        }
        ctx.stroke(); // Render the determined border highlight
    }
    /**
     * Checks if a given global row number is currently within the selected range in the spreadsheet.
     * @param {number} num - The global row number to check.
     * @returns {boolean} True if the row is selected, false otherwise.
     */
    ifSelected(num) {
        // Determine the absolute start and end of the selection range
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        return num >= canvasStartRow && num <= canvasEndRow;
    }
    /**
     * Determines if the entire row block (i.e., all columns from 1 to 1000) is selected.
     * This is used to apply distinct styling for full-row selection versus cell/column-limited selection.
     * @returns {boolean} True if full row selection across all 1000 columns, false if partial or column-limited selection.
     */
    ifSelectedWhole() {
        // Determine the absolute start and end of the column selection range
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        // Check if the selection spans from the first column (1) to the last column (1000)
        return canvasStartColumn === 1 && canvasEndColumn === 1000;
    }
}
