import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";

/**
 * Represents a single tile (cell group) in a grid system composed of 25 rows and 25 columns.
 * Responsible for rendering the grid lines within this tile using canvas.
 */
export class Tile {
    /** Row index of this tile (e.g., 0-based tile row in a large grid layout) */
    readonly row: number;

    /** Column index of this tile (e.g., 0-based tile column in a large grid layout) */
    readonly col: number;

    /** Array containing vertical positions (Y coordinates) of row boundaries */
    readonly rowsPositionArr: number[];

    /** Array containing horizontal positions (X coordinates) of column boundaries */
    readonly colsPositionArr: number[];

    /** Wrapper div element that contains the tile canvas */
    readonly tileDiv: HTMLDivElement;

    /** Canvas element used to render grid lines */
    private tileCanvas: HTMLCanvasElement = document.createElement("canvas");

    private selectionCoordinates:MultipleSelectionCoordinates;

    /**
     * Initializes a new Tile instance for a specific (row, col) position
     * @param row - The row index of the tile
     * @param col - The column index of the tile
     * @param rowsPositionArr - Array of row edge positions (prefix sum of heights)
     * @param colsPositionArr - Array of column edge positions (prefix sum of widths)
     */
    constructor(row: number, col: number, rowsPositionArr: number[], colsPositionArr: number[],selectionCoordinates:MultipleSelectionCoordinates) {
        this.row = row;
        this.col = col;
        this.rowsPositionArr = rowsPositionArr;
        this.colsPositionArr = colsPositionArr;
        this.selectionCoordinates=selectionCoordinates;
        this.tileDiv = this.createTile(); // initialize and attach canvas
    }

    /**
     * Draws the 25x25 grid on the tileCanvas using the row and column positions
     */
    drawGrid() {
        // Set canvas dimensions based on the total size of 25 rows and columns
        this.tileCanvas.width = this.colsPositionArr[24];
        this.tileCanvas.height = this.rowsPositionArr[24];
        this.tileCanvas.setAttribute("row",`${this.row}`);
        this.tileCanvas.setAttribute("col",`${this.col}`);

        const ctx = this.tileCanvas.getContext("2d") as CanvasRenderingContext2D;

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#ddd"; // Light gray for grid lines

        // Draw horizontal and vertical grid lines
        for (let i = 0; i < 25; i++) {
            // Horizontal line at row boundary
            ctx.moveTo(0, this.rowsPositionArr[i] - 0.5);
            ctx.lineTo(this.colsPositionArr[24], this.rowsPositionArr[i] - 0.5);

            // Vertical line at column boundary
            ctx.moveTo(this.colsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.colsPositionArr[i] - 0.5, this.rowsPositionArr[24]);
        }

        ctx.stroke(); // Render the lines

        this.renderSelected(ctx);
    }

    /**
     * Creates and returns the tile's outer container div, appending the canvas inside it
     * @returns HTMLDivElement containing the tile canvas
     */
    createTile() {
        const tileDiv = document.createElement("div");
        tileDiv.id = `tile_${this.row}_${this.col}`; // Unique ID based on position


        this.drawGrid(); // Render the grid on canvas
        tileDiv.appendChild(this.tileCanvas); // Attach canvas to the container
        return tileDiv;
    }

    private renderSelected(ctx:CanvasRenderingContext2D){

        const tileStartRowNum=this.row*25 + 1;
        const tileStartColNum=this.col*25 + 1;
        const tileEndRowNum= this.row*25 + 25;
        const tileEndColNum= this.col*25 + 25;

        const selectedStartRow = Math.min(this.selectionCoordinates.selectionEndRow,this.selectionCoordinates.selectionStartRow);
        const selectedEndRow = Math.max(this.selectionCoordinates.selectionEndRow,this.selectionCoordinates.selectionStartRow);
        const selectedStartCol = Math.min(this.selectionCoordinates.selectionEndColumn,this.selectionCoordinates.selectionStartColumn);
        const selectedEndCol = Math.max(this.selectionCoordinates.selectionEndColumn,this.selectionCoordinates.selectionStartColumn);


        if((selectedEndRow<tileStartRowNum) ||
            (selectedStartRow>tileEndRowNum) ||
            (selectedEndCol<tileStartColNum) ||
            (selectedStartCol>tileEndColNum)
        ) return ;


        const rangeRowStartNum=Math.max(selectedStartRow,tileStartRowNum);
        const rangeRowEndNum=Math.min(selectedEndRow,tileEndRowNum);

        const rangeColumnStartNum=Math.max(selectedStartCol,tileStartColNum);
        const rangeColumnEndNum=Math.min(selectedEndCol,tileEndColNum);

        const startY=((rangeRowStartNum-1)%25===0)?0:(this.rowsPositionArr[(rangeRowStartNum-2)%25]);
        const startX=((rangeColumnStartNum-1)%25===0)?0:(this.colsPositionArr[(rangeColumnStartNum-2)%25]);

        const rectHeight= this.rowsPositionArr[(rangeRowEndNum-1)%25] - startY;
        const rectWidth= this.colsPositionArr[(rangeColumnEndNum-1)%25] - startX;
        ctx.fillStyle="#E8F2EC";
        ctx.fillRect(startX,startY,rectWidth,rectHeight);
        ctx.stroke();

        if((this.selectionCoordinates.selectionStartRow>=tileStartRowNum && this.selectionCoordinates.selectionStartRow<=tileEndRowNum) && (this.selectionCoordinates.selectionStartColumn>=tileStartColNum && this.selectionCoordinates.selectionStartColumn<=tileEndColNum)){
            const clearY=((this.selectionCoordinates.selectionStartRow-1)%25===0)?0:(this.rowsPositionArr[(this.selectionCoordinates.selectionStartRow-2)%25]);
            const clearX=((this.selectionCoordinates.selectionStartColumn-1)%25===0)?0:(this.colsPositionArr[(this.selectionCoordinates.selectionStartColumn-2)%25]);

            const clearWidth= this.colsPositionArr[(this.selectionCoordinates.selectionStartColumn-1)%25] - clearX;
            const clearHeight= this.rowsPositionArr[(this.selectionCoordinates.selectionStartRow-1)%25] - clearY;

            ctx.clearRect(clearX,clearY,clearWidth-1,clearHeight-1);
            
        }
        ctx.beginPath();
        ctx.strokeStyle="#137E43";
        ctx.lineWidth=2;
        if(selectedStartCol===rangeColumnStartNum){
            ctx.moveTo(startX+1,startY);
            ctx.lineTo(startX+1,startY+rectHeight);
        }

        if(selectedStartRow===rangeRowStartNum){
            ctx.moveTo(startX,startY+1);
            ctx.lineTo(startX+rectWidth,startY+1);
        }

        if(selectedEndCol === rangeColumnEndNum){
            ctx.moveTo(startX+rectWidth-1,startY);
            ctx.lineTo(startX+rectWidth-1,startY+rectHeight);
        }

        if(selectedEndRow === rangeRowEndNum){
            ctx.moveTo(startX,startY+rectHeight-1);
            ctx.lineTo(startX+rectWidth,startY+rectHeight-1);
        }
        ctx.stroke();
        

    }


    
}
