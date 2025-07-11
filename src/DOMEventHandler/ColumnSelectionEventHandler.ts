import { ColumnsCanvas } from "../ColumnsCanvas";
import { ColumnsManager } from "../ColumnsManager";
import { RowsManager } from "../RowsManager";
import { Tile } from "../Tile";
import { TilesManager } from "../TilesManager";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

export class ColumnSelectionEventHandler extends PointerEventHandlerBase {
    private ColumnDiv = document.getElementById("columnsRow") as HTMLDivElement;
    private rowsManager: RowsManager;
    private columnsManager: ColumnsManager;
    private tilesManager: TilesManager;
    private selectionCoordinates: MultipleSelectionCoordinates;
    private currentCanvasObj: ColumnsCanvas | null;
    private columnID: number | null;
    private hoverIdx: number;
    private coordinateX: number = 0;
    private coordinateY: number = 0;
    private ifSelectionOn: boolean = false;
    private scrollID: number | null = null;
    readonly maxDistance: number = 100;

    readonly maxSpeed: number = 10;

    private sheetDiv: HTMLDivElement = document.getElementById("sheet") as HTMLDivElement;


    constructor(rowsManager: RowsManager, columnsManager: ColumnsManager, tilesManager: TilesManager, selectionCoordinates: MultipleSelectionCoordinates) {
        super();
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.selectionCoordinates = selectionCoordinates;
        this.currentCanvasObj = null;
        this.columnID = null;
        this.hoverIdx = -1;
        this.autoScroll = this.autoScroll.bind(this);
    }

    hitTest(event: PointerEvent): boolean {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement)) return false;

        if (!this.ColumnDiv.contains(currentElement)) return false;

        this.columnID = parseInt(currentElement.getAttribute("col") as string);

        this.currentCanvasObj = this.columnsManager.getCurrentColumnCanvas(this.columnID);

        if (!this.currentCanvasObj) return false;

        const currentCanvasRect = currentElement.getBoundingClientRect();

        const offsetX = event.clientX - currentCanvasRect.left;

        this.hoverIdx = this.currentCanvasObj.binarySearchRange(offsetX);

        return this.hoverIdx === -1;
    }

    pointerDown(event: PointerEvent): void {
        document.body.style.cursor = "url('./img/ArrowDown.png'), auto";

        this.ifSelectionOn=true;

        const startColumn = this.getColumn(this.currentCanvasObj!.columnCanvas, event.clientX);

        if (!startColumn) return alert("Not a valid canvas element in column pointer down");

        this.selectionCoordinates.selectionStartColumn = startColumn;
        this.selectionCoordinates.selectionEndColumn = startColumn;
        this.selectionCoordinates.selectionStartRow = 1;
        this.selectionCoordinates.selectionEndRow = 1000000;

        this.rerender();
        this.startAutoScroll();
    }

    pointerMove(event: PointerEvent): void {
        this.coordinateX=event.clientX;
        this.coordinateY=event.clientY;
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
        console.log("before this : ", this);
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }


    private autoScroll() {
        console.log("this : ", this);
        console.log("starting auto scroll ");
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

        const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));

        const canvasY = 216 + this.columnsManager.defaultHeight / 2;

        const endColumn = this.getColumn(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX);

        if (endColumn) this.selectionCoordinates.selectionEndColumn = endColumn;

        this.rerender();
        this.scrollID=requestAnimationFrame(this.autoScroll);
    }

    private calculateSpeed(distance: number) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }

    private getColumn(canvas: HTMLElement, clientX: number) {
        if (!canvas || canvas.tagName !== "CANVAS") return null;

        const rect = canvas.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const currentCol = parseInt(canvas.getAttribute('col') as string);
        const arrIdx = currentCol - this.columnsManager.visibleColumns[0].columnID;
        const colBlock = this.columnsManager.visibleColumns[arrIdx];
        // Assuming each column has a default width of 25 pixels and then using binary search within the block
        return currentCol * 25 + this.binarySearchUpperBound(colBlock.columnsPositionArr, offsetX) + 1;
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