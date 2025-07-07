import { ColumnsCanvas } from "./ColumnsCanvas.js";
/**
 * Manages the creation, rendering, and scrolling of column canvases.
 * Handles dynamic mounting and unmounting of ColumnsCanvas blocks for performance.
 */
export class ColumnsManager {
    constructor(columnWidths, startColumnIdx, visibleColumnCnt, ifResizeOn, ifResizePointerDown, selectionCoordinates, columnCanvasLimit = 40, defaultHeight = 25, defaultWidth = 100, marginLeft = { value: 0 }) {
        this.columnWidths = columnWidths;
        this._ifResizeOn = ifResizeOn;
        this.currentResizingColumn = { value: -1 };
        this._ifResizePointerDown = ifResizePointerDown;
        this.startColumnIdx = startColumnIdx;
        this.columnCanvasLimit = columnCanvasLimit;
        this.visibleColumnCnt = visibleColumnCnt;
        this.visibleColumnsPrefixSum = [];
        this.visibleColumns = [];
        this.marginLeft = marginLeft;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.selectionCoordinates = selectionCoordinates;
        this.columnsDivContainer = document.getElementById("columnsRow");
        this.initialLoad();
    }
    /**
     * Returns the ColumnsCanvas instance for the currently resizing column group.
     */
    get currentResizingColumnCanvas() {
        let idx = 0;
        if (this.currentResizingColumn.value !== -1) {
            idx = this.currentResizingColumn.value - this.visibleColumns[0].columnID;
        }
        return this.visibleColumns[idx];
    }
    scrollRight() {
        if (this.startColumnIdx === (this.columnCanvasLimit - 1 - this.visibleColumnCnt))
            return false;
        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
        return true;
    }
    scrollLeft() {
        if (this.startColumnIdx === 0)
            return false;
        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
        return true;
    }
    initialLoad() {
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = j + this.startColumnIdx;
            const canvas = new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingColumn, this.selectionCoordinates);
            this.visibleColumns.push(canvas);
            this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr);
            this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
        }
    }
    mountColumnRight() {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1;
        const canvas = new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingColumn, this.selectionCoordinates);
        this.visibleColumns.push(canvas);
        this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
        this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr);
    }
    mountColumnLeft() {
        const columnIdx = this.startColumnIdx;
        const canvas = new ColumnsCanvas(columnIdx, this.columnWidths, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingColumn, this.selectionCoordinates);
        this.visibleColumns.unshift(canvas);
        this.columnsDivContainer.prepend(canvas.columnCanvasDiv);
        this.visibleColumnsPrefixSum.unshift(canvas.columnsPositionArr);
        this.marginLeft.value -= canvas.columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
    }
    unmountColumnLeft() {
        this.marginLeft.value += this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvasDiv);
        this.visibleColumns.shift();
        this.visibleColumnsPrefixSum.shift();
    }
    unmountColumnRight() {
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
}
