import { Tile } from "./Tile.js";
 
 
export class TilesManager {
    private visibleTiles: Tile[][];
    private visibleTilesRowDivArr: HTMLDivElement[];
    private visibleTilesRowPrefixSum: number[][];
    private visibleTilesColumnPrefixSum: number[][];
    private visibleRowCnt: number;
    private visibleColumnCnt: number;
    private startRowIdx: number;
    private startColIdx: number;
    private marginTop: {value:number};
    private marginLeft: {value:number};
    private gridDiv: HTMLDivElement;
 
 
    constructor(visibleTilesRowPrefixSum: number[][], visibleTilesColumnPrefixSum: number[][], visibleRowCnt: number, visibleColumnCnt: number, startRowIdx: number = 0, startColIdx: number = 0, marginTop:{value:number}={value:0}, marginLeft:{value:number}={value:0}) {
        this.gridDiv = document.getElementById("grid") as HTMLDivElement;
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
 
 
    scrollDown(nextRowPrefixSumArr: number[]) {
        this.gridDiv.style.marginTop=`${this.marginTop.value}px`;
        this.unmountTileTop();
        this.startRowIdx++;
        // this.visibleTilesRowPrefixSum.push(nextRowPrefixSumArr);
        this.mountTileBottom();
    }
 
    scrollRight(nextColumnPrefixSumArr:number[]){
        console.log("margin: ",this.marginLeft.value)
        this.gridDiv.style.marginLeft=`${this.marginLeft.value}px`;
        this.unmountTileLeft();
        this.startColIdx++;
        // this.visibleTilesColumnPrefixSum.push(nextColumnPrefixSumArr);
        this.mountTileRight();
    }
 
    scrollUp(prevRowPrefixSumArr:number[]){
        this.gridDiv.style.marginTop=`${this.marginTop.value}px`;
        this.unmountTileBottom();
        // this.visibleTilesRowPrefixSum.unshift(prevRowPrefixSumArr);
        this.startRowIdx--;
        this.mountTileTop();
    }
 
    scrollLeft(prevColumnPrefixSumArr:number[]){
        if(this.startColIdx===0) return ;
        this.gridDiv.style.marginLeft=`${this.marginLeft.value}px`;
        this.unmountTileRight();
        this.startColIdx--;
        // this.visibleTilesColumnPrefixSum.unshift(prevColumnPrefixSumArr);
        this.mountTileLeft();
    }
 
 
 
    private initialLoad() {
        for (let i = this.startRowIdx; i < this.visibleRowCnt + this.startRowIdx; i++) {
            this.visibleTilesRowDivArr.push(this.createRowDiv(i));
            const currentVisibleRow: Tile[] = [];
            for (let j = this.startColIdx; j < this.visibleColumnCnt + this.startColIdx; j++) {
                const tile = new Tile(i, j, this.visibleTilesRowPrefixSum[i - this.startRowIdx], this.visibleTilesColumnPrefixSum[j - this.startColIdx]);
                currentVisibleRow.push(tile);
                this.visibleTilesRowDivArr[i - this.startRowIdx].appendChild(tile.tileDiv);
            }
            this.visibleTiles.push(currentVisibleRow);
            this.gridDiv.appendChild(this.visibleTilesRowDivArr[i]);
        }
 
    }
 
    private createRowDiv(rowID: number) {
        const tilesDiv = document.createElement("div");
tilesDiv.id = `tileRow${rowID}`;
        tilesDiv.classList.add("flex");
 
        return tilesDiv;
    }
 
 
    private mountTileBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        this.visibleTilesRowDivArr.push(this.createRowDiv(rowIdx));
        const currentVisibleRow: Tile[] = [];
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[this.visibleTilesRowPrefixSum.length - 1], this.visibleTilesColumnPrefixSum[j]);
            currentVisibleRow.push(tile);
            this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1].appendChild(tile.tileDiv);
 
        }
        this.visibleTiles.push(currentVisibleRow);
        this.gridDiv.appendChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
 
    }
 
 
    private mountTileTop() {
//         this.marginTop-=this.visibleTilesRowPrefixSum[0][24];
// this.gridDiv.style.marginTop=`${this.marginTop}px`;
        const rowIdx = this.startRowIdx;
        this.visibleTilesRowDivArr.unshift(this.createRowDiv(rowIdx));
        const currentVisibleRow: Tile[] = [];
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[0], this.visibleTilesColumnPrefixSum[0]);
            currentVisibleRow.unshift(tile);
            this.visibleTilesRowDivArr[0].appendChild(tile.tileDiv);
        }
        this.visibleTiles.unshift(currentVisibleRow);
        this.gridDiv.prepend(this.visibleTilesRowDivArr[0]);
 
    }
 
    private mountTileLeft() {
        
        const colIdx = this.startColIdx;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[i], this.visibleTilesColumnPrefixSum[0]);
            this.visibleTiles[i].unshift(tile);
            this.visibleTilesRowDivArr[i].prepend(tile.tileDiv);
        }
 
    }
 
    private mountTileRight() {
        const colIdx = this.startColIdx + this.visibleColumnCnt-1;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[i], this.visibleTilesColumnPrefixSum[this.visibleTilesColumnPrefixSum.length - 1]);
            this.visibleTiles[i].push(tile);
            this.visibleTilesRowDivArr[i].appendChild(tile.tileDiv);
        }
    }
 
    private unmountTileTop() {
//         this.marginTop += this.visibleTilesRowPrefixSum[0][24];
// this.gridDiv.style.marginTop = `${this.marginTop}px`;
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[0]);
        this.visibleTiles.shift();
        this.visibleTilesRowDivArr.shift();
        // this.visibleTilesRowPrefixSum.shift();
        // this.startRowIdx++;
    }
    private unmountTileBottom() {
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
        this.visibleTiles.pop();
        this.visibleTilesRowDivArr.pop();
        // this.visibleTilesRowPrefixSum.pop();
 
    }
 
    private unmountTileLeft() {
        // this.marginLeft += this.visibleTilesColumnPrefixSum[0][24];
        // this.marginLeft+=this.visibleTiles[0][0].colsPositionArr[24];
        // this.gridDiv.style.marginLeft = `${this.marginLeft}px`;
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].firstChild as HTMLDivElement);
            this.visibleTiles[i].shift();
        }
        // this.visibleTilesColumnPrefixSum.shift();
 
        // this.startColIdx++;
    }
 
    private unmountTileRight() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].lastChild as HTMLDivElement);
            this.visibleTiles[i].pop();
        }
        // this.visibleTilesColumnPrefixSum.pop();
 
        // this.marginLeft-=this.visibleTilesColumnPrefixSum[0][24];
        // this.marginLeft-=this.visibleTiles[0][0].colsPositionArr[24];
// this.gridDiv.style.marginLeft=`${this.marginLeft}px`;
 
 
    }
 
}