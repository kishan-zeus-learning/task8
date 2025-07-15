import { CellsManager } from "./CellsManager";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates";

/**
 * Represents a single tile (25x25 grid of cells) in the spreadsheet.
 * Responsible for rendering grid lines, text content, and selection highlights.
 */
export class Tile {
    /** @type {number} Tile's row index (grid-wise, 0-based) */
    readonly row: number;

    /** @type {number} Tile's column index (grid-wise, 0-based) */
    readonly col: number;

    /** @type {number[]} Pixel Y-positions for all row boundaries */
    readonly rowsPositionArr: number[];

    /** @type {number[]} Pixel X-positions for all column boundaries */
    readonly colsPositionArr: number[];

    /** @type {HTMLDivElement} Wrapper div that holds the canvas */
    readonly tileDiv: HTMLDivElement;

    /** @type {HTMLDivElement} Outer wrapper div for the tile, used for positioning */
    readonly tileDivWrapper: HTMLDivElement;

    /** @type {HTMLCanvasElement} Canvas used for rendering the tile */
    private tileCanvas: HTMLCanvasElement = document.createElement("canvas");

    /** @type {MultipleSelectionCoordinates} Selection coordinates within this tile */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @type {CellsManager} Manager for retrieving cell content */
    private CellsManager: CellsManager;

    /** @type {HTMLInputElement} Input element used for in-cell editing */
    readonly inputDiv: HTMLInputElement = document.createElement("input");

    /** @type {number} Device pixel ratio for high-DPI screens */
    private dpr: number = window.devicePixelRatio || 1;

    /**
     * Initializes a tile instance for a given (row, col) position.
     * @param {number} row - The row index of the tile.
     * @param {number} col - The column index of the tile.
     * @param {number[]} rowsPositionArr - Array of pixel Y-positions for row boundaries within the tile.
     * @param {number[]} colsPositionArr - Array of pixel X-positions for column boundaries within the tile.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object containing the current selection coordinates.
     * @param {CellsManager} CellsManager - The CellsManager instance to interact with cell data.
     */
    constructor(row: number, col: number, rowsPositionArr: number[], colsPositionArr: number[], selectionCoordinates: MultipleSelectionCoordinates, CellsManager: CellsManager) {
        this.row = row;
        this.col = col;
        this.rowsPositionArr = rowsPositionArr;
        this.colsPositionArr = colsPositionArr;
        this.selectionCoordinates = selectionCoordinates;
        this.CellsManager = CellsManager;
        this.tileDiv = this.createTile();
        this.tileDivWrapper = document.createElement("div");
        this.tileDivWrapper.classList.add("tileDivWrapper");
        this.tileDivWrapper.appendChild(this.tileDiv);
        this.drawGrid();
    }

    /**
     * Renders the grid lines, selected cells, text values, and manages the input element visibility.
     */
    drawGrid() {
        const logicalWidth = this.colsPositionArr[24];
        const logicalHeight = this.rowsPositionArr[24];

        this.tileCanvas.style.width = `${logicalWidth}px`;
        this.tileCanvas.style.height = `${logicalHeight}px`;

        this.tileCanvas.width = logicalWidth * this.dpr;
        this.tileCanvas.height = logicalHeight * this.dpr;

        this.tileCanvas.setAttribute("row", `${this.row}`);
        this.tileCanvas.setAttribute("col", `${this.col}`);

        const ctx = this.tileCanvas.getContext("2d") as CanvasRenderingContext2D;
        ctx.scale(this.dpr, this.dpr);

        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeStyle = "#ddd";

        for (let i = 0; i < 25; i++) {
            ctx.moveTo(0, this.rowsPositionArr[i] - 0.5);
            ctx.lineTo(this.colsPositionArr[24], this.rowsPositionArr[i] - 0.5);
            ctx.moveTo(this.colsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.colsPositionArr[i] - 0.5, this.rowsPositionArr[24]);
        }

        ctx.stroke();
        this.renderSelected(ctx);
        this.renderText(ctx);
        this.handleInputTag();
    }

    /**
     * Adds or removes the input box based on whether the selection start cell is within this tile.
     */
    private handleInputTag() {
        if (this.ifInputAppend()) {
            this.tileDiv.appendChild(this.inputDiv);
            this.inputDiv.classList.add("cellInput");
            this.inputDiv.id = `input_r${this.row}_c${this.col}`;
            this.inputDiv.style.visibility = "hidden";
        } else {
            if (this.tileDiv.querySelector(".cellInput")) {
                this.tileDiv.removeChild(this.inputDiv);
            }
        }
    }

    /**
     * Renders cell text content inside the tile.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
     */
    private renderText(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textBaseline = "bottom";

        for (let i = 0; i < 25; i++) {
            const rowNum = this.row * 25 + 1 + i;
            const columnMap = this.CellsManager.CellsMap.get(rowNum);
            if (!columnMap) continue;

            for (let j = 0; j < 25; j++) {
                const colNum = this.col * 25 + 1 + j;
                const cell = columnMap.get(colNum);
                if (!cell) continue;

                if (cell.leftAlign) {
                    ctx.textAlign = "left";
                    const textX = j === 0 ? 0 : this.colsPositionArr[j - 1] + 5;
                    const textY = this.rowsPositionArr[i] - 3;
                    ctx.fillText(cell.getValue(), textX, textY);
                } else {
                    ctx.textAlign = "right";
                    const textX = this.colsPositionArr[j] - 5;
                    const textY = this.rowsPositionArr[i] - 3;
                    ctx.fillText(cell.getValue(), textX, textY);
                }
            }
        }

        ctx.stroke();
    }

    /**
     * Creates and returns the tile container div.
     * @returns {HTMLDivElement} The created tile div element.
     */
    createTile(): HTMLDivElement {
        const tileDiv = document.createElement("div");
        tileDiv.id = `tile_${this.row}_${this.col}`;
        tileDiv.classList.add("tileDiv");
        tileDiv.appendChild(this.tileCanvas);
        return tileDiv;
    }

    /**
     * Determines if the selection start cell lies within this tile.
     * @returns {boolean} True if the selection start cell is within this tile, false otherwise.
     */
    private ifInputAppend(): boolean {
        const startRow = this.row * 25 + 1;
        const endRow = this.row * 25 + 25;
        const startCol = this.col * 25 + 1;
        const endCol = this.col * 25 + 25;

        return (
            this.selectionCoordinates.selectionStartRow <= endRow &&
            this.selectionCoordinates.selectionStartRow >= startRow &&
            this.selectionCoordinates.selectionStartColumn >= startCol &&
            this.selectionCoordinates.selectionStartColumn <= endCol
        );
    }

    /**
     * Highlights the selected area and draws the selection border within the tile.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
     */
    private renderSelected(ctx: CanvasRenderingContext2D) {
        const tileStartRowNum = this.row * 25 + 1;
        const tileStartColNum = this.col * 25 + 1;
        const tileEndRowNum = this.row * 25 + 25;
        const tileEndColNum = this.col * 25 + 25;

        const selectedStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const selectedEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const selectedStartCol = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const selectedEndCol = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);

        // If the selection does not overlap with this tile, return.
        if (
            selectedEndRow < tileStartRowNum ||
            selectedStartRow > tileEndRowNum ||
            selectedEndCol < tileStartColNum ||
            selectedStartCol > tileEndColNum
        ) return;

        // Determine the actual range of rows and columns within this tile that are selected.
        const rangeRowStartNum = Math.max(selectedStartRow, tileStartRowNum);
        const rangeRowEndNum = Math.min(selectedEndRow, tileEndRowNum);
        const rangeColumnStartNum = Math.max(selectedStartCol, tileStartColNum);
        const rangeColumnEndNum = Math.min(selectedEndCol, tileEndColNum);

        // Calculate the starting pixel coordinates for the highlighted rectangle.
        const startY = ((rangeRowStartNum - 1) % 25 === 0) ? 0 : this.rowsPositionArr[(rangeRowStartNum - 2) % 25];
        const startX = ((rangeColumnStartNum - 1) % 25 === 0) ? 0 : this.colsPositionArr[(rangeColumnStartNum - 2) % 25];

        // Calculate the width and height of the highlighted rectangle.
        const rectHeight = this.rowsPositionArr[(rangeRowEndNum - 1) % 25] - startY;
        const rectWidth = this.colsPositionArr[(rangeColumnEndNum - 1) % 25] - startX;

        // Draw the background highlight for the selected area.
        ctx.fillStyle = "#E8F2EC";
        ctx.fillRect(startX, startY, rectWidth, rectHeight);
        ctx.stroke();

        // If the single active cell (selection start) is within this tile, prepare and clear its area for the input box.
        if (
            this.selectionCoordinates.selectionStartRow >= tileStartRowNum &&
            this.selectionCoordinates.selectionStartRow <= tileEndRowNum &&
            this.selectionCoordinates.selectionStartColumn >= tileStartColNum &&
            this.selectionCoordinates.selectionStartColumn <= tileEndColNum
        ) {
            const clearY = ((this.selectionCoordinates.selectionStartRow - 1) % 25 === 0) ? 0 : this.rowsPositionArr[(this.selectionCoordinates.selectionStartRow - 2) % 25];
            const clearX = ((this.selectionCoordinates.selectionStartColumn - 1) % 25 === 0) ? 0 : this.colsPositionArr[(this.selectionCoordinates.selectionStartColumn - 2) % 25];

            const clearWidth = this.colsPositionArr[(this.selectionCoordinates.selectionStartColumn - 1) % 25] - clearX;
            const clearHeight = this.rowsPositionArr[(this.selectionCoordinates.selectionStartRow - 1) % 25] - clearY;

            // Set the position and size of the input element.
            this.inputDiv.style.top = `${clearY}px`;
            this.inputDiv.style.left = `${clearX}px`;
            this.inputDiv.style.width = `${clearWidth}px`;
            this.inputDiv.style.height = `${clearHeight}px`;

            // Set attributes on the input element for identifying its corresponding cell.
            this.inputDiv.setAttribute("row", `${this.selectionCoordinates.selectionStartRow}`);
            this.inputDiv.setAttribute("col", `${this.selectionCoordinates.selectionStartColumn}`);

            // Clear the canvas area where the input box will be placed.
            ctx.clearRect(clearX, clearY, clearWidth - 1, clearHeight - 1);
        }

        // Draw the border around the selected range.
        ctx.beginPath();
        ctx.strokeStyle = "#137E43";
        ctx.lineWidth = 2;

        // Draw left border if it's the start of the selected column range.
        if (selectedStartCol === rangeColumnStartNum) {
            ctx.moveTo(startX + 1, startY);
            ctx.lineTo(startX + 1, startY + rectHeight);
        }

        // Draw top border if it's the start of the selected row range.
        if (selectedStartRow === rangeRowStartNum) {
            ctx.moveTo(startX, startY + 1);
            ctx.lineTo(startX + rectWidth, startY + 1);
        }

        // Draw right border if it's the end of the selected column range.
        if (selectedEndCol === rangeColumnEndNum) {
            ctx.moveTo(startX + rectWidth - 1, startY);
            ctx.lineTo(startX + rectWidth - 1, startY + rectHeight);
        }

        // Draw bottom border if it's the end of the selected row range.
        if (selectedEndRow === rangeRowEndNum) {
            ctx.moveTo(startX, startY + rectHeight - 1);
            ctx.lineTo(startX + rectWidth, startY + rectHeight - 1);
        }

        ctx.stroke();
    }

    /**
     * Updates the canvas's device pixel ratio (DPR) and redraws the grid if the DPR has changed,
     * ensuring crisp rendering on high-DPI screens.
     */
    updateDPR() {
        const newDPR = window.devicePixelRatio || 1;
        if (newDPR !== this.dpr) {
            this.dpr = newDPR;
            this.drawGrid();
        }
    }
}