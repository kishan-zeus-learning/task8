import { RowsManager } from "../RowsManager.js";
import { ColumnsManager } from "../ColumnsManager.js";
import { TilesManager } from "../TilesManager.js";
import { CellsManager } from "../CellsManager.js";
import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager.js";
import { TextEditOperation } from "../UndoRedoManager/TextEditOperation.js";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates.js";
// import { BooleanObj } from "../types/BooleanObj.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

export class CellSelectionEventHandler extends PointerEventHandlerBase {
    private gridDiv: HTMLDivElement;
    private sheetDiv: HTMLDivElement = document.getElementById("sheet") as HTMLDivElement;
    
    private rowsManager: RowsManager;
    private columnsManager: ColumnsManager;
    private tilesManager: TilesManager;
    private cellsManager: CellsManager;
    private undoRedoManager: UndoRedoManager;
    private selectionCoordinates: MultipleSelectionCoordinates;
    private pressedKeys: Set<string>; // Passed from keyboard handler
    
    private coordinateX: number = 0;
    private coordinateY: number = 0;
    private ifSelectionOn: boolean = false;
    private scrollID: number | null = null;
    
    // Input handling
    private inputDiv: HTMLInputElement | null = null;
    private inputFocus= false ;
    private ifCellEdited: boolean = false;
    private outerInput: HTMLInputElement;
    private outerInputFocus: boolean = false;
    
    // Auto-scroll configuration
    readonly maxDistance: number = 100;
    readonly maxSpeed: number = 10;
    
    // Double-click simulation for pointer move
    private lastPointerDownTime: number = 0;
    private lastPointerDownTarget: HTMLElement | null = null;
    private readonly DOUBLE_CLICK_THRESHOLD: number = 300; // ms

    constructor(
        rowsManager: RowsManager,
        columnsManager: ColumnsManager,
        tilesManager: TilesManager,
        cellsManager: CellsManager,
        undoRedoManager: UndoRedoManager,
        selectionCoordinates: MultipleSelectionCoordinates,
        outerInput: HTMLInputElement,
        pressedKeys: Set<string>
    ) {
        super();
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.cellsManager = cellsManager;
        this.undoRedoManager = undoRedoManager;
        this.selectionCoordinates = selectionCoordinates;
        this.outerInput = outerInput;
        this.pressedKeys = pressedKeys;
        this.gridDiv = this.tilesManager.gridDiv;
        
        this.autoScroll = this.autoScroll.bind(this);
    }

    hitTest(event: PointerEvent): boolean {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement)) return false;
        console.log("hit test true");
        return this.gridDiv.contains(currentElement);
    }

    pointerDown(event: PointerEvent): void {
        if (event.button === 1) return; // Ignore middle-click
        
        const rc = this.getTileRowColumn(event.target as HTMLElement, event.clientX, event.clientY);
        if (!rc) return;

        const currentTime = Date.now();
        const isSameTarget = this.lastPointerDownTarget === event.target;
        const isWithinTimeThreshold = currentTime - this.lastPointerDownTime < this.DOUBLE_CLICK_THRESHOLD;
        
        // Handle double-click simulation
        if (isSameTarget && isWithinTimeThreshold) {
            this.handleDoubleClick(event);
            return;
        }
        
        this.lastPointerDownTime = currentTime;
        this.lastPointerDownTarget = event.target as HTMLElement;

        // Handle existing input if clicking on different cell
        if (this.inputDiv) {
            const r = parseInt(this.inputDiv.getAttribute('row') as string);
            const c = parseInt(this.inputDiv.getAttribute('col') as string);
            if (rc.row === r && rc.col === c) return; // Same cell, do nothing
            
            this.inputDiv.style.visibility = "hidden";
            this.saveInput();
        }

        // Set selection coordinates
        this.selectionCoordinates.selectionStartRow = rc.row;
        this.selectionCoordinates.selectionStartColumn = rc.col;
        this.selectionCoordinates.selectionEndRow = rc.row;
        this.selectionCoordinates.selectionEndColumn = rc.col;
        
        this.ifSelectionOn = true;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;

        this.rerender();
        this.startAutoScroll();
    }

    pointerMove(event: PointerEvent): void {
        if (!this.ifSelectionOn) return;
        
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }

    pointerUp(event: PointerEvent): void {
        this.ifSelectionOn = false;
    }

    /**
     * Handles window click to manage input focus
     */
    handleWindowClick(event: MouseEvent): void {
        if (event.target === this.outerInput) {
            this.outerInputFocus = true;
        } else {
            this.outerInputFocus = false;
        }
        
        if (!this.inputDiv || event.target === this.inputDiv) return;
        
        this.saveInput();
        this.rerender();
    }

    /**
     * Handles arrow key navigation
     */
    handleArrowKey(direction: 'up' | 'down' | 'left' | 'right', isShiftPressed: boolean = false, isEnterKey: boolean = false): void {
        const isShift = isShiftPressed && !isEnterKey;
        
        switch (direction) {
            case 'up':
                if (isShift) {
                    this.selectionCoordinates.selectionEndRow = Math.max(1, this.selectionCoordinates.selectionEndRow - 1);
                } else {
                    this.selectionCoordinates.selectionStartRow = Math.max(1, this.selectionCoordinates.selectionStartRow - 1);
                    this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
                    this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
                    this.saveInput();
                }
                break;
                
            case 'down':
                if (isShift) {
                    this.selectionCoordinates.selectionEndRow = Math.min(1000000, this.selectionCoordinates.selectionEndRow + 1);
                } else {
                    this.selectionCoordinates.selectionStartRow = Math.min(1000000, this.selectionCoordinates.selectionStartRow + 1);
                    this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
                    this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
                    this.saveInput();
                }
                break;
                
            case 'left':
                if (isShift) {
                    this.selectionCoordinates.selectionEndColumn = Math.max(1, this.selectionCoordinates.selectionEndColumn - 1);
                } else {
                    this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
                    this.selectionCoordinates.selectionStartColumn = Math.max(1, this.selectionCoordinates.selectionStartColumn - 1);
                    this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
                    this.saveInput();
                }
                break;
                
            case 'right':
                if (isShift) {
                    this.selectionCoordinates.selectionEndColumn = Math.min(1000, this.selectionCoordinates.selectionEndColumn + 1);
                } else {
                    this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
                    this.selectionCoordinates.selectionStartColumn = Math.min(1000, this.selectionCoordinates.selectionStartColumn + 1);
                    this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
                    this.saveInput();
                }
                break;
        }
        
        this.rerender();
        this.handleArrowKeyScroll();
    }

    /**
     * Handles Enter key navigation
     */
    handleEnterKey(): void {
        const isShiftPressed = this.pressedKeys.has('Shift');
        if (isShiftPressed) {
            this.handleArrowKey('up', false, true);
        } else {
            this.handleArrowKey('down', false, true);
        }
    }

    /**
     * Activates direct input without double-click
     */
    activateDirectInput(): void {
        if (this.outerInputFocus) return;
        
        this.inputDiv = document.querySelector(".cellInput") as HTMLInputElement;
        if (!this.inputDiv) return;
        
        this.inputDiv.style.visibility = "visible";
        this.inputDiv.value = "";
        this.inputDiv.focus({ preventScroll: true });
        this.inputFocus = true;
        this.ifCellEdited = true;
    }

    /**
     * Gets input focus state
     */
    isInputFocused(): boolean {
        return this.inputFocus;
    }

    /**
     * Gets outer input focus state
     */
    isOuterInputFocused(): boolean {
        return this.outerInputFocus;
    }

    private handleDoubleClick(event: PointerEvent): void {
        this.inputDiv = document.querySelector(".cellInput") as HTMLInputElement;
        if (!this.inputDiv) return;
        
        this.inputDiv.style.visibility = "visible";
        this.inputDiv.focus({ preventScroll: true });
        this.putInput();
        this.inputFocus = true;
        this.ifCellEdited = true;
    }

    private saveInput(): void {
        if (!this.inputDiv || !this.ifCellEdited) return;
        
        const r = parseInt(this.inputDiv.getAttribute('row') as string);
        const c = parseInt(this.inputDiv.getAttribute('col') as string);
        
        const operation = new TextEditOperation(
            this.cellsManager,
            r,
            c,
            this.cellsManager.getCellValue(r, c),
            this.inputDiv.value,
            this.tilesManager
        );
        
        this.undoRedoManager.execute(operation);
        this.inputDiv.value = "";
        this.inputDiv.style.visibility = "hidden";
        this.inputDiv = null;
        this.inputFocus = false;
        this.ifCellEdited = false;
    }

    private putInput(): void {
        if (!this.inputDiv) return;
        
        const r = parseInt(this.inputDiv.getAttribute('row') as string);
        const c = parseInt(this.inputDiv.getAttribute('col') as string);
        this.inputDiv.value = this.cellsManager.getCellValue(r, c);
    }

    private handleArrowKeyScroll(): void {
        this.inputDiv = document.querySelector(".cellInput");
        if (!this.inputDiv) return;
        
        const containerRect = this.sheetDiv.getBoundingClientRect();
        const inputRect = this.inputDiv.getBoundingClientRect();
        
        if (containerRect.top - inputRect.top >= 0) {
            this.sheetDiv.scrollBy(0, inputRect.top - containerRect.top - 25);
        }
        
        if (inputRect.bottom - containerRect.bottom >= 0) {
            this.sheetDiv.scrollBy(0, inputRect.bottom + 18 - containerRect.bottom);
        }
        
        if (containerRect.left - inputRect.left >= 0) {
            this.sheetDiv.scrollBy(inputRect.left - containerRect.left - 50, 0);
        }
        
        if (inputRect.right - containerRect.right >= 0) {
            this.sheetDiv.scrollBy(inputRect.right + 18 - containerRect.right, 0);
        }
    }

    private getTileRowColumn(canvas: HTMLElement, clientX: number, clientY: number): {row: number, col: number} | null {
        if (!canvas || canvas.tagName !== 'CANVAS') return null;

        const rect = canvas.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        const currentRow = parseInt(canvas.getAttribute('row') as string);
        const currentCol = parseInt(canvas.getAttribute('col') as string);

        const arrRowIdx = currentRow - this.tilesManager.visibleTiles[0][0].row;
        const arrColIdx = currentCol - this.tilesManager.visibleTiles[0][0].col;

        const tile = this.tilesManager.visibleTiles[arrRowIdx][arrColIdx];

        const row = currentRow * 25 + this.binarySearchUpperBound(tile.rowsPositionArr, offsetY) + 1;
        const col = currentCol * 25 + this.binarySearchUpperBound(tile.colsPositionArr, offsetX) + 1;

        return { row, col };
    }

    private startAutoScroll(): void {
        if (this.scrollID !== null) return;
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    private autoScroll(): void {
        console.log("scrolling is on at cell selection");
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

        // Update selection during drag
        const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));
        const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
        
        const rc = this.getTileRowColumn(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX, canvasY);
        if (rc) {
            this.selectionCoordinates.selectionEndRow = rc.row;
            this.selectionCoordinates.selectionEndColumn = rc.col;
        }

        this.rerender();
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    private calculateSpeed(distance: number): number {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }

    private rerender(): void {
        this.tilesManager.rerender();
        this.rowsManager.rerender();
        this.columnsManager.rerender();
    }

    private binarySearchUpperBound(arr: number[], target: number): number {
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