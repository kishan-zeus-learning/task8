import { RowData } from "./types/RowsColumn.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { GlobalBoolean } from "./types/GlobalBoolean.js";
import { GlobalNumber } from "./types/GlobalNumber.js";

/**
 * Manages a scrolling set of visible row canvases, enabling efficient rendering
 * and resizing behavior for a large number of rows by dynamically mounting and unmounting row blocks.
 */
export class RowsManager {
    /** Map of row indices to custom row height values */
    private rowHeights: RowData;

    /** The index of the first visible row block */
    private startRowIdx: number;

    /** Number of row blocks currently visible */
    private visibleRowCnt: number;

    /** Stores the prefix sum arrays for row positions in each visible block */
    readonly rowsPositionPrefixSumArr: number[][];

    /** Array of currently visible RowsCanvas instances */
    readonly visibleRows: RowsCanvas[];

    /** Global shared variable representing vertical scroll offset in pixels */
    readonly marginTop: GlobalNumber;

    /** DOM references to currently visible row block divs */
    private rowsDivArr: HTMLDivElement[];

    /** Container element that holds all the visible row divs */
    private rowsDivContainer: HTMLDivElement;

    /** Default height for a single row */
    public defaultHeight: number;

    /** Default width for a single row */
    public defaultWidth: number;

    /** Maximum row canvas blocks (hard limit for scrolling) */
    private rowCanvasLimit: number;

    /** Shared boolean flag for showing resize indicator line */
    private _ifResizeOn: GlobalBoolean;

    /** Shared boolean flag to track if pointer is down during resize */
    private _ifResizePointerDown: GlobalBoolean;

    /** Currently active resizing row block index */
    private currentResizingRow: GlobalNumber;

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
    constructor(
        rowHeights: RowData,
        startRowIdx: number,
        visibleRowCnt: number,
        ifResizeOn: GlobalBoolean,
        ifResizePointerDown: GlobalBoolean,
        rowCanvasLimit: number = 4000,
        defaultHeight: number = 25,
        defaultWidth: number = 50,
        marginTop: GlobalNumber = { value: 0 }
    ) {
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
        this.rowsDivContainer = document.getElementById("rowsColumn") as HTMLDivElement;
        this.initialLoad();
    }

    /**
     * Returns the RowsCanvas currently being resized
     */
    get currentResizingRowCanvas() {
        let idx = 0;
        if (this.currentResizingRow.value === -1) {
            // alert("something went wrong");
        } else {
            idx = this.currentResizingRow.value - this.visibleRows[0].rowID;
        }
        return this.visibleRows[idx];
    }

    /**
     * Scrolls row view down by one block and mounts a new row at the bottom
     */
    scrollDown() {
        if (this.startRowIdx === (this.rowCanvasLimit - 1 - this.visibleRowCnt)) return false;
        this.unmountRowTop();
        this.startRowIdx++;
        this.mountRowBottom();
        return true;
    }

    /**
     * Scrolls row view up by one block and mounts a new row at the top
     */
    scrollUp() {
        if (this.startRowIdx === 0) return false;
        this.unmountRowBottom();
        this.startRowIdx--;
        this.mountRowTop();
        return true;
    }

    /**
     * Loads all visible row canvases on initial render
     */
    private initialLoad() {
        for (let i = 0; i < this.visibleRowCnt; i++) {
            const rowIdx = i + this.startRowIdx;
            const canvas = new RowsCanvas(
                rowIdx,
                this.rowHeights,
                this.defaultWidth,
                this.defaultHeight,
                this._ifResizeOn,
                this._ifResizePointerDown,
                this.currentResizingRow
            );

            this.visibleRows.push(canvas);
            this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
            this.rowsDivArr.push(canvas.rowCanvasDiv);
            this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
        }
    }

    /**
     * Adds a new row block to the bottom of the view
     */
    private mountRowBottom() {
        const rowIdx = this.startRowIdx + this.visibleRowCnt - 1;

        const canvas = new RowsCanvas(
            rowIdx,
            this.rowHeights,
            this.defaultWidth,
            this.defaultHeight,
            this._ifResizeOn,
            this._ifResizePointerDown,
            this.currentResizingRow
        );

        this.visibleRows.push(canvas);
        this.rowsPositionPrefixSumArr.push(canvas.rowsPositionArr);
        this.rowsDivArr.push(canvas.rowCanvasDiv);
        this.rowsDivContainer.appendChild(canvas.rowCanvasDiv);
    }

    /**
     * Adds a new row block to the top of the view
     */
    private mountRowTop() {
        const rowIdx = this.startRowIdx;

        const canvas = new RowsCanvas(
            rowIdx,
            this.rowHeights,
            this.defaultWidth,
            this.defaultHeight,
            this._ifResizeOn,
            this._ifResizePointerDown,
            this.currentResizingRow
        );

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
    private unmountRowTop() {
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
    private unmountRowBottom() {
        this.rowsDivContainer.removeChild(this.rowsDivArr[this.rowsDivArr.length - 1]);
        this.rowsDivArr.pop();
        this.rowsPositionPrefixSumArr.pop();
        this.visibleRows.pop();
    }
}
