import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
export class RowSelectionEventHandler extends PointerEventHandlerBase {
    constructor(rowsManager, columnsManager, tilesManager, selectionCoordinates) {
        super();
        this.RowDiv = document.getElementById("rowsColumn");
        this.coordinateX = 0;
        this.coordinateY = 0;
        this.ifSelectionOn = false;
        this.scrollID = null;
        this.maxDistance = 100;
        /** @type {number} Max auto-scroll speed */
        this.maxSpeed = 10;
        this.sheetDiv = document.getElementById("sheet");
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.selectionCoordinates = selectionCoordinates;
        this.currentCanvasObj = null;
        this.rowID = null;
        this.hoverIdx = -1;
        this.autoScroll = this.autoScroll.bind(this);
    }
    hitTest(event) {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement))
            return false;
        if (!this.RowDiv.contains(currentElement))
            return false;
        this.rowID = parseInt(currentElement.getAttribute("row"));
        this.currentCanvasObj = this.rowsManager.getCurrentRowCanvas(this.rowID);
        if (!this.currentCanvasObj)
            return false;
        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetY = event.clientY - currentCanvasRect.top;
        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetY);
        return this.hoverIdx === -1;
    }
    pointerDown(event) {
        console.log("success hit test");
        document.body.style.cursor = "url('./img/ArrowRight.png'), auto";
        const startRow = this.getRow(this.currentCanvasObj.rowCanvas, event.clientX, event.clientY);
        if (!startRow)
            return alert("Not a valid canvas element in row pointer down");
        this.selectionCoordinates.selectionStartRow = startRow;
        this.selectionCoordinates.selectionEndRow = startRow;
        this.selectionCoordinates.selectionStartColumn = 1;
        this.selectionCoordinates.selectionEndColumn = 1000;
        this.ifSelectionOn = true;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
        this.rerender();
        this.startAutoScroll();
    }
    pointerMove(event) {
        // if (!this.ifSelectionOn) return;
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
        console.log("before this : ", this);
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }
    autoScroll() {
        // console.log("this : ",this);
        console.log("scrolling is on at row selection");
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
        const canvasX = this.rowsManager.defaultWidth / 2;
        const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
        const endRow = this.getRow(document.elementFromPoint(canvasX, canvasY), canvasX, canvasY);
        if (endRow)
            this.selectionCoordinates.selectionEndRow = endRow;
        this.rerender();
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }
    calculateSpeed(distance) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }
    getRow(canvas, clientX, clientY) {
        if (!canvas || canvas.tagName !== "CANVAS")
            return null;
        const rect = canvas.getBoundingClientRect();
        const offsetY = clientY - rect.top;
        const currentRow = parseInt(canvas.getAttribute('row'));
        const arrIdx = currentRow - this.rowsManager.visibleRows[0].rowID;
        const rowBlock = this.rowsManager.visibleRows[arrIdx];
        return currentRow * 25 + this.binarySearchUpperBound(rowBlock.rowsPositionArr, offsetY) + 1;
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
