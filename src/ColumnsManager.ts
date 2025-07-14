import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { ColumnData } from "./types/ColumnRows.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";
import { NumberObj } from "./types/NumberObj.js";

/**
 * Manages the creation, rendering, and scrolling of column canvases.
 * Handles dynamic mounting and unmounting of ColumnsCanvas blocks for performance.
 */
export class ColumnsManager {
    /** Stores custom column widths keyed by column index */
    columnWidths: ColumnData;

    /** Index of the first visible column group (each group = 25 columns) */
    private startColumnIdx: number;

    /** Number of column groups visible at any time */
    private visibleColumnCnt: number;

    /** Prefix sum arrays storing x-positions of each column in visible groups */
    readonly visibleColumnsPrefixSum: number[][];

    /** Array of visible ColumnsCanvas instances */
    readonly visibleColumns: ColumnsCanvas[];

    /** Shared global number used to track the left margin of the columns container */
    readonly marginLeft: NumberObj;

    /** HTML container where column canvas divs are mounted */
    readonly columnsDivContainer: HTMLDivElement;

    /** Default height for each column header */
    readonly defaultHeight: number;

    /** Default width for each column */
    readonly defaultWidth: number;

    /** Max number of ColumnsCanvas groups allowed (used for scroll bounds) */
    private columnCanvasLimit: number;

    /** Shared selection coordinates for column highlighting */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /**
     * Initializes a ColumnsManager instance.
     * @param columnWidths - Map that stores custom column widths keyed by column index.
     * @param startColumnIdx - Initial index of the first visible column group.
     * @param visibleColumnCnt - Number of column groups visible initially.
     * @param selectionCoordinates - Object containing selection range coordinates.
     * @param columnCanvasLimit - Maximum number of column canvas groups.
     * @param defaultHeight - Default height for column headers.
     * @param defaultWidth - Default width for columns.
     * @param marginLeft - Initial left margin for the columns container.
     */
    constructor(
        columnWidths: ColumnData,
        startColumnIdx: number,
        visibleColumnCnt: number,
        selectionCoordinates: MultipleSelectionCoordinates,
        columnCanvasLimit: number = 40,
        defaultHeight: number = 25,
        defaultWidth: number = 100,
        marginLeft = { value: 0 }
    ) {
        this.columnWidths = columnWidths;
        this.startColumnIdx = startColumnIdx;
        this.visibleColumnCnt = visibleColumnCnt;
        this.columnCanvasLimit = columnCanvasLimit;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.selectionCoordinates = selectionCoordinates;
        this.marginLeft = marginLeft;

        this.visibleColumns = [];
        this.visibleColumnsPrefixSum = [];

        this.columnsDivContainer = document.getElementById("columnsRow") as HTMLDivElement;

        this.initialLoad(); // Load initial column canvases
    }

    /**
     * Loads initial visible column canvases and appends them to the DOM.
     */
    private initialLoad(): void {
        for (let j = 0; j < this.visibleColumnCnt; j++) {
            const colIdx = j + this.startColumnIdx;
            const canvas = new ColumnsCanvas(
                colIdx,
                this.columnWidths,
                this.defaultWidth,
                this.defaultHeight,
                this.selectionCoordinates
            );
            this.visibleColumns.push(canvas);
            this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr);
            this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
        }
    }

    /**
     * Scrolls right by removing leftmost canvas and adding a new one on the right.
     * @returns True if scroll occurred, false if already at right edge.
     */
    scrollRight(): boolean {
        if (this.startColumnIdx === (this.columnCanvasLimit - 1 - this.visibleColumnCnt)) return false;
        this.unmountColumnLeft();
        this.startColumnIdx++;
        this.mountColumnRight();
        return true;
    }

    /**
     * Scrolls left by removing rightmost canvas and adding a new one on the left.
     * @returns True if scroll occurred, false if already at left edge.
     */
    scrollLeft(): boolean {
        if (this.startColumnIdx === 0) return false;
        this.unmountColumnRight();
        this.startColumnIdx--;
        this.mountColumnLeft();
        return true;
    }

    /**
     * Mounts a new column canvas group to the right end.
     */
    private mountColumnRight(): void {
        const colIdx = this.startColumnIdx + this.visibleColumnCnt - 1;
        const canvas = new ColumnsCanvas(
            colIdx,
            this.columnWidths,
            this.defaultWidth,
            this.defaultHeight,
            this.selectionCoordinates
        );
        this.visibleColumns.push(canvas);
        this.visibleColumnsPrefixSum.push(canvas.columnsPositionArr);
        this.columnsDivContainer.appendChild(canvas.columnCanvasDiv);
    }

    /**
     * Mounts a new column canvas group to the left end and adjusts margin.
     */
    private mountColumnLeft(): void {
        const columnIdx = this.startColumnIdx;
        const canvas = new ColumnsCanvas(
            columnIdx,
            this.columnWidths,
            this.defaultWidth,
            this.defaultHeight,
            this.selectionCoordinates
        );
        this.visibleColumns.unshift(canvas);
        this.visibleColumnsPrefixSum.unshift(canvas.columnsPositionArr);
        this.columnsDivContainer.prepend(canvas.columnCanvasDiv);

        // Adjust container margin to maintain visual continuity
        this.marginLeft.value -= canvas.columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
    }

    /**
     * Unmounts the leftmost canvas and updates margin.
     */
    private unmountColumnLeft(): void {
        this.marginLeft.value += this.visibleColumns[0].columnsPositionArr[24];
        this.columnsDivContainer.style.marginLeft = `${this.marginLeft.value}px`;
        this.columnsDivContainer.removeChild(this.visibleColumns[0].columnCanvasDiv);
        this.visibleColumns.shift();
        this.visibleColumnsPrefixSum.shift();
    }

    /**
     * Unmounts the rightmost canvas from the DOM.
     */
    private unmountColumnRight(): void {
        const canvas = this.visibleColumns.pop();
        if (canvas) {
            this.columnsDivContainer.removeChild(canvas.columnCanvasDiv);
            this.visibleColumnsPrefixSum.pop();
        }
    }

    /**
     * Redraws all currently visible columns.
     */
    rerender(): void {
        for (let column of this.visibleColumns) {
            column.drawCanvas();
        }
    }

    /**
     * Gets the ColumnsCanvas instance for the specified column group ID.
     * @param columnID - The group ID (0-based) of the column canvas to retrieve.
     * @returns The matching ColumnsCanvas instance, or null if not found.
     */
    getCurrentColumnCanvas(columnID: number): ColumnsCanvas | null {
        const arrIdx = columnID - this.visibleColumns[0].columnID;
        if (arrIdx >= 0 && arrIdx < this.visibleColumns.length) return this.visibleColumns[arrIdx];
        alert("something went wrong inside columns manager");
        return null;
    }
}