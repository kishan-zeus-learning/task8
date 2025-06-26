import { RowsCanvas } from "./RowsCanvas.js";
export class RowsManager {
    constructor(rowHeights, startRowIdx, visibleRowCnt, defaultHeight = 25, defaultWidth = 80, marginTop = 0) {
        this.rowHeights = rowHeights;
        this.startRowIdx = startRowIdx;
        this.visibleRowCnt = visibleRowCnt;
        this.rowsPositionPrefixSumArr = [];
        this.rowsDivArr = [];
        this.visibleRows = [];
        this.marginTop = marginTop;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsDivContainer = document.getElementById("rowsColumn");
        this.initialLoad();
    }
    scrollDown() {
        this.unmountRowTop();
        this.rowsPositionPrefixSumArr.shift();
        this.visibleRows.shift();
        this.rowsDivArr.shift();
        this.startRowIdx++;
        this.mountRowBottom();
    }
    scrollUp() {
        if (this.startRowIdx === 0)
            return;
        this.unmountRowBottom();
        this.startRowIdx--;
        this.mountRowTop();
    }
    initialLoad() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = i + this.startRowIdx;
            this.visibleRows.push(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight));
            this.rowsPositionPrefixSumArr.push(this.visibleRows[i].rowsPositionArr);
            this.rowsDivArr.push(this.visibleRows[i].rowCanvas);
            this.rowsDivContainer.appendChild(this.visibleRows[i].rowCanvas);
        }
    }
    mountRowBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        this.visibleRows.push(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight));
        this.rowsPositionPrefixSumArr.push(this.visibleRows[this.visibleRows.length - 1].rowsPositionArr);
        this.rowsDivArr.push(this.visibleRows[this.visibleRows.length - 1].rowCanvas);
        this.rowsDivContainer.appendChild(this.visibleRows[this.visibleRows.length - 1].rowCanvas);
    }
    mountRowTop() {
        const rowIdx = this.startRowIdx;
        this.visibleRows.unshift(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight));
        this.rowsPositionPrefixSumArr.unshift(this.visibleRows[0].rowsPositionArr);
        this.rowsDivArr.unshift(this.visibleRows[0].rowCanvas);
        this.rowsDivContainer.prepend(this.visibleRows[0].rowCanvas);
        this.marginTop -= this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop}px`;
    }
    unmountRowTop() {
        this.marginTop += this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop}px`;
        this.rowsDivContainer.removeChild(this.rowsDivArr[0]);
        this.rowsDivArr.shift();
        this.rowsPositionPrefixSumArr.shift();
        this.visibleRows.shift();
    }
    unmountRowBottom() {
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]);
        this.rowsDivArr.pop();
        this.rowsPositionPrefixSumArr.pop();
        this.visibleRows.pop();
    }
}
