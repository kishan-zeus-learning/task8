import { CellsManager } from "./CellsManager.js";
import { ColumnsManager } from "../Columns/ColumnsManager.js";
import { RowsManager } from "../Rows/RowsManager.js";
import { Tile } from "./Tile.js";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates.js";

/**
 * Manages the rendering and dynamic loading/unloading of visible cell tiles within the grid.
 */
export class TilesManager {
    /** @type {Tile[][]} Stores the currently visible tile instances in a 2D array */
    readonly visibleTiles: Tile[][];

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

    /** @type {RowsManager} Manages row-related operations and data */
    private rowsManagerObj: RowsManager;

    /** @type {ColumnsManager} Manages column-related operations and data */
    private columnsManagerObj: ColumnsManager;

    /** @type {HTMLDivElement} Main grid container element */
    readonly gridDiv: HTMLDivElement;

    /** @type {CellsManager} Manages the data and interactions for grid cells */
    private CellsManager: CellsManager;

    /**
     * Initializes a new TilesManager instance
     * @param {RowsManager} rowsManagerObj - The RowsManager instance
     * @param {ColumnsManager} columnsManagerObj - The ColumnsManager instance
     * @param {number} visibleRowCnt - The number of rows currently visible
     * @param {number} visibleColumnCnt - The number of columns currently visible
     * @param {MultipleSelectionCoordinates} selectionCoordinates - The coordinates of the current selection
     * @param {CellsManager} CellsManager - The CellsManager instance
     * @param {number} [startRowIdx=0] - The starting row index for visible tiles
     * @param {number} [startColIdx=0] - The starting column index for visible tiles
     */
    constructor(
        rowsManagerObj: RowsManager,
        columnsManagerObj: ColumnsManager,
        visibleRowCnt: number,
        visibleColumnCnt: number,
        selectionCoordinates: MultipleSelectionCoordinates,
        CellsManager: CellsManager,
        startRowIdx: number = 0,
        startColIdx: number = 0,
    ) {
        this.gridDiv = document.getElementById("grid") as HTMLDivElement;
        this.rowsManagerObj = rowsManagerObj;
        this.columnsManagerObj = columnsManagerObj;
        this.visibleTilesRowPrefixSum = rowsManagerObj.rowsPositionPrefixSumArr;
        this.visibleTilesColumnPrefixSum = columnsManagerObj.visibleColumnsPrefixSumArr;
        this.visibleTiles = [];
        this.visibleRowCnt = visibleRowCnt;
        this.visibleColumnCnt = visibleColumnCnt;
        this.CellsManager = CellsManager;
        this.selectionCoordinates = selectionCoordinates;
        this.startRowIdx = startRowIdx;
        this.startColIdx = startColIdx;

        this.reload();
    }

    /** Scrolls the grid one row down */
    scrollDown(): void {
        this.unmountTileTop();
        this.startRowIdx++;
        this.mountTileBottom();
    }

    /** Scrolls the grid one column to the right */
    scrollRight(): void {
        console.log("inside scroll right");
        this.unmountTileLeft();
        this.startColIdx++;
        this.mountTileRight();
    }

    /** Scrolls the grid one row up */
    scrollUp(): void {
        this.unmountTileBottom();
        this.startRowIdx--;
        this.mountTileTop();
    }

    /** Scrolls the grid one column to the left */
    scrollLeft(): void {
        if (this.startColIdx === 0) return;
        this.unmountTileRight();
        this.startColIdx--;
        this.mountTileLeft();
    }

    /**
     * Redraws all tiles in a specific row.
     * @param {number} rowID - The global index of the row to redraw.
     */
    redrawRow(rowID: number): void {
        const arrIdx = rowID - this.visibleTiles[0][0].row;
        this.visibleTiles[arrIdx].forEach(tile => tile.drawGrid());
    }

    /**
     * Redraws all tiles in a specific column.
     * @param {number} columnID - The global index of the column to redraw.
     */
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
    reload(): void {
        this.startRowIdx = this.rowsManagerObj.getStartRowIdx();
        this.startColIdx = this.columnsManagerObj.getStartColIdx();

        this.gridDiv.replaceChildren();

        this.visibleTiles.splice(0, this.visibleTiles.length);

        let positionY = this.rowsManagerObj.getStartTop();

        for (let i = this.startRowIdx; i < this.visibleRowCnt + this.startRowIdx; i++) {
            let positionX = this.columnsManagerObj.getStartLeft();
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

                this.gridDiv.appendChild(tile.tileDivWrapper);
                tile.tileDivWrapper.style.top = `${positionY}px`;
                tile.tileDivWrapper.style.left = `${positionX}px`;

                positionX += this.visibleTilesColumnPrefixSum[j - this.startColIdx][24];
            }

            this.visibleTiles.push(currentVisibleRow);
            positionY += this.visibleTilesRowPrefixSum[i - this.startRowIdx][24];
        }
    }

    /** Appends a new row of tiles to the bottom of the grid */
    private mountTileBottom(): void {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;

        const currentVisibleRow: Tile[] = [];
        const positionY = this.rowsManagerObj.getScrollHeight() - this.rowsManagerObj.visibleRows[this.visibleRowCnt - 1].rowsPositionArr[24];
        let positionX = this.columnsManagerObj.getStartLeft();

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
            this.gridDiv.appendChild(tile.tileDivWrapper);
            tile.tileDivWrapper.style.top = `${positionY}px`;
            tile.tileDivWrapper.style.left = `${positionX}px`;
            positionX += tile.colsPositionArr[24];
        }

        this.visibleTiles.push(currentVisibleRow);
    }

    /** Prepends a new row of tiles to the top of the grid */
    private mountTileTop(): void {
        const rowIdx = this.startRowIdx;
        const currentVisibleRow: Tile[] = [];
        const coordinateY = this.rowsManagerObj.getStartTop();
        let coordinateX = this.columnsManagerObj.getStartLeft();

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

            this.gridDiv.prepend(tile.tileDivWrapper);
            tile.tileDivWrapper.style.top = `${coordinateY}px`;
            tile.tileDivWrapper.style.left = `${coordinateX}px`;
            coordinateX += tile.colsPositionArr[24];
            currentVisibleRow.push(tile);
        }

        this.visibleTiles.unshift(currentVisibleRow);
    }

    /** Prepends a new column of tiles to the left of the grid */
    private mountTileLeft(): void {
        const colIdx = this.startColIdx;
        const positionX = this.columnsManagerObj.getStartLeft();
        let positionY = this.rowsManagerObj.getStartTop();

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
            this.gridDiv.prepend(tile.tileDivWrapper);
            tile.tileDivWrapper.style.top = `${positionY}px`;
            tile.tileDivWrapper.style.left = `${positionX}px`;

            positionY += tile.rowsPositionArr[24];
            this.visibleTiles[i].unshift(tile);
        }
    }

    /** Appends a new column of tiles to the right of the grid */
    private mountTileRight(): void {
        const colIdx = this.startColIdx + this.visibleColumnCnt - 1;
        const coordinateX = this.columnsManagerObj.getScrollWidth() - this.columnsManagerObj.visibleColumns[this.visibleColumnCnt - 1].columnsPositionArr[24];
        let coordinateY = this.rowsManagerObj.getStartTop();

        console.log("mount tile right x : ", coordinateX, "y: ", coordinateY);

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

            this.gridDiv.appendChild(tile.tileDivWrapper);
            tile.tileDivWrapper.style.left = `${coordinateX}px`;
            tile.tileDivWrapper.style.top = `${coordinateY}px`;
            coordinateY += tile.rowsPositionArr[24];
            this.visibleTiles[i].push(tile);
        }
    }

    /** Removes the topmost row of tiles */
    private unmountTileTop(): void {
        const removingRow = this.visibleTiles[0];
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            this.gridDiv.removeChild(removingRow[j].tileDivWrapper);
        }
        this.visibleTiles.shift();
    }

    /** Removes the bottommost row of tiles */
    private unmountTileBottom(): void {
        const currentRow = this.visibleTiles[this.visibleRowCnt - 1];
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            this.gridDiv.removeChild(currentRow[j].tileDivWrapper);
        }
        this.visibleTiles.pop();
    }

    /** Removes the leftmost column of tiles */
    private unmountTileLeft(): void {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.gridDiv.removeChild(this.visibleTiles[i][0].tileDivWrapper);
            this.visibleTiles[i].shift();
        }
    }

    /** Removes the rightmost column of tiles */
    private unmountTileRight(): void {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            this.gridDiv.removeChild(this.visibleTiles[i][this.visibleColumnCnt - 1].tileDivWrapper);
            this.visibleTiles[i].pop();
        }
    }

    /** Updates the positions and redraws all visible tiles, typically after a resize event. */
    resizePosition() {
        let positionY = this.rowsManagerObj.getStartTop();

        for (let i = 0; i < this.visibleRowCnt; i++) {
            let positionX = this.columnsManagerObj.getStartLeft();
            for (let j = 0; j < this.visibleColumnCnt; j++) {
                this.visibleTiles[i][j].drawGrid();
                this.visibleTiles[i][j].tileDivWrapper.style.top = `${positionY}px`;
                this.visibleTiles[i][j].tileDivWrapper.style.left = `${positionX}px`;

                positionX += this.visibleTiles[i][j].colsPositionArr[24];
            }
            positionY += this.visibleTilesRowPrefixSum[i][24];
        }
    }
}