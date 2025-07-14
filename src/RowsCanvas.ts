import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";
import { RowData } from "./types/RowsColumn";

/**
 * Represents a canvas-based rendering of a block of 25 rows.
 * Handles row drawing, resizing, and rendering optimizations.
 */
export class RowsCanvas {
    /** Map holding the heights of individual rows */
    readonly rowHeights: RowData;

    /** Array storing cumulative heights for quick lookup of row boundaries */
    readonly rowsPositionArr: number[];

    /** Identifier for this block of 25 rows */
    readonly rowID: number;

    /** Container div element holding the canvas and resize handle */
    readonly rowCanvasDiv: HTMLDivElement;

    /** Canvas element where the rows are rendered */
    readonly rowCanvas: HTMLCanvasElement = document.createElement("canvas");

    /** Default width for this canvas block */
    private defaultWidth: number;

    /** Default height for each row */
    private defaultHeight: number;

    /** Div element used as a visual resize handle */
    private resizeDiv: HTMLDivElement = document.createElement("div");

    /** Current selection coordinates within the spreadsheet */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** Current resized row height value */
    private newValue: number = 25;

    /**
     * Constructs a new RowsCanvas block for rendering 25 rows.
     * @param rowID - ID of this block (zero-based index of blocks)
     * @param rowHeights - Map of individual row heights
     * @param defaultWidth - Default width of the canvas area
     * @param defaultHeight - Default height for each row
     * @param selectionCoordinates - Current selection state in spreadsheet
     */
    constructor(
        rowID: number,
        rowHeights: RowData,
        defaultWidth: number,
        defaultHeight: number,
        selectionCoordinates: MultipleSelectionCoordinates
    ) {
        this.rowHeights = rowHeights;
        this.rowID = rowID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsPositionArr = [];
        this.selectionCoordinates = selectionCoordinates;

        this.setRowsPositionArr();           // Populate initial cumulative row heights
        this.rowCanvasDiv = this.createRowCanvas(); // Create DOM structure with canvas and resize div
    }

    /** Returns the current new row height after resizing */
    getNewValue(): number {
        return this.newValue;
    }

    /**
     * Called during drag operation to resize a row.
     * Calculates new height based on drag position and updates visuals.
     * @param newPosition - Y coordinate of drag event
     * @param hoverIdx - Index of hovered row within this block (0-24)
     * @param rowKey - Unique key of the row (calculated here)
     */
    resizeRow(newPosition: number, hoverIdx: number, rowKey: number): void {
        // Calculate relative position inside the canvas container
        newPosition = newPosition - this.rowCanvasDiv.getBoundingClientRect().top;
        let newHeight: number;

        // Calculate new height based on hovered row boundary or absolute position
        if (hoverIdx !== 0) {
            newHeight = newPosition - this.rowsPositionArr[hoverIdx - 1];
        } else {
            newHeight = newPosition;
        }

        // Clamp the new height within reasonable bounds
        newHeight = Math.max(25, Math.min(500, newHeight));

        // Move the resize handle visually
        if (hoverIdx !== 0) {
            this.resizeDiv.style.top = `${this.rowsPositionArr[hoverIdx - 1] + newHeight}px`;
        } else {
            this.resizeDiv.style.top = `${newHeight}px`;
        }

        // Compute global row key from block ID and hover index
        rowKey = this.rowID * 25 + hoverIdx + 1;
        this.changeHeight(newHeight, rowKey);
    }

    /**
     * Modifies the height of a row and triggers re-rendering of the canvas.
     * @param newHeight - New height value to apply
     * @param rowKey - Unique row identifier in rowHeights map
     */
    changeHeight(newHeight: number, rowKey: number): void {
        this.newValue = newHeight;

        // Remove from map if height is default, else update map
        if (newHeight === 25) {
            this.rowHeights.delete(rowKey);
        } else {
            this.rowHeights.set(rowKey, { height: newHeight });
        }

        // Recompute cumulative positions and redraw the canvas
        this.setRowsPositionArr();
        this.drawCanvas();
    }

    /**
     * Finds the row boundary index within ±5 pixels of a given Y coordinate.
     * Used to detect if user is hovering near a row boundary for resizing.
     * @param num - Y coordinate to test
     * @returns Index of row boundary or -1 if none found within threshold
     */
    binarySearchRange(num: number): number {
        let start = 0;
        let end = 24;

        while (start <= end) {
            const mid = Math.floor((start + end) / 2);

            if (Math.abs(num - this.rowsPositionArr[mid]) <= 5) {
                return mid;
            } else if (num > this.rowsPositionArr[mid]) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }

        return -1;
    }

    /**
     * Calculates the cumulative sum of row heights into `rowsPositionArr`.
     * Uses defaultHeight for rows without an explicit height in the map.
     */
    setRowsPositionArr(): void {
        let startNum = this.rowID * 25 + 1;
        let prefixSum = 0;

        this.rowsPositionArr.length = 0; // reset array
        for (let i = 0; i < 25; i++) {
            const rowData = this.rowHeights.get(i + startNum);
            prefixSum += rowData ? rowData.height : this.defaultHeight;
            this.rowsPositionArr.push(prefixSum);
        }
    }

    /**
     * Creates the container div holding the canvas and resize div elements.
     * Sets appropriate attributes and styles, then draws the initial canvas.
     * @returns The constructed HTMLDivElement
     */
    private createRowCanvas(): HTMLDivElement {
        const rowDiv = document.createElement("div");
        rowDiv.id = `row${this.rowID}`;
        rowDiv.classList.add("subRow");

        this.rowCanvas.setAttribute("row", `${this.rowID}`);
        this.drawCanvas();

        rowDiv.appendChild(this.rowCanvas);

        this.resizeDiv.classList.add("RowResizeDiv");
        rowDiv.appendChild(this.resizeDiv);

        return rowDiv;
    }

    /**
     * Draws the 25 rows inside the canvas, including highlights for selected rows.
     * Handles scaling for device pixel ratio for crisp rendering.
     */
    drawCanvas(): void {
        if (!this.rowCanvas) return;

        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = this.defaultWidth;
        const canvasHeight = this.rowsPositionArr[24]; // total height of 25 rows

        // Set canvas pixel dimensions accounting for device pixel ratio
        this.rowCanvas.width = canvasWidth * dpr;
        this.rowCanvas.height = canvasHeight * dpr;

        this.rowCanvas.style.width = `${canvasWidth}px`;
        this.rowCanvas.style.height = `${canvasHeight}px`;

        const ctx = this.rowCanvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Determine selected row range for highlighting
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);

        // Draw background
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw right border line
        ctx.beginPath();
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.moveTo(canvasWidth - 0.5, 0);
        ctx.lineTo(canvasWidth - 0.5, canvasHeight);
        ctx.stroke();

        // Setup text style for row numbers
        ctx.font = '14px Arial';
        ctx.lineWidth = 1;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        const offset = 0.5;
        const startNum = this.rowID * 25 + 1;

        for (let i = 0; i < 25; i++) {
            const yTop = (i === 0) ? 0 : this.rowsPositionArr[i - 1];
            const yBottom = this.rowsPositionArr[i];
            const yPos = Math.round(yBottom - (yBottom - yTop) / 2 + 1);
            const rowIndex = i + startNum;

            let widthOffset = 0;

            // Highlight row if selected
            if (this.ifSelected(rowIndex)) {
                widthOffset = 2;

                if (this.ifSelectedWhole()) {
                    ctx.fillStyle = "#107C41";
                    ctx.fillRect(0, yTop, canvasWidth, yBottom - yTop);
                    ctx.fillStyle = "#ffffff";
                    ctx.strokeStyle = "#ffffff";
                } else {
                    ctx.fillStyle = "#CAEAD8";
                    ctx.fillRect(0, yTop, canvasWidth, yBottom - yTop);

                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#107C41";
                    ctx.moveTo(canvasWidth - 1, yTop);
                    ctx.lineTo(canvasWidth - 1, yBottom);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.fillStyle = "#0F703B";
                    ctx.strokeStyle = "#A0D8B9";
                }
            } else {
                ctx.fillStyle = "#616161";
                ctx.strokeStyle = "#ddd";
            }

            // Draw horizontal grid line for each row boundary
            ctx.beginPath();
            ctx.moveTo(0, this.rowsPositionArr[i] - offset);
            ctx.lineTo(canvasWidth - widthOffset, this.rowsPositionArr[i] - offset);
            ctx.stroke();

            // Draw row number text
            ctx.fillText(`${rowIndex}`, canvasWidth - 5, yPos);
        }

        // Draw bottom border highlight if selection is whole rows block or partial
        ctx.beginPath();
        if (this.ifSelectedWhole()) {
            if (
                canvasEndRow <= this.rowID * 25 + 25 &&
                canvasEndRow >= this.rowID * 25 + 1 &&
                (canvasEndRow === this.selectionCoordinates.selectionStartRow ||
                    canvasEndRow === this.selectionCoordinates.selectionEndRow)
            ) {
                const lastIdx = (canvasEndRow - 1) % 25;
                ctx.strokeStyle = "#107C41";
                ctx.lineWidth = 2;
                ctx.moveTo(0, this.rowsPositionArr[lastIdx] - 1);
                ctx.lineTo(canvasWidth, this.rowsPositionArr[lastIdx] - 1);
            }
        } else {
            if (
                canvasStartRow <= this.rowID * 25 + 25 &&
                canvasStartRow >= this.rowID * 25 + 1 &&
                (canvasStartRow === this.selectionCoordinates.selectionStartRow ||
                    canvasStartRow === this.selectionCoordinates.selectionEndRow)
            ) {
                const firstIdx = (canvasStartRow - 1) % 25;
                ctx.strokeStyle = "#A0D8B9";
                ctx.lineWidth = 1;
                ctx.moveTo(0, firstIdx === 0 ? 0 : this.rowsPositionArr[firstIdx - 1]);
                ctx.lineTo(canvasWidth, firstIdx === 0 ? 0 : this.rowsPositionArr[firstIdx - 1]);
            }
        }
        ctx.stroke();
    }

    /**
     * Checks if a given row number is currently within the selected range.
     * @param num - Row number to check
     * @returns True if the row is selected, false otherwise
     */
    private ifSelected(num: number): boolean {
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        return num >= canvasStartRow && num <= canvasEndRow;
    }

    /**
     * Determines if the entire row block (all columns) is selected.
     * @returns True if full row selection, false if partial or column-limited selection
     */
    private ifSelectedWhole(): boolean {
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        return canvasStartColumn === 1 && canvasEndColumn === 1000;
    }
}
