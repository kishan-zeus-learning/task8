export class ColumnsCanvas {
    constructor(columnID, columnWidths, defaultWidth, defaultHeight, ifResizeOn, ifResizePointerDown, currentResizingColumn) {
        this.columnCanvas = document.createElement("canvas");
        this.resizeDiv = document.createElement("div");
        this.hoverIdx = -1;
        this.columnWidths = columnWidths;
        this.columnID = columnID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.columnsPositionArr = [];
        this.currentResizingColumn = currentResizingColumn;
        this.ifResizeOn = ifResizeOn;
        this.ifResizePointerDown = ifResizePointerDown;
        this.setColumnsPositionArr();
        this.columnCanvasDiv = this.createcolumnCanvas();
        this.handleResize();
    }
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
        if (newWidth === this.defaultWidth)
            delete this.columnWidths[this.columnID * 25 + this.hoverIdx + 1];
        else
            this.columnWidths[this.columnID * 25 + this.hoverIdx + 1] = { width: newWidth };
        this.setColumnsPositionArr();
        this.drawCanvas();
    }
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
    drawCanvas() {
        this.columnCanvas.width = this.columnsPositionArr[24];
        this.columnCanvas.height = this.defaultHeight;
        // this.columnCanvas.style.width=`${this.columnsPositionArr[24]}px`;
        // this.columnCanvas.style.height=`${this.defaultHeight}px`;
        const ctx = this.columnCanvas.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle = "#e7e7e7";
        ctx.font = "12px Arial";
        ctx.lineWidth = 1;
        ctx.fillRect(0, 0, this.columnsPositionArr[24], this.defaultHeight);
        ctx.fillStyle = "black";
        let startNum = this.columnID * 25 + 1;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        for (let i = 0; i < 25; i++) {
            ctx.moveTo(this.columnsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.columnsPositionArr[i] - 0.5, this.defaultHeight);
            ctx.fillText(this.getColumnString(i + startNum), this.columnsPositionArr[i] - (this.columnsPositionArr[i] - ((i == 0) ? 0 : this.columnsPositionArr[i - 1])) / 2, this.defaultHeight / 2 + 1);
        }
        ctx.moveTo(0, this.defaultHeight);
        ctx.lineTo(this.columnsPositionArr[24] - 0.5, this.defaultHeight);
        ctx.moveTo(0, 0);
        ctx.lineTo(this.columnsPositionArr[24] - 0.5, 0);
        ctx.stroke();
    }
    setColumnsPositionArr() {
        let startNum = this.columnID * 25 + 1;
        let prefixSum = 0;
        const columnsPostion = [];
        for (let i = 0; i < 25; i++) {
            if (this.columnWidths[startNum + i]) {
                prefixSum += this.columnWidths[startNum + i].width;
            }
            else {
                prefixSum += this.defaultWidth;
            }
            columnsPostion.push(prefixSum);
        }
        this.columnsPositionArr = columnsPostion;
    }
    getColumnString(num) {
        num--;
        if (num < 0)
            return "";
        return this.getColumnString(Math.floor(num / 26)) + String.fromCharCode("A".charCodeAt(0) + (num % 26));
    }
}
