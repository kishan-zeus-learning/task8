import { RowsCanvas } from "./RowsCanvas.js";
/**
 * Manages a scrolling set of visible row canvases, enabling efficient rendering
 * and resizing behavior for a large number of rows by dynamically mounting and unmounting row blocks.
 */
export class RowsManager {
    /**
     * Initializes a scrollable manager for row canvas blocks.
     * @param {RowData} rowHeights - Map of row custom heights.
     * @param {number} startRowIdx - Initial starting row block index.
     * @param {number} visibleRowCnt - Number of row blocks to render at once.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object containing selection range coordinates.
     * @param {number} [rowCanvasLimit=40000] - Maximum number of row blocks.
     * @param {number} [defaultHeight=25] - Default row height (pixels).
     * @param {number} [defaultWidth=50] - Default row width (pixels).
     * @param {NumberObj} [marginTop={ value: 0 }] - Global object for managing vertical scroll offset.
     */
    constructor(rowHeights, startRowIdx, visibleRowCnt, selectionCoordinates, rowCanvasLimit = 40000, defaultHeight = 25, defaultWidth = 50, marginTop = { value: 0 }) {
        this.rowHeights = rowHeights;
        this.startRowIdx = startRowIdx;
        this.rowCanvasLimit = rowCanvasLimit;
        this.visibleRowCnt = visibleRowCnt;
        this.selectionCoordinates = selectionCoordinates;
        this.rowsPositionPrefixSumArr = [];
        this.rowsDivArr = [];
        this.visibleRows = [];
        this.marginTop = marginTop;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsDivContainer = document.getElementById("rowsColumn");
        this.initialLoad();
    }
    /**
     * Scrolls row view down by one block and mounts a new row at the bottom.
     * @returns {boolean} True if scrolling occurred, false if at the bottommost limit.
     */
    scrollDown() {
        if (this.startRowIdx === (this.rowCanvasLimit - 1 - this.visibleRowCnt))
            return false;
        this.unmountRowTop();
        this.startRowIdx++;
        this.mountRowBottom();
        return true;
    }
    /**
     * Scrolls row view up by one block and mounts a new row at the top.
     * @returns {boolean} True if scrolling occurred, false if at the topmost limit.
     */
    scrollUp() {
        if (this.startRowIdx === 0)
            return false;
        this.unmountRowBottom();
        this.startRowIdx--;
        this.mountRowTop();
        return true;
    }
    /**
     * Loads all visible row canvases on initial render.
     * Called once during constructor to prepare visible rows.
     */
    initialLoad() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = i + this.startRowIdx;
            const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
            this.visibleRows.push(canvas);
            this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
            this.rowsDivArr.push(canvas.rowCanvasDiv);
            this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
        }
    }
    /**
     * Mounts a new row block at the bottom during scroll down.
     */
    mountRowBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
        this.visibleRows.push(canvas);
        this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
        this.rowsDivArr.push(canvas.rowCanvasDiv);
        this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
    }
    /**
     * Mounts a new row block at the top during scroll up.
     */
    mountRowTop() {
        const rowIdx = this.startRowIdx;
        const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this.selectionCoordinates);
        this.visibleRows.unshift(canvas);
        this.rowsPositionPrefixSumArr.unshift(canvas.rowsPositionArr);
        this.rowsDivArr.unshift(canvas.rowCanvasDiv);
        this.rowsDivContainer.prepend(canvas.rowCanvasDiv);
        // Adjust top margin to simulate scroll
        this.marginTop.value -= this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
    }
    /**
     * Unmounts the topmost row block and adjusts margin to simulate scroll down.
     */
    unmountRowTop() {
        console.log("unmounted the top div .....................");
        this.marginTop.value += this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
        this.rowsDivContainer.removeChild(this.rowsDivArr[0]);
        this.rowsDivArr.shift();
        this.rowsPositionPrefixSumArr.shift();
        this.visibleRows.shift();
    }
    /**
     * Unmounts the bottommost row block during scroll up.
     */
    unmountRowBottom() {
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]);
        this.rowsDivArr.pop();
        this.rowsPositionPrefixSumArr.pop();
        this.visibleRows.pop();
    }
    /**
     * Redraws all currently visible rows.
     * Typically used after selection change or resizing.
     */
    rerender() {
        for (let row of this.visibleRows) {
            row.drawCanvas();
        }
    }
    /**
     * Gets the row canvas by global row ID if it's currently visible.
     * @param {number} rowID - The global row index.
     * @returns {RowsCanvas|null} Matching row canvas or null if out of bounds.
     */
    getCurrentRowCanvas(rowID) {
        const arrIdx = rowID - this.visibleRows[0].rowID;
        if (arrIdx >= 0 && arrIdx < this.visibleRows.length)
            return this.visibleRows[arrIdx];
        alert("something went wrong inside rows manager");
        return null;
    }
}
