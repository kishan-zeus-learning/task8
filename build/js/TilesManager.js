import { Tile } from "./Tile.js";
export class TilesManager {
    constructor(visibleTilesRowPrefixSum, visibleTilesColumnPrefixSum, visibleRowCnt, visibleColumnCnt, startRowIdx = 0, startColIdx = 0, marginTop = 0) {
        this.gridDiv = document.getElementById("grid");
        this.visibleTilesRowPrefixSum = visibleTilesRowPrefixSum;
        this.visibleTilesColumnPrefixSum = visibleTilesColumnPrefixSum;
        this.visibleTiles = [];
        this.visibleTilesRowDiv = [];
        this.visibleRowCnt = visibleRowCnt;
        this.visibleColumnCnt = visibleColumnCnt;
        this.startRowIdx = startRowIdx;
        this.endRowIdx = startRowIdx + visibleRowCnt - 1;
        this.startColIdx = startColIdx;
        this.endColIdx = startColIdx + visibleColumnCnt - 1;
        this.marginTop = marginTop;
        this.initialLoad();
    }
    initialLoad() {
        for (let i = this.startRowIdx; i < this.visibleRowCnt + this.startRowIdx; i++) {
            this.visibleTilesRowDiv.push(this.createRowDiv(i));
            const currentVisibleRow = [];
            for (let j = this.startColIdx; j < this.visibleColumnCnt + this.startColIdx; j++) {
                const tile = new Tile(i, j, this.visibleTilesRowPrefixSum[i - this.startRowIdx], this.visibleTilesColumnPrefixSum[j - this.startColIdx]);
                currentVisibleRow.push(tile);
                this.visibleTilesRowDiv[i - this.startRowIdx].appendChild(tile.tileDiv);
            }
            this.visibleTiles.push(currentVisibleRow);
            this.gridDiv.appendChild(this.visibleTilesRowDiv[i]);
        }
    }
    createRowDiv(rowID) {
        const tilesDiv = document.createElement("div");
        tilesDiv.id = `tileRow${rowID}`;
        tilesDiv.classList.add("flex");
        return tilesDiv;
    }
    mountTileBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt;
        console.log(rowIdx);
        this.visibleTilesRowDiv.push(this.createRowDiv(rowIdx));
        const currentVisibleRow = [];
        for (let j = this.startColIdx; j < this.visibleColumnCnt + this.startColIdx; j++) {
            const tile = new Tile(rowIdx, j, this.visibleTilesRowPrefixSum[this.visibleRowCnt - 1], this.visibleTilesColumnPrefixSum[j]);
            currentVisibleRow.push(tile);
            this.visibleTilesRowDiv[this.visibleTilesRowDiv.length - 1].appendChild(tile.tileDiv);
        }
        this.visibleTiles.push(currentVisibleRow);
        console.log(this.visibleTilesRowDiv[this.visibleTilesRowDiv.length - 1]);
        this.gridDiv.appendChild(this.visibleTilesRowDiv[this.visibleTilesRowDiv.length - 1]);
    }
    mountTileTop() {
    }
    mountTileLeft() {
    }
    mountTileRight() {
    }
}
