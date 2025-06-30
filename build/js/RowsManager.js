import { RowsCanvas } from "./RowsCanvas.js";
export class RowsManager {
    constructor(rowHeights, startRowIdx, visibleRowCnt, ifResizeOn, ifResizePointerDown, rowCanvasLimit = 4000, defaultHeight = 25, defaultWidth = 80, marginTop = { value: 0 }) {
        this.rowHeights = rowHeights;
        this._ifResizeOn = ifResizeOn;
        this.currentResizingRow = { value: -1 };
        this._ifResizePointerDown = ifResizePointerDown;
        this.startRowIdx = startRowIdx;
        this.rowCanvasLimit = rowCanvasLimit;
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
    get currentResizingRowCanvas() {
        let idx = 0;
        if (this.currentResizingRow.value === -1) {
            alert("something went wrong");
        }
        else {
            idx = this.currentResizingRow.value - this.visibleRows[0].rowID;
        }
        return this.visibleRows[idx];
    }
    // set ifResizeOn(obj:GlobalBoolean){
    //     this._ifResizeOn=obj;
    // }
    // get ifResizeOn(){
    //     return this._ifResizeOn as GlobalBoolean;
    // }
    // set ifResizePointerDown(obj:GlobalBoolean){
    //     this._ifResizePointerDown=obj;
    // }
    // get ifResizePointerDown(){
    //     return this._ifResizePointerDown as GlobalBoolean;
    // }
    scrollDown() {
        if (this.startRowIdx === (this.rowCanvasLimit - 1 - this.visibleRowCnt))
            return false;
        this.unmountRowTop();
        this.startRowIdx++;
        this.mountRowBottom();
        return true;
    }
    scrollUp() {
        if (this.startRowIdx === 0)
            return false;
        this.unmountRowBottom();
        this.startRowIdx--;
        this.mountRowTop();
        return true;
    }
    initialLoad() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = i + this.startRowIdx;
            this.visibleRows.push(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow));
            this.rowsPositionPrefixSumArr.push(this.visibleRows[i].rowsPositionArr);
            this.rowsDivArr.push(this.visibleRows[i].rowCanvasDiv);
            this.rowsDivContainer.appendChild(this.visibleRows[i].rowCanvasDiv);
        }
    }
    mountRowBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        this.visibleRows.push(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow));
        this.rowsPositionPrefixSumArr.push(this.visibleRows[this.visibleRows.length - 1].rowsPositionArr);
        this.rowsDivArr.push(this.visibleRows[this.visibleRows.length - 1].rowCanvasDiv);
        this.rowsDivContainer.appendChild(this.visibleRows[this.visibleRows.length - 1].rowCanvasDiv);
    }
    mountRowTop() {
        const rowIdx = this.startRowIdx;
        this.visibleRows.unshift(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight, this._ifResizeOn, this._ifResizePointerDown, this.currentResizingRow));
        this.rowsPositionPrefixSumArr.unshift(this.visibleRows[0].rowsPositionArr);
        this.rowsDivArr.unshift(this.visibleRows[0].rowCanvasDiv);
        this.rowsDivContainer.prepend(this.visibleRows[0].rowCanvasDiv);
        this.marginTop.value -= this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
    }
    unmountRowTop() {
        this.marginTop.value += this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
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
