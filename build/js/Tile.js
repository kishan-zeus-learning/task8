export class Tile {
    constructor(row, col, rowsPositionArr, colsPositionArr) {
        this.tileCanvas = document.createElement("canvas");
        this.row = row;
        this.col = col;
        this.rowsPositionArr = rowsPositionArr;
        this.colsPositionArr = colsPositionArr;
        this.tileDiv = this.createTile();
    }
    drawGrid() {
        this.tileCanvas.width = this.colsPositionArr[24];
        this.tileCanvas.height = this.rowsPositionArr[24];
        const ctx = this.tileCanvas.getContext("2d");
        // ctx.fillStyle = "#e7e7e7";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#e7e7e7";
        for (let i = 0; i < 25; i++) {
            ctx.moveTo(0, this.rowsPositionArr[i] - 0.5);
            ctx.lineTo(this.colsPositionArr[24], this.rowsPositionArr[i] - 0.5);
            ctx.moveTo(this.colsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.colsPositionArr[i] - 0.5, this.rowsPositionArr[24]);
        }
        ctx.stroke();
    }
    createTile() {
        const tileDiv = document.createElement("div");
        tileDiv.id = `tile_${this.row}_${this.col}`;
        this.tileCanvas;
        this.drawGrid();
        tileDiv.appendChild(this.tileCanvas);
        return tileDiv;
    }
}
