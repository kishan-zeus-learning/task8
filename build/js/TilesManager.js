import { Tile } from "./Tile.js";
export class TilesManager {
    constructor(visibleTilesRowPrefixSum, visibleTilesColumnPrefixSum, visibleRowCnt, visibleColumnCnt, startRowIdx = 0, startColIdx = 0, marginTop = 0, marginLeft = 0) {
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
    scrollDown(nextRowPrefixSumArr) {
        // if(this.startRowIdx>=this.maxRowIdx) return ;
        this.unmountTileTop();
        this.startRowIdx++;
        this.visibleTilesRowPrefixSum.push(nextRowPrefixSumArr);
        this.mountTileBottom();
    }
    scrollRight(nextColumnPrefixSumArr) {
        // if(this.startColIdx>=this.maxColIdx) return;
        this.unmountTileLeft();
        this.startColIdx++;
        this.visibleTilesColumnPrefixSum.push(nextColumnPrefixSumArr);
        this.mountTileRight();
    }
    scrollUp(prevRowPrefixSumArr) {
        if (this.startRowIdx === 0)
            return;
        this.unmountTileBottom();
        this.visibleTilesRowPrefixSum.unshift(prevRowPrefixSumArr);
        this.startRowIdx--;
        this.mountTileTop();
    }
    scrollLeft(prevColumnPrefixSumArr) {
        if (this.startColIdx === 0)
            return;
        this.unmountTileRight();
        this.startColIdx--;
        this.visibleTilesColumnPrefixSum.unshift(prevColumnPrefixSumArr);
        this.mountTileLeft();
    }
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
    createRowDiv(rowID) {
        const tilesDiv = document.createElement("div");
        tilesDiv.id = `tileRow${rowID}`;
        tilesDiv.classList.add("flex");
        return tilesDiv;
    }
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
    mountTileLeft() {
        const colIdx = this.startColIdx;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[i], this.visibleTilesColumnPrefixSum[0]);
            this.visibleTiles[i].unshift(tile);
            this.visibleTilesRowDivArr[i].prepend(tile.tileDiv);
        }
    }
    mountTileRight() {
        const colIdx = this.startColIdx + this.visibleColumnCnt - 1;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[i], this.visibleTilesColumnPrefixSum[this.visibleTilesColumnPrefixSum.length - 1]);
            this.visibleTiles[i].push(tile);
            this.visibleTilesRowDivArr[i].appendChild(tile.tileDiv);
        }
    }
    unmountTileTop() {
        this.marginTop += this.visibleTilesRowPrefixSum[0][24];
        this.gridDiv.style.marginTop = `${this.marginTop}px`;
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[0]);
        this.visibleTiles.shift();
        this.visibleTilesRowDivArr.shift();
        this.visibleTilesRowPrefixSum.shift();
        // this.startRowIdx++;
    }
    unmountTileBottom() {
        this.gridDiv.style.marginTop = `${this.marginTop}px`;
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
        this.visibleTiles.pop();
        this.visibleTilesRowDivArr.pop();
        this.visibleTilesRowPrefixSum.pop();
    }
    unmountTileLeft() {
        this.marginLeft += this.visibleTilesColumnPrefixSum[0][24];
        this.gridDiv.style.marginLeft = `${this.marginLeft}px`;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].firstChild);
            this.visibleTiles[i].shift();
        }
        this.visibleTilesColumnPrefixSum.shift();
        // this.startColIdx++;
    }
    unmountTileRight() {
        this.gridDiv.style.marginLeft = `${this.marginLeft}px`;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].lastChild);
            this.visibleTiles[i].pop();
        }
        this.visibleTilesColumnPrefixSum.pop();
    }
}
