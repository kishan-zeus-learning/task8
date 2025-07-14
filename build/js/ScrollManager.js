/**
 * Manages scrolling behavior and coordinates updates to rows, columns, and tile data.
 * Observes the scroll position of a main container and triggers loading/unloading
 * of row, column, and tile blocks to maintain performance for large datasets.
 */
export class ScrollManager {
    /**
     * Initializes the ScrollManager and sets up initial scrollable regions and listeners.
     */
    constructor() {
        /** @type {number} The minimum height of a row in pixels */
        this.minHeight = 18;
        /** @type {number} The minimum width of a column in pixels */
        this.minWidth = 40;
        /** @type {ColumnsManager | null} Manager responsible for column scroll handling */
        this.columnsManager = null;
        /** @type {RowsManager | null} Manager responsible for row scroll handling */
        this.rowsManager = null;
        /** @type {TilesManager | null} Manager responsible for cell/tile scroll handling */
        this.tilesManager = null;
        this.sheetDiv = document.getElementById("sheet");
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
    initializeManager(columnsManager, rowsManager, tilesManager) {
        this.columnsManager = columnsManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
    }
    /**
     * Calculates minimum number of 25-row blocks visible based on container height.
     * @private
     * @returns {number} Number of vertical divisions
     */
    minVerticalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight / this.minHeight) / 25);
    }
    /**
     * Calculates minimum number of 25-column blocks visible based on container width.
     * @private
     * @returns {number} Number of horizontal divisions
     */
    minHorizontalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth / this.minWidth) / 25);
    }
    /**
     * Attaches scroll listener to handle dynamic tile rendering on scroll.
     * @private
     */
    scrollListener() {
        let lastScrollTop = this.sheetDiv.scrollTop;
        let lastScrollLeft = this.sheetDiv.scrollLeft;
        this.sheetDiv.addEventListener("scroll", (event) => {
            const currentScrollTop = this.sheetDiv.scrollTop;
            const currentScrollLeft = this.sheetDiv.scrollLeft;
            if (currentScrollTop > lastScrollTop)
                this.handleScrollDown(event);
            else if (currentScrollTop < lastScrollTop)
                this.handleScrollUp(event);
            if (currentScrollLeft > lastScrollLeft)
                this.handleScrollRight(event);
            else if (currentScrollLeft < lastScrollLeft)
                this.handleScrollLeft(event);
            lastScrollLeft = currentScrollLeft;
            lastScrollTop = currentScrollTop;
        });
    }
    /**
     * Handles vertical scroll down and loads new rows and tiles if necessary.
     * @private
     * @param {Event} event - Scroll event
     */
    handleScrollDown(event) {
        var _a, _b, _c;
        const lastRow = (_a = this.rowsManager) === null || _a === void 0 ? void 0 : _a.visibleRows[this.rowsManager.visibleRows.length - 1];
        if (!lastRow)
            return;
        const bufferRect = lastRow.rowCanvasDiv.getBoundingClientRect();
        const isVisible = bufferRect.top < this.containerDivRect.bottom && bufferRect.bottom > this.containerDivRect.top;
        if (isVisible) {
            console.log("buffer is visible ...............");
            if ((_b = this.rowsManager) === null || _b === void 0 ? void 0 : _b.scrollDown())
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollDown();
        }
    }
    /**
     * Handles vertical scroll up and loads new rows and tiles if necessary.
     * @private
     * @param {Event} event - Scroll event
     */
    handleScrollUp(event) {
        var _a, _b, _c;
        const firstRow = (_a = this.rowsManager) === null || _a === void 0 ? void 0 : _a.visibleRows[0];
        if (!firstRow)
            return;
        const bufferRect = firstRow.rowCanvasDiv.getBoundingClientRect();
        const isVisible = bufferRect.bottom > this.containerDivRect.top && bufferRect.top < this.containerDivRect.bottom;
        if (isVisible) {
            if ((_b = this.rowsManager) === null || _b === void 0 ? void 0 : _b.scrollUp())
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollUp();
        }
    }
    /**
     * Handles horizontal scroll right and loads new columns and tiles if necessary.
     * @private
     * @param {Event} event - Scroll event
     */
    handleScrollRight(event) {
        var _a, _b, _c;
        const lastColumn = (_a = this.columnsManager) === null || _a === void 0 ? void 0 : _a.visibleColumns[this.columnsManager.visibleColumns.length - 1];
        if (!lastColumn)
            return;
        const bufferRect = lastColumn.columnCanvasDiv.getBoundingClientRect();
        const isVisible = bufferRect.right > this.containerDivRect.left && bufferRect.left < this.containerDivRect.right;
        if (isVisible) {
            if ((_b = this.columnsManager) === null || _b === void 0 ? void 0 : _b.scrollRight())
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollRight();
        }
    }
    /**
     * Handles horizontal scroll left and loads new columns and tiles if necessary.
     * @private
     * @param {Event} event - Scroll event
     */
    handleScrollLeft(event) {
        var _a, _b, _c;
        const firstColumn = (_a = this.columnsManager) === null || _a === void 0 ? void 0 : _a.visibleColumns[0];
        if (!firstColumn)
            return;
        const bufferRect = firstColumn.columnCanvasDiv.getBoundingClientRect();
        const isVisible = bufferRect.left < this.containerDivRect.right && bufferRect.right > this.containerDivRect.left;
        if (isVisible) {
            if ((_b = this.columnsManager) === null || _b === void 0 ? void 0 : _b.scrollLeft())
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollLeft();
        }
    }
}
