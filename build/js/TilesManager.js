import { Tile } from "./Tile.js";
/**
 * Manages the rendering and dynamic loading/unloading of visible cell tiles within the grid.
 * It coordinates with scroll events to efficiently display a large spreadsheet by
 * creating and destroying tile DOM elements as they enter or leave the viewport.
 */
export class TilesManager {
    /**
     * Constructs a new `TilesManager` instance.
     * @param {number[][]} visibleTilesRowPrefixSum - Row-wise prefix sums of visible row heights.
     * @param {number[][]} visibleTilesColumnPrefixSum - Column-wise prefix sums of visible column widths.
     * @param {number} visibleRowCnt - The number of rows of tiles to keep visible.
     * @param {number} visibleColumnCnt - The number of columns of tiles to keep visible.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - The object holding selection coordinates.
     * @param {CellsManager} CellsManager - The manager for cell data.
     * @param {number} [startRowIdx=0] - The initial global row index from which to start rendering tiles.
     * @param {number} [startColIdx=0] - The initial global column index from which to start rendering tiles.
     * @param {{ value: number }} [marginTop={ value: 0 }] - The initial top margin (vertical scroll offset).
     * @param {{ value: number }} [marginLeft={ value: 0 }] - The initial left margin (horizontal scroll offset).
     */
    constructor(visibleTilesRowPrefixSum, visibleTilesColumnPrefixSum, visibleRowCnt, visibleColumnCnt, selectionCoordinates, CellsManager, startRowIdx = 0, startColIdx = 0, marginTop = { value: 0 }, marginLeft = { value: 0 }) {
        // Get the main grid container DOM element
        this.gridDiv = document.getElementById("grid");
        this.visibleTilesRowPrefixSum = visibleTilesRowPrefixSum;
        this.visibleTilesColumnPrefixSum = visibleTilesColumnPrefixSum;
        this.visibleTiles = []; // Initialize empty array for visible Tile objects
        this.visibleTilesRowDivArr = []; // Initialize empty array for row container divs
        this.visibleRowCnt = visibleRowCnt;
        this.visibleColumnCnt = visibleColumnCnt;
        this.CellsManager = CellsManager;
        this.selectionCoordinates = selectionCoordinates;
        this.startRowIdx = startRowIdx;
        this.startColIdx = startColIdx;
        this.marginTop = marginTop;
        this.marginLeft = marginLeft;
        this.initialLoad(); // Perform initial rendering of tiles
    }
    /**
     * Scrolls the grid down by one tile row.
     * This involves adjusting the top margin, unmounting the top row,
     * incrementing the starting row index, and mounting a new row at the bottom.
     */
    scrollDown() {
        this.gridDiv.style.marginTop = `${this.marginTop.value}px`; // Apply new top margin
        this.unmountTileTop(); // Remove the topmost row of tiles
        this.startRowIdx++; // Increment the global starting row index
        this.mountTileBottom(); // Add a new row of tiles to the bottom
    }
    /**
     * Scrolls the grid to the right by one tile column.
     * This involves adjusting the left margin, unmounting the leftmost column,
     * incrementing the starting column index, and mounting a new column on the right.
     */
    scrollRight() {
        this.gridDiv.style.marginLeft = `${this.marginLeft.value}px`; // Apply new left margin
        this.unmountTileLeft(); // Remove the leftmost column of tiles
        this.startColIdx++; // Increment the global starting column index
        this.mountTileRight(); // Add a new column of tiles to the right
    }
    /**
     * Scrolls the grid up by one tile row.
     * This involves adjusting the top margin, unmounting the bottom row,
     * decrementing the starting row index, and mounting a new row at the top.
     */
    scrollUp() {
        this.gridDiv.style.marginTop = `${this.marginTop.value}px`; // Apply new top margin
        this.unmountTileBottom(); // Remove the bottommost row of tiles
        this.startRowIdx--; // Decrement the global starting row index
        this.mountTileTop(); // Add a new row of tiles to the top
    }
    /**
     * Scrolls the grid to the left by one tile column.
     * This involves checking if already at the first column, adjusting the left margin,
     * unmounting the rightmost column, decrementing the starting column index,
     * and mounting a new column on the left.
     */
    scrollLeft() {
        if (this.startColIdx === 0)
            return; // Prevent scrolling beyond the first column
        this.gridDiv.style.marginLeft = `${this.marginLeft.value}px`; // Apply new left margin
        this.unmountTileRight(); // Remove the rightmost column of tiles
        this.startColIdx--; // Decrement the global starting column index
        this.mountTileLeft(); // Add a new column of tiles to the left
    }
    /**
     * Redraws all tiles in a specific row.
     * This is useful when a row's height changes or its content needs refreshing.
     * @param {number} rowID - The global 1-based index of the row to redraw.
     */
    redrawRow(rowID) {
        // Calculate the array index within `visibleTiles` for the given rowID
        const arrIdx = rowID - this.visibleTiles[0][0].row;
        // Iterate over all tiles in that row and trigger their `drawGrid` method
        this.visibleTiles[arrIdx].forEach(tile => {
            tile.drawGrid();
        });
    }
    /**
     * Redraws all tiles in a specific column.
     * This is useful when a column's width changes or its content needs refreshing.
     * @param {number} columnID - The global 1-based index of the column to redraw.
     */
    redrawColumn(columnID) {
        // Calculate the array index within each row's tile array for the given columnID
        const arrIdx = columnID - this.visibleTiles[0][0].col;
        // Iterate over each visible tile row
        this.visibleTiles.forEach(tileArr => {
            tileArr[arrIdx].drawGrid(); // Trigger `drawGrid` for the tile at the specified column index
        });
    }
    /**
     * Re-renders all currently visible tiles on the grid.
     * This is a complete redraw of the visible area, often used after
     * a global change that affects multiple tiles (e.g., selection change, undo/redo).
     */
    rerender() {
        for (const tilesRow of this.visibleTiles) { // Iterate over each row of visible tiles
            for (const tile of tilesRow) { // Iterate over each tile within that row
                tile.drawGrid(); // Call the `drawGrid` method on each tile to redraw it
            }
        }
    }
    /**
     * Performs the initial rendering of all tiles that should be visible when the grid loads.
     * It creates `Tile` instances and appends their DOM elements to the `gridDiv`.
     * @private
     */
    initialLoad() {
        // Loop through the initial range of rows to be displayed
        for (let i = this.startRowIdx; i < this.visibleRowCnt + this.startRowIdx; i++) {
            // Create a new div element to contain the tiles for the current row
            const rowDiv = this.createRowDiv(i);
            this.visibleTilesRowDivArr.push(rowDiv); // Store the row container div
            const currentVisibleRow = []; // Array to hold Tile objects for the current row
            // Loop through the initial range of columns to be displayed in the current row
            for (let j = this.startColIdx; j < this.visibleColumnCnt + this.startColIdx; j++) {
                // Create a new Tile instance
                const tile = new Tile(i, // Global row index
                j, // Global column index
                this.visibleTilesRowPrefixSum[i - this.startRowIdx], // Row prefix sum data
                this.visibleTilesColumnPrefixSum[j - this.startColIdx], // Column prefix sum data
                this.selectionCoordinates, // Selection coordinates for highlighting
                this.CellsManager // CellsManager for cell data
                );
                currentVisibleRow.push(tile); // Add the created tile to the current row's tile array
                // Append the tile's DOM element to its row container div
                this.visibleTilesRowDivArr[i - this.startRowIdx].appendChild(tile.tileDiv);
            }
            this.visibleTiles.push(currentVisibleRow); // Add the completed row of tiles to the main `visibleTiles` 2D array
            this.gridDiv.appendChild(this.visibleTilesRowDivArr[i - this.startRowIdx]); // Append the row container div to the main grid div
        }
    }
    /**
     * Creates and initializes a new HTMLDivElement to serve as a container for a row of tiles.
     * @private
     * @param {number} rowID - The global row index this div will represent.
     * @returns {HTMLDivElement} The newly created row container div.
     */
    createRowDiv(rowID) {
        const tilesDiv = document.createElement("div");
        tilesDiv.id = `tileRow${rowID}`; // Assign a unique ID
        tilesDiv.classList.add("flex"); // Add a CSS class for flexbox layout
        return tilesDiv;
    }
    /**
     * Adds a new row of tiles to the bottom of the visible grid.
     * This is called during vertical scrolling down.
     * @private
     */
    mountTileBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1; // Calculate the global index of the new row
        const rowDiv = this.createRowDiv(rowIdx); // Create a new row container div
        this.visibleTilesRowDivArr.push(rowDiv); // Add to the array of row divs
        const currentVisibleRow = []; // Array to hold new Tile objects
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j; // Global column index
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[this.visibleTilesRowPrefixSum.length - 1], // Use last row's prefix sum
            this.visibleTilesColumnPrefixSum[j], // Use corresponding column's prefix sum
            this.selectionCoordinates, this.CellsManager);
            currentVisibleRow.push(tile);
            // Append the new tile's DOM element to the newly created row container div
            this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1].appendChild(tile.tileDiv);
        }
        this.visibleTiles.push(currentVisibleRow); // Add the new row of tiles to the `visibleTiles` 2D array
        this.gridDiv.appendChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]); // Append the row div to the main grid container
    }
    /**
     * Adds a new row of tiles to the top of the visible grid.
     * This is called during vertical scrolling up.
     * @private
     */
    mountTileTop() {
        const rowIdx = this.startRowIdx; // Global index of the new top row
        const rowDiv = this.createRowDiv(rowIdx); // Create a new row container div
        this.visibleTilesRowDivArr.unshift(rowDiv); // Add to the beginning of the array of row divs
        const currentVisibleRow = []; // Array to hold new Tile objects
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = this.startColIdx + j; // Global column index
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[0], // Use first row's prefix sum
            this.visibleTilesColumnPrefixSum[j], // Use corresponding column's prefix sum
            this.selectionCoordinates, this.CellsManager);
            currentVisibleRow.push(tile);
            // Prepend the new tile's DOM element to the newly created row container div
            this.visibleTilesRowDivArr[0].appendChild(tile.tileDiv);
        }
        this.visibleTiles.unshift(currentVisibleRow); // Add the new row of tiles to the beginning of the `visibleTiles` 2D array
        this.gridDiv.prepend(this.visibleTilesRowDivArr[0]); // Prepend the row div to the main grid container
    }
    /**
     * Adds a new column of tiles to the left of the visible grid.
     * This is called during horizontal scrolling left.
     * @private
     */
    mountTileLeft() {
        const colIdx = this.startColIdx; // Global index of the new left column
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i; // Global row index
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[i], // Use corresponding row's prefix sum
            this.visibleTilesColumnPrefixSum[0], // Use first column's prefix sum
            this.selectionCoordinates, this.CellsManager);
            this.visibleTiles[i].unshift(tile); // Add the new tile to the beginning of the current row's tile array
            // Prepend the new tile's DOM element to the corresponding row container div
            this.visibleTilesRowDivArr[i].prepend(tile.tileDiv);
        }
    }
    /**
     * Adds a new column of tiles to the right of the visible grid.
     * This is called during horizontal scrolling right.
     * @private
     */
    mountTileRight() {
        const colIdx = this.startColIdx + this.visibleColumnCnt - 1; // Global index of the new right column
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = this.startRowIdx + i; // Global row index
            const tile = new Tile(rowIdx, colIdx, this.visibleTilesRowPrefixSum[i], // Use corresponding row's prefix sum
            this.visibleTilesColumnPrefixSum[this.visibleTilesColumnPrefixSum.length - 1], // Use last column's prefix sum
            this.selectionCoordinates, this.CellsManager);
            this.visibleTiles[i].push(tile); // Add the new tile to the end of the current row's tile array
            // Append the new tile's DOM element to the corresponding row container div
            this.visibleTilesRowDivArr[i].appendChild(tile.tileDiv);
        }
    }
    /**
     * Removes the topmost row of tiles from the visible grid and the DOM.
     * This is called during vertical scrolling down.
     * @private
     */
    unmountTileTop() {
        // Remove the first row container div from the main grid DOM element
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[0]);
        this.visibleTiles.shift(); // Remove the first row of `Tile` objects from `visibleTiles`
        this.visibleTilesRowDivArr.shift(); // Remove the first row container div from its array
    }
    /**
     * Removes the bottommost row of tiles from the visible grid and the DOM.
     * This is called during vertical scrolling up.
     * @private
     */
    unmountTileBottom() {
        // Remove the last row container div from the main grid DOM element
        this.gridDiv.removeChild(this.visibleTilesRowDivArr[this.visibleTilesRowDivArr.length - 1]);
        this.visibleTiles.pop(); // Remove the last row of `Tile` objects from `visibleTiles`
        this.visibleTilesRowDivArr.pop(); // Remove the last row container div from its array
    }
    /**
     * Removes the leftmost column of tiles from the visible grid and the DOM.
     * This is called during horizontal scrolling right.
     * @private
     */
    unmountTileLeft() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            // Remove the first child (leftmost tile) from each row container div
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].firstChild);
            this.visibleTiles[i].shift(); // Remove the leftmost `Tile` object from each row's array
        }
    }
    /**
     * Removes the rightmost column of tiles from the visible grid and the DOM.
     * This is called during horizontal scrolling left.
     * @private
     */
    unmountTileRight() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            // Remove the last child (rightmost tile) from each row container div
            this.visibleTilesRowDivArr[i].removeChild(this.visibleTilesRowDivArr[i].lastChild);
            this.visibleTiles[i].pop(); // Remove the rightmost `Tile` object from each row's array
        }
    }
}
