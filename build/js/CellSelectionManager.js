export class CellSelectionManager {
    constructor(rowsManager, tilesManager, columnsManager, ifMultipleSelection, selectionCoordinates) {
        this.coordinateX = 0;
        this.coordinateY = 0;
        this.scrollId = null;
        this.maxDistance = 100;
        this.maxSpeed = 10;
        this.sheetDiv = document.getElementById('sheet');
        this.selectedCells = {};
        this.selectedRows = [];
        this.selectedColumns = [];
        this.ifMultipleSelection = ifMultipleSelection;
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.ifSelectionOn = { value: false };
        this.selectionCoordinates = selectionCoordinates;
        this.autoScroll = this.autoScroll.bind(this);
        this.init();
    }
    selectCell(row, col) {
        // this.selectedCells.push({row,col});
    }
    deselectCell(row, col) {
    }
    init() {
        this.tilesManager.gridDiv.addEventListener("pointerdown", (event) => this.pointerDown(event));
    }
    getRowColumn(canvasUnderCursor, clientX, clientY) {
        if (!canvasUnderCursor || canvasUnderCursor.tagName !== 'CANVAS') {
            return null;
        }
        const canvasElementRect = canvasUnderCursor.getBoundingClientRect();
        const offsetX = clientX - canvasElementRect.left;
        const offsetY = clientY - canvasElementRect.top;
        const currentRow = parseInt(canvasUnderCursor.getAttribute('row'));
        const currentCol = parseInt(canvasUnderCursor.getAttribute('col'));
        const arrRowIdx = currentRow - this.tilesManager.visibleTiles[0][0].row;
        const arrColIdx = currentCol - this.tilesManager.visibleTiles[0][0].col;
        const tile = this.tilesManager.visibleTiles[arrRowIdx][arrColIdx];
        const row = currentRow * 25 + this.binarySearchUpperBound(tile.rowsPositionArr, offsetY) + 1;
        const col = currentCol * 25 + this.binarySearchUpperBound(tile.colsPositionArr, offsetX) + 1;
        return { row, col };
    }
    calculateSpeed(distance) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }
    startAutoScroll() {
        if (this.scrollId !== null)
            return;
        this.scrollId = requestAnimationFrame(this.autoScroll);
    }
    autoScroll() {
        if (!this.ifSelectionOn.value) {
            this.scrollId = null;
            return;
        }
        const rect = this.sheetDiv.getBoundingClientRect();
        let dx = 0, dy = 0;
        if (this.coordinateY > rect.bottom - 30) {
            dy = this.calculateSpeed(this.coordinateY - rect.bottom + 30);
        }
        else if (this.coordinateY < rect.top) {
            dy = -this.calculateSpeed(rect.top - this.coordinateY);
        }
        if (this.coordinateX > rect.right - 30) {
            dx = this.calculateSpeed(this.coordinateX - rect.right + 30);
        }
        else if (this.coordinateX < rect.left) {
            dx = -this.calculateSpeed(rect.left - this.coordinateX);
        }
        this.sheetDiv.scrollBy(dx, dy);
        const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));
        const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
        let rowColObj = this.getRowColumn(document.elementFromPoint(canvasX, canvasY), canvasX, canvasY);
        if (rowColObj) {
            this.selectionCoordinates.selectionEndRow = rowColObj.row;
            this.selectionCoordinates.selectionEndColumn = rowColObj.col;
        }
        this.rerender();
        this.scrollId = requestAnimationFrame(this.autoScroll);
    }
    pointerMove(event) {
        if (!this.ifSelectionOn)
            return;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }
    pointerDown(event) {
        let startRowCol = this.getRowColumn(event.target, event.clientX, event.clientY);
        if (!startRowCol)
            return console.log("not canvas element");
        this.selectionCoordinates.selectionStartRow = startRowCol.row;
        this.selectionCoordinates.selectionStartColumn = startRowCol.col;
        this.selectionCoordinates.selectionEndRow = startRowCol.row;
        this.selectionCoordinates.selectionEndColumn = startRowCol.col;
        this.ifSelectionOn.value = true;
        this.coordinateY = event.clientY;
        this.coordinateX = event.clientX;
        this.rerender();
        this.startAutoScroll();
    }
    pointerUp(event) {
        this.ifSelectionOn.value = false;
        console.log("selection coordinates : ", this.selectionCoordinates);
    }
    rerender() {
        this.tilesManager.rerender();
        this.rowsManager.rerender();
        this.columnsManager.rerender();
    }
    binarySearchUpperBound(arr, target) {
        let start = 0;
        let end = 24;
        let mid;
        let ans = -1;
        while (start <= end) {
            mid = Math.floor((start + end) / 2);
            if (target <= arr[mid]) {
                ans = mid;
                end = mid - 1;
            }
            else {
                start = mid + 1;
            }
        }
        return ans;
    }
}
