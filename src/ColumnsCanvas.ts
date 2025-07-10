// Imports remain unchanged
import { ColumnData } from "./types/ColumnRows";
import { BooleanObj } from "./types/BooleanObj.js";
import { NumberObj } from "./types/NumberObj";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";

/**
 * Manages the rendering and interaction of column headers on a canvas.
 * Handles column resizing and visual feedback for selections.
 */
export class ColumnsCanvas {
    /** @readonly @type {ColumnData} A map storing custom widths for columns. */
    readonly columnWidths: ColumnData;
    /** @readonly @type {number[]} An array storing the prefix sums of column widths, defining column boundaries. */
    readonly columnsPositionArr: number[];
    /** @readonly @type {number} The unique identifier for this column canvas block (e.g., 0 for A-Y, 1 for Z-AY, etc.). */
    readonly columnID: number;
    /** @readonly @type {HTMLDivElement} The main container div for this column canvas, including the canvas and resize handle. */
    readonly columnCanvasDiv: HTMLDivElement;

    /** @private @type {HTMLCanvasElement} The HTML canvas element used for drawing column headers. */
    private columnCanvas: HTMLCanvasElement = document.createElement("canvas");
    /** @private @type {number} The default width for columns. */
    private defaultWidth: number;
    /** @private @type {number} The default height for column headers. */
    private defaultHeight: number;
    /** @private @type {HTMLDivElement} The draggable div used as a visual handle for column resizing. */
    private resizeDiv: HTMLDivElement = document.createElement("div");
    /** @private @type {BooleanObj} A mutable boolean object indicating if a column resize action is currently active (hovering over a resizable edge). */
    private ifResizeOn: BooleanObj;
    /** @private @type {NumberObj} A mutable number object storing the ID of the column currently being resized. */
    private currentResizingColumn: NumberObj;
    /** @private @type {BooleanObj} A mutable boolean object indicating if the resize pointer is currently held down. */
    private ifResizePointerDown: BooleanObj;
    /** @private @type {number} The index of the column boundary currently being hovered over for resizing, or -1 if none. */
    private hoverIdx: number = -1;
    /** @private @type {MultipleSelectionCoordinates} An object containing the start and end coordinates of the current cell selection. */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @private @type {number} Stores the width of the column *before* a resize operation for undo functionality. */
    private prevValue:number=100;
    /** @private @type {number} Stores the width of the column *after* a resize operation for undo functionality. */
    private newValue:number=100;
    /** @private @type {number} Stores the key (index) of the column being resized for undo functionality. */
    private columnKey:number=-1;

    /**
     * Creates an instance of ColumnsCanvas.
     * @param {number} columnID - The ID of this column canvas block.
     * @param {ColumnData} columnWidths - A map containing custom column widths.
     * @param {number} defaultWidth - The default width for columns.
     * @param {number} defaultHeight - The default height for column headers.
     * @param {BooleanObj} ifResizeOn - Boolean object indicating if resize is active.
     * @param {BooleanObj} ifResizePointerDown - Boolean object indicating if resize pointer is held down.
     * @param {NumberObj} currentResizingColumn - Number object storing the currently resizing column's ID.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object with current selection coordinates.
     */
    constructor(
        columnID: number,
        columnWidths: ColumnData,
        defaultWidth: number,
        defaultHeight: number,
        ifResizeOn: BooleanObj,
        ifResizePointerDown: BooleanObj,
        currentResizingColumn: NumberObj,
        selectionCoordinates: MultipleSelectionCoordinates
    ) {
        this.columnWidths = columnWidths;
        this.columnID = columnID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.columnsPositionArr = []; // Will be populated by setColumnsPositionArr
        this.currentResizingColumn = currentResizingColumn;
        this.ifResizeOn = ifResizeOn;
        this.ifResizePointerDown = ifResizePointerDown;
        this.selectionCoordinates = selectionCoordinates;
        this.setColumnsPositionArr(); // Initialize column positions
        this.columnCanvasDiv = this.createcolumnCanvas(); // Create the DOM elements
        this.handleResize(); // Attach event listeners for resizing
    }

    /**
     * Gets the previous width value of the column being resized.
     * @returns {number} The previous width.
     */
    getPrevValue(): number {
        return this.prevValue;
    }

    /**
     * Gets the new width value of the column after resizing.
     * @returns {number} The new width.
     */
    getNewValue(): number {
        return this.newValue;
    }

    /**
     * Gets the key (index) of the column being resized.
     * @returns {number} The column key.
     */
    getColumnKey(): number {
        return this.columnKey;
    }

    /**
     * Sets up event listeners for column resizing interactions (pointerdown, pointermove, pointerout).
     * This method manages the visual feedback of the resize handle and updates resize state flags.
     */
    private handleResize() {
        this.columnCanvasDiv.addEventListener("pointerdown", (event) => {
            if (event.button === 1) return; // Ignore middle-click
            this.hoverIdx = this.binarySearchRange(event.offsetX); // Determine which column boundary is hovered
            if (this.hoverIdx !== -1) {
                this.ifResizePointerDown.value = true; // Set flag when pointer is down on a resizable edge
                // Calculate the global column key
                const columnKey = this.columnID * 25 + 1 + this.hoverIdx;
                // Store the previous width for undo/redo
                this.prevValue = this.columnWidths.get(columnKey)?.width || 100;
                this.newValue = this.prevValue; // Initialize newValue with prevValue
                this.columnKey = columnKey; // Store the column key
            }
        });

        this.columnCanvasDiv.addEventListener("pointermove", (event) => {
            if (this.ifResizePointerDown.value) {
                // If resize is active and pointer is down, indicate which column canvas is involved in resizing
                this.currentResizingColumn.value = this.columnID;
                return;
            }

            this.hoverIdx = this.binarySearchRange(event.offsetX); // Find hovered column boundary

            if (this.hoverIdx !== -1) {
                this.ifResizeOn.value = true; // Indicate that resizing is possible
                this.resizeDiv.style.display = "block"; // Show the resize handle
                // Position the resize handle at the column boundary
                this.resizeDiv.style.left = `${this.columnsPositionArr[this.hoverIdx] - 1.5}px`;
                this.resizeDiv.style.zIndex = `10`; // Bring resize handle to front
            } else {
                if (!this.ifResizePointerDown.value) {
                    // Hide resize handle if not hovering and not currently resizing
                    this.resizeDiv.style.display = "none";
                }
                this.ifResizeOn.value = false; // Indicate that resizing is not possible
            }
        });

        this.columnCanvasDiv.addEventListener("pointerout", () => {
            if (!this.ifResizePointerDown.value) {
                // Hide resize handle when pointer leaves if not actively resizing
                this.resizeDiv.style.display = "none";
            }
            this.ifResizeOn.value = false; // Reset resize active flag
        });
    }

    /**
     * Resizes the column identified by `hoverIdx` based on the new pointer position.
     * Updates the `resizeDiv`'s position and calls `changeWidth` to update column data.
     * @param {number} newPosition - The new X-coordinate of the pointer relative to the viewport.
     */
    resizeColumn(newPosition: number) {
        // Convert viewport position to position relative to the column canvas div
        newPosition = newPosition - this.columnCanvasDiv.getBoundingClientRect().left;

        let newWidth;
        if (this.hoverIdx !== 0) {
            // Calculate new width based on the previous column boundary
            newWidth = newPosition - this.columnsPositionArr[this.hoverIdx - 1];
        } else {
            // If it's the first column, new width is simply the new position
            newWidth = newPosition;
        }

        // Clamp the new width to ensure it stays within reasonable bounds
        newWidth = Math.max(50, newWidth);
        newWidth = Math.min(500, newWidth);

        // Update the visual position of the resize handle
        if (this.hoverIdx !== 0) {
            this.resizeDiv.style.left = `${this.columnsPositionArr[this.hoverIdx - 1] + newWidth}px`;
        } else {
            this.resizeDiv.style.left = `${newWidth}px`;
        }

        // Calculate the global column key for the resized column
        this.columnKey = this.columnID * 25 + this.hoverIdx + 1;
        
        // Apply the width change and trigger canvas redraw
        this.changeWidth(newWidth, this.columnKey);
    }

    /**
     * Updates the width of a specific column in `columnWidths` and redraws the canvas.
     * If `newWidth` is equal to `defaultWidth`, the entry for the column is removed,
     * effectively resetting it to the default.
     * @param {number} newWidth - The new width to set for the column.
     * @param {number} columnKey - The key (index) of the column to update.
     */
    changeWidth(newWidth: number, columnKey: number) {
        this.newValue = newWidth; // Store the new value for undo/redo
        if (newWidth === this.defaultWidth) {
            this.columnWidths.delete(columnKey); // If default width, remove entry
        } else {
            this.columnWidths.set(columnKey, { width: newWidth }); // Otherwise, set custom width
        }

        this.setColumnsPositionArr(); // Recalculate column positions
        this.drawCanvas(); // Redraw the canvas to reflect changes
    }

    /**
     * Performs a binary search on `columnsPositionArr` to find if the given `num` (offset)
     * is within a small range (e.g., +/- 5 pixels) of any column boundary.
     * This helps in identifying if the pointer is near a resizable edge.
     * @private
     * @param {number} num - The X-coordinate offset within the canvas.
     * @returns {number} The index of the column boundary if found, otherwise -1.
     */
    private binarySearchRange(num: number): number {
        let start = 0;
        let end = 24; // There are 25 columns per canvas (0-24 index)
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            // Check if num is within a +/- 5 pixel range of the boundary
            if (this.columnsPositionArr[mid] + 5 >= num && num >= this.columnsPositionArr[mid] - 5) {
                return mid;
            } else if (num > this.columnsPositionArr[mid]) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        return -1; // No boundary found in range
    }

    /**
     * Creates the main HTML structure for the column canvas:
     * a div containing the canvas element and the resize handle div.
     * @private
     * @returns {HTMLDivElement} The created column canvas container div.
     */
    private createcolumnCanvas(): HTMLDivElement {
        const columnDiv = document.createElement("div");
        columnDiv.id = `column${this.columnID}`; // Assign unique ID
        columnDiv.classList.add("subColumn"); // Add base class for styling

        this.columnCanvas.setAttribute("col", `${this.columnID}`); // Set custom attribute for column ID
        this.drawCanvas(); // Initial draw of the canvas

        columnDiv.appendChild(this.columnCanvas); // Add canvas to the container div
        this.resizeDiv.classList.add("ColumnResizeDiv"); // Add class for styling the resize handle
        columnDiv.appendChild(this.resizeDiv); // Add resize handle to the container div
        return columnDiv;
    }

    /**
     * Draws the column headers on the canvas.
     * This includes column labels (A, B, C...), grid lines, and selection highlights.
     */
    drawCanvas() {
        // Determine the effective selection range for columns on this canvas
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const startNum = this.columnID * 25 + 1; // The starting global column number for this canvas (e.g., 1, 26, 51...)

        // Set canvas dimensions based on device pixel ratio for sharp rendering
        const dpr = window.devicePixelRatio || 1;
        this.columnCanvas.width = this.columnsPositionArr[24] * dpr; // Total width of 25 columns
        this.columnCanvas.height = this.defaultHeight * dpr;
        this.columnCanvas.style.width = `${this.columnsPositionArr[24]}px`;
        this.columnCanvas.style.height = `${this.defaultHeight}px`;

        const ctx = this.columnCanvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.clearRect(0, 0, this.columnsPositionArr[24], this.defaultHeight); // Clear previous drawings
        ctx.scale(dpr, dpr); // Apply DPR scaling
        ctx.font = "12px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#f5f5f5"; // Background color
        ctx.fillRect(0, 0, this.columnsPositionArr[24], this.defaultHeight); // Fill background

        // Draw bottom border of the header
        ctx.strokeStyle = "#ddd";
        ctx.beginPath();
        ctx.moveTo(0, this.defaultHeight - 0.5);
        ctx.lineTo(this.columnsPositionArr[24], this.defaultHeight - 0.5);
        ctx.stroke();

        let heightOffset = 0; // Used for adjusting line height when selected

        // Loop through 25 columns on this canvas
        for (let i = 0; i < 25; i++) {
            const xLeft = i === 0 ? 0 : this.columnsPositionArr[i - 1]; // Left edge of the current column
            const xRight = this.columnsPositionArr[i]; // Right edge of the current column
            const colIndex = i + startNum; // Global column index (1-based)
            const xCenter = xRight - (xRight - xLeft) / 2; // Center for text alignment

            // Apply selection styling if the current column is selected
            if (this.ifSelected(colIndex)) {
                heightOffset = 2; // Adjust for thicker bottom border
                if (this.ifSelectedWhole()) {
                    // If entire columns are selected (from row 1 to last row)
                    ctx.fillStyle = "#107C41"; // Dark green fill
                    ctx.fillRect(xLeft, 0, xRight - xLeft, this.defaultHeight);
                    ctx.fillStyle = "#ffffff"; // White text
                    ctx.strokeStyle = "#ffffff"; // White stroke for inner lines
                } else {
                    // If only part of the columns are selected
                    ctx.fillStyle = "#CAEAD8"; // Light green fill
                    ctx.fillRect(xLeft, 0, xRight - xLeft, this.defaultHeight);

                    // Draw a thicker bottom border for partial selection
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#107C41"; // Dark green border
                    ctx.moveTo(xLeft, this.defaultHeight - 1);
                    ctx.lineTo(xRight, this.defaultHeight - 1);
                    ctx.stroke();

                    ctx.beginPath(); // Reset path for text and inner lines
                    ctx.lineWidth = 1;
                    ctx.fillStyle = "#0F703B"; // Darker green text
                    ctx.strokeStyle = "#A0D8B9"; // Lighter green stroke for inner lines
                }
            } else {
                // Default styling for unselected columns
                ctx.fillStyle = "#616161"; // Grey text
                ctx.strokeStyle = "#ddd"; // Light grey stroke
                heightOffset = 0;
            }

            // Draw vertical grid line for each column
            ctx.beginPath();
            ctx.moveTo(this.columnsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.columnsPositionArr[i] - 0.5, this.defaultHeight - heightOffset);
            ctx.stroke();

            // Draw column letter (e.g., A, B, C...)
            ctx.fillText(this.getColumnString(colIndex), xCenter, this.defaultHeight / 2 + 1);
        }

        // Draw the rightmost selection border if applicable
        ctx.beginPath();
        if (this.ifSelectedWhole()) {
            // For whole column selection, apply dark green border
            if (
                canvasEndColumn <= this.columnID * 25 + 25 &&
                canvasEndColumn >= this.columnID * 25 + 1 &&
                (canvasEndColumn === this.selectionCoordinates.selectionStartColumn ||
                    canvasEndColumn === this.selectionCoordinates.selectionEndColumn)
            ) {
                const lastIdx = (canvasEndColumn - 1) % 25; // Index within this canvas
                ctx.strokeStyle = "#107C41"; // Dark green
                ctx.lineWidth = 2;
                ctx.moveTo(this.columnsPositionArr[lastIdx] - 1, 0);
                ctx.lineTo(this.columnsPositionArr[lastIdx] - 1, this.defaultHeight);
            }
        } else {
            // For partial column selection, apply lighter green border
            if (
                canvasStartColumn <= this.columnID * 25 + 25 &&
                canvasStartColumn >= this.columnID * 25 + 1 &&
                (canvasStartColumn === this.selectionCoordinates.selectionStartColumn ||
                    canvasStartColumn === this.selectionCoordinates.selectionEndColumn)
            ) {
                const firstIdx = (canvasStartColumn - 1) % 25; // Index within this canvas
                ctx.strokeStyle = "#A0D8B9"; // Lighter green
                ctx.lineWidth = 1;
                ctx.moveTo(firstIdx === 0 ? 0 : this.columnsPositionArr[firstIdx - 1], 0);
                ctx.lineTo(firstIdx === 0 ? 0 : this.columnsPositionArr[firstIdx - 1], this.defaultHeight);
            }
        }
        ctx.stroke(); // Final stroke for the rightmost selection border
    }

    /**
     * Checks if a given column number is within the current selection range.
     * @private
     * @param {number} num - The global column number to check.
     * @returns {boolean} True if the column is selected, false otherwise.
     */
    private ifSelected(num: number): boolean {
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        return num >= canvasStartColumn && num <= canvasEndColumn;
    }

    /**
     * Checks if the entire column range (from row 1 to 1,000,000) is selected.
     * This is used to determine if a "whole column" selection style should be applied.
     * @private
     * @returns {boolean} True if the entire column range is selected, false otherwise.
     */
    private ifSelectedWhole(): boolean {
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        return canvasStartRow === 1 && canvasEndRow === 1000000;
    }

    /**
     * Calculates and updates the `columnsPositionArr` which stores the cumulative widths
     * of columns, effectively defining the X-coordinates of their right boundaries.
     * This array is crucial for rendering columns and determining click/hover positions.
     */
    setColumnsPositionArr() {
        const startNum = this.columnID * 25 + 1; // Global starting column number for this canvas
        let prefixSum = 0;
        this.columnsPositionArr.length = 0; // Clear the array before repopulating

        for (let i = 0; i < 25; i++) { // Iterate through 25 columns handled by this canvas
            const col = this.columnWidths.get(startNum + i); // Get custom width if exists
            prefixSum += col ? col.width : this.defaultWidth; // Add custom or default width
            this.columnsPositionArr.push(prefixSum); // Store cumulative width
        }
    }

    /**
     * Converts a 1-based column number to its corresponding Excel-style column string (e.g., 1 -> A, 26 -> Z, 27 -> AA).
     * @private
     * @param {number} num - The 1-based column number.
     * @returns {string} The Excel-style column string.
     */
    private getColumnString(num: number): string {
        num--; // Convert to 0-based index
        if (num < 0) return ""; // Handle invalid input
        // Recursively build the column string
        return this.getColumnString(Math.floor(num / 26)) + String.fromCharCode("A".charCodeAt(0) + (num % 26));
    }
}