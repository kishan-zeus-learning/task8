export class CellSelectionManager {
    constructor(rowsManager, tilesManager, columnsManager, ifMultipleSelection) {
        this.selectedCells = {};
        this.selectedRows = [];
        this.selectedColumns = [];
        this.ifMultipleSelection = ifMultipleSelection;
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.init();
    }
    selectCell(row, col) {
        // this.selectedCells.push({row,col});
    }
    deselectCell(row, col) {
    }
    init() {
        this.tilesManager.gridDiv.addEventListener("click", (event) => {
            // console.log(event.offsetX,event.offsetY);
            console.log(this.getRowColumn(event));
        });
    }
    getRowColumn(event) {
        const canvasUnderCursor = document.elementFromPoint(event.clientX, event.clientY);
        if (!canvasUnderCursor || canvasUnderCursor.tagName !== 'CANVAS') {
            return null;
        }
        const canvasElementRect = canvasUnderCursor.getBoundingClientRect();
        const offsetX = event.clientX - canvasElementRect.left;
        const offsetY = event.clientY - canvasElementRect.top;
        const currentRow = parseInt(canvasUnderCursor.getAttribute('row'));
        const currentCol = parseInt(canvasUnderCursor.getAttribute('col'));
        const arrRowIdx = currentRow - this.tilesManager.visibleTiles[0][0].row;
        const arrColIdx = currentCol - this.tilesManager.visibleTiles[0][0].col;
        const tile = this.tilesManager.visibleTiles[arrRowIdx][arrColIdx];
        const row = currentRow * 25 + this.binarySearchUpperBound(tile.rowsPositionArr, offsetY) + 1;
        const col = currentCol * 25 + this.binarySearchUpperBound(tile.colsPositionArr, offsetX) + 1;
        return { row, col };
    }
    selectCellPointerMove(event) {
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
