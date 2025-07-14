import { ColumnsCanvas } from "./ColumnsCanvas.js";
/**
 * Manages the creation, rendering, and scrolling of column canvases.
 * Handles dynamic mounting and unmounting of ColumnsCanvas blocks for performance.
 */
export class ColumnsManager {
    /**
     * Initializes a ColumnsManager instance.
     * @param columnWidths - Map that stores custom column widths keyed by column index.
     * @param startColumnIdx - Initial index of the first visible column group.
     * @param visibleColumnCnt - Number of column groups visible initially.
     * @param selectionCoordinates - Object containing selection range coordinates.
     * @param columnCanvasLimit - Maximum number of column canvas groups.
     * @param defaultHeight - Default height for column headers.
     * @param defaultWidth - Default width for columns.
     */
    constructor(columnWidths, startColumnIdx, visibleColumnCnt, selectionCoordinates, columnCanvasLimit = 40, defaultHeight = 25, defaultWidth = 100) {
        this.columnWidths = columnWidths;
        this.startColumnIdx = startColumnIdx;
        this.visibleColumnCnt = visibleColumnCnt;
        this.columnCanvasLimit = columnCanvasLimit;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.selectionCoordinates = selectionCoordinates;
        this.marginLeft = { value: 0 };
        this.marginRight = { value: 0 };
        this.visibleColumns = [];
        this.visibleColumnsPrefixSum = [];
        this.columnsDivContainer = document.getElementById("columnsRow");
        this.initialLoad(); // Load initial column canvases
    }
    /**
     * Loads initial visible column canvases and appends them to the DOM.
     */
    initialLoad() {
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = j + this.startColumnIdx;
            const canvas = new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
            this.visibleColumns.push(canvas);
            this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr);
            this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
        }
    }
    /**
     * Scrolls right by removing leftmost canvas and adding a new one on the right.
     * @returns True if scroll occurred, false if already at right edge.
     */
    scrollRight() {
        if (this.startColumnIdx === (this.columnCanvasLimit - 1 - this.visibleColumnCnt))
            return false;
        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
        return true;
    }
    /**
     * Scrolls left by removing rightmost canvas and adding a new one on the left.
     * @returns True if scroll occurred, false if already at left edge.
     */
    scrollLeft() {
        if (this.startColumnIdx === 0)
            return false;
        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
        return true;
    }
    /**
     * Mounts a new column canvas group to the right end.
     */
    mountColumnRight() {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1;
        const canvas = new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
        this.visibleColumns.push(canvas);
        this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr);
        this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
        if (this.marginRight.value > 0) {
            this.marginRight.value -= canvas.columnsPositionArr[24];
            this.columnsDivContainer.style.marginRight = `${this.marginRight.value}px`;
        }
    }
    /**
     * Mounts a new column canvas group to the left end and adjusts margin.
     */
    mountColumnLeft() {
        const columnIdx = this.startColumnIdx;
        const canvas = new ColumnsCanvas(columnIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
        this.visibleColumns.unshift(canvas);
        this.visibleColumnsPrefixSum.unshift(canvas.columnsPositionArr);
        this.columnsDivContainer.prepend(canvas.columnCanvasDiv);
        // Adjust container margin to maintain visual continuity
        this.marginLeft.value -= canvas.columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
    }
    /**
     * Unmounts the leftmost canvas and updates margin.
     */
    unmountColumnLeft() {
        this.marginLeft.value += this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvasDiv);
        this.visibleColumns.shift();
        this.visibleColumnsPrefixSum.shift();
    }
    /**
     * Unmounts the rightmost canvas from the DOM.
     */
    unmountColumnRight() {
        this.marginRight.value += this.visibleColumns[this.visibleColumnCnt - 1].columnsPositionArr[24];
        this.columnsDivContainer.style.marginRight = `${this.marginRight.value}px`;
        const canvas = this.visibleColumns.pop();
        if (canvas) {
            this.columnsDivContainer.removeChild(canvas.columnCanvasDiv);
            this.visibleColumnsPrefixSum.pop();
        }
    }
    /**
     * Redraws all currently visible columns.
     */
    rerender() {
        for (let column of this.visibleColumns) {
            column.drawCanvas();
        }
    }
    /**
     * Gets the ColumnsCanvas instance for the specified column group ID.
     * @param columnID - The group ID (0-based) of the column canvas to retrieve.
     * @returns The matching ColumnsCanvas instance, or null if not found.
     */
    getCurrentColumnCanvas(columnID) {
        const arrIdx = columnID - this.visibleColumns[0].columnID;
        if (arrIdx >= 0 && arrIdx < this.visibleColumns.length)
            return this.visibleColumns[arrIdx];
        alert("something went wrong inside columns manager");
        return null;
    }
}
