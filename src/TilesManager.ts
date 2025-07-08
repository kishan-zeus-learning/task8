import { CellsManager } from "./CellsManager.js";
import { Tile } from "./Tile.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";

export class TilesManager {
    // 2D array of currently visible tiles
    readonly visibleTiles: Tile[][];

    // Array of row container divs for visible tile rows
    private visibleTilesRowDivArr: HTMLDivElement[];

    private selectionCoordinates: MultipleSelectionCoordinates;

    // Row-wise prefix sums of visible row heights
    private visibleTilesRowPrefixSum: number[][];

    // Column-wise prefix sums of visible column widths
    private visibleTilesColumnPrefixSum: number[][];

    // Count of visible tile rows and columns
    private visibleRowCnt: number;
    private visibleColumnCnt: number;

    // Indices representing the starting visible row and column
    private startRowIdx: number;
    private startColIdx: number;

    // Current vertical and horizontal margins for scrolling
    private marginTop: { value: number };
    private marginLeft: { value: number };

    // The main grid container div element
    readonly gridDiv: HTMLDivElement;

    private CellsManager:CellsManager;

    constructor(
        visibleTilesRowPrefixSum: number[][],
        visibleTilesColumnPrefixSum: number[][],
        visibleRowCnt: number,
        visibleColumnCnt: number,
        selectionCoordinates:MultipleSelectionCoordinates,
        CellsManager:CellsManager,
        startRowIdx: number = 0,
        startColIdx: number = 0,
        marginTop: { value: number } = { value: 0 },
        marginLeft: { value: number } = { value: 0 }
    ) {
        this.gridDiv = document.getElementById("grid") as HTMLDivElement;
        this.visibleTilesRowPrefixSum = visibleTilesRowPrefixSum;
        this.visibleTilesColumnPrefixSum = visibleTilesColumnPrefixSum;
        this.visibleTiles = [];
        this.visibleTilesRowDivArr = [];
        this.visibleRowCnt = visibleRowCnt;
        this.visibleColumnCnt = visibleColumnCnt;
        this.CellsManager=CellsManager;
        this.selectionCoordinates=selectionCoordinates;
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
        if (this.startColIdx === 0) return;
        this.gridDiv.style.marginLeft = `${this.marginLeft.value}px`;
        this.unmountTileRight();
        this.startColIdx--;
        this.mountTileLeft();
    }

    // Redraws an entire tile row given a row index
    redrawRow(rowID: number) {
        const arrIdx = rowID - this.visibleTiles[0][0].row;
        this.visibleTiles[arrIdx].forEach(tile => {
            tile.drawGrid();
        });
    }

    // Redraws an entire tile column given a column index
    redrawColumn(columnID: number) {
        const arrIdx = columnID - this.visibleTiles[0][0].col;
        this.visibleTiles.forEach(tileArr => {
            tileArr[arrIdx].drawGrid();
        });
    }


    rerender(){
        for(let tilesRow of this.visibleTiles){
            for(let tile of tilesRow){
                tile.drawGrid();
            }
        }
    }

    // Initial rendering of all visible tiles
    private initialLoad() {
        for (let i = this.startRowIdx; i < this.visibleRowCnt + this.startRowIdx; i++) {
            this.visibleTilesRowDivArr.push(this.createRowDiv(i));
            const currentVisibleRow: Tile[] = [];

            for (let j = this.startColIdx; j < this.visibleColumnCnt + this.startColIdx; j++) {
                const tile = new Tile(
                    i,
                    j,
                    this.visibleTilesRowPrefixSum[i - this.startRowIdx],
                    this.visibleTilesColumnPrefixSum[j - this.startColIdx],
                    this.selectionCoordinates,
                    this.CellsManager
                );
                currentVisibleRow.push(tile);
                this.visibleTilesRowDivArr[i - this.startRowIdx].appendChild(tile.tileDiv);
            }

            this.visibleTiles.push(currentVisibleRow);
            this.gridDiv.appendChild(this.visibleTilesRowDivArr[i]);
        }
    }

    // Creates a row container div for tile row
    private createRowDiv(rowID: number) {
        const tilesDiv = document.createElement("div");
        tilesDiv.id = `tileRow${rowID}`;
        tilesDiv.classList.add("flex");
        return tilesDiv;
    }

    // Adds a new row of tiles at the bottom
    private mountTileBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        this.visibleTilesRowDivArr.push(this.createRowDiv(rowIdx));
        const currentVisibleRow: Tile[] = [];

        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j;
            const tile = new Tile(
                rowIdx,
                colIdx,
                this.visibleTilesRowPrefixSum[this.visibleTilesRowPrefixSum.length - 1],
                this.visibleTilesColumnPrefixSum[j],
                this.selectionCoordinates,
                this.CellsManager
            );
            currentVisibleRow.push(tile);
            this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1].appendChild(tile.tileDiv);
        }

        this.visibleTiles.push(currentVisibleRow);
        this.gridDiv.appendChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
    }

    // Adds a new row of tiles at the top
    private mountTileTop() {
        const rowIdx = this.startRowIdx;
        this.visibleTilesRowDivArr.unshift(this.createRowDiv(rowIdx));
        const currentVisibleRow: Tile[] = [];

        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j;
            const tile = new Tile(
                rowIdx,
                colIdx,
                this.visibleTilesRowPrefixSum[0],
                this.visibleTilesColumnPrefixSum[0],
                this.selectionCoordinates,
                this.CellsManager
            );
            currentVisibleRow.push(tile);
            this.visibleTilesRowDivArr[0].appendChild(tile.tileDiv);
        }

        this.visibleTiles.unshift(currentVisibleRow);
        this.gridDiv.prepend(this.visibleTilesRowDivArr[0]);
    }

    // Adds a new column of tiles to the left
    private mountTileLeft() {
        const colIdx = this.startColIdx;

        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;
            const tile = new Tile(
                rowIdx,
                colIdx,
                this.visibleTilesRowPrefixSum[i],
                this.visibleTilesColumnPrefixSum[0],
                this.selectionCoordinates,
                this.CellsManager
            );
            this.visibleTiles[i].unshift(tile);
            this.visibleTilesRowDivArr[i].prepend(tile.tileDiv);
        }
    }

    // Adds a new column of tiles to the right
    private mountTileRight() {
        const colIdx = this.startColIdx + this.visibleColumnCnt - 1;

        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i;
            const tile = new Tile(
                rowIdx,
                colIdx,
                this.visibleTilesRowPrefixSum[i],
                this.visibleTilesColumnPrefixSum[this.visibleTilesColumnPrefixSum.length - 1],
                this.selectionCoordinates,
                this.CellsManager
            );
            this.visibleTiles[i].push(tile);
            this.visibleTilesRowDivArr[i].appendChild(tile.tileDiv);
        }
    }

    // Removes the topmost row of tiles
    private unmountTileTop() {
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[0]);
        this.visibleTiles.shift();
        this.visibleTilesRowDivArr.shift();
    }

    // Removes the bottommost row of tiles
    private unmountTileBottom() {
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
        this.visibleTiles.pop();
        this.visibleTilesRowDivArr.pop();
    }

    // Removes the leftmost column of tiles
    private unmountTileLeft() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].firstChild as HTMLDivElement);
            this.visibleTiles[i].shift();
        }
    }

    // Removes the rightmost column of tiles
    private unmountTileRight() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].lastChild as HTMLDivElement);
            this.visibleTiles[i].pop();
        }
    }
}
