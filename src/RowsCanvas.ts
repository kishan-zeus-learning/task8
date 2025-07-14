import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";
import { RowData } from "./types/RowsColumn";

/**
 * Represents a canvas-based rendering of a block of 25 rows.
 * Handles row drawing, resizing, and rendering optimizations.
 */
export class RowsCanvas {
    readonly rowHeights: RowData;
    readonly rowsPositionArr: number[];
    readonly rowID: number;
    readonly rowCanvasDiv: HTMLDivElement;
    readonly rowCanvas: HTMLCanvasElement = document.createElement("canvas");

    private defaultWidth: number;
    private defaultHeight: number;
    private resizeDiv: HTMLDivElement = document.createElement("div");

    private selectionCoordinates: MultipleSelectionCoordinates;
    private newValue: number = 25;

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

        this.setRowsPositionArr();           // Populate initial row boundaries
        this.rowCanvasDiv = this.createRowCanvas(); // Build DOM elements and attach canvas
    }

    getNewValue(): number {
        return this.newValue;
    }

    /**
     * Called during drag operation to resize a row.
     */
    resizeRow(newPosition: number, hoverIdx: number, rowKey: number): void {
        newPosition = newPosition - this.rowCanvasDiv.getBoundingClientRect().top;
        let newHeight: number;

        if (hoverIdx !== 0) {
            newHeight = newPosition - this.rowsPositionArr[hoverIdx - 1];
        } else {
            newHeight = newPosition;
        }

        newHeight = Math.max(25, Math.min(500, newHeight));

        if (hoverIdx !== 0) {
            this.resizeDiv.style.top = `${this.rowsPositionArr[hoverIdx - 1] + newHeight}px`;
        } else {
            this.resizeDiv.style.top = `${newHeight}px`;
        }

        rowKey = this.rowID * 25 + hoverIdx + 1;
        this.changeHeight(newHeight, rowKey);
    }

    /**
     * Modifies row height and re-renders the canvas.
     */
    changeHeight(newHeight: number, rowKey: number): void {
        this.newValue = newHeight;

        if (newHeight === 25) {
            this.rowHeights.delete(rowKey);
        } else {
            this.rowHeights.set(rowKey, { height: newHeight });
        }

        this.setRowsPositionArr();
        this.drawCanvas();
    }

    /**
     * Finds row boundary within ±5px of a given Y coordinate.
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
     * Updates the `rowsPositionArr` array using cumulative height logic.
     */
    setRowsPositionArr(): void {
        let startNum = this.rowID * 25 + 1;
        let prefixSum = 0;

        this.rowsPositionArr.length = 0;
        for (let i = 0; i < 25; i++) {
            const rowData = this.rowHeights.get(i + startNum);
            prefixSum += rowData ? rowData.height : this.defaultHeight;
            this.rowsPositionArr.push(prefixSum);
        }
    }

    /**
     * Creates a div container with canvas and resize line for the current row block.
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
     * Draws the 25 rows inside the canvas, with selection highlights.
     */
    drawCanvas(): void {
        if (!this.rowCanvas) return;

        const dpr = window.devicePixelRatio || 1;
        const canvasWidth = this.defaultWidth;
        const canvasHeight = this.rowsPositionArr[24];

        this.rowCanvas.width = canvasWidth * dpr;
        this.rowCanvas.height = canvasHeight * dpr;

        this.rowCanvas.style.width = `${canvasWidth}px`;
        this.rowCanvas.style.height = `${canvasHeight}px`;

        const ctx = this.rowCanvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);

        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.beginPath();
        ctx.strokeStyle = "#ddd";
        ctx.lineWidth = 1;
        ctx.moveTo(canvasWidth - 0.5, 0);
        ctx.lineTo(canvasWidth - 0.5, canvasHeight);
        ctx.stroke();

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

            ctx.beginPath();
            ctx.moveTo(0, this.rowsPositionArr[i] - offset);
            ctx.lineTo(canvasWidth - widthOffset, this.rowsPositionArr[i] - offset);
            ctx.stroke();

            ctx.fillText(`${rowIndex}`, canvasWidth - 5, yPos);
        }

        // Bottom border for selection
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

    private ifSelected(num: number): boolean {
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        return num >= canvasStartRow && num <= canvasEndRow;
    }

    private ifSelectedWhole(): boolean {
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        return canvasStartColumn === 1 && canvasEndColumn === 1000;
    }
}