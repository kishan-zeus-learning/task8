import { RowData } from "./types/RowsColumn";
export class RowsCanvas {
    private rowHeights: RowData;
    readonly rowsPositionArr: number[];
    readonly rowID: number;
    readonly rowCanvas: HTMLDivElement;
    private defaultWidth: number;
    private defaultHeight: number;

    constructor(rowID: number, rowHeights: RowData, defaultWidth: number, defaultHeight: number) {
        this.rowHeights = rowHeights;
        this.rowID = rowID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsPositionArr = this.getRowsPositionArr(this.rowID);
        this.rowCanvas = this.createRowCanvas(this.rowID);

    }

    private getRowsPositionArr(rowID: number) {
        let startNum = rowID * 25 + 1;
        let prefixSum = 0;
        const rowsPosition = [];
        for (let i = 0; i < 25; i++) {
            if (this.rowHeights[i + startNum]) {
                prefixSum += this.rowHeights[i + startNum].height;
            } else {
                prefixSum += this.defaultHeight;
            }
            rowsPosition.push(prefixSum);
        }

        return rowsPosition;
    }

    private createRowCanvas(rowID: number) {
        const rowDiv = document.createElement("div");
        rowDiv.id = `row${rowID}`;
        rowDiv.classList.add("subRow");

        const rowCanvas = document.createElement("canvas");

        this.drawCanvas(rowCanvas);
        rowDiv.appendChild(rowCanvas);
        return rowDiv;
    }

    private drawCanvas(rowCanvas:HTMLCanvasElement){
        const dpr = window.devicePixelRatio || 1;
        rowCanvas.width = this.defaultWidth * dpr;
        rowCanvas.height = this.rowsPositionArr[24] * dpr;
        rowCanvas.style.width = `${this.defaultWidth}px`;
        rowCanvas.style.height = `${this.rowsPositionArr[24]}px`;


        const ctx = rowCanvas.getContext("2d") as CanvasRenderingContext2D;
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

