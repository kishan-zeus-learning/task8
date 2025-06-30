import { RowData } from "./types/RowsColumn.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { GlobalBoolean } from "./types/GlobalBoolean.js";
import { GlobalNumber } from "./types/GlobalNumber.js";
export class RowsManager {

    private rowHeights: RowData;
    private startRowIdx: number;
    private visibleRowCnt: number;
    readonly rowsPositionPrefixSumArr: number[][];
    readonly visibleRows: RowsCanvas[];
    readonly marginTop: GlobalNumber;
    private rowsDivArr: HTMLDivElement[];
    private rowsDivContainer: HTMLDivElement;
    private defaultHeight: number;
    private defaultWidth: number;
    private rowCanvasLimit: number;
    private _ifResizeOn:GlobalBoolean;
    private _ifResizePointerDown:GlobalBoolean;
    private currentResizingRow:GlobalNumber;

    constructor(rowHeights: RowData, startRowIdx: number, visibleRowCnt: number,ifResizeOn:GlobalBoolean,ifResizePointerDown:GlobalBoolean, rowCanvasLimit: number = 4000, defaultHeight: number = 25, defaultWidth: number = 80, marginTop:GlobalNumber={value: 0}) {
        this.rowHeights = rowHeights;
        this._ifResizeOn=ifResizeOn;
        this.currentResizingRow={value:-1};
        this._ifResizePointerDown=ifResizePointerDown;
        this.startRowIdx = startRowIdx;
        this.rowCanvasLimit = rowCanvasLimit;
        this.visibleRowCnt = visibleRowCnt;
        this.rowsPositionPrefixSumArr = [];
        this.rowsDivArr = [];
        this.visibleRows = [];
        this.marginTop = marginTop;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsDivContainer = document.getElementById("rowsColumn") as HTMLDivElement;
        this.initialLoad();


    }
    
    get currentResizingRowCanvas(){
        let idx=0;
        if(this.currentResizingRow.value===-1){
            alert("something went wrong");
        }else{
            idx=this.currentResizingRow.value - this.visibleRows[0].rowID;
        }

        return this.visibleRows[idx];
    }


    scrollDown() {
        if (this.startRowIdx === (this.rowCanvasLimit - 1 - this.visibleRowCnt)) return false;
        this.unmountRowTop();
        this.startRowIdx++;
        this.mountRowBottom();
        return true;
    }

    scrollUp() {
        if (this.startRowIdx === 0) return false;
        this.unmountRowBottom();
        this.startRowIdx--;
        this.mountRowTop();
        return true;
    }

    private initialLoad() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = i + this.startRowIdx;
            this.visibleRows.push(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight,this._ifResizeOn as GlobalBoolean,this._ifResizePointerDown as GlobalBoolean,this.currentResizingRow));
            this.rowsPositionPrefixSumArr.push(this.visibleRows[i].rowsPositionArr);
            this.rowsDivArr.push(this.visibleRows[i].rowCanvasDiv);
            this.rowsDivContainer.appendChild(this.visibleRows[i].rowCanvasDiv);

        }
    }

    private mountRowBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        this.visibleRows.push(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight,this._ifResizeOn as GlobalBoolean,this._ifResizePointerDown as GlobalBoolean,this.currentResizingRow));

        this.rowsPositionPrefixSumArr.push(this.visibleRows[this.visibleRows.length - 1].rowsPositionArr);

        this.rowsDivArr.push(this.visibleRows[this.visibleRows.length - 1].rowCanvasDiv);

        this.rowsDivContainer.appendChild(this.visibleRows[this.visibleRows.length - 1].rowCanvasDiv);
    }

    private mountRowTop() {
        const rowIdx = this.startRowIdx;

        this.visibleRows.unshift(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight,this._ifResizeOn as GlobalBoolean,this._ifResizePointerDown as GlobalBoolean,this.currentResizingRow));
        this.rowsPositionPrefixSumArr.unshift(this.visibleRows[0].rowsPositionArr);
        this.rowsDivArr.unshift(this.visibleRows[0].rowCanvasDiv);
        this.rowsDivContainer.prepend(this.visibleRows[0].rowCanvasDiv);

        this.marginTop.value -= this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
    }

    private unmountRowTop() {
        this.marginTop.value += this.rowsPositionPrefixSumArr[0][24];
        this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
        this.rowsDivContainer.removeChild(this.rowsDivArr[0]);
        this.rowsDivArr.shift();
        this.rowsPositionPrefixSumArr.shift();
        this.visibleRows.shift();
    }

    private unmountRowBottom() {
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]);
        this.rowsDivArr.pop();
        this.rowsPositionPrefixSumArr.pop();
        this.visibleRows.pop();
    }

}