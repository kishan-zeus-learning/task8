import { ColumnsCanvas } from "./ColumnsCanvas.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { RowsCanvas } from "./RowsCanvas.js";
import { RowsManager } from "./RowsManager.js";
import { TilesManager } from "./TilesManager.js";
// import { BooleanObj } from "./types/BooleanObj.js";

/**
 * Manages scrolling behavior and coordinates updates to rows, columns, and tile data.
 */
export class ScrollManager {
    /** @type {HTMLDivElement} The main container div for the sheet */
    private sheetDiv: HTMLDivElement;

    /** @type {number} The minimum row height in pixels */
    private minHeight: number = 18;

    /** @type {number} The minimum column width in pixels */
    private minWidth: number = 40;

    /** @readonly @type {number} Number of vertical scrollable divisions */
    readonly verticalNum: number;

    /** @readonly @type {number} Number of horizontal scrollable divisions */
    readonly horizontalNum: number;

    /** @type {ColumnsManager | null} Manager handling columns and scrolling logic */
    private columnsManager: ColumnsManager | null = null;

    /** @type {RowsManager | null} Manager handling rows and scrolling logic */
    private rowsManager: RowsManager | null = null;

    /** @type {TilesManager | null} Manager handling tiles and scrolling logic */
    private tilesManager: TilesManager | null = null;

    /** @type {DOMRect} Bounding client rectangle of the sheet container */
    private containerDivRect: DOMRect;


    /**
     * Initializes the ScrollManager, computes scrollable divisions, and sets up scroll listeners.
     */
    constructor() {
        this.sheetDiv = document.getElementById("sheet") as HTMLDivElement;
        this.containerDivRect = this.sheetDiv.getBoundingClientRect();
        this.verticalNum = this.minVerticalDiv() + 2;
        this.horizontalNum = this.minHorizontalDiv() + 2;
        this.scrollListener();
    }

    /**
     * Links managers required for scroll coordination.
     * @param {ColumnsManager} columnsManager - The manager for columns.
     * @param {RowsManager} rowsManager - The manager for rows.
     * @param {TilesManager} tilesManager - The manager for cell tiles.
     */
    initializeManager(columnsManager: ColumnsManager, rowsManager: RowsManager, tilesManager: TilesManager) {
        this.columnsManager = columnsManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
    }

    /**
     * Calculates the minimum number of vertical divisions based on the container height.
     * @returns {number} Number of vertical scrollable sections.
     */
    private minVerticalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight / this.minHeight) / 25);
    }

    /**
     * Calculates the minimum number of horizontal divisions based on the container width.
     * @returns {number} Number of horizontal scrollable sections.
     */
    private minHorizontalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth / this.minWidth) / 25);
    }

    /**
     * Attaches a scroll event listener to the sheet container and tracks scroll direction.
     */
    private scrollListener() {
        
        let lastScrollTop = this.sheetDiv.scrollTop;
        let lastScrollLeft = this.sheetDiv.scrollLeft;

        this.sheetDiv.addEventListener("scroll", (event) => {

            const currentScrollTop = this.sheetDiv.scrollTop;
            const currentScrollLeft = this.sheetDiv.scrollLeft;

            if (currentScrollTop > lastScrollTop) {
                this.handleScrollDown(event);
            }
            if (currentScrollTop < lastScrollTop) {
                this.handleScrollUp(event);
            }
            if (currentScrollLeft > lastScrollLeft) {
                this.handleScrollRight(event);
            }
            if (currentScrollLeft < lastScrollLeft) {
                this.handleScrollLeft(event);
            }

            lastScrollLeft = currentScrollLeft;
            lastScrollTop = currentScrollTop;
        });
    }

    /**
     * Handles scrolling down and triggers row and tile updates if needed.
     * @param {Event} event - The scroll event.
     */
    private handleScrollDown(event: Event) {
        const lastRow = this.rowsManager?.visibleRows[this.rowsManager.visibleRows.length - 1] as RowsCanvas;
        const bufferRect = lastRow.rowCanvasDiv.getBoundingClientRect();

        const isVisible = (
            bufferRect.top < this.containerDivRect.bottom &&
            bufferRect.bottom > this.containerDivRect.top
        );

        if (isVisible) {
            if (this.rowsManager?.scrollDown()) {
                this.tilesManager?.scrollDown();
            }
        }
    }

    /**
     * Handles scrolling up and triggers row and tile updates if needed.
     * @param {Event} event - The scroll event.
     */
    private handleScrollUp(event: Event) {
        const firstRow = this.rowsManager?.visibleRows[0] as RowsCanvas;
        const bufferRect = firstRow.rowCanvasDiv.getBoundingClientRect();

        const isVisible = (
            bufferRect.bottom > this.containerDivRect.top &&
            bufferRect.top < this.containerDivRect.bottom
        );

        if (isVisible) {
            if (this.rowsManager?.scrollUp()) {
                this.tilesManager?.scrollUp();
            }
        }
    }

    /**
     * Handles scrolling right and triggers column and tile updates if needed.
     * @param {Event} event - The scroll event.
     */
    private handleScrollRight(event: Event) {
        const lastColumn = this.columnsManager?.visibleColumns[this.columnsManager.visibleColumns.length - 1] as ColumnsCanvas;
        const bufferRect = lastColumn.columnCanvasDiv.getBoundingClientRect();

        const isVisible = (
            bufferRect.right > this.containerDivRect.left &&
            bufferRect.left < this.containerDivRect.right
        );

        if (isVisible) {
            if (this.columnsManager?.scrollRight()) {
                this.tilesManager?.scrollRight();
            }
        }
    }

    /**
     * Handles scrolling left and triggers column and tile updates if needed.
     * @param {Event} event - The scroll event.
     */
    private handleScrollLeft(event: Event) {
        const firstColumn = this.columnsManager?.visibleColumns[0] as ColumnsCanvas;
        const bufferRect = firstColumn.columnCanvasDiv.getBoundingClientRect();

        const isVisible = (
            bufferRect.left < this.containerDivRect.right &&
            bufferRect.right > this.containerDivRect.left
        );

        if (isVisible) {
            if (this.columnsManager?.scrollLeft()) {
                this.tilesManager?.scrollLeft();
            }
        }
    }
}
