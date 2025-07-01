/**
 * Represents a single tile (cell group) in a grid system composed of 25 rows and 25 columns.
 * Responsible for rendering the grid lines within this tile using canvas.
 */
export class Tile {
    /**
     * Initializes a new Tile instance for a specific (row, col) position
     * @param row - The row index of the tile
     * @param col - The column index of the tile
     * @param rowsPositionArr - Array of row edge positions (prefix sum of heights)
     * @param colsPositionArr - Array of column edge positions (prefix sum of widths)
     */
    constructor(row, col, rowsPositionArr, colsPositionArr) {
        /** Canvas element used to render grid lines */
        this.tileCanvas = document.createElement("canvas");
        this.row = row;
        this.col = col;
        this.rowsPositionArr = rowsPositionArr;
        this.colsPositionArr = colsPositionArr;
        this.tileDiv = this.createTile(); // initialize and attach canvas
    }
    /**
     * Draws the 25x25 grid on the tileCanvas using the row and column positions
     */
    drawGrid() {
        // Set canvas dimensions based on the total size of 25 rows and columns
        this.tileCanvas.width = this.colsPositionArr[24];
        this.tileCanvas.height = this.rowsPositionArr[24];
        this.tileCanvas.setAttribute("row", `${this.row}`);
        this.tileCanvas.setAttribute("col", `${this.col}`);
        const ctx = this.tileCanvas.getContext("2d");
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
}
