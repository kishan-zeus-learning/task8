/**
 * Represents a canvas component for rendering a group of 25 Excel-style columns.
 * Supports rendering, resizing, and hover interactions for each column.
 */
export class ColumnsCanvas {
    /**
     * Initializes the ColumnsCanvas
     * @param {number} columnID - Unique ID for the column block
     * @param {columnData} columnWidths - Object storing column width info
     * @param {number} defaultWidth - Default column width
     * @param {number} defaultHeight - Default column height
     * @param {GlobalBoolean} ifResizeOn - Global flag for resize hover
     * @param {GlobalBoolean} ifResizePointerDown - Global flag for active pointer during resize
     * @param {GlobalNumber} currentResizingColumn - Global index of the column currently being resized
     */
    constructor(columnID, columnWidths, defaultWidth, defaultHeight, ifResizeOn, ifResizePointerDown, currentResizingColumn, selectionCoordinates) {
        /** Canvas element where column headers are drawn */
        this.columnCanvas = document.createElement("canvas");
        /** Div used for displaying the resize line during hover/drag */
        this.resizeDiv = document.createElement("div");
        /** Tracks the index of the column currently being hovered for resizing */
        this.hoverIdx = -1;
        this.columnWidths = columnWidths;
        this.columnID = columnID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.columnsPositionArr = [];
        this.currentResizingColumn = currentResizingColumn;
        this.ifResizeOn = ifResizeOn;
        this.ifResizePointerDown = ifResizePointerDown;
        this.selectionCoordinates = selectionCoordinates;
        this.setColumnsPositionArr();
        this.columnCanvasDiv = this.createcolumnCanvas();
        this.handleResize();
    }
    /**
     * Attaches event listeners for handling column resize operations
     */
    handleResize() {
        this.columnCanvasDiv.addEventListener("pointerdown", (event) => {
            this.ifResizePointerDown.value = true;
        });
        this.columnCanvasDiv.addEventListener("pointermove", (event) => {
            if (this.ifResizePointerDown.value) {
                this.currentResizingColumn.value = this.columnID;
                return;
            }
            this.hoverIdx = this.binarySearchRange(event.offsetX);
            if (this.hoverIdx !== -1) {
                this.ifResizeOn.value = true;
                this.resizeDiv.style.display = "block";
                this.resizeDiv.style.left = `${this.columnsPositionArr[this.hoverIdx] - 1.5}px`;
                this.resizeDiv.style.zIndex = `10`;
            }
            else {
                if (!this.ifResizePointerDown.value) {
                    this.resizeDiv.style.display = "none";
                }
                this.ifResizeOn.value = false;
            }
        });
        this.columnCanvasDiv.addEventListener("pointerout", (event) => {
            if (!this.ifResizePointerDown.value) {
                this.resizeDiv.style.display = "none";
            }
            this.ifResizeOn.value = false;
        });
    }
    /**
     * Resizes the selected column based on new pointer position
     * @param {number} newPosition - New pointer x-coordinate for resize
     */
    resizeColumn(newPosition) {
        newPosition = newPosition - this.columnCanvasDiv.getBoundingClientRect().left;
        let newWidth;
        if (this.hoverIdx !== 0) {
            newWidth = newPosition - this.columnsPositionArr[this.hoverIdx - 1];
        }
        else {
            newWidth = newPosition;
        }
        // Clamp newWidth to acceptable limits
        newWidth = Math.max(50, newWidth);
        newWidth = Math.min(500, newWidth);
        if (this.hoverIdx !== 0) {
            this.resizeDiv.style.left = `${this.columnsPositionArr[this.hoverIdx - 1] + newWidth}px`;
        }
        else {
            this.resizeDiv.style.left = `${newWidth}px`;
        }
        // Update width in columnWidths or delete if default
        if (newWidth === this.defaultWidth)
            delete this.columnWidths[this.columnID * 25 + this.hoverIdx + 1];
        else
            this.columnWidths[this.columnID * 25 + this.hoverIdx + 1] = { width: newWidth };
        this.setColumnsPositionArr();
        this.drawCanvas();
    }
    /**
     * Performs binary search to determine if mouse is near a column boundary
     * @param {number} num - X-position of the mouse
     * @returns {number} Index of column near boundary, -1 if none
     */
    binarySearchRange(num) {
        let start = 0;
        let end = 24;
        let mid;
        while (start <= end) {
            mid = Math.floor((start + end) / 2);
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
    /**
     * Creates the column canvas div and initializes rendering
     * @returns {HTMLDivElement} Column div container
     */
    createcolumnCanvas() {
        const columnDiv = document.createElement("div");
        columnDiv.id = `column${this.columnID}`;
        columnDiv.classList.add("subColumn");
        this.drawCanvas();
        columnDiv.appendChild(this.columnCanvas);
        this.resizeDiv.classList.add("ColumnResizeDiv");
        columnDiv.appendChild(this.resizeDiv);
        return columnDiv;
    }
    /**
     * Draws the column headers on the canvas
     */
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
        // === Background Fill ===
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, this.columnsPositionArr[24], this.defaultHeight);
        // === Top and Bottom Borders ===
        ctx.strokeStyle = "#ddd";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.columnsPositionArr[24], 0);
        ctx.moveTo(0, this.defaultHeight - 0.5);
        ctx.lineTo(this.columnsPositionArr[24], this.defaultHeight - 0.5);
        ctx.stroke();
        let heightOffset = 0;
        for (let i = 0; i < 25; i++) {
            const xLeft = i === 0 ? 0 : this.columnsPositionArr[i - 1];
            const xRight = this.columnsPositionArr[i];
            const colIndex = i + startNum;
            const xCenter = xRight - (xRight - xLeft) / 2;
            if (this.ifSelected(colIndex)) {
                heightOffset = 2;
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
                    ctx.beginPath();
                    ctx.lineWidth = 1;
                    ctx.fillStyle = "#0F703B";
                    ctx.strokeStyle = "#A0D8B9";
                }
            }
            else {
                ctx.fillStyle = "#616161";
                ctx.strokeStyle = "#ddd";
                heightOffset = 0;
            }
            // Draw vertical grid line
            ctx.beginPath();
            ctx.moveTo(this.columnsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.columnsPositionArr[i] - 0.5, this.defaultHeight - heightOffset);
            ctx.stroke();
            // Draw text
            ctx.fillText(this.getColumnString(colIndex), xCenter, this.defaultHeight / 2 + 1);
        }
        // === Draw bottom or top border for selected column edge ===
        ctx.beginPath();
        if (this.ifSelectedWhole()) {
            if (canvasEndColumn <= this.columnID * 25 + 25 &&
                canvasEndColumn >= this.columnID * 25 + 1 &&
                (canvasEndColumn === this.selectionCoordinates.selectionStartColumn ||
                    canvasEndColumn === this.selectionCoordinates.selectionEndColumn)) {
                const lastIdx = (canvasEndColumn - 1) % 25;
                ctx.strokeStyle = "#107C41";
                ctx.lineWidth = 2;
                ctx.moveTo(this.columnsPositionArr[lastIdx] - 1, 0);
                ctx.lineTo(this.columnsPositionArr[lastIdx] - 1, this.defaultHeight);
            }
        }
        else {
            if (canvasStartColumn <= this.columnID * 25 + 25 &&
                canvasStartColumn >= this.columnID * 25 + 1 &&
                (canvasStartColumn === this.selectionCoordinates.selectionStartColumn ||
                    canvasStartColumn === this.selectionCoordinates.selectionEndColumn)) {
                const firstIdx = (canvasStartColumn - 1) % 25;
                ctx.strokeStyle = "#A0D8B9";
                ctx.lineWidth = 1;
                ctx.moveTo((firstIdx === 0 ? 0 : this.columnsPositionArr[firstIdx - 1]), 0);
                ctx.lineTo((firstIdx === 0 ? 0 : this.columnsPositionArr[firstIdx - 1]), this.defaultHeight);
            }
        }
        ctx.stroke();
    }
    ifSelected(num) {
        const canvasStartColumn = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const canvasEndColumn = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        return num >= canvasStartColumn && num <= canvasEndColumn;
    }
    ifSelectedWhole() {
        const canvasStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const canvasEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        return canvasStartRow === 1 && canvasEndRow === 1000000;
    }
    /**
     * Updates `columnsPositionArr` based on current column widths
     */
    setColumnsPositionArr() {
        let startNum = this.columnID * 25 + 1;
        let prefixSum = 0;
        this.columnsPositionArr.length = 0;
        for (let i = 0; i < 25; i++) {
            if (this.columnWidths[startNum + i]) {
                prefixSum += this.columnWidths[startNum + i].width;
            }
            else {
                prefixSum += this.defaultWidth;
            }
            this.columnsPositionArr.push(prefixSum);
        }
    }
    /**
     * Converts a numeric column index to its Excel-style string (e.g., 1 -> A, 27 -> AA)
     * @param {number} num - The column index (1-based)
     * @returns {string} Excel-style column label
     */
    getColumnString(num) {
        num--;
        if (num < 0)
            return "";
        return this.getColumnString(Math.floor(num / 26)) + String.fromCharCode("A".charCodeAt(0) + (num % 26));
    }
}
