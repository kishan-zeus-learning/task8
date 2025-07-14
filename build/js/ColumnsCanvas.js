// ColumnsCanvas.ts with comments
/**
 * Manages the rendering and interaction of column headers on a canvas.
 * Handles column resizing and visual feedback for selections.
 */
export class ColumnsCanvas {
    constructor(columnID, columnWidths, defaultWidth, defaultHeight, selectionCoordinates) {
        /** The canvas element used for drawing headers. */
        this.columnCanvas = document.createElement("canvas");
        /** The draggable resize indicator. */
        this.resizeDiv = document.createElement("div");
        /** Used to track new width after resizing for undo. */
        this.newValue = 100;
        this.columnWidths = columnWidths;
        this.columnID = columnID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.columnsPositionArr = [];
        this.selectionCoordinates = selectionCoordinates;
        this.setColumnsPositionArr();
        this.columnCanvasDiv = this.createcolumnCanvas();
    }
    getNewValue() {
        return this.newValue;
    }
    /**
     * Called by external resizer to change column width dynamically.
     */
    resizeColumn(newPosition, hoverIdx, columnKey) {
        newPosition = newPosition - this.columnCanvasDiv.getBoundingClientRect().left;
        let newWidth = hoverIdx !== 0
            ? newPosition - this.columnsPositionArr[hoverIdx - 1]
            : newPosition;
        newWidth = Math.max(50, Math.min(500, newWidth));
        this.resizeDiv.style.left = hoverIdx !== 0
            ? `${this.columnsPositionArr[hoverIdx - 1] + newWidth}px`
            : `${newWidth}px`;
        columnKey = this.columnID * 25 + hoverIdx + 1;
        this.changeWidth(newWidth, columnKey);
    }
    changeWidth(newWidth, columnKey) {
        this.newValue = newWidth;
        if (newWidth === this.defaultWidth) {
            this.columnWidths.delete(columnKey);
        }
        else {
            this.columnWidths.set(columnKey, { width: newWidth });
        }
        this.setColumnsPositionArr();
        this.drawCanvas();
    }
    binarySearchRange(num) {
        let start = 0;
        let end = 24;
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            if (this.columnsPositionArr[mid] + 5 >= num && num >= this.columnsPositionArr[mid] - 5) {
                return mid;
            }
            else if (num > this.columnsPositionArr[mid]) {
                start = mid + 1;
            }
            else {
                end = mid - 1;
            }
        }
        return -1;
    }
    createcolumnCanvas() {
        const columnDiv = document.createElement("div");
        columnDiv.id = `column${this.columnID}`;
        columnDiv.classList.add("subColumn");
        this.columnCanvas.setAttribute("col", `${this.columnID}`);
        this.drawCanvas();
        columnDiv.appendChild(this.columnCanvas);
        this.resizeDiv.classList.add("ColumnResizeDiv");
        columnDiv.appendChild(this.resizeDiv);
        return columnDiv;
    }
    drawCanvas() {
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const startNum = this.columnID * 25 + 1;
        const dpr = window.devicePixelRatio || 1;
        this.columnCanvas.width = this.columnsPositionArr[24] * dpr;
        this.columnCanvas.height = this.defaultHeight * dpr;
        this.columnCanvas.style.width = `${this.columnsPositionArr[24]}px`;
        this.columnCanvas.style.height = `${this.defaultHeight}px`;
        const ctx = this.columnCanvas.getContext("2d");
        ctx.clearRect(0, 0, this.columnsPositionArr[24], this.defaultHeight);
        ctx.scale(dpr, dpr);
        ctx.font = "12px Arial";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, this.columnsPositionArr[24], this.defaultHeight);
        ctx.strokeStyle = "#ddd";
        ctx.beginPath();
        ctx.moveTo(0, this.defaultHeight - 0.5);
        ctx.lineTo(this.columnsPositionArr[24], this.defaultHeight - 0.5);
        ctx.stroke();
        for (let i = 0; i < 25; i++) {
            const xLeft = i === 0 ? 0 : this.columnsPositionArr[i - 1];
            const xRight = this.columnsPositionArr[i];
            const colIndex = i + startNum;
            const xCenter = xRight - (xRight - xLeft) / 2;
            if (this.ifSelected(colIndex)) {
                if (this.ifSelectedWhole()) {
                    ctx.fillStyle = "#107C41";
                    ctx.fillRect(xLeft, 0, xRight - xLeft, this.defaultHeight);
                    ctx.fillStyle = "#ffffff";
                    ctx.strokeStyle = "#ffffff";
                }
                else {
                    ctx.fillStyle = "#CAEAD8";
                    ctx.fillRect(xLeft, 0, xRight - xLeft, this.defaultHeight);
                    ctx.beginPath();
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = "#107C41";
                    ctx.moveTo(xLeft, this.defaultHeight - 1);
                    ctx.lineTo(xRight, this.defaultHeight - 1);
                    ctx.stroke();
                    ctx.fillStyle = "#0F703B";
                    ctx.strokeStyle = "#A0D8B9";
                }
            }
            else {
                ctx.fillStyle = "#616161";
                ctx.strokeStyle = "#ddd";
            }
            ctx.beginPath();
            ctx.moveTo(this.columnsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.columnsPositionArr[i] - 0.5, this.defaultHeight);
            ctx.stroke();
            ctx.fillText(this.getColumnString(colIndex), xCenter, this.defaultHeight / 2 + 1);
        }
    }
    ifSelected(num) {
        const start = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const end = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        return num >= start && num <= end;
    }
    ifSelectedWhole() {
        const start = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const end = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        return start === 1 && end === 1000000;
    }
    setColumnsPositionArr() {
        const startNum = this.columnID * 25 + 1;
        let prefixSum = 0;
        this.columnsPositionArr.length = 0;
        for (let i = 0; i < 25; i++) {
            const col = this.columnWidths.get(startNum + i);
            prefixSum += col ? col.width : this.defaultWidth;
            this.columnsPositionArr.push(prefixSum);
        }
    }
    getColumnString(num) {
        num--;
        if (num < 0)
            return "";
        return this.getColumnString(Math.floor(num / 26)) + String.fromCharCode("A".charCodeAt(0) + (num % 26));
    }
}
