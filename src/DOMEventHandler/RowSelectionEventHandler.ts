import { ColumnsManager } from "../ColumnsManager.js";
import { RowsCanvas } from "../RowsCanvas.js";
import { RowsManager } from "../RowsManager.js";
import { TilesManager } from "../TilesManager.js";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

export class RowSelectionEventHandler extends PointerEventHandlerBase {
    private RowDiv = document.getElementById("rowsColumn") as HTMLDivElement;
    private rowsManager: RowsManager;
    private columnsManager: ColumnsManager;
    private tilesManager: TilesManager;
    private selectionCoordinates: MultipleSelectionCoordinates;
    private currentCanvasObj: RowsCanvas | null;
    private rowID: number | null;
    private hoverIdx: number;
    private coordinateX: number = 0;
    private coordinateY: number = 0;
    private ifSelectionOn: boolean = false;
    private scrollID: number | null = null;
    readonly maxDistance: number = 100;

    /** @type {number} Max auto-scroll speed */
    readonly maxSpeed: number = 10;
    private sheetDiv: HTMLDivElement = document.getElementById("sheet") as HTMLDivElement;
    constructor(rowsManager: RowsManager, columnsManager: ColumnsManager, tilesManager: TilesManager, selectionCoordinates: MultipleSelectionCoordinates) {
        super();
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.selectionCoordinates = selectionCoordinates;
        this.currentCanvasObj = null;
        this.rowID = null;
        this.hoverIdx = -1;
        this.autoScroll=this.autoScroll.bind(this);
    }

    hitTest(event: PointerEvent): boolean {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement)) return false;

        if (!this.RowDiv.contains(currentElement)) return false;

        this.rowID = parseInt(currentElement.getAttribute("row") as string);

        this.currentCanvasObj = this.rowsManager.getCurrentRowCanvas(this.rowID);

        if (!this.currentCanvasObj) return false;

        const currentCanvasRect = currentElement.getBoundingClientRect();

        const offsetY = event.clientY - currentCanvasRect.top;

        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetY);
        

        return this.hoverIdx === -1;
    }

    pointerDown(event: PointerEvent): void {
        console.log("success hit test");
        document.body.style.cursor = "url('./img/ArrowRight.png'), auto";

        const startRow = this.getRow(this.currentCanvasObj!.rowCanvas, event.clientX, event.clientY);

        if (!startRow) return alert("Not a valid canvas element in row pointer down");

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

    pointerMove(event: PointerEvent): void {
        // if (!this.ifSelectionOn) return;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }

    pointerUp(event: PointerEvent): void {
        this.ifSelectionOn=false;
        document.body.style.cursor="";
    }


    private rerender() {
        this.rowsManager.rerender();
        this.columnsManager.rerender();
        this.tilesManager.rerender();
    }

    private startAutoScroll() {
        if (this.scrollID !== null) return;
        console.log("before this : ",this);
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    private autoScroll() {
        console.log("this : ",this);
        if (!this.ifSelectionOn) {
            this.scrollID = null;
            return;
        }

        const rect = this.sheetDiv.getBoundingClientRect();
        let dx = 0, dy = 0;

        if (this.coordinateY > rect.bottom - 30) {
            dy = this.calculateSpeed(this.coordinateY - rect.bottom + 30);
        } else if (this.coordinateY < rect.top) {
            dy = -this.calculateSpeed(rect.top - this.coordinateY);
        }

        if (this.coordinateX > rect.right - 30) {
            dx = this.calculateSpeed(this.coordinateX - rect.right + 30);
        } else if (this.coordinateX < rect.left + 50) {
            dx = -this.calculateSpeed(rect.left + 50 - this.coordinateX);
        }

        this.sheetDiv.scrollBy(dx, dy);

        const canvasX = this.rowsManager.defaultWidth / 2;
        const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
        const endRow = this.getRow(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX, canvasY);
        if (endRow) this.selectionCoordinates.selectionEndRow = endRow;

        this.rerender();
        this.scrollID=requestAnimationFrame(this.autoScroll);


    }


    private calculateSpeed(distance: number) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }



    private getRow(canvas: HTMLElement, clientX: number, clientY: number) {
        if (!canvas || canvas.tagName !== "CANVAS") return null;

        const rect = canvas.getBoundingClientRect();
        const offsetY = clientY - rect.top;
        const currentRow = parseInt(canvas.getAttribute('row') as string);
        const arrIdx = currentRow - this.rowsManager.visibleRows[0].rowID;
        const rowBlock = this.rowsManager.visibleRows[arrIdx];

        return currentRow * 25 + this.binarySearchUpperBound(rowBlock.rowsPositionArr, offsetY) + 1;
    }


    private binarySearchUpperBound(arr: number[], target: number) {
        let start = 0, end = 24, ans = -1;
        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            if (arr[mid] >= target) {
                ans = mid;
                end = mid - 1;
            } else {
                start = mid + 1;
            }
        }
        return ans === -1 ? 24 : ans;
    }
}