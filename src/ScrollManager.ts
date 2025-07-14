import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { RowsManager } from "./RowsManager.js";
import { TilesManager } from "./TilesManager.js";

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

        this.sheetDiv.addEventListener("scroll", (event) => {
            const currentScrollTop = this.sheetDiv.scrollTop;
            const currentScrollLeft = this.sheetDiv.scrollLeft;

            
            if (currentScrollTop > lastScrollTop) this.handleScrollDown(event);
            else if (currentScrollTop < lastScrollTop) this.handleScrollUp(event);
            
            if (currentScrollLeft > lastScrollLeft) this.handleScrollRight(event);
            else if (currentScrollLeft < lastScrollLeft) this.handleScrollLeft(event);
            
            lastScrollLeft = currentScrollLeft;
            lastScrollTop = currentScrollTop;
        if(currentScrollTop===0){
            this.rowsManager!.rowsDivContainer.style.marginBottom="0";
            this.rowsManager!.marginBottom.value=0;
        }

        if(currentScrollLeft===0){
            this.columnsManager!.columnsDivContainer.style.marginRight="0";
            this.columnsManager!.marginRight.value=0;
        }
        });
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
            console.log("buffer is visible ...............");
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
}