import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { columnData } from "./types/ColumnRows.js";
import { GlobalBoolean } from "./types/GlobalBoolean.js";
import { GlobalNumber } from "./types/GlobalNumber.js";

/**
 * Manages the creation, rendering, and scrolling of column canvases.
 * Handles dynamic mounting and unmounting of ColumnsCanvas blocks for performance.
 */
export class ColumnsManager {
    /** Object that stores custom column widths keyed by column index */
    private columnWidths: columnData;

    /** Index of the first visible column group (each group = 25 columns) */
    private startColumnIdx: number;

    /** Number of column groups visible at any time */
    private visibleColumnCnt: number;

    /** Prefix sum arrays storing x-positions of each column in visible groups */
    readonly visibleColumnsPrefixSum: number[][];

    /** Array of visible ColumnsCanvas instances */
    readonly visibleColumns: ColumnsCanvas[];

    /** Shared global number used to track the left margin of the columns container */
    readonly marginLeft: GlobalNumber;

    /** HTML container where column canvas divs are mounted */
    private columnsDivContainer: HTMLDivElement;

    /** Default height for each column header */
    private defaultHeight: number;

    /** Default width for each column */
    private defaultWidth: number;

    /** Max number of ColumnsCanvas groups allowed (used for scroll bounds) */
    private columnCanvasLimit: number;

    /** Global flag used to show/hide the resize line on hover */
    private _ifResizeOn: GlobalBoolean;

    /** Global flag indicating if pointer is down during a resize operation */
    private _ifResizePointerDown: GlobalBoolean;

    /** Global number tracking the currently resizing column group index */
    private currentResizingColumn: GlobalNumber;

    /**
     * Initializes the ColumnsManager with config values and starts rendering columns.
     * @param {columnData} columnWidths - Column widths map
     * @param {number} startColumnIdx - Initial column group index
     * @param {number} visibleColumnCnt - Number of visible column groups
     * @param {GlobalBoolean} ifResizeOn - Global flag for resize hover
     * @param {GlobalBoolean} ifResizePointerDown - Global flag for pointer down
     * @param {number} columnCanvasLimit - Max allowed column groups (default 40)
     * @param {number} defaultHeight - Default header height (default 25)
     * @param {number} defaultWidth - Default column width (default 80)
     * @param {GlobalNumber} marginLeft - Margin left for scroll (default {value:0})
     */
    constructor(
        columnWidths: columnData,
        startColumnIdx: number,
        visibleColumnCnt: number,
        ifResizeOn: GlobalBoolean,
        ifResizePointerDown: GlobalBoolean,
        columnCanvasLimit: number = 40,
        defaultHeight: number = 25,
        defaultWidth: number = 100,
        marginLeft: GlobalNumber = { value: 0 }
    ) {
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
        this.columnsDivContainer = document.getElementById("columnsRow") as HTMLDivElement;
        this.initialLoad();
    }

    /**
     * Returns the ColumnsCanvas instance for the currently resizing column group.
     * @returns {ColumnsCanvas}
     */
    get currentResizingColumnCanvas() {
        let idx = 0;
        if (this.currentResizingColumn.value === -1) {
            // alert("something went wrong");
        } else {
            idx = this.currentResizingColumn.value - this.visibleColumns[0].columnID;
        }
        return this.visibleColumns[idx];
    }

    /**
     * Scrolls column view one group to the right.
     * Unmounts the leftmost column group and mounts a new one on the right.
     * @returns {boolean} True if scrolled, false if at limit
     */
    scrollRight() {
        if (this.startColumnIdx === (this.columnCanvasLimit - 1 - this.visibleColumnCnt)) return false;

        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
        return true;
    }

    /**
     * Scrolls column view one group to the left.
     * Unmounts the rightmost column group and mounts a new one on the left.
     * @returns {boolean} True if scrolled, false if at leftmost position
     */
    scrollLeft() {
        if (this.startColumnIdx === 0) return false;

        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
        return true;
    }

    /**
     * Loads the initial set of visible ColumnsCanvas groups into the DOM.
     */
    private initialLoad() {
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = j + this.startColumnIdx;
            this.visibleColumns.push(
                new ColumnsCanvas(
                    colIdx,
                    this.columnWidths,
                    this.defaultWidth,
                    this.defaultHeight,
                    this._ifResizeOn,
                    this._ifResizePointerDown,
                    this.currentResizingColumn
                )
            );
            this.visibleColumnsPrefixSum.push(this.visibleColumns[j].columnsPositionArr);
            this.columnsDivContainer.appendChild(this.visibleColumns[j].columnCanvasDiv);
        }
    }

    /**
     * Adds a new ColumnsCanvas to the right side of the container.
     */
    private mountColumnRight() {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1;

        this.visibleColumns.push(
            new ColumnsCanvas(
                colIdx,
                this.columnWidths,
                this.defaultWidth,
                this.defaultHeight,
                this._ifResizeOn,
                this._ifResizePointerDown,
                this.currentResizingColumn
            )
        );

        this.columnsDivContainer.appendChild(this.visibleColumns[this.visibleColumns.length - 1].columnCanvasDiv);
        this.visibleColumnsPrefixSum.push(this.visibleColumns[this.visibleColumns.length - 1].columnsPositionArr);
    }

    /**
     * Adds a new ColumnsCanvas to the left side of the container and adjusts margin.
     */
    private mountColumnLeft() {
        const columnIdx = this.startColumnIdx;

        this.visibleColumns.unshift(
            new ColumnsCanvas(
                columnIdx,
                this.columnWidths,
                this.defaultWidth,
                this.defaultHeight,
                this._ifResizeOn,
                this._ifResizePointerDown,
                this.currentResizingColumn
            )
        );
        this.columnsDivContainer.prepend(this.visibleColumns[0].columnCanvasDiv);
        this.visibleColumnsPrefixSum.unshift(this.visibleColumns[0].columnsPositionArr);
        this.marginLeft.value -= this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
    }

    /**
     * Removes the leftmost ColumnsCanvas and adjusts margin.
     */
    private unmountColumnLeft() {
        this.marginLeft.value += this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;

        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvasDiv);

        this.visibleColumns.shift();
        this.visibleColumnsPrefixSum.shift();
    }

    /**
     * Removes the rightmost ColumnsCanvas from the container.
     */
    private unmountColumnRight() {
        this.columnsDivContainer.removeChild(this.visibleColumns[this.visibleColumns.length - 1].columnCanvasDiv);
        this.visibleColumns.pop();
        this.visibleColumnsPrefixSum.pop();
    }
}
