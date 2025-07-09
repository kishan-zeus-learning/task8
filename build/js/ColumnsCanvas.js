export class ColumnsCanvas {
    constructor(columnID, columnWidths, defaultWidth, defaultHeight, ifResizeOn, ifResizePointerDown, currentResizingColumn, selectionCoordinates) {
        this.columnCanvas = document.createElement("canvas");
        this.resizeDiv = document.createElement("div");
        this.hoverIdx = -1;
        this.prevValue = 100;
        this.newValue = 100;
        this.columnKey = -1;
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
    getPrevValue() {
        return this.prevValue;
    }
    getNewValue() {
        return this.newValue;
    }
    getColumnKey() {
        return this.columnKey;
    }
    handleResize() {
        this.columnCanvasDiv.addEventListener("pointerdown", (event) => {
            var _a;
            if (event.button === 1)
                return;
            this.hoverIdx = this.binarySearchRange(event.offsetX);
            if (this.hoverIdx !== -1) {
                this.ifResizePointerDown.value = true;
                const columnKey = this.columnID * 25 + 1 + this.hoverIdx;
                this.prevValue = ((_a = this.columnWidths.get(columnKey)) === null || _a === void 0 ? void 0 : _a.width) || 100;
                this.newValue = this.prevValue;
            }
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
        this.columnCanvasDiv.addEventListener("pointerout", () => {
            if (!this.ifResizePointerDown.value) {
                this.resizeDiv.style.display = "none";
            }
            this.ifResizeOn.value = false;
        });
    }
    resizeColumn(newPosition) {
        newPosition = newPosition - this.columnCanvasDiv.getBoundingClientRect().left;
        let newWidth;
        if (this.hoverIdx !== 0) {
            newWidth = newPosition - this.columnsPositionArr[this.hoverIdx - 1];
        }
        else {
            newWidth = newPosition;
        }
        newWidth = Math.max(50, newWidth);
        newWidth = Math.min(500, newWidth);
        if (this.hoverIdx !== 0) {
            this.resizeDiv.style.left = `${this.columnsPositionArr[this.hoverIdx - 1] + newWidth}px`;
        }
        else {
            this.resizeDiv.style.left = `${newWidth}px`;
        }
        this.columnKey = this.columnID * 25 + this.hoverIdx + 1;
        this.changeWidth(newWidth, this.columnKey);
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
            ctx.beginPath();
            ctx.moveTo(this.columnsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.columnsPositionArr[i] - 0.5, this.defaultHeight - heightOffset);
            ctx.stroke();
            ctx.fillText(this.getColumnString(colIndex), xCenter, this.defaultHeight / 2 + 1);
        }
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
                ctx.moveTo(firstIdx === 0 ? 0 : this.columnsPositionArr[firstIdx - 1], 0);
                ctx.lineTo(firstIdx === 0 ? 0 : this.columnsPositionArr[firstIdx - 1], this.defaultHeight);
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
