import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { ColumnData } from "./types/ColumnRows.js";
import { GlobalBoolean } from "./types/GlobalBoolean.js";
import { GlobalNumber } from "./types/GlobalNumber.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";

/**
 * Manages the creation, rendering, and scrolling of column canvases.
 * Handles dynamic mounting and unmounting of ColumnsCanvas blocks for performance.
 */
export class ColumnsManager {
    /** Map that stores custom column widths keyed by column index */
    private columnWidths: ColumnData;

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
    readonly columnsDivContainer: HTMLDivElement;

    /** Default height for each column header */
    readonly defaultHeight: number;

    /** Default width for each column */
    readonly defaultWidth: number;

    /** Max number of ColumnsCanvas groups allowed (used for scroll bounds) */
    private columnCanvasLimit: number;

    /** Global flag used to show/hide the resize line on hover */
    private _ifResizeOn: GlobalBoolean;

    /** Global flag indicating if pointer is down during a resize operation */
    private _ifResizePointerDown: GlobalBoolean;

    /** Global number tracking the currently resizing column group index */
    private currentResizingColumn: GlobalNumber;

    /** Shared selection coordinates for column highlighting */
    private selectionCoordinates: MultipleSelectionCoordinates;

    constructor(
        columnWidths: ColumnData,
        startColumnIdx: number,
        visibleColumnCnt: number,
        ifResizeOn: GlobalBoolean,
        ifResizePointerDown: GlobalBoolean,
        selectionCoordinates: MultipleSelectionCoordinates,
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
        this.selectionCoordinates = selectionCoordinates;
        this.columnsDivContainer = document.getElementById("columnsRow") as HTMLDivElement;
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
        if (this.startColumnIdx === (this.columnCanvasLimit - 1 - this.visibleColumnCnt)) return false;
        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
        return true;
    }

    scrollLeft() {
        if (this.startColumnIdx === 0) return false;
        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
        return true;
    }

    private initialLoad() {
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = j + this.startColumnIdx;
            const canvas = new ColumnsCanvas(
                colIdx,
                this.columnWidths,
                this.defaultWidth,
                this.defaultHeight,
                this._ifResizeOn,
                this._ifResizePointerDown,
                this.currentResizingColumn,
                this.selectionCoordinates
            );
            this.visibleColumns.push(canvas);
            this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr);
            this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
        }
    }

    private mountColumnRight() {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1;
        const canvas = new ColumnsCanvas(
            colIdx,
            this.columnWidths,
            this.defaultWidth,
            this.defaultHeight,
            this._ifResizeOn,
            this._ifResizePointerDown,
            this.currentResizingColumn,
            this.selectionCoordinates
        );
        this.visibleColumns.push(canvas);
        this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
        this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr);
    }

    private mountColumnLeft() {
        const columnIdx = this.startColumnIdx;
        const canvas = new ColumnsCanvas(
            columnIdx,
            this.columnWidths,
            this.defaultWidth,
            this.defaultHeight,
            this._ifResizeOn,
            this._ifResizePointerDown,
            this.currentResizingColumn,
            this.selectionCoordinates
        );
        this.visibleColumns.unshift(canvas);
        this.columnsDivContainer.prepend(canvas.columnCanvasDiv);
        this.visibleColumnsPrefixSum.unshift(canvas.columnsPositionArr);
        this.marginLeft.value -= canvas.columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
    }

    private unmountColumnLeft() {
        this.marginLeft.value += this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvasDiv);
        this.visibleColumns.shift();
        this.visibleColumnsPrefixSum.shift();
    }

    private unmountColumnRight() {
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
