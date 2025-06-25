class Columns {
    constructor(columnWidths, mountLeftPos, mountRightPos) {
        this.columnWidths = columnWidths;
        this.mountLeftPos = mountLeftPos;
        this.mountRightPos = mountRightPos;
    }
}
export class ColumnsCanvas {
    constructor(columnID, columnWidths, defaultWidth, defaultHeight) {
        this.columnWidths = columnWidths;
        this.columnID = columnID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.columnsPositionArr = this.createColumnsPositionArr();
        this.columnCanvas = this.createcolumnCanvas();
    }
    createColumnsPositionArr() {
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
        return columnsPostion;
    }
    createcolumnCanvas() {
        const columnDiv = document.createElement("div");
        columnDiv.id = `column${this.columnID}`;
        columnDiv.classList.add("subColumn");
        const columnCanvas = document.createElement("canvas");
        columnCanvas.width = this.columnsPositionArr[24];
        columnCanvas.height = this.defaultHeight;
        columnDiv.style.width = `${this.columnsPositionArr[24]}px`;
        columnDiv.style.height = `${this.defaultHeight}px`;
        const ctx = columnCanvas.getContext("2d");
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
        columnDiv.appendChild(columnCanvas);
        return columnDiv;
    }
    getColumnString(num) {
        num--;
        if (num < 0)
            return "";
        return this.getColumnString(Math.floor(num / 26)) + String.fromCharCode("A".charCodeAt(0) + (num % 26));
    }
}
