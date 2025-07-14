/**
 * Represents a single tile (25x25 grid of cells) in the spreadsheet.
 * Responsible for rendering grid lines, text content, and selection highlights.
 */
export class Tile {
    /**
     * Initializes a tile instance for a given (row, col) position.
     * @param {number} row
     * @param {number} col
     * @param {number[]} rowsPositionArr
     * @param {number[]} colsPositionArr
     * @param {MultipleSelectionCoordinates} selectionCoordinates
     * @param {CellsManager} CellsManager
     */
    constructor(row, col, rowsPositionArr, colsPositionArr, selectionCoordinates, CellsManager) {
        /** @type {HTMLCanvasElement} Canvas used for rendering the tile */
        this.tileCanvas = document.createElement("canvas");
        /** @type {HTMLInputElement} Input element used for in-cell editing */
        this.inputDiv = document.createElement("input");
        /** @type {number} Device pixel ratio for high-DPI screens */
        this.dpr = window.devicePixelRatio || 1;
        this.row = row;
        this.col = col;
        this.rowsPositionArr = rowsPositionArr;
        this.colsPositionArr = colsPositionArr;
        this.selectionCoordinates = selectionCoordinates;
        this.CellsManager = CellsManager;
        this.tileDiv = this.createTile();
        this.drawGrid();
    }
    /**
     * Renders the grid lines, selected cells, text values, and input.
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
        const ctx = this.tileCanvas.getContext("2d");
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
     * Adds or removes the input box based on whether selection is inside this tile.
     */
    handleInputTag() {
        if (this.ifInputAppend()) {
            this.tileDiv.appendChild(this.inputDiv);
            this.inputDiv.classList.add("cellInput");
            this.inputDiv.id = `input_r${this.row}_c${this.col}`;
            this.inputDiv.style.visibility = "hidden";
        }
        else {
            if (this.tileDiv.querySelector(".cellInput")) {
                this.tileDiv.removeChild(this.inputDiv);
            }
        }
    }
    /**
     * Renders cell text content inside the tile.
     * @param {CanvasRenderingContext2D} ctx
     */
    renderText(ctx) {
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.textBaseline = "bottom";
        for (let i = 0; i < 25; i++) {
            const rowNum = this.row * 25 + 1 + i;
            const columnMap = this.CellsManager.CellsMap.get(rowNum);
            if (!columnMap)
                continue;
            for (let j = 0; j < 25; j++) {
                const colNum = this.col * 25 + 1 + j;
                const cell = columnMap.get(colNum);
                if (!cell)
                    continue;
                if (cell.leftAlign) {
                    ctx.textAlign = "left";
                    const textX = j === 0 ? 0 : this.colsPositionArr[j - 1] + 5;
                    const textY = this.rowsPositionArr[i] - 3;
                    ctx.fillText(cell.getValue(), textX, textY);
                }
                else {
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
     * @returns {HTMLDivElement}
     */
    createTile() {
        const tileDiv = document.createElement("div");
        tileDiv.id = `tile_${this.row}_${this.col}`;
        tileDiv.classList.add("tileDiv");
        tileDiv.appendChild(this.tileCanvas);
        return tileDiv;
    }
    /**
     * Determines if selection start cell lies within this tile.
     * @returns {boolean}
     */
    ifInputAppend() {
        const startRow = this.row * 25 + 1;
        const endRow = this.row * 25 + 25;
        const startCol = this.col * 25 + 1;
        const endCol = this.col * 25 + 25;
        return (this.selectionCoordinates.selectionStartRow <= endRow &&
            this.selectionCoordinates.selectionStartRow >= startRow &&
            this.selectionCoordinates.selectionStartColumn >= startCol &&
            this.selectionCoordinates.selectionStartColumn <= endCol);
    }
    /**
     * Highlights the selected area and draws the selection border.
     * @param {CanvasRenderingContext2D} ctx
     */
    renderSelected(ctx) {
        const tileStartRowNum = this.row * 25 + 1;
        const tileStartColNum = this.col * 25 + 1;
        const tileEndRowNum = this.row * 25 + 25;
        const tileEndColNum = this.col * 25 + 25;
        const selectedStartRow = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const selectedEndRow = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
        const selectedStartCol = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        const selectedEndCol = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
        if (selectedEndRow < tileStartRowNum ||
            selectedStartRow > tileEndRowNum ||
            selectedEndCol < tileStartColNum ||
            selectedStartCol > tileEndColNum)
            return;
        const rangeRowStartNum = Math.max(selectedStartRow, tileStartRowNum);
        const rangeRowEndNum = Math.min(selectedEndRow, tileEndRowNum);
        const rangeColumnStartNum = Math.max(selectedStartCol, tileStartColNum);
        const rangeColumnEndNum = Math.min(selectedEndCol, tileEndColNum);
        const startY = ((rangeRowStartNum - 1) % 25 === 0) ? 0 : this.rowsPositionArr[(rangeRowStartNum - 2) % 25];
        const startX = ((rangeColumnStartNum - 1) % 25 === 0) ? 0 : this.colsPositionArr[(rangeColumnStartNum - 2) % 25];
        const rectHeight = this.rowsPositionArr[(rangeRowEndNum - 1) % 25] - startY;
        const rectWidth = this.colsPositionArr[(rangeColumnEndNum - 1) % 25] - startX;
        ctx.fillStyle = "#E8F2EC";
        ctx.fillRect(startX, startY, rectWidth, rectHeight);
        ctx.stroke();
        if (this.selectionCoordinates.selectionStartRow >= tileStartRowNum &&
            this.selectionCoordinates.selectionStartRow <= tileEndRowNum &&
            this.selectionCoordinates.selectionStartColumn >= tileStartColNum &&
            this.selectionCoordinates.selectionStartColumn <= tileEndColNum) {
            const clearY = ((this.selectionCoordinates.selectionStartRow - 1) % 25 === 0) ? 0 : this.rowsPositionArr[(this.selectionCoordinates.selectionStartRow - 2) % 25];
            const clearX = ((this.selectionCoordinates.selectionStartColumn - 1) % 25 === 0) ? 0 : this.colsPositionArr[(this.selectionCoordinates.selectionStartColumn - 2) % 25];
            const clearWidth = this.colsPositionArr[(this.selectionCoordinates.selectionStartColumn - 1) % 25] - clearX;
            const clearHeight = this.rowsPositionArr[(this.selectionCoordinates.selectionStartRow - 1) % 25] - clearY;
            this.inputDiv.style.top = `${clearY}px`;
            this.inputDiv.style.left = `${clearX}px`;
            this.inputDiv.style.width = `${clearWidth}px`;
            this.inputDiv.style.height = `${clearHeight}px`;
            this.inputDiv.setAttribute("row", `${this.selectionCoordinates.selectionStartRow}`);
            this.inputDiv.setAttribute("col", `${this.selectionCoordinates.selectionStartColumn}`);
            ctx.clearRect(clearX, clearY, clearWidth - 1, clearHeight - 1);
        }
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
    /**
     * Updates the canvas DPR and redraws the grid if DPR has changed.
     */
    updateDPR() {
        const newDPR = window.devicePixelRatio || 1;
        if (newDPR !== this.dpr) {
            this.dpr = newDPR;
            this.drawGrid();
        }
    }
}
