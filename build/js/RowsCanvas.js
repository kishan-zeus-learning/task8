/**
 * Represents a canvas-based rendering of a block of 25 rows.
 * Handles row drawing, resizing, and rendering optimizations.
 */
export class RowsCanvas {
    /**
     * Initializes the RowsCanvas with layout and resize behavior.
     * @param rowID Index of this row block
     * @param rowHeights Custom height map
     * @param defaultWidth Default width of rows
     * @param defaultHeight Default height of rows
     * @param ifResizeOn Shared global boolean for resize indicator
     * @param ifResizePointerDown Shared global boolean for pointer down
     * @param currentResizingRow Shared global row ID during resizing
     */
    constructor(rowID, rowHeights, defaultWidth, defaultHeight, ifResizeOn, ifResizePointerDown, currentResizingRow) {
        /** The canvas element used to render rows */
        this.rowCanvas = document.createElement("canvas");
        /** The horizontal resize UI indicator element */
        this.resizeDiv = document.createElement("div");
        /** Index of the row currently being hovered near a resize boundary */
        this.hoverIdx = -1;
        this.rowHeights = rowHeights;
        this.rowID = rowID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsPositionArr = [];
        this.currentResizingRow = currentResizingRow;
        this.ifResizeOn = ifResizeOn;
        this.ifResizePointerDown = ifResizePointerDown;
        this.setRowsPositionArr();
        this.rowCanvasDiv = this.createRowCanvas();
        this.handleResize();
    }
    /**
     * Adds resize behavior and hover logic to row borders.
     */
    handleResize() {
        this.rowCanvasDiv.addEventListener("pointerdown", (event) => {
            this.ifResizePointerDown.value = true;
        });
        this.rowCanvasDiv.addEventListener("pointermove", (event) => {
            if (this.ifResizePointerDown.value) {
                this.currentResizingRow.value = this.rowID;
                return;
            }
            this.hoverIdx = this.binarySearchRange(event.offsetY);
            if (this.hoverIdx !== -1) {
                this.ifResizeOn.value = true;
                this.resizeDiv.style.display = "block";
                this.resizeDiv.style.top = `${this.rowsPositionArr[this.hoverIdx] - 1.5}px`;
                this.resizeDiv.style.zIndex = `10`;
            }
            else {
                if (!this.ifResizePointerDown.value) {
                    if (this.resizeDiv)
                        this.resizeDiv.style.display = "none";
                }
                this.ifResizeOn.value = false;
            }
        });
        this.rowCanvasDiv.addEventListener("pointerout", (event) => {
            if (!this.ifResizePointerDown.value) {
                if (this.resizeDiv)
                    this.resizeDiv.style.display = "none";
            }
            this.ifResizeOn.value = false;
        });
    }
    /**
     * Resizes a specific row when dragged, clamps height, and redraws.
     * @param newPosition The new Y position of the mouse
     */
    resizeRow(newPosition) {
        newPosition = newPosition - this.rowCanvasDiv.getBoundingClientRect().top;
        let newHeight;
        if (this.hoverIdx !== 0) {
            newHeight = newPosition - this.rowsPositionArr[this.hoverIdx - 1];
        }
        else {
            newHeight = newPosition;
        }
        newHeight = Math.max(25, newHeight);
        newHeight = Math.min(500, newHeight);
        if (this.hoverIdx !== 0) {
            this.resizeDiv.style.top = `${this.rowsPositionArr[this.hoverIdx - 1] + newHeight}px`;
        }
        else {
            this.resizeDiv.style.top = `${newHeight}px`;
        }
        const rowKey = this.rowID * 25 + this.hoverIdx + 1;
        if (newHeight === 25)
            delete this.rowHeights[rowKey];
        else
            this.rowHeights[rowKey] = { height: newHeight };
        this.setRowsPositionArr();
        this.drawCanvas();
    }
    /**
     * Finds the row index near the given vertical coordinate using binary search.
     * @param num The Y offset to check
     * @returns Row index if found near boundary, else -1
     */
    binarySearchRange(num) {
        let start = 0;
        let end = 24;
        let mid;
        while (start <= end) {
            mid = Math.floor((start + end) / 2);
            if (this.rowsPositionArr[mid] + 5 >= num && num >= this.rowsPositionArr[mid] - 5) {
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
     * Recalculates and stores vertical positions of rows using prefix sum.
     */
    setRowsPositionArr() {
        let startNum = this.rowID * 25 + 1;
        let prefixSum = 0;
        this.rowsPositionArr.length = 0;
        for (let i = 0; i < 25; i++) {
            if (this.rowHeights[i + startNum]) {
                prefixSum += this.rowHeights[i + startNum].height;
            }
            else {
                prefixSum += this.defaultHeight;
            }
            this.rowsPositionArr.push(prefixSum);
        }
    }
    /**
     * Creates and initializes the DOM structure for a single row block.
     * @returns HTMLDivElement containing canvas and resize line
     */
    createRowCanvas() {
        const rowDiv = document.createElement("div");
        rowDiv.id = `row${this.rowID}`;
        rowDiv.classList.add("subRow");
        this.drawCanvas();
        rowDiv.appendChild(this.rowCanvas);
        this.resizeDiv.classList.add("RowResizeDiv");
        rowDiv.appendChild(this.resizeDiv);
        return rowDiv;
    }
    /**
     * Draws row numbers and horizontal lines on the canvas.
     * Uses device pixel ratio for sharper rendering.
     */
    drawCanvas() {
        if (!this.rowCanvas)
            return;
        const dpr = window.devicePixelRatio || 1;
        this.rowCanvas.width = this.defaultWidth * dpr;
        this.rowCanvas.height = this.rowsPositionArr[24] * dpr;
        this.rowCanvas.style.width = `${this.defaultWidth}px`;
        this.rowCanvas.style.height = `${this.rowsPositionArr[24]}px`;
        const ctx = this.rowCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.defaultWidth, this.rowsPositionArr[24]);
        ctx.scale(dpr, dpr);
        ctx.beginPath();
        ctx.fillStyle = "#e7e7e7";
        ctx.fillRect(0, 0, this.defaultWidth, this.rowsPositionArr[24]);
        ctx.font = '16px Arial';
        ctx.lineWidth = 1;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        let startNum = this.rowID * 25 + 1;
        const offset = 0.5 / dpr;
        for (let i = 0; i < 25; i++) {
            ctx.moveTo(0, this.rowsPositionArr[i] - offset);
            ctx.lineTo(this.defaultWidth, this.rowsPositionArr[i] - offset);
            const yPos = Math.round(this.rowsPositionArr[i] -
                (this.rowsPositionArr[i] - (i === 0 ? 0 : this.rowsPositionArr[i - 1])) / 2 + 1);
            ctx.fillText(`${i + startNum}`, this.defaultWidth - 5, yPos);
        }
        ctx.moveTo(this.defaultWidth - 0.5, 0);
        ctx.lineTo(this.defaultWidth - 0.5, this.rowsPositionArr[24]);
        ctx.moveTo(0.5, 0);
        ctx.lineTo(0.5, this.rowsPositionArr[24]);
        ctx.stroke();
    }
}
