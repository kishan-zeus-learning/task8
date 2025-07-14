import { CellsManager } from "./CellsManager.js";
import { Tile } from "./Tile.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";
import { NumberObj } from "./types/NumberObj.js";

/**
 * Manages the rendering and dynamic loading/unloading of visible cell tiles within the grid.
 */
export class TilesManager {
    /** @type {Tile[][]} Stores the currently visible tile instances in a 2D array */
    readonly visibleTiles: Tile[][];

    /** @type {HTMLDivElement[]} Stores row container divs for visible tiles */
    private visibleTilesRowDivArr: HTMLDivElement[];

    /** @type {MultipleSelectionCoordinates} Stores the coordinates of the selected cell range */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @type {number[][]} Row-wise prefix sums for visible row heights */
    private visibleTilesRowPrefixSum: number[][];

    /** @type {number[][]} Column-wise prefix sums for visible column widths */
    private visibleTilesColumnPrefixSum: number[][];

    /** @type {number} Number of visible tile rows */
    private visibleRowCnt: number;

    /** @type {number} Number of visible tile columns */
    private visibleColumnCnt: number;

    /** @type {number} Index of the first visible row */
    private startRowIdx: number;

    /** @type {number} Index of the first visible column */
    private startColIdx: number;

    /** @type {NumberObj} Object storing current vertical scroll offset */
    private marginTop: NumberObj;

    /** @type {NumberObj} Object storing current horizontal scroll offset */
    private marginLeft: NumberObj;

    /** @type {HTMLDivElement} Main grid container element */
    readonly gridDiv: HTMLDivElement;

    /** @type {CellsManager} Manages the data and interactions for grid cells */
    private CellsManager: CellsManager;

    /**
     * Initializes a new TilesManager instance
     */
    constructor(
        visibleTilesRowPrefixSum: number[][],
        visibleTilesColumnPrefixSum: number[][],
        visibleRowCnt: number,
        visibleColumnCnt: number,
        selectionCoordinates: MultipleSelectionCoordinates,
        CellsManager: CellsManager,
        startRowIdx: number = 0,
        startColIdx: number = 0,
        marginTop: NumberObj,
        marginLeft: NumberObj
    ) {
        this.gridDiv = document.getElementById("grid") as HTMLDivElement;
        this.visibleTilesRowPrefixSum = visibleTilesRowPrefixSum;
        this.visibleTilesColumnPrefixSum = visibleTilesColumnPrefixSum;
        this.visibleTiles = [];
        this.visibleTilesRowDivArr = [];
        this.visibleRowCnt = visibleRowCnt;
        this.visibleColumnCnt = visibleColumnCnt;
        this.CellsManager = CellsManager;
        this.selectionCoordinates = selectionCoordinates;
        this.startRowIdx = startRowIdx;
        this.startColIdx = startColIdx;
        this.marginTop = marginTop;
        this.marginLeft = marginLeft;

        this.initialLoad();
    }

    /** Scrolls the grid one row down */
    scrollDown(): void {
        this.gridDiv.style.marginTop = `${this.marginTop.value}px`;
        this.unmountTileTop();
        this.startRowIdx++;
        this.mountTileBottom();
    }

    /** Scrolls the grid one column to the right */
    scrollRight(): void {
        this.gridDiv.style.marginLeft = `${this.marginLeft.value}px`;
        this.unmountTileLeft();
        this.startColIdx++;
        this.mountTileRight();
    }

    /** Scrolls the grid one row up */
    scrollUp(): void {
        this.gridDiv.style.marginTop = `${this.marginTop.value}px`;
        this.unmountTileBottom();
        this.startRowIdx--;
        this.mountTileTop();
    }

    /** Scrolls the grid one column to the left */
    scrollLeft(): void {
        if (this.startColIdx === 0) return;
        this.gridDiv.style.marginLeft = `${this.marginLeft.value}px`;
        this.unmountTileRight();
        this.startColIdx--;
        this.mountTileLeft();
    }

    /** Redraws all tiles in a specific row */
    redrawRow(rowID: number): void {
        const arrIdx = rowID - this.visibleTiles[0][0].row;
        this.visibleTiles[arrIdx].forEach(tile => tile.drawGrid());
    }

    /** Redraws all tiles in a specific column */
    redrawColumn(columnID: number): void {
        const arrIdx = columnID - this.visibleTiles[0][0].col;
        this.visibleTiles.forEach(tileArr => tileArr[arrIdx].drawGrid());
    }

    /** Redraws all visible tiles */
    rerender(): void {
        for (const tilesRow of this.visibleTiles) {
            for (const tile of tilesRow) {
                tile.drawGrid();
            }
        }
    }

    /** Loads the initial set of visible tiles */
    private initialLoad(): void {
        for (let i = this.startRowIdx; i < this.visibleRowCnt + this.startRowIdx; i++) {
            const rowDiv = this.createRowDiv(i);
            this.visibleTilesRowDivArr.push(rowDiv);

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
            this.gridDiv.appendChild(this.visibleTilesRowDivArr[i - this.startRowIdx]);
        }
    }

    /** Creates a container div for a tile row */
    private createRowDiv(rowID: number): HTMLDivElement {
        const tilesDiv = document.createElement("div");
        tilesDiv.id = `tileRow${rowID}`;
        tilesDiv.classList.add("flex");
        return tilesDiv;
    }

    /** Appends a new row of tiles to the bottom of the grid */
    private mountTileBottom(): void {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        const rowDiv = this.createRowDiv(rowIdx);
        this.visibleTilesRowDivArr.push(rowDiv);

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

    /** Prepends a new row of tiles to the top of the grid */
    private mountTileTop(): void {
        const rowIdx = this.startRowIdx;
        const rowDiv = this.createRowDiv(rowIdx);
        this.visibleTilesRowDivArr.unshift(rowDiv);

        const currentVisibleRow: Tile[] = [];

        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j;
            const tile = new Tile(
                rowIdx,
                colIdx,
                this.visibleTilesRowPrefixSum[0],
                this.visibleTilesColumnPrefixSum[j],
                this.selectionCoordinates,
                this.CellsManager
            );
            currentVisibleRow.push(tile);
            this.visibleTilesRowDivArr[0].appendChild(tile.tileDiv);
        }

        this.visibleTiles.unshift(currentVisibleRow);
        this.gridDiv.prepend(this.visibleTilesRowDivArr[0]);
    }

    /** Prepends a new column of tiles to the left of the grid */
    private mountTileLeft(): void {
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

    /** Appends a new column of tiles to the right of the grid */
    private mountTileRight(): void {
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

    /** Removes the topmost row of tiles */
    private unmountTileTop(): void {
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[0]);
        this.visibleTiles.shift();
        this.visibleTilesRowDivArr.shift();
    }

    /** Removes the bottommost row of tiles */
    private unmountTileBottom(): void {
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
        this.visibleTiles.pop();
        this.visibleTilesRowDivArr.pop();
    }

    /** Removes the leftmost column of tiles */
    private unmountTileLeft(): void {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].firstChild as HTMLDivElement);
            this.visibleTiles[i].shift();
        }
    }

    /** Removes the rightmost column of tiles */
    private unmountTileRight(): void {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].lastChild as HTMLDivElement);
            this.visibleTiles[i].pop();
        }
    }
}