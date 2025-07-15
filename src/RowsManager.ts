import { RowData } from "./types/RowsColumn.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";
// import { NumberObj } from "./types/NumberObj.js";

/**
 * Manages a scrolling set of visible row canvases, enabling efficient rendering
 * and resizing behavior for a large number of rows by dynamically mounting and unmounting row blocks.
 */
export class RowsManager {
    /** @type {RowData} Map of row indices to custom row height values */
    readonly rowHeights: RowData;

    /** @type {number} The index of the first visible row block */
    private startRowIdx: number;

    /** @type {number} Number of row blocks currently visible */
    readonly visibleRowCnt: number;

    /** @type {number[][]} Stores the prefix sum arrays for row positions in each visible block */
    readonly rowsPositionPrefixSumArr: number[][];

    /** @type {RowsCanvas[]} Array of currently visible RowsCanvas instances */
    readonly visibleRows: RowsCanvas[];

    /** @type {NumberObj} Global shared variable representing vertical scroll top offset in pixels */
    // readonly marginTop: NumberObj;

    // /** @type {NumberObj} Global shared variable representing vertical scroll bottom offset in pixels */
    // readonly marginBottom: NumberObj;

    /** @type {HTMLDivElement[]} DOM references to currently visible row block divs */
    private rowsDivArr: HTMLDivElement[];

    /** @type {HTMLDivElement} Container element that holds all the visible row divs */
    readonly rowsDivContainer: HTMLDivElement;

    /** @type {number} Default height for a single row */
    readonly defaultHeight: number;

    /** @type {number} Default width for a single row */
    readonly defaultWidth: number;

    /** @type {number} Maximum row canvas blocks (hard limit for scrolling) */
    private rowCanvasLimit: number;

    /** @type {MultipleSelectionCoordinates} Shared selection coordinates for row highlighting */
    private selectionCoordinates: MultipleSelectionCoordinates;

    private scrollHeight:number;

    private scrollHeightStart:number;

    /**
     * Initializes a scrollable manager for row canvas blocks.
     * @param {RowData} rowHeights - Map of row custom heights.
     * @param {number} startRowIdx - Initial starting row block index.
     * @param {number} visibleRowCnt - Number of row blocks to render at once.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object containing selection range coordinates.
     * @param {number} [rowCanvasLimit=40000] - Maximum number of row blocks.
     * @param {number} [defaultHeight=25] - Default row height (pixels).
     * @param {number} [defaultWidth=50] - Default row width (pixels).
     */
    constructor(
        rowHeights: RowData,
        startRowIdx: number,
        visibleRowCnt: number,
        selectionCoordinates: MultipleSelectionCoordinates,
        rowCanvasLimit: number = 40000,
        defaultHeight: number = 25,
        defaultWidth: number = 50,
    ) {
        this.rowHeights = rowHeights;
        this.startRowIdx = startRowIdx;
        this.rowCanvasLimit = rowCanvasLimit;
        this.visibleRowCnt = visibleRowCnt;
        this.selectionCoordinates = selectionCoordinates;
        this.rowsPositionPrefixSumArr = [];
        this.rowsDivArr = [];
        this.visibleRows = [];
        // this.marginTop = {value:0};
        // this.marginBottom={value:0};
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.scrollHeight=0;
        this.scrollHeightStart=0;
        this.rowsDivContainer = document.getElementById("rowsColumn") as HTMLDivElement;
        this.reload(0,0);
    }

    /**
     * Scrolls row view down by one block and mounts a new row at the bottom.
     * @returns {boolean} True if scrolling occurred, false if at the bottommost limit.
     */
    scrollDown(): boolean {
        if (this.startRowIdx === (this.rowCanvasLimit - 1 - this.visibleRowCnt)) return false;
        this.unmountRowTop();
        this.startRowIdx++;
        this.mountRowBottom();
        return true;
    }

    /**
     * Scrolls row view up by one block and mounts a new row at the top.
     * @returns {boolean} True if scrolling occurred, false if at the topmost limit.
     */
    scrollUp(): boolean {
        if (this.startRowIdx === 0) return false;
        this.unmountRowBottom();
        this.startRowIdx--;
        this.mountRowTop();
        return true;
    }

    /**
     * Loads all visible row canvases on initial render.
     * Called once during constructor to prepare visible rows.
     */
    // private initialLoad(): void {

    //     for (let i = 0; i < this.visibleRowCnt; i++) {
    //         const rowIdx = i + this.startRowIdx;
    //         const canvas = new RowsCanvas(
    //             rowIdx,
    //             this.rowHeights,
    //             this.defaultWidth,
    //             this.defaultHeight,
    //             this.selectionCoordinates
    //         );
    //         this.visibleRows.push(canvas);
    //         this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
    //         this.rowsDivArr.push(canvas.rowCanvasDiv);
    //         this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
    //         canvas.rowCanvasDiv.style.top=`${this.scrollHeight}px`;
    //         this.scrollHeight+=canvas.rowsPositionArr[24];
    //         this.rowsDivContainer.style.height=`${this.scrollHeight}px`;
    //     }
    // }


    reload(startIdx:number,startPosition:number):void{
        const prevHeight=this.scrollHeight;
        startIdx=Math.max(0,startIdx);
        startIdx=Math.min(startIdx,this.rowCanvasLimit-this.visibleRowCnt);

        startPosition=Math.max(startPosition,0);
        this.rowsDivContainer.replaceChildren();
        this.visibleRows.splice(0,this.visibleRows.length);
        this.rowsDivArr.splice(0,this.rowsDivArr.length);
        this.startRowIdx=startIdx;
        this.rowsPositionPrefixSumArr.splice(0,this.rowsPositionPrefixSumArr.length);
        this.scrollHeightStart=startPosition;
        this.scrollHeight=this.scrollHeightStart;
        for(let i=0;i<this.visibleRowCnt;i++){
            const rowIdx=this.startRowIdx+i;

            const canvas=new RowsCanvas(
                rowIdx,
                this.rowHeights,
                this.defaultWidth,
                this.defaultHeight,
                this.selectionCoordinates
            );

            this.visibleRows.push(canvas);
            this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
            this.rowsDivArr.push(canvas.rowCanvasDiv);
            this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
            canvas.rowCanvasDiv.style.top=`${this.scrollHeight}px`;
            this.scrollHeight+=canvas.rowsPositionArr[24];
        }


        this.rowsDivContainer.style.height=`${Math.max(prevHeight,this.scrollHeight)}px`;

    }

    /**
     * Mounts a new row block at the bottom during scroll down.
     */
    private mountRowBottom(): void {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;
        const canvas = new RowsCanvas(
            rowIdx,
            this.rowHeights,
            this.defaultWidth,
            this.defaultHeight,
            this.selectionCoordinates
        );
        this.visibleRows.push(canvas);
        this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
        this.rowsDivArr.push(canvas.rowCanvasDiv);
        this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
        // if(this.marginBottom.value>0){
        //     this.marginBottom.value-=this.rowsPositionPrefixSumArr[this.visibleRowCnt-1][24];
        //     this.rowsDivContainer.style.marginBottom=`${this.marginBottom.value}px`;
        // }
        canvas.rowCanvasDiv.style.top=`${this.scrollHeight}px`;
        this.scrollHeight+=canvas.rowsPositionArr[24];
        this.rowsDivContainer.style.height=`${this.scrollHeight}px`;
    }

    /**
     * Mounts a new row block at the top during scroll up.
     */
    private mountRowTop(): void {
        const rowIdx = this.startRowIdx;
        const canvas = new RowsCanvas(
            rowIdx,
            this.rowHeights,
            this.defaultWidth,
            this.defaultHeight,
            this.selectionCoordinates
        );
        this.visibleRows.unshift(canvas);
        this.rowsPositionPrefixSumArr.unshift(canvas.rowsPositionArr);
        this.rowsDivArr.unshift(canvas.rowCanvasDiv);
        this.rowsDivContainer.prepend(canvas.rowCanvasDiv);
        this.scrollHeightStart-=canvas.rowsPositionArr[24];
        canvas.rowCanvasDiv.style.top=`${this.scrollHeightStart}px`;

        



        // Adjust top margin to simulate scroll
        // this.marginTop.value -= this.rowsPositionPrefixSumArr[0][24];
        // this.rowsDivContainer.style.marginTop = `${this.marginTop.value}px`;
    }

    /**
     * Unmounts the topmost row block and adjusts margin to simulate scroll down.
     */
    private unmountRowTop(): void {
        this.scrollHeightStart+=this.visibleRows[0].rowsPositionArr[24];
        this.rowsDivContainer.removeChild(this.rowsDivArr[0]);
        this.rowsDivArr.shift();
        this.rowsPositionPrefixSumArr.shift();
        this.visibleRows.shift();
    }

    /**
     * Unmounts the bottommost row block during scroll up.
     */
    private unmountRowBottom(): void {
        this.scrollHeight-=this.visibleRows[this.visibleRowCnt-1].rowsPositionArr[24];
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]);
        this.rowsDivArr.pop();
        this.rowsPositionPrefixSumArr.pop();
        this.visibleRows.pop();
    }

    /**
     * Redraws all currently visible rows.
     * Typically used after selection change or resizing.
     */
    rerender(): void {
        for (let row of this.visibleRows) {
            row.drawCanvas();
        }
    }

    /**
     * Gets the row canvas by global row ID if it's currently visible.
     * @param {number} rowID - The global row index.
     * @returns {RowsCanvas|null} Matching row canvas or null if out of bounds.
     */
    getCurrentRowCanvas(rowID: number): RowsCanvas | null {
        const arrIdx = rowID - this.visibleRows[0].rowID;
        if (arrIdx >= 0 && arrIdx < this.visibleRows.length) return this.visibleRows[arrIdx];
        alert("something went wrong inside rows manager");
        return null;
    }

    resizePosition(){
        this.scrollHeight=this.scrollHeightStart+this.visibleRows[0].rowsPositionArr[24];
        for(let i=1;i<this.visibleRowCnt;i++){
            this.visibleRows[i].rowCanvasDiv.style.top=`${this.scrollHeight}px`;
            this.scrollHeight+=this.visibleRows[i].rowsPositionArr[24];
        }
    }

    resetScrollTop(){
        this.rowsDivContainer.style.height=`${this.scrollHeight}px`;
    }

    getStartTop(){
        return this.scrollHeightStart;
    }

    getScrollHeight(){
        return this.scrollHeight;
    }

    getStartRowIdx(){
        return this.startRowIdx;
    }
}