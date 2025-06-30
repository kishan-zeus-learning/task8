

export class Tile{
    readonly row:number;
    readonly col:number;
    readonly rowsPositionArr:number[];
    readonly colsPositionArr:number[];
    readonly tileDiv:HTMLDivElement;
    private tileCanvas:HTMLCanvasElement=document.createElement("canvas");

    constructor(row:number,col:number,rowsPositionArr:number[],colsPositionArr:number[]){
        this.row=row;
        this.col=col;
        this.rowsPositionArr=rowsPositionArr;
        this.colsPositionArr=colsPositionArr;
        this.tileDiv=this.createTile();
    }

   drawGrid() {
    this.tileCanvas.width=this.colsPositionArr[24];
    this.tileCanvas.height=this.rowsPositionArr[24];

    const ctx=this.tileCanvas.getContext("2d") as CanvasRenderingContext2D;
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


    createTile(){
        const tileDiv=document.createElement("div");
        tileDiv.id=`tile_${this.row}_${this.col}`;
        this.tileCanvas;
        
        this.drawGrid();
        tileDiv.appendChild(this.tileCanvas);
        return tileDiv;
    }
}