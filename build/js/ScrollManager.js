/**
 * Manages scrolling behavior and coordinates updates to rows, columns, and tile data.
 */
export class ScrollManager {
    /**
     * Initializes the ScrollManager, computes scrollable divisions, and sets up scroll listeners.
     */
    constructor() {
        /** @type {number} The minimum row height in pixels */
        this.minHeight = 18;
        /** @type {number} The minimum column width in pixels */
        this.minWidth = 40;
        /** @type {ColumnsManager | null} Manager handling columns and scrolling logic */
        this.columnsManager = null;
        /** @type {RowsManager | null} Manager handling rows and scrolling logic */
        this.rowsManager = null;
        /** @type {TilesManager | null} Manager handling tiles and scrolling logic */
        this.tilesManager = null;
        this.sheetDiv = document.getElementById("sheet");
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
    initializeManager(columnsManager, rowsManager, tilesManager) {
        this.columnsManager = columnsManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
    }
    /**
     * Calculates the minimum number of vertical divisions based on the container height.
     * @returns {number} Number of vertical scrollable sections.
     */
    minVerticalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight / this.minHeight) / 25);
    }
    /**
     * Calculates the minimum number of horizontal divisions based on the container width.
     * @returns {number} Number of horizontal scrollable sections.
     */
    minHorizontalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth / this.minWidth) / 25);
    }
    /**
     * Attaches a scroll event listener to the sheet container and tracks scroll direction.
     */
    scrollListener() {
        let lastScrollTop = this.sheetDiv.scrollTop;
        let lastScrollLeft = this.sheetDiv.scrollLeft;
        this.sheetDiv.addEventListener("scroll", (event) => {
            //     console.log("scroll event triggered", this.scrollByKeyboard);
            //     if(this.scrollByKeyboard.value) {
            //     // this.scrollByKeyboard.value=false;
            //     this.sheetDiv.scrollTop=lastScrollTop;
            //     this.sheetDiv.scrollLeft=lastScrollLeft;
            //     setTimeout(()=>{
            //         this.scrollByKeyboard.value=false;
            //     },100)
            //     return ;
            // }
            console.log("crossed the return statement");
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
    handleScrollDown(event) {
        var _a, _b, _c;
        console.log("scroll down executed ");
        const lastRow = (_a = this.rowsManager) === null || _a === void 0 ? void 0 : _a.visibleRows[this.rowsManager.visibleRows.length - 1];
        const bufferRect = lastRow.rowCanvasDiv.getBoundingClientRect();
        const isVisible = (bufferRect.top < this.containerDivRect.bottom &&
            bufferRect.bottom > this.containerDivRect.top);
        if (isVisible) {
            if ((_b = this.rowsManager) === null || _b === void 0 ? void 0 : _b.scrollDown()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollDown();
            }
        }
    }
    /**
     * Handles scrolling up and triggers row and tile updates if needed.
     * @param {Event} event - The scroll event.
     */
    handleScrollUp(event) {
        var _a, _b, _c;
        const firstRow = (_a = this.rowsManager) === null || _a === void 0 ? void 0 : _a.visibleRows[0];
        const bufferRect = firstRow.rowCanvasDiv.getBoundingClientRect();
        const isVisible = (bufferRect.bottom > this.containerDivRect.top &&
            bufferRect.top < this.containerDivRect.bottom);
        if (isVisible) {
            if ((_b = this.rowsManager) === null || _b === void 0 ? void 0 : _b.scrollUp()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollUp();
            }
        }
    }
    /**
     * Handles scrolling right and triggers column and tile updates if needed.
     * @param {Event} event - The scroll event.
     */
    handleScrollRight(event) {
        var _a, _b, _c;
        const lastColumn = (_a = this.columnsManager) === null || _a === void 0 ? void 0 : _a.visibleColumns[this.columnsManager.visibleColumns.length - 1];
        const bufferRect = lastColumn.columnCanvasDiv.getBoundingClientRect();
        const isVisible = (bufferRect.right > this.containerDivRect.left &&
            bufferRect.left < this.containerDivRect.right);
        if (isVisible) {
            if ((_b = this.columnsManager) === null || _b === void 0 ? void 0 : _b.scrollRight()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollRight();
            }
        }
    }
    /**
     * Handles scrolling left and triggers column and tile updates if needed.
     * @param {Event} event - The scroll event.
     */
    handleScrollLeft(event) {
        var _a, _b, _c;
        const firstColumn = (_a = this.columnsManager) === null || _a === void 0 ? void 0 : _a.visibleColumns[0];
        const bufferRect = firstColumn.columnCanvasDiv.getBoundingClientRect();
        const isVisible = (bufferRect.left < this.containerDivRect.right &&
            bufferRect.right > this.containerDivRect.left);
        if (isVisible) {
            if ((_b = this.columnsManager) === null || _b === void 0 ? void 0 : _b.scrollLeft()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollLeft();
            }
        }
    }
}
