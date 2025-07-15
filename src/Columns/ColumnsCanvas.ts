import { ColumnData } from "../types/ColumnRows";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates";

/**
 * Manages the rendering and interaction of column headers on a canvas.
 * Handles column resizing and visual feedback for selections.
 */
export class ColumnsCanvas {
    /** @type {ColumnData} A map storing custom widths for columns. */
    readonly columnWidths: ColumnData;

    /** @type {number[]} Prefix sums of column widths, defining column boundaries. */
    readonly columnsPositionArr: number[];

    /** @type {number} The unique identifier for this canvas block (e.g., 0 for A-Y, 1 for Z-AY, etc.) */
    readonly columnID: number;

    /** @type {HTMLDivElement} The DOM container for this canvas and resize handle. */
    readonly columnCanvasDiv: HTMLDivElement;

    /** @type {HTMLCanvasElement} The canvas element used for drawing headers. */
    readonly columnCanvas: HTMLCanvasElement = document.createElement("canvas");

    /** @type {number} The default column width in pixels. */
    private defaultWidth: number;

    /** @type {number} The default header height in pixels. */
    private defaultHeight: number;

    /** @type {HTMLDivElement} The draggable resize indicator. */
    private resizeDiv: HTMLDivElement = document.createElement("div");

    /** @type {MultipleSelectionCoordinates} Selection coordinates shared globally. */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @type {number} Used to track the new width after resizing, primarily for potential undo operations. */
    private newValue: number = 100;

    /**
     * Constructs a new ColumnsCanvas instance for a block of 25 columns.
     * @param {number} columnID - The unique identifier for this canvas block (0-based index of blocks).
     * @param {ColumnData} columnWidths - A Map containing custom widths for individual columns.
     * @param {number} defaultWidth - The default width to apply to columns if no custom width is specified.
     * @param {number} defaultHeight - The default height for the column headers.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - The shared object containing the current selection range in the spreadsheet.
     */
    constructor(
        columnID: number,
        columnWidths: ColumnData,
        defaultWidth: number,
        defaultHeight: number,
        selectionCoordinates: MultipleSelectionCoordinates
    ) {
        this.columnWidths = columnWidths;
        this.columnID = columnID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.columnsPositionArr = [];
        this.selectionCoordinates = selectionCoordinates;
        this.setColumnsPositionArr(); // Initialize column positions based on widths
        this.columnCanvasDiv = this.createcolumnCanvas(); // Create the DOM elements for the canvas block
    }

    /**
     * Retrieves the last stored new width value, typically set after a resize operation.
     * @returns {number} The new width value.
     */
    getNewValue(): number {
        return this.newValue;
    }

    /**
     * Called by an external resizer mechanism to change a column's width dynamically during a drag operation.
     * It calculates the new width, updates the visual resize handle, and triggers a full canvas redraw.
     * @param {number} newPosition - The X coordinate of the drag event relative to the viewport.
     * @param {number} hoverIdx - The index of the column within this canvas block (0-24) that is being hovered over for resizing.
     * @param {number} columnKey - The global unique key of the column being resized (calculated internally based on `columnID` and `hoverIdx`).
     */
    resizeColumn(newPosition: number, hoverIdx: number, columnKey: number): void {
        // Calculate newPosition relative to the left edge of this column canvas div
        newPosition = newPosition - this.columnCanvasDiv.getBoundingClientRect().left;
        let newWidth = hoverIdx !== 0
            ? newPosition - this.columnsPositionArr[hoverIdx - 1] // Calculate width based on previous column boundary
            : newPosition; // If first column in block, width is from left edge

        // Clamp newWidth to a reasonable range (50px to 500px)
        newWidth = Math.max(50, Math.min(500, newWidth));

        // Position the resize handle visually
        this.resizeDiv.style.left = hoverIdx !== 0
            ? `${this.columnsPositionArr[hoverIdx - 1] + newWidth}px`
            : `${newWidth}px`;

        // Calculate the global column key
        columnKey = this.columnID * 25 + hoverIdx + 1;
        // Apply the width change and redraw
        this.changeWidth(newWidth, columnKey);
    }

    /**
     * Modifies the width of a specific column, updates the `columnWidths` map,
     * recalculates all column positions, and then redraws the canvas to reflect the change.
     * @param {number} newWidth - The new width value to apply to the column.
     * @param {number} columnKey - The global unique identifier for the column being changed.
     */
    changeWidth(newWidth: number, columnKey: number): void {
        this.newValue = newWidth; // Store the new width

        // Update or delete the custom width in the map
        if (newWidth === this.defaultWidth) {
            this.columnWidths.delete(columnKey); // If new width is default, remove from map
        } else {
            this.columnWidths.set(columnKey, { width: newWidth }); // Otherwise, set or update custom width
        }
        this.setColumnsPositionArr(); // Recalculate all column positions
        this.drawCanvas(); // Redraw the canvas to show the updated widths
    }

    /**
     * Performs a binary search on `columnsPositionArr` to find a column boundary
     * within a ±5 pixel range of the given `num` (X coordinate). This is used
     * to detect if the user's cursor is near a resizeable column boundary.
     * @param {number} num - The X coordinate (relative to the canvas block's left edge) to search for.
     * @returns {number} The index (0-24) of the column boundary found within the range, or -1 if no boundary is close enough.
     */
    binarySearchRange(num: number): number {
        let start = 0;
        let end = 24; // Represents the 25 columns in the block (0-24)

        while (start <= end) {
            const mid = Math.floor((start + end) / 2);

            // Check if 'num' is within ±5 pixels of the column boundary at 'mid'
            if (this.columnsPositionArr[mid] + 5 >= num && num >= this.columnsPositionArr[mid] - 5) {
                return mid; // Boundary found
            } else if (num > this.columnsPositionArr[mid]) {
                start = mid + 1; // Search in the right half
            } else {
                end = mid - 1; // Search in the left half
            }
        }
        return -1; // No boundary found within the threshold
    }

    /**
     * Creates the main container `div` element (`columnCanvasDiv`) which holds
     * the canvas element and the resize handle `div`. It sets their IDs, classes,
     * and appends them correctly.
     * @returns {HTMLDivElement} The newly created container `div` for the column canvas.
     */
    private createcolumnCanvas(): HTMLDivElement {
        const columnDiv = document.createElement("div");
        columnDiv.id = `column${this.columnID}`; // Set ID based on block ID
        columnDiv.classList.add("subColumn"); // Add CSS class for styling

        this.columnCanvas.setAttribute("col", `${this.columnID}`); // Custom attribute for column block identification
        this.drawCanvas(); // Initial drawing of the canvas content

        columnDiv.appendChild(this.columnCanvas); // Append canvas to its container

        this.resizeDiv.classList.add("ColumnResizeDiv"); // Add CSS class for the resize handle
        columnDiv.appendChild(this.resizeDiv); // Append resize handle to the container

        return columnDiv;
    }

    /**
     * Draws the column headers onto the canvas. This includes drawing the background,
     * column lines, column labels (A, B, C, ...), and applying selection highlights.
     * It accounts for device pixel ratio (DPR) for high-resolution displays.
     */
    drawCanvas(): void {
        // Determine the absolute start and end of the column selection range
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const startNum = this.columnID * 25 + 1; // Global column number for the first column in this block

        const dpr = window.devicePixelRatio || 1; // Get device pixel ratio

        // Set canvas pixel dimensions, scaled by DPR for clarity
        this.columnCanvas.width = this.columnsPositionArr[24] * dpr; // Total width of 25 columns
        this.columnCanvas.height = this.defaultHeight * dpr;

        // Set CSS dimensions to control actual display size
        this.columnCanvas.style.width = `${this.columnsPositionArr[24]}px`;
        this.columnCanvas.style.height = `${this.defaultHeight}px`;

        const ctx = this.columnCanvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.clearRect(0, 0, this.columnsPositionArr[24], this.defaultHeight); // Clear previous drawings
        ctx.scale(dpr, dpr); // Scale context to match DPR

        // Set common text and line styles
        ctx.font = "12px Arial";
        ctx.textBaseline = "middle"; // Vertically center text
        ctx.textAlign = "center"; // Horizontally center text
        ctx.lineWidth = 1;

        // Draw background
        ctx.fillStyle = "#f5f5f5"; // Light gray background
        ctx.fillRect(0, 0, this.columnsPositionArr[24], this.defaultHeight);

        // Draw bottom border line of the header row
        ctx.strokeStyle = "#ddd"; // Light gray border
        ctx.beginPath();
        ctx.moveTo(0, this.defaultHeight - 0.5); // Use 0.5 for crisp single-pixel lines
        ctx.lineTo(this.columnsPositionArr[24], this.defaultHeight - 0.5);
        ctx.stroke();

        // Iterate through each of the 25 columns in this block
        for (let i = 0; i < 25; i++) {
            const xLeft = i === 0 ? 0 : this.columnsPositionArr[i - 1]; // Left X coordinate of the current column
            const xRight = this.columnsPositionArr[i]; // Right X coordinate of the current column
            const colIndex = i + startNum; // Global column index (1-based)
            const xCenter = xRight - (xRight - xLeft) / 2; // Horizontal center for text positioning

            // Check if the current column is within the selected range
            if (this.ifSelected(colIndex)) {
                // Check if the entire spreadsheet column (all rows) is selected
                if (this.ifSelectedWhole()) {
                    // Full column selection style
                    ctx.fillStyle = "#107C41"; // Dark green fill
                    ctx.fillRect(xLeft, 0, xRight - xLeft, this.defaultHeight);
                    ctx.fillStyle = "#ffffff"; // White text
                    ctx.strokeStyle = "#ffffff"; // White lines
                } else {
                    // Partial column selection style (only some rows selected)
                    ctx.fillStyle = "#CAEAD8"; // Light green fill
                    ctx.fillRect(xLeft, 0, xRight - xLeft, this.defaultHeight);

                    // Draw distinct bottom border for partial selection
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#107C41"; // Dark green border
                    ctx.moveTo(xLeft, this.defaultHeight - 1);
                    ctx.lineTo(xRight, this.defaultHeight - 1);
                    ctx.stroke();

                    // Reset fill and stroke for text and grid lines
                    ctx.fillStyle = "#0F703B"; // Darker green text
                    ctx.strokeStyle = "#A0D8B9"; // Lighter green grid lines
                }
            } else {
                // Default unselected style
                ctx.fillStyle = "#616161"; // Gray text
                ctx.strokeStyle = "#ddd"; // Light gray grid lines
            }

            // Draw vertical grid line for each column boundary
            ctx.beginPath();
            ctx.moveTo(this.columnsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.columnsPositionArr[i] - 0.5, this.defaultHeight);
            ctx.stroke();

            // Draw column label (A, B, C, etc.)
            ctx.fillText(this.getColumnString(colIndex), xCenter, this.defaultHeight / 2 + 1);
        }
    }

    /**
     * Checks if a given global column number is currently within the selected range in the spreadsheet.
     * @param {number} num - The global column number to check.
     * @returns {boolean} True if the column is selected, false otherwise.
     */
    private ifSelected(num: number): boolean {
        // Determine the absolute start and end of the selection range
        const start = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const end = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        return num >= start && num <= end;
    }

    /**
     * Determines if the entire column (i.e., all rows from 1 to 1,000,000) is selected.
     * This is used to apply distinct styling for full-column selection versus cell/row-limited selection.
     * @returns {boolean} True if full column selection across all 1,000,000 rows, false if partial or row-limited selection.
     */
    private ifSelectedWhole(): boolean {
        // Determine the absolute start and end of the row selection range
        const start = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const end = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        // Check if the selection spans from the first row (1) to the last row (1,000,000)
        return start === 1 && end === 1000000;
    }

    /**
     * Calculates the cumulative sum of column widths and stores them in `columnsPositionArr`.
     * It uses the `defaultWidth` for columns without an explicit custom width in the `columnWidths` map.
     */
    setColumnsPositionArr(): void {
        const startNum = this.columnID * 25 + 1; // Global column number for the first column in this block
        let prefixSum = 0; // Initialize prefix sum

        this.columnsPositionArr.length = 0; // Reset array
        for (let i = 0; i < 25; i++) {
            const col = this.columnWidths.get(startNum + i);
            prefixSum += col ? col.width : this.defaultWidth; // Add custom width or default
            this.columnsPositionArr.push(prefixSum); // Store cumulative width
        }
    }

    /**
     * Converts a 1-based numerical column index (e.g., 1, 2, 27) into its corresponding Excel-style alphabetical string (e.g., "A", "B", "AA").
     * @param {number} num - The 1-based global numerical column index.
     * @returns {string} The alphabetical string representation of the column.
     */
    private getColumnString(num: number): string {
        num--; // Convert to 0-based for calculation
        if (num < 0) return ""; // Handle invalid input

        // Recursive conversion:
        // Calculate the current character (remainder when divided by 26)
        // Recursively call for the quotient (equivalent to shifting left in base 26)
        return this.getColumnString(Math.floor(num / 26)) + String.fromCharCode("A".charCodeAt(0) + (num % 26));
    }
}