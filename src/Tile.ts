import { CellsManager } from "./CellsManager";
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

    /** Coordinates representing current multi-cell selection */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** Manages cell data for this tile */
    private CellsManager: CellsManager;

    /** Input element for editing cell values */
    readonly inputDiv: HTMLInputElement = document.createElement("input");

    /**
     * Initializes a new Tile instance for a specific (row, col) position
     * @param row - The row index of the tile
     * @param col - The column index of the tile
     * @param rowsPositionArr - Array of row edge positions (prefix sum of heights)
     * @param colsPositionArr - Array of column edge positions (prefix sum of widths)
     * @param selectionCoordinates - Current selection coordinates in the grid
     * @param CellsManager - Manages cell data and updates
     */
    constructor(row: number, col: number, rowsPositionArr: number[], colsPositionArr: number[], selectionCoordinates: MultipleSelectionCoordinates, CellsManager: CellsManager) {
        this.row = row;
        this.col = col;
        this.rowsPositionArr = rowsPositionArr;
        this.colsPositionArr = colsPositionArr;
        this.selectionCoordinates = selectionCoordinates;
        this.CellsManager = CellsManager;
        this.tileDiv = this.createTile(); // initialize and attach canvas element
        this.drawGrid(); // Render the grid lines and content on canvas
    }

    /**
     * Draws the 25x25 grid on the tileCanvas using the row and column positions
     * Also renders the selection highlight, cell text, and handles input tag
     */
    drawGrid() {
        // Set canvas size based on 25 rows and columns using position arrays
        this.tileCanvas.width = this.colsPositionArr[24];
        this.tileCanvas.height = this.rowsPositionArr[24];

        // Add row and column attributes for reference
        this.tileCanvas.setAttribute("row", `${this.row}`);
        this.tileCanvas.setAttribute("col", `${this.col}`);

        const ctx = this.tileCanvas.getContext("2d") as CanvasRenderingContext2D;

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#ddd"; // Light gray for grid lines

        // Draw horizontal and vertical grid lines for all 25 boundaries
        for (let i = 0; i < 25; i++) {
            // Horizontal line at row boundary
            ctx.moveTo(0, this.rowsPositionArr[i] - 0.5);
            ctx.lineTo(this.colsPositionArr[24], this.rowsPositionArr[i] - 0.5);

            // Vertical line at column boundary
            ctx.moveTo(this.colsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.colsPositionArr[i] - 0.5, this.rowsPositionArr[24]);
        }

        ctx.stroke(); // Render all grid lines

        this.renderSelected(ctx);  // Render selected cell highlight

        this.renderText(ctx);      // Render cell text values

        this.handleInputTag();     // Show or hide the input element as needed
    }

    /**
     * Adds or removes the input element based on whether
     * the selection is within this tile.
     */
    private handleInputTag() {
        if (this.ifInputAppend()) {
            // Append input if not already present
            this.tileDiv.appendChild(this.inputDiv);
            this.inputDiv.classList.add("cellInput");
            this.inputDiv.id = `input_r${this.row}_c${this.col}`;
            this.inputDiv.style.visibility = "hidden";
        } else {
            // Remove input if present but selection is outside this tile
            if (this.tileDiv.querySelector(".cellInput")) {
                this.tileDiv.removeChild(this.inputDiv);
            }
        }
    }

    /**
     * Draws text values for cells within this tile
     * Uses left or right alignment based on cell property
     * @param ctx Canvas rendering context
     */
    private renderText(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.fillStyle = "black";        // Text color
        ctx.font = "16px Arial";        // Text font and size
        ctx.textBaseline = "bottom";    // Vertical alignment

        let rowNum, colNum;
        for (let i = 0; i < 25; i++) {
            rowNum = this.row * 25 + 1 + i;            // Global row number
            const columnMap = this.CellsManager.CellsMap.get(rowNum);

            if (columnMap) {
                for (let j = 0; j < 25; j++) {
                    colNum = this.col * 25 + 1 + j;   // Global column number
                    const cell = columnMap.get(colNum);

                    if (cell) {
                        if (cell.leftAlign) {
                            ctx.textAlign = "left";    // Align left for leftAlign cells
                            const textX = (j === 0) ? 0 : this.colsPositionArr[j - 1] + 5;
                            const textY = this.rowsPositionArr[i] - 3;

                            ctx.fillText(cell.getValue(), textX, textY);
                        } else {
                            ctx.textAlign = "right";   // Align right otherwise
                            const textX = this.colsPositionArr[j] - 5;
                            const textY = this.rowsPositionArr[i] - 3;

                            ctx.fillText(cell.getValue(), textX, textY);
                        }
                    }
                }
            }
        }

        ctx.stroke();
    }

    /**
     * Creates the tile's container div and appends the canvas inside it
     * @returns The div element wrapping this tile's canvas
     */
    createTile() {
        const tileDiv = document.createElement("div");
        tileDiv.id = `tile_${this.row}_${this.col}`; // Unique tile identifier
        tileDiv.classList.add("tileDiv");

        tileDiv.appendChild(this.tileCanvas); // Append canvas element to div

        return tileDiv;
    }

    /**
     * Checks if the input element should be appended to this tile
     * based on whether the selection start cell is inside this tile
     * @returns True if input should be appended, false otherwise
     */
    private ifInputAppend() {
        const startRow = this.row * 25 + 1;
        const endRow = this.row * 25 + 25;
        const startCol = this.col * 25 + 1;
        const endCol = this.col * 25 + 25;

        return (this.selectionCoordinates.selectionStartRow <= endRow
            && this.selectionCoordinates.selectionStartRow >= startRow
            && this.selectionCoordinates.selectionStartColumn >= startCol
            && this.selectionCoordinates.selectionStartColumn <= endCol);
    }

    /**
     * Renders the selected area on the canvas,
     * highlighting the selected cells within this tile,
     * and positions the input element if the selection start is here
     * @param ctx Canvas rendering context
     */
    private renderSelected(ctx: CanvasRenderingContext2D) {

        // Tile boundaries in global coordinates
        const tileStartRowNum = this.row * 25 + 1;
        const tileStartColNum = this.col * 25 + 1;
        const tileEndRowNum = this.row * 25 + 25;
        const tileEndColNum = this.col * 25 + 25;

        // Calculate selection boundaries (normalized min/max)
        const selectedStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const selectedEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const selectedStartCol = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const selectedEndCol = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);

        // Return early if selection doesn't intersect this tile
        if ((selectedEndRow < tileStartRowNum) ||
            (selectedStartRow > tileEndRowNum) ||
            (selectedEndCol < tileStartColNum) ||
            (selectedStartCol > tileEndColNum)
        ) return;

        // Intersection of selection and tile boundaries
        const rangeRowStartNum = Math.max(selectedStartRow, tileStartRowNum);
        const rangeRowEndNum = Math.min(selectedEndRow, tileEndRowNum);

        const rangeColumnStartNum = Math.max(selectedStartCol, tileStartColNum);
        const rangeColumnEndNum = Math.min(selectedEndCol, tileEndColNum);

        // Calculate pixel coordinates of selection rectangle start
        const startY = ((rangeRowStartNum - 1) % 25 === 0) ? 0 : (this.rowsPositionArr[(rangeRowStartNum - 2) % 25]);
        const startX = ((rangeColumnStartNum - 1) % 25 === 0) ? 0 : (this.colsPositionArr[(rangeColumnStartNum - 2) % 25]);

        // Calculate pixel width and height of selection rectangle
        const rectHeight = this.rowsPositionArr[(rangeRowEndNum - 1) % 25] - startY;
        const rectWidth = this.colsPositionArr[(rangeColumnEndNum - 1) % 25] - startX;

        // Draw translucent green fill for selection highlight
        ctx.fillStyle = "#E8F2EC";
        ctx.fillRect(startX, startY, rectWidth, rectHeight);
        ctx.stroke();

        // If selection start cell is within this tile, position input box accordingly
        if ((this.selectionCoordinates.selectionStartRow >= tileStartRowNum && this.selectionCoordinates.selectionStartRow <= tileEndRowNum) &&
            (this.selectionCoordinates.selectionStartColumn >= tileStartColNum && this.selectionCoordinates.selectionStartColumn <= tileEndColNum)) {

            // Calculate input box pixel position and size based on selection start cell
            const clearY = ((this.selectionCoordinates.selectionStartRow - 1) % 25 === 0) ? 0 : (this.rowsPositionArr[(this.selectionCoordinates.selectionStartRow - 2) % 25]);
            const clearX = ((this.selectionCoordinates.selectionStartColumn - 1) % 25 === 0) ? 0 : (this.colsPositionArr[(this.selectionCoordinates.selectionStartColumn - 2) % 25]);

            const clearWidth = this.colsPositionArr[(this.selectionCoordinates.selectionStartColumn - 1) % 25] - clearX;
            const clearHeight = this.rowsPositionArr[(this.selectionCoordinates.selectionStartRow - 1) % 25] - clearY;

            // Position and size the input element to align with selected cell
            this.inputDiv.style.top = `${clearY}px`;
            this.inputDiv.style.left = `${clearX}px`;
            this.inputDiv.style.width = `${clearWidth}px`;
            this.inputDiv.style.height = `${clearHeight}px`;

            // Store cell coordinates as attributes for reference
            this.inputDiv.setAttribute("row", `${this.selectionCoordinates.selectionStartRow}`);
            this.inputDiv.setAttribute("col", `${this.selectionCoordinates.selectionStartColumn}`);

            // Clear the underlying canvas area so input is visible
            ctx.clearRect(clearX, clearY, clearWidth - 1, clearHeight - 1);
        }

        // Draw selection border lines around selected area with thicker green stroke
        ctx.beginPath();
        ctx.strokeStyle = "#137E43";
        ctx.lineWidth = 2;

        if (selectedStartCol === rangeColumnStartNum) {
            ctx.moveTo(startX + 1, startY);
            ctx.lineTo(startX + 1, startY + rectHeight);
        }

        if (selectedStartRow === rangeRowStartNum) {
            ctx.moveTo(startX, startY + 1);
            ctx.lineTo(startX + rectWidth, startY + 1);
        }

        if (selectedEndCol === rangeColumnEndNum) {
            ctx.moveTo(startX + rectWidth - 1, startY);
            ctx.lineTo(startX + rectWidth - 1, startY + rectHeight);
        }

        if (selectedEndRow === rangeRowEndNum) {
            ctx.moveTo(startX, startY + rectHeight - 1);
            ctx.lineTo(startX + rectWidth, startY + rectHeight - 1);
        }

        ctx.stroke();
    }
}
