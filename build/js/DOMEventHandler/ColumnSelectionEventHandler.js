import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
export class ColumnSelectionEventHandler extends PointerEventHandlerBase {
    constructor(rowsManager, columnsManager, tilesManager, selectionCoordinates) {
        super();
        this.ColumnDiv = document.getElementById("columnsRow");
        this.coordinateX = 0;
        this.coordinateY = 0;
        this.ifSelectionOn = false;
        this.scrollID = null;
        this.maxDistance = 100;
        this.maxSpeed = 10;
        this.sheetDiv = document.getElementById("sheet");
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.selectionCoordinates = selectionCoordinates;
        this.currentCanvasObj = null;
        this.columnID = null;
        this.hoverIdx = -1;
        this.autoScroll = this.autoScroll.bind(this);
    }
    hitTest(event) {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement))
            return false;
        if (!this.ColumnDiv.contains(currentElement))
            return false;
        this.columnID = parseInt(currentElement.getAttribute("col"));
        this.currentCanvasObj = this.columnsManager.getCurrentColumnCanvas(this.columnID);
        if (!this.currentCanvasObj)
            return false;
        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetX = event.clientX - currentCanvasRect.left;
        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetX);
        return this.hoverIdx === -1;
    }
    pointerDown(event) {
        document.body.style.cursor = "url('./img/ArrowDown.png'), auto";
        this.ifSelectionOn = true;
        const startColumn = this.getColumn(this.currentCanvasObj.columnCanvas, event.clientX);
        if (!startColumn)
            return alert("Not a valid canvas element in column pointer down");
        this.selectionCoordinates.selectionStartColumn = startColumn;
        this.selectionCoordinates.selectionEndColumn = startColumn;
        this.selectionCoordinates.selectionStartRow = 1;
        this.selectionCoordinates.selectionEndRow = 1000000;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
        this.rerender();
        this.startAutoScroll();
    }
    pointerMove(event) {
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }
    pointerUp(event) {
        this.ifSelectionOn = false;
        document.body.style.cursor = "";
    }
    rerender() {
        this.rowsManager.rerender();
        this.columnsManager.rerender();
        this.tilesManager.rerender();
    }
    startAutoScroll() {
        if (this.scrollID !== null)
            return;
        // console.log("before this : ", this);
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }
    autoScroll() {
        // console.log("this : ", this);
        // console.log("starting auto scroll ");
        console.log("scrolling is on at column selection");
        if (!this.ifSelectionOn) {
            this.scrollID = null;
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
        else if (this.coordinateX < rect.left + 50) {
            dx = -this.calculateSpeed(rect.left + 50 - this.coordinateX);
        }
        this.sheetDiv.scrollBy(dx, dy);
        const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));
        const canvasY = 216 + this.columnsManager.defaultHeight / 2;
        const endColumn = this.getColumn(document.elementFromPoint(canvasX, canvasY), canvasX);
        if (endColumn)
            this.selectionCoordinates.selectionEndColumn = endColumn;
        console.log("endColumn: ", this.selectionCoordinates);
        this.rerender();
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }
    calculateSpeed(distance) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }
    getColumn(canvas, clientX) {
        if (!canvas || canvas.tagName !== "CANVAS")
            return null;
        const rect = canvas.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const currentCol = parseInt(canvas.getAttribute('col'));
        const arrIdx = currentCol - this.columnsManager.visibleColumns[0].columnID;
        const colBlock = this.columnsManager.visibleColumns[arrIdx];
        // Assuming each column has a default width of 25 pixels and then using binary search within the block
        return currentCol * 25 + this.binarySearchUpperBound(colBlock.columnsPositionArr, offsetX) + 1;
    }
    binarySearchUpperBound(arr, target) {
        let start = 0, end = 24, ans = -1;
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            if (arr[mid] >= target) {
                ans = mid;
                end = mid - 1;
            }
            else {
                start = mid + 1;
            }
        }
        return ans === -1 ? 24 : ans;
    }
}
