export class ScrollManager {
    constructor() {
        this.minHeight = 18;
        this.minWidth = 40;
        this.columnsManager = null;
        this.rowsManager = null;
        this.tilesManager = null;
        this.gridDiv = document.getElementById("grid");
        this.sheetDiv = document.getElementById("sheet");
        this.containerDivRect = this.sheetDiv.getBoundingClientRect();
        this.verticalNum = this.minVerticalDiv() + 2;
        this.horizontalNum = this.minHorizontalDiv() + 2;
        this.scrollListener();
    }
    initializeManager(columnsManager, rowsManager, tilesManager) {
        this.columnsManager = columnsManager;
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
    }
    minVerticalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientHeight / (this.minHeight)) / 25);
    }
    minHorizontalDiv() {
        return Math.ceil(Math.ceil(this.sheetDiv.clientWidth / (this.minWidth)) / 25);
    }
    scrollListener() {
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
    handleScrollDown(event) {
        var _a, _b, _c, _d;
        const lastRow = (_a = this.rowsManager) === null || _a === void 0 ? void 0 : _a.visibleRows[this.rowsManager.visibleRows.length - 1];
        const bufferRect = lastRow.rowCanvas.getBoundingClientRect();
        const isVisible = (bufferRect.top < this.containerDivRect.bottom &&
            bufferRect.bottom > this.containerDivRect.top);
        if (isVisible) {
            if ((_b = this.rowsManager) === null || _b === void 0 ? void 0 : _b.scrollDown()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollDown((_d = this.rowsManager) === null || _d === void 0 ? void 0 : _d.rowsPositionPrefixSumArr[this.rowsManager.rowsPositionPrefixSumArr.length - 1]);
            }
        }
    }
    handleScrollUp(event) {
        var _a, _b, _c, _d;
        const firstRow = (_a = this.rowsManager) === null || _a === void 0 ? void 0 : _a.visibleRows[0];
        const bufferRect = firstRow.rowCanvas.getBoundingClientRect();
        const isVisible = (bufferRect.bottom > this.containerDivRect.top &&
            bufferRect.top < this.containerDivRect.bottom);
        if (isVisible) {
            if ((_b = this.rowsManager) === null || _b === void 0 ? void 0 : _b.scrollUp()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollUp((_d = this.rowsManager) === null || _d === void 0 ? void 0 : _d.rowsPositionPrefixSumArr[0]);
            }
        }
    }
    handleScrollRight(event) {
        var _a, _b, _c, _d;
        const lastColumn = (_a = this.columnsManager) === null || _a === void 0 ? void 0 : _a.visibleColumns[this.columnsManager.visibleColumns.length - 1];
        const bufferRect = lastColumn.columnCanvas.getBoundingClientRect();
        const isVisible = (bufferRect.right > this.containerDivRect.left &&
            bufferRect.left < this.containerDivRect.right);
        if (isVisible) {
            if ((_b = this.columnsManager) === null || _b === void 0 ? void 0 : _b.scrollRight()) {
                console.log("before rendering : ");
                // console.log(this.tilesManager);
                // this.tilesManager?.printConsole();
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollRight((_d = this.columnsManager) === null || _d === void 0 ? void 0 : _d.visibleColumnsPrefixSum[this.columnsManager.visibleColumnsPrefixSum.length - 1]);
                console.log("After rendering");
                // console.log(this.tilesManager);
                // this.tilesManager?.printConsole();
            }
        }
    }
    handleScrollLeft(event) {
        var _a, _b, _c, _d;
        const firstColumn = (_a = this.columnsManager) === null || _a === void 0 ? void 0 : _a.visibleColumns[0];
        const bufferRect = firstColumn.columnCanvas.getBoundingClientRect();
        const isVisible = (bufferRect.left < this.containerDivRect.right &&
            bufferRect.right > this.containerDivRect.left);
        if (isVisible) {
            if ((_b = this.columnsManager) === null || _b === void 0 ? void 0 : _b.scrollLeft()) {
                (_c = this.tilesManager) === null || _c === void 0 ? void 0 : _c.scrollLeft((_d = this.columnsManager) === null || _d === void 0 ? void 0 : _d.visibleColumnsPrefixSum[0]);
            }
        }
    }
}
