import { ColumnsCanvas } from "./ColumnsCanvas.js";
export class ColumnsManager {
    constructor(columnWidths, startColumnIdx, visibleColumnCnt, defaultHeight = 25, defaultWidth = 80, marginLeft = 0) {
        this.columnWidths = columnWidths;
        this.startColumnIdx = startColumnIdx;
        this.visibleColumnCnt = visibleColumnCnt;
        this.visibleColumns = [];
        this.marginLeft = marginLeft;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.columnsDivContainer = document.getElementById("columnsRow");
        this.initialLoad();
    }
    scrollRight() {
        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
    }
    scrollLeft() {
        if (this.startColumnIdx === 0)
            return;
        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
    }
    initialLoad() {
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = j + this.startColumnIdx;
            this.visibleColumns.push(new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight));
            this.columnsDivContainer.appendChild(this.visibleColumns[j].columnCanvas);
        }
    }
    mountColumnRight() {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1;
        this.visibleColumns.push(new ColumnsCanvas(colIdx, this.columnWidths, this.defaultWidth, this.defaultHeight));
        this.columnsDivContainer.appendChild(this.visibleColumns[this.visibleColumns.length - 1].columnCanvas);
    }
    mountColumnLeft() {
        const columnIdx = this.startColumnIdx;
        this.visibleColumns.unshift(new ColumnsCanvas(columnIdx, this.columnWidths, this.defaultWidth, this.defaultHeight));
        this.columnsDivContainer.prepend(this.visibleColumns[0].columnCanvas);
        this.marginLeft -= this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft}px`;
    }
    unmountColumnLeft() {
        this.marginLeft += this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft}px`;
        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvas);
        this.visibleColumns.shift();
    }
    unmountColumnRight() {
        this.columnsDivContainer.removeChild(this.visibleColumns[this.visibleColumns.length - 1].columnCanvas);
        this.visibleColumns.pop();
    }
}
