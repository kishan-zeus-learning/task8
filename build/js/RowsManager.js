import { RowsCanvas } from "./RowsCanvas.js";
/**
 * Manages a scrolling set of visible row canvases, enabling efficient rendering
 * and resizing behavior for a large number of rows by dynamically mounting and unmounting row blocks.
 */
export class RowsManager {
    /**
     * Initializes a scrollable manager for row canvas blocks
     * @param rowHeights Map of row custom heights
     * @param startRowIdx Initial starting row block index
     * @param visibleRowCnt Number of row blocks to render at once
     * @param ifResizeOn Shared boolean controlling resize line visibility
     * @param ifResizePointerDown Shared boolean indicating pointer press during resize
     * @param rowCanvasLimit Maximum number of row blocks
     * @param defaultHeight Default row height (pixels)
     * @param defaultWidth Default row width (pixels)
     * @param marginTop Global object for managing vertical scroll offset
     */
    constructor(rowHeights, startRowIdx, visibleRowCnt, ifResizeOn, ifResizePointerDown, selectionCoordinates, rowCanvasLimit = 40000, defaultHeight = 25, defaultWidth = 50, marginTop = { value: 0 }) {
        this.rowHeights = rowHeights;
        this._ifResizeOn = ifResizeOn;
        this.currentResizingRow = { value: -1 };
        this._ifResizePointerDown = ifResizePointerDown;
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
     * Returns the RowsCanvas currently being resized
     */
    get currentResizingRowCanvas() {
        let idx = 0;
        if (this.currentResizingRow.value === -1) {
            // alert("something went wrong");
        }
        else {
            idx = this.currentResizingRow.value - this.visibleRows[0].rowID;
        }
        return this.visibleRows[idx];
    }
    /**
     * Scrolls row view down by one block and mounts a new row at the bottom
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
     * Scrolls row view up by one block and mounts a new row at the top
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
     * Loads all visible row canvases on initial render
     */
    initialLoad() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = i + this.startRowIdx;
            const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow, this.selectionCoordinates);
            this.visibleRows.push(canvas);
            this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
            this.rowsDivArr.push(canvas.rowCanvasDiv);
            this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
        }
    }
    /**
     * Adds a new row block to the bottom of the view
     */
    mountRowBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow, this.selectionCoordinates);
        this.visibleRows.push(canvas);
        this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
        this.rowsDivArr.push(canvas.rowCanvasDiv);
        this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
    }
    /**
     * Adds a new row block to the top of the view
     */
    mountRowTop() {
        const rowIdx = this.startRowIdx;
        const canvas = new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow, this.selectionCoordinates);
        this.visibleRows.unshift(canvas);
        this.rowsPositionPrefixSumArr.unshift(canvas.rowsPositionArr);
        this.rowsDivArr.unshift(canvas.rowCanvasDiv);
        this.rowsDivContainer.prepend(canvas.rowCanvasDiv);
        this.marginTop.value -= this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
    }
    /**
     * Removes the topmost row block from the view
     */
    unmountRowTop() {
        this.marginTop.value += this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
        this.rowsDivContainer.removeChild(this.rowsDivArr[0]);
        this.rowsDivArr.shift();
        this.rowsPositionPrefixSumArr.shift();
        this.visibleRows.shift();
    }
    /**
     * Removes the bottommost row block from the view
     */
    unmountRowBottom() {
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]);
        this.rowsDivArr.pop();
        this.rowsPositionPrefixSumArr.pop();
        this.visibleRows.pop();
    }
    rerender() {
        for (let row of this.visibleRows) {
            row.drawCanvas();
        }
    }
}
