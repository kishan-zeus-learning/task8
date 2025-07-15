import { ColumnsCanvas } from "./Columns/ColumnsCanvas.js";
import { ColumnsManager } from "./Columns/ColumnsManager.js";
import { RowsCanvas } from "./Rows/RowsCanvas.js";
import { RowsManager } from "./Rows/RowsManager.js";
import { TilesManager } from "./Tiles/TilesManager.js";

/**
 * Manages scrolling behavior and coordinates updates to rows, columns, and tile data.
 * Observes the scroll position of a main container and triggers loading/unloading
 * of row, column, and tile blocks to maintain performance for large datasets.
 */
export class ScrollManager {
    /** @type {HTMLDivElement} The main container div for the sheet */
    private sheetDiv: HTMLDivElement;

    /** @type {number} The minimum height of a row in pixels */
    private minHeight: number = 18;

    /** @type {number} The minimum width of a column in pixels */
    private minWidth: number = 40;

    /** @readonly @type {number} Number of vertical scrollable divisions (row blocks) to render initially */
    readonly verticalNum: number;

    /** @readonly @type {number} Number of horizontal scrollable divisions (column blocks) to render initially */
    readonly horizontalNum: number;

    /** @type {ColumnsManager | null} Manager responsible for column scroll handling */
    private columnsManager: ColumnsManager | null = null;

    /** @type {RowsManager | null} Manager responsible for row scroll handling */
    private rowsManager: RowsManager | null = null;

    /** @type {TilesManager | null} Manager responsible for cell/tile scroll handling */
    private tilesManager: TilesManager | null = null;

    /** @type {DOMRect} Bounding client rectangle of the container for visibility checks */
    private containerDivRect: DOMRect;

    /**
     * Initializes the ScrollManager and sets up initial scrollable regions and listeners.
     */
    constructor() {
        this.sheetDiv = document.getElementById("sheet") as HTMLDivElement;
        this.containerDivRect = this.sheetDiv.getBoundingClientRect();
        this.verticalNum = this.minVerticalDiv() + 2;
        this.horizontalNum = this.minHorizontalDiv() + 2;
        this.scrollListener();
    }

    /**
     * Initializes manager dependencies for scroll coordination.
     * @param {ColumnsManager} columnsManager - Manages column data and rendering
     * @param {RowsManager} rowsManager - Manages row data and rendering
     * @param {TilesManager} tilesManager - Manages cell data and rendering
     */
    initializeManager(columnsManager: ColumnsManager, rowsManager: RowsManager, tilesManager: TilesManager): void {
        this.columnsManager = columnsManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
    }

    /**
     * Calculates minimum number of 25-row blocks visible based on container height.
     * @private
     * @returns {number} Number of vertical divisions
     */
    private minVerticalDiv(): number {
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight / this.minHeight) / 25);
    }

    /**
     * Calculates minimum number of 25-column blocks visible based on container width.
     * @private
     * @returns {number} Number of horizontal divisions
     */
    private minHorizontalDiv(): number {
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth / this.minWidth) / 25);
    }

    /**
     * Attaches scroll listener to handle dynamic tile rendering on scroll.
     * @private
     */
    private scrollListener(): void {
        let lastScrollTop = this.sheetDiv.scrollTop;
        let lastScrollLeft = this.sheetDiv.scrollLeft;
        let fastScrollDetected = false;
        let scrollStopTimer: ReturnType<typeof setTimeout> | null = null;

        // These will hold the scroll positions when fast scroll ends
        let finalScrollTop = 0;
        let finalScrollLeft = 0;

        this.sheetDiv.addEventListener("scroll", (event) => {
            const currentScrollTop = this.sheetDiv.scrollTop;
            const currentScrollLeft = this.sheetDiv.scrollLeft;

            const deltaY = currentScrollTop - lastScrollTop;
            const deltaX = currentScrollLeft - lastScrollLeft;

            // Determine if the scroll is "fast" based on a threshold
            const isFastScroll = Math.abs(deltaX) > 2500 || Math.abs(deltaY) > 625;

            if (isFastScroll) {
                console.log("Fast scrolling");
                fastScrollDetected = true;

                // Store current positions for use when scrolling ends
                finalScrollTop = currentScrollTop;
                finalScrollLeft = currentScrollLeft;
            } else {
                this.scrollSmooth(
                    event,
                    currentScrollTop,
                    currentScrollLeft,
                    lastScrollTop,
                    lastScrollLeft
                );
            }

            lastScrollTop = currentScrollTop;
            lastScrollLeft = currentScrollLeft;

            // Detect scroll stop using a debounce timer
            if (scrollStopTimer) {
                clearTimeout(scrollStopTimer);
            }

            scrollStopTimer = setTimeout(() => {
                if (fastScrollDetected) {
                    this.onFastScrollEnd(finalScrollTop, finalScrollLeft);
                    fastScrollDetected = false;
                }

                if (currentScrollTop === 0) {
                    this.rowsManager!.resetScrollTop();
                }

                if (currentScrollLeft === 0) {
                    this.columnsManager!.resetScrollLeft();
                }
            }, 150); // delay in ms to determine scroll stop

            // Immediate reset for edge cases where scroll position is exactly 0
            if (currentScrollTop === 0) {
                this.rowsManager!.resetScrollTop();
            }

            if (currentScrollLeft === 0) {
                this.columnsManager!.resetScrollLeft();
            }
        });
    }

    /**
     * Handles actions to take when a fast scroll event ends.
     * Reloads rows, columns, and tiles based on the final scroll position.
     * @private
     * @param {number} scrollTop - The final vertical scroll position.
     * @param {number} scrollLeft - The final horizontal scroll position.
     */
    private onFastScrollEnd(scrollTop: number, scrollLeft: number) {
        console.log("fast scroll ended");

        const topPosIdx = this.getIdxTop(scrollTop);
        const leftPosIdx = this.getIdxLeft(scrollLeft);

        this.rowsManager!.reload(topPosIdx.idx, topPosIdx.top);
        this.columnsManager!.reload(leftPosIdx.idx, leftPosIdx.left);

        this.tilesManager!.reload();
    }

    /**
     * Handles smooth scrolling, triggering updates for rows and columns.
     * @private
     * @param {Event} event - The scroll event.
     * @param {number} currentScrollTop - The current vertical scroll position.
     * @param {number} currentScrollLeft - The current horizontal scroll position.
     * @param {number} lastScrollTop - The previous vertical scroll position.
     * @param {number} lastScrollLeft - The previous horizontal scroll position.
     */
    private scrollSmooth(event: Event, currentScrollTop: number, currentScrollLeft: number, lastScrollTop: number, lastScrollLeft: number) {
        if (currentScrollTop > lastScrollTop) this.handleScrollDown(event);
        else if (currentScrollTop < lastScrollTop) this.handleScrollUp(event);

        if (currentScrollLeft > lastScrollLeft) this.handleScrollRight(event);
        else if (currentScrollLeft < lastScrollLeft) this.handleScrollLeft(event);
    }

    /**
     * Handles vertical scroll down and loads new rows and tiles if necessary.
     * @private
     * @param {Event} event - Scroll event
     */
    private handleScrollDown(event: Event): void {
        const lastRow = this.rowsManager?.visibleRows[this.rowsManager.visibleRows.length - 1] as RowsCanvas;
        if (!lastRow) return;

        const bufferRect = lastRow.rowCanvasDiv.getBoundingClientRect();
        const isVisible = bufferRect.top < this.containerDivRect.bottom && bufferRect.bottom > this.containerDivRect.top;

        if (isVisible) {
            if (this.rowsManager?.scrollDown()) this.tilesManager?.scrollDown();
        }
    }

    /**
     * Handles vertical scroll up and loads new rows and tiles if necessary.
     * @private
     * @param {Event} event - Scroll event
     */
    private handleScrollUp(event: Event): void {
        const firstRow = this.rowsManager?.visibleRows[0] as RowsCanvas;
        if (!firstRow) return;

        const bufferRect = firstRow.rowCanvasDiv.getBoundingClientRect();
        const isVisible = bufferRect.bottom > this.containerDivRect.top && bufferRect.top < this.containerDivRect.bottom;

        if (isVisible) {
            if (this.rowsManager?.scrollUp()) this.tilesManager?.scrollUp();
        }
    }

    /**
     * Handles horizontal scroll right and loads new columns and tiles if necessary.
     * @private
     * @param {Event} event - Scroll event
     */
    private handleScrollRight(event: Event): void {
        const lastColumn = this.columnsManager?.visibleColumns[this.columnsManager.visibleColumns.length - 1] as ColumnsCanvas;
        if (!lastColumn) return;

        const bufferRect = lastColumn.columnCanvasDiv.getBoundingClientRect();
        const isVisible = bufferRect.right > this.containerDivRect.left && bufferRect.left < this.containerDivRect.right;

        if (isVisible) {
            if (this.columnsManager?.scrollRight()) this.tilesManager?.scrollRight();
        }
    }

    /**
     * Handles horizontal scroll left and loads new columns and tiles if necessary.
     * @private
     * @param {Event} event - Scroll event
     */
    private handleScrollLeft(event: Event): void {
        const firstColumn = this.columnsManager?.visibleColumns[0] as ColumnsCanvas;
        if (!firstColumn) return;

        const bufferRect = firstColumn.columnCanvasDiv.getBoundingClientRect();
        const isVisible = bufferRect.left < this.containerDivRect.right && bufferRect.right > this.containerDivRect.left;

        if (isVisible) {
            if (this.columnsManager?.scrollLeft()) this.tilesManager?.scrollLeft();
        }
    }

    /**
     * Calculates the index and top pixel position of the row block that should be at the top
     * of the visible area given a scroll top value. Used for fast scrolling reloads.
     * @private
     * @param {number} scrollTop - The current vertical scroll position.
     * @returns {{idx: number, top: number}} An object containing the row block index and its top pixel position.
     */
    private getIdxTop(scrollTop: number): { idx: number, top: number } {
        let sum = 0;
        let prevSum = 0;
        // Iterate through potential row blocks (each 25 rows)
        for (let i = 0; i < 4000 - this.rowsManager!.visibleRowCnt; i++) {
            const currentSum = this.getSum25Row(i); // Get total height of current 25-row block
            if (sum + currentSum > scrollTop) {
                // If adding the current block's height exceeds scrollTop,
                // the previous block was the one just above the scroll top.
                return { idx: i - 1, top: prevSum };
            }
            prevSum = sum; // Store the sum before adding current block's height
            sum += currentSum; // Accumulate total height
        }

        // If scroll position is beyond all calculated blocks, return the last possible block
        return { idx: 4000 - this.rowsManager!.visibleRowCnt, top: prevSum };
    }

    /**
     * Calculates the total height of a block of 25 rows starting from a given block index.
     * @private
     * @param {number} idx - The 0-based index of the 25-row block.
     * @returns {number} The total height of the 25 rows in the specified block.
     */
    private getSum25Row(idx: number): number {
        let currIdx = idx * 25; // Calculate the global starting row number for this block (0-indexed)
        let sum = 0;
        for (let i = 0; i < 25; i++) {
            currIdx++; // Move to the next global row number (1-indexed for map lookup)
            const currentHeight = this.rowsManager!.rowHeights.get(currIdx);
            if (currentHeight) {
                sum += currentHeight.height;
            } else {
                sum += this.rowsManager!.defaultHeight; // Use default height if not custom
            }
        }
        return sum;
    }

    /**
     * Calculates the index and left pixel position of the column block that should be at the left
     * of the visible area given a scroll left value. Used for fast scrolling reloads.
     * @private
     * @param {number} scrollLeft - The current horizontal scroll position.
     * @returns {{idx: number, left: number}} An object containing the column block index and its left pixel position.
     */
    private getIdxLeft(scrollLeft: number): { idx: number, left: number } {
        let sum = 0;
        let prevSum = 0;
        // Iterate through potential column blocks (each 25 columns)
        for (let i = 0; i < 40 - this.columnsManager!.visibleColumnCnt; i++) {
            const currentSum = this.getSum25Column(i); // Get total width of current 25-column block
            if (sum + currentSum > scrollLeft) {
                // If adding the current block's width exceeds scrollLeft,
                // the previous block was the one just left of the scroll left.
                return { idx: (i - 1), left: prevSum };
            }
            prevSum = sum; // Store the sum before adding current block's width
            sum += currentSum; // Accumulate total width
        }

        // If scroll position is beyond all calculated blocks, return the last possible block
        return { idx: 40 - this.columnsManager!.visibleColumnCnt, left: prevSum };
    }

    /**
     * Calculates the total width of a block of 25 columns starting from a given block index.
     * @private
     * @param {number} idx - The 0-based index of the 25-column block.
     * @returns {number} The total width of the 25 columns in the specified block.
     */
    private getSum25Column(idx: number): number {
        let currIdx = idx * 25; // Calculate the global starting column number for this block (0-indexed)
        let sum = 0;
        for (let i = 0; i < 25; i++) {
            currIdx++; // Move to the next global column number (1-indexed for map lookup)
            const currentWidth = this.columnsManager!.columnWidths.get(currIdx);

            if (currentWidth) {
                sum += currentWidth.width;
            } else {
                sum += this.columnsManager!.defaultWidth; // Use default width if not custom
            }
        }
        return sum;
    }
}