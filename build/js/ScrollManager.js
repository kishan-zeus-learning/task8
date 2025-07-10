// import { BooleanObj } from "./types/BooleanObj.js"; // This import is commented out and not used
/**
 * Manages scrolling behavior and coordinates updates to rows, columns, and tile data.
 * It observes the scroll position of a main container and triggers loading/unloading
 * of row, column, and tile blocks to maintain performance for large datasets.
 */
export class ScrollManager {
    /**
     * Initializes the ScrollManager, computes initial scrollable divisions, and sets up scroll listeners.
     * It connects to the main sheet DOM element and calculates how many row/column blocks
     * should be initially visible based on its dimensions.
     */
    constructor() {
        /** @type {number} The minimum height of a row in pixels, used for calculating divisions. */
        this.minHeight = 18;
        /** @type {number} The minimum width of a column in pixels, used for calculating divisions. */
        this.minWidth = 40;
        /** @type {ColumnsManager | null} Manager responsible for handling columns and their scrolling logic. */
        this.columnsManager = null;
        /** @type {RowsManager | null} Manager responsible for handling rows and their scrolling logic. */
        this.rowsManager = null;
        /** @type {TilesManager | null} Manager responsible for handling individual cells/tiles and their scrolling logic. */
        this.tilesManager = null;
        this.sheetDiv = document.getElementById("sheet"); // Get the main sheet container
        this.containerDivRect = this.sheetDiv.getBoundingClientRect(); // Get its dimensions and position
        // Calculate the number of row blocks needed, plus a buffer of 2 blocks
        this.verticalNum = this.minVerticalDiv() + 2;
        // Calculate the number of column blocks needed, plus a buffer of 2 blocks
        this.horizontalNum = this.minHorizontalDiv() + 2;
        this.scrollListener(); // Attach the scroll event listener
    }
    /**
     * Links the external manager instances (ColumnsManager, RowsManager, TilesManager)
     * to this ScrollManager. This is necessary for ScrollManager to coordinate their
     * loading/unloading operations during scrolling.
     * @param {ColumnsManager} columnsManager - The manager for columns.
     * @param {RowsManager} rowsManager - The manager for rows.
     * @param {TilesManager} tilesManager - The manager for cell tiles.
     */
    initializeManager(columnsManager, rowsManager, tilesManager) {
        this.columnsManager = columnsManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
    }
    /**
     * Calculates the minimum number of vertical divisions (25-row blocks)
     * required to fill the visible height of the sheet container.
     * @private
     * @returns {number} The calculated number of vertical scrollable sections.
     */
    minVerticalDiv() {
        // Calculate rows per view, then divide by 25 rows per block to get block count
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight / this.minHeight) / 25);
    }
    /**
     * Calculates the minimum number of horizontal divisions (25-column blocks)
     * required to fill the visible width of the sheet container.
     * @private
     * @returns {number} The calculated number of horizontal scrollable sections.
     */
    minHorizontalDiv() {
        // Calculate columns per view, then divide by 25 columns per block to get block count
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth / this.minWidth) / 25);
    }
    /**
     * Attaches a scroll event listener to the sheet container.
     * This listener monitors scroll direction (up, down, left, right)
     * and triggers the corresponding handler functions.
     * @private
     */
    scrollListener() {
        let lastScrollTop = this.sheetDiv.scrollTop; // Store initial vertical scroll position
        let lastScrollLeft = this.sheetDiv.scrollLeft; // Store initial horizontal scroll position
        this.sheetDiv.addEventListener("scroll", (event) => {
            const currentScrollTop = this.sheetDiv.scrollTop;
            const currentScrollLeft = this.sheetDiv.scrollLeft;
            // Determine vertical scroll direction
            if (currentScrollTop > lastScrollTop) {
                this.handleScrollDown(event);
            }
            else if (currentScrollTop < lastScrollTop) {
                this.handleScrollUp(event);
            }
            // Determine horizontal scroll direction
            if (currentScrollLeft > lastScrollLeft) {
                this.handleScrollRight(event);
            }
            else if (currentScrollLeft < lastScrollLeft) {
                this.handleScrollLeft(event);
            }
            // Update last scroll positions for the next event
            lastScrollLeft = currentScrollLeft;
            lastScrollTop = currentScrollTop;
        });
    }
    /**
     * Handles scrolling down. It checks if the bottommost visible row block
     * is entering the viewport, and if so, triggers the `RowsManager` and
     * `TilesManager` to scroll down (unmount top, mount bottom).
     * @private
     * @param {Event} event - The scroll event object.
     */
    handleScrollDown(event) {
        var _a, _b, _c;
        // Get the last visible row canvas and its bounding rectangle
        const lastRow = (_a = this.rowsManager) === null || _a === void 0 ? void 0 : _a.visibleRows[this.rowsManager.visibleRows.length - 1];
        // If there are no rows (e.g., initial state or error), return
        if (!lastRow)
            return;
        const bufferRect = lastRow.rowCanvasDiv.getBoundingClientRect();
        // Check if the bottom buffer row is within the container's visible area
        const isVisible = (bufferRect.top < this.containerDivRect.bottom &&
            bufferRect.bottom > this.containerDivRect.top);
        if (isVisible) {
            // If the buffer is visible, attempt to scroll down managers
            if ((_b = this.rowsManager) === null || _b === void 0 ? void 0 : _b.scrollDown()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollDown();
            }
        }
    }
    /**
     * Handles scrolling up. It checks if the topmost visible row block
     * is entering the viewport, and if so, triggers the `RowsManager` and
     * `TilesManager` to scroll up (unmount bottom, mount top).
     * @private
     * @param {Event} event - The scroll event object.
     */
    handleScrollUp(event) {
        var _a, _b, _c;
        // Get the first visible row canvas and its bounding rectangle
        const firstRow = (_a = this.rowsManager) === null || _a === void 0 ? void 0 : _a.visibleRows[0];
        // If there are no rows, return
        if (!firstRow)
            return;
        const bufferRect = firstRow.rowCanvasDiv.getBoundingClientRect();
        // Check if the top buffer row is within the container's visible area
        const isVisible = (bufferRect.bottom > this.containerDivRect.top &&
            bufferRect.top < this.containerDivRect.bottom);
        if (isVisible) {
            // If the buffer is visible, attempt to scroll up managers
            if ((_b = this.rowsManager) === null || _b === void 0 ? void 0 : _b.scrollUp()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollUp();
            }
        }
    }
    /**
     * Handles scrolling right. It checks if the rightmost visible column block
     * is entering the viewport, and if so, triggers the `ColumnsManager` and
     * `TilesManager` to scroll right (unmount left, mount right).
     * @private
     * @param {Event} event - The scroll event object.
     */
    handleScrollRight(event) {
        var _a, _b, _c;
        // Get the last visible column canvas and its bounding rectangle
        const lastColumn = (_a = this.columnsManager) === null || _a === void 0 ? void 0 : _a.visibleColumns[this.columnsManager.visibleColumns.length - 1];
        // If there are no columns, return
        if (!lastColumn)
            return;
        const bufferRect = lastColumn.columnCanvasDiv.getBoundingClientRect();
        // Check if the right buffer column is within the container's visible area
        const isVisible = (bufferRect.right > this.containerDivRect.left &&
            bufferRect.left < this.containerDivRect.right);
        if (isVisible) {
            // If the buffer is visible, attempt to scroll right managers
            if ((_b = this.columnsManager) === null || _b === void 0 ? void 0 : _b.scrollRight()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollRight();
            }
        }
    }
    /**
     * Handles scrolling left. It checks if the leftmost visible column block
     * is entering the viewport, and if so, triggers the `ColumnsManager` and
     * `TilesManager` to scroll left (unmount right, mount left).
     * @private
     * @param {Event} event - The scroll event object.
     */
    handleScrollLeft(event) {
        var _a, _b, _c;
        // Get the first visible column canvas and its bounding rectangle
        const firstColumn = (_a = this.columnsManager) === null || _a === void 0 ? void 0 : _a.visibleColumns[0];
        // If there are no columns, return
        if (!firstColumn)
            return;
        const bufferRect = firstColumn.columnCanvasDiv.getBoundingClientRect();
        // Check if the left buffer column is within the container's visible area
        const isVisible = (bufferRect.left < this.containerDivRect.right &&
            bufferRect.right > this.containerDivRect.left);
        if (isVisible) {
            // If the buffer is visible, attempt to scroll left managers
            if ((_b = this.columnsManager) === null || _b === void 0 ? void 0 : _b.scrollLeft()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollLeft();
            }
        }
    }
}
