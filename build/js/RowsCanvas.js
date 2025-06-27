export class RowsCanvas {
    constructor(rowID, rowHeights, defaultWidth, defaultHeight) {
        this.rowCanvas = null;
        this.resizeDiv = null;
        this.rowHeights = rowHeights;
        this.rowID = rowID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsPositionArr = [];
        this.setRowsPositionArr();
        this.rowCanvasDiv = this.createRowCanvas();
        this.handleResize();
        // this.resizeRow(0,150);
        // this.resizeRow(4,125);
    }
    handleResize() {
        let ifResizeOn = false;
        this.rowCanvasDiv.addEventListener("pointermove", (event) => {
            const hoverIdx = this.binarySearchRange(event.offsetY);
            if (hoverIdx !== -1) {
                this.rowCanvasDiv.style.cursor = "ns-resize";
                ifResizeOn = true;
                if (this.resizeDiv) {
                    this.resizeDiv.style.display = "block";
                    this.resizeDiv.style.top = `${this.rowsPositionArr[hoverIdx] - 0.5}px`;
                    this.resizeDiv.style.zIndex = `10`;
                }
            }
            else {
                this.rowCanvasDiv.style.cursor = "default";
                if (this.resizeDiv)
                    this.resizeDiv.style.display = "none";
            }
        });
        this.rowCanvasDiv.addEventListener("pointerout", (event) => {
            if (this.resizeDiv)
                this.resizeDiv.style.display = "none";
            this.rowCanvasDiv.style.cursor = "default";
        });
    }
    resizeRow(rowIdx, newPosition) {
        //to be debugged soon
        if (rowIdx !== 0) {
            if (newPosition === this.rowsPositionArr[rowIdx - 1] + this.defaultHeight)
                delete this.rowHeights[rowIdx + 1 + this.rowID * 25];
            else {
                // to be debugged soon
                if (this.rowHeights[rowIdx + 1]) {
                    this.rowHeights[rowIdx + 1].height = newPosition - this.rowsPositionArr[rowIdx - 1];
                }
                else {
                    this.rowHeights[rowIdx + 1] = { height: (newPosition - this.rowsPositionArr[rowIdx]) };
                }
            }
        }
        else {
            if (newPosition === this.defaultHeight)
                delete this.rowHeights[rowIdx + 1 + this.rowID * 25];
            else
                this.rowHeights[rowIdx + 1 + this.rowID * 25] = { height: newPosition };
        }
        this.setRowsPositionArr();
        this.drawCanvas();
    }
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
    createRowCanvas() {
        const rowDiv = document.createElement("div");
        rowDiv.id = `row${this.rowID}`;
        rowDiv.classList.add("subRow");
        this.rowCanvas = document.createElement("canvas");
        this.drawCanvas();
        rowDiv.appendChild(this.rowCanvas);
        this.resizeDiv = document.createElement("div");
        this.resizeDiv.classList.add("RowResizeDiv");
        rowDiv.appendChild(this.resizeDiv);
        return rowDiv;
    }
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
            const yPos = Math.round(this.rowsPositionArr[i] - (this.rowsPositionArr[i] - ((i === 0) ? 0 : this.rowsPositionArr[i - 1])) / 2 + 1);
            ctx.fillText(`${i + startNum}`, this.defaultWidth - 5, yPos);
        }
        ctx.moveTo(this.defaultWidth - 0.5, 0);
        ctx.lineTo(this.defaultWidth - 0.5, this.rowsPositionArr[24]);
        ctx.moveTo(0.5, 0);
        ctx.lineTo(0.5, this.rowsPositionArr[24]);
        ctx.stroke();
    }
}
