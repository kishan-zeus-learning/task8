import { RowData } from "./types/RowsColumn.js";
import { RowsCanvas } from "./RowsCanvas.js";
export class RowsManager {

    private rowHeights: RowData;
    private startRowIdx: number;
    private visibleRowCnt: number;
    readonly rowsPositionPrefixSumArr: number[][];
    readonly visibleRows: RowsCanvas[];
    readonly marginTop: {value:number};
    private rowsDivArr: HTMLDivElement[];
    private rowsDivContainer: HTMLDivElement;
    private defaultHeight: number;
    private defaultWidth: number;
    private rowCanvasLimit: number;


    constructor(rowHeights: RowData, startRowIdx: number, visibleRowCnt: number, rowCanvasLimit: number = 4000, defaultHeight: number = 25, defaultWidth: number = 80, marginTop:{value:number}={value: 0}) {
        this.rowHeights = rowHeights;
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
            this.visibleRows.push(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight));
            this.rowsPositionPrefixSumArr.push(this.visibleRows[i].rowsPositionArr);
            this.rowsDivArr.push(this.visibleRows[i].rowCanvas);
            this.rowsDivContainer.appendChild(this.visibleRows[i].rowCanvas);

        }
    }

    private mountRowBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        this.visibleRows.push(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight));

        this.rowsPositionPrefixSumArr.push(this.visibleRows[this.visibleRows.length - 1].rowsPositionArr);

        this.rowsDivArr.push(this.visibleRows[this.visibleRows.length - 1].rowCanvas);

        this.rowsDivContainer.appendChild(this.visibleRows[this.visibleRows.length - 1].rowCanvas);
    }

    private mountRowTop() {
        const rowIdx = this.startRowIdx;

        this.visibleRows.unshift(new RowsCanvas(rowIdx, this.rowHeights, this.defaultWidth, this.defaultHeight));
        this.rowsPositionPrefixSumArr.unshift(this.visibleRows[0].rowsPositionArr);
        this.rowsDivArr.unshift(this.visibleRows[0].rowCanvas);
        this.rowsDivContainer.prepend(this.visibleRows[0].rowCanvas);

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