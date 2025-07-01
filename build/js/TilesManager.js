import { Tile } from "./Tile.js";
export class TilesManager {
    constructor(visibleTilesRowPrefixSum, visibleTilesColumnPrefixSum, visibleRowCnt, visibleColumnCnt, startRowIdx = 0, startColIdx = 0, marginTop = { value: 0 }, marginLeft = { value: 0 }) {
        this.gridDiv = document.getElementById("grid");
        this.visibleTilesRowPrefixSum = visibleTilesRowPrefixSum;
        this.visibleTilesColumnPrefixSum = visibleTilesColumnPrefixSum;
        this.visibleTiles = [];
        this.visibleTilesRowDivArr = [];
        this.visibleRowCnt = visibleRowCnt;
        this.visibleColumnCnt = visibleColumnCnt;
        this.startRowIdx = startRowIdx;
        this.startColIdx = startColIdx;
        this.marginTop = marginTop;
        this.marginLeft = marginLeft;
        this.initialLoad();
    }
    // Scrolls grid down by one tile row
    scrollDown() {
        this.gridDiv.style.marginTop = `${this.marginTop.value}px`;
        this.unmountTileTop();
        this.startRowIdx++;
        this.mountTileBottom();
    }
    // Scrolls grid to the right by one tile column
    scrollRight() {
        this.gridDiv.style.marginLeft = `${this.marginLeft.value}px`;
        this.unmountTileLeft();
        this.startColIdx++;
        this.mountTileRight();
    }
    // Scrolls grid up by one tile row
    scrollUp() {
        this.gridDiv.style.marginTop = `${this.marginTop.value}px`;
        this.unmountTileBottom();
        this.startRowIdx--;
        this.mountTileTop();
    }
    // Scrolls grid to the left by one tile column
    scrollLeft() {
        if (this.startColIdx === 0)
            return;
        this.gridDiv.style.marginLeft = `${this.marginLeft.value}px`;
        this.unmountTileRight();
        this.startColIdx--;
        this.mountTileLeft();
    }
    // Redraws an entire tile row given a row index
    redrawRow(rowID) {
        const arrIdx = rowID - this.visibleTiles[0][0].row;
        this.visibleTiles[arrIdx].forEach(tile => {
            tile.drawGrid();
        });
    }
    // Redraws an entire tile column given a column index
    redrawColumn(columnID) {
        const arrIdx = columnID - this.visibleTiles[0][0].col;
        this.visibleTiles.forEach(tileArr => {
            tileArr[arrIdx].drawGrid();
        });
    }
    // Initial rendering of all visible tiles
    initialLoad() {
        for (let i = this.startRowIdx; i < this.visibleRowCnt + this.startRowIdx; i++) {
            this.visibleTilesRowDivArr.push(this.createRowDiv(i));
            const currentVisibleRow = [];
            for (let j = this.startColIdx; j < this.visibleColumnCnt + this.startColIdx; j++) {
                const tile = new Tile(i, j, this.visibleTilesRowPrefixSum[i - this.startRowIdx], this.visibleTilesColumnPrefixSum[j - this.startColIdx]);
                currentVisibleRow.push(tile);
                this.visibleTilesRowDivArr[i - this.startRowIdx].appendChild(tile.tileDiv);
            }
            this.visibleTiles.push(currentVisibleRow);
            this.gridDiv.appendChild(this.visibleTilesRowDivArr[i]);
        }
    }
    // Creates a row container div for tile row
    createRowDiv(rowID) {
        const tilesDiv = document.createElement("div");
        tilesDiv.id = `tileRow${rowID}`;
        tilesDiv.classList.add("flex");
        return tilesDiv;
    }
    // Adds a new row of tiles at the bottom
    mountTileBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        this.visibleTilesRowDivArr.push(this.createRowDiv(rowIdx));
        const currentVisibleRow = [];
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[this.visibleTilesRowPrefixSum.length - 1], this.visibleTilesColumnPrefixSum[j]);
            currentVisibleRow.push(tile);
            this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1].appendChild(tile.tileDiv);
        }
        this.visibleTiles.push(currentVisibleRow);
        this.gridDiv.appendChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
    }
    // Adds a new row of tiles at the top
    mountTileTop() {
        const rowIdx = this.startRowIdx;
        this.visibleTilesRowDivArr.unshift(this.createRowDiv(rowIdx));
        const currentVisibleRow = [];
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[0], this.visibleTilesColumnPrefixSum[0]);
            currentVisibleRow.unshift(tile);
            this.visibleTilesRowDivArr[0].appendChild(tile.tileDiv);
        }
        this.visibleTiles.unshift(currentVisibleRow);
        this.gridDiv.prepend(this.visibleTilesRowDivArr[0]);
    }
    // Adds a new column of tiles to the left
    mountTileLeft() {
        const colIdx = this.startColIdx;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[i], this.visibleTilesColumnPrefixSum[0]);
            this.visibleTiles[i].unshift(tile);
            this.visibleTilesRowDivArr[i].prepend(tile.tileDiv);
        }
    }
    // Adds a new column of tiles to the right
    mountTileRight() {
        const colIdx = this.startColIdx + this.visibleColumnCnt - 1;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[i], this.visibleTilesColumnPrefixSum[this.visibleTilesColumnPrefixSum.length - 1]);
            this.visibleTiles[i].push(tile);
            this.visibleTilesRowDivArr[i].appendChild(tile.tileDiv);
        }
    }
    // Removes the topmost row of tiles
    unmountTileTop() {
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[0]);
        this.visibleTiles.shift();
        this.visibleTilesRowDivArr.shift();
    }
    // Removes the bottommost row of tiles
    unmountTileBottom() {
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
        this.visibleTiles.pop();
        this.visibleTilesRowDivArr.pop();
    }
    // Removes the leftmost column of tiles
    unmountTileLeft() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].firstChild);
            this.visibleTiles[i].shift();
        }
    }
    // Removes the rightmost column of tiles
    unmountTileRight() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].lastChild);
            this.visibleTiles[i].pop();
        }
    }
}
