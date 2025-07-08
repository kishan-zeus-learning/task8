import { RowsManager } from "./RowsManager";
import { TilesManager } from "./TilesManager";
import { ColumnsManager } from "./ColumnsManager";
import { BooleanObj } from "./types/BooleanObj.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";
import { CellsManager } from "./CellsManager";
import { UndoRedoManager } from "./UndoRedoManager";
import { Operation } from "./types/Operation.js";
import { TextEditOperation } from "./TextEditOperation.js";
import { ResizeManager } from "./ResizeManager";

/**
 * Manages cell, row, and column selection, editing, and input interactions
 */
export class CellSelectionManager {
    /** @type {number} X coordinate for selection or auto-scroll */
    coordinateX = 0;

    /** @type {number} Y coordinate for selection or auto-scroll */
    coordinateY = 0;

    /** @type {number | null} Stores requestAnimationFrame ID for auto-scrolling */
    scrollId: number | null = null;

    /** @type {BooleanObj} Controls tile selection activity */
    ifTileSelectionOn: BooleanObj;

    /** @type {BooleanObj} Controls row selection activity */
    ifRowSelectionOn: BooleanObj;

    /** @type {BooleanObj} Controls column selection activity */
    ifColumnSelectionOn: BooleanObj;

    /** @type {number} Max distance used to calculate auto-scroll speed */
    readonly maxDistance: number = 100;

    /** @type {number} Max auto-scroll speed */
    readonly maxSpeed: number = 10;

    /** @type {MultipleSelectionCoordinates} Holds selection range coordinates */
    selectionCoordinates: MultipleSelectionCoordinates;

    /** @type {RowsManager} Manages rows and related logic */
    private rowsManager: RowsManager;

    /** @type {TilesManager} Manages cell grid/tile interactions */
    private tilesManager: TilesManager;

    /** @type {ColumnsManager} Manages columns and related logic */
    private columnsManager: ColumnsManager;

    /** @type {CellsManager} Manages cell data and updates */
    private cellsManager: CellsManager;

    /** @type {BooleanObj} Tracks focus state of input */
    private inputFocus: BooleanObj = { value: false };

    /** @type {HTMLInputElement | null} Editable input box for cell editing */
    private inputDiv: HTMLInputElement | null = null;

    /** @type {BooleanObj} Whether Shift key is currently pressed */
    private ifShiftDown: BooleanObj = { value: false };

    private ifCtrlDown: BooleanObj = {value:false};

    /** @type {HTMLDivElement} The main sheet container element */
    private sheetDiv = document.getElementById('sheet') as HTMLDivElement;


    private undoRedoManager:UndoRedoManager;

    private resizeManager:ResizeManager;

    private ifCellEdited:boolean=false;

    private outerInput:HTMLInputElement;

    private outerInputFocus:boolean=false;
    

    /**
     * Initializes CellSelectionManager
     * @param {RowsManager} rowsManager 
     * @param {TilesManager} tilesManager 
     * @param {ColumnsManager} columnsManager 
     * @param {BooleanObj} ifTilesSelectionOn 
     * @param {BooleanObj} ifRowsSelectionOn 
     * @param {BooleanObj} ifColumnSelectionOn 
     * @param {MultipleSelectionCoordinates} selectionCoordinates 
     * @param {CellsManager} cellsManager 
     */
    constructor(
        rowsManager: RowsManager,
        tilesManager: TilesManager,
        columnsManager: ColumnsManager,
        ifTilesSelectionOn: BooleanObj,
        ifRowsSelectionOn: BooleanObj,
        ifColumnSelectionOn: BooleanObj,
        selectionCoordinates: MultipleSelectionCoordinates,
        cellsManager: CellsManager,
        undoRedoManager:UndoRedoManager,
        resizeManager: ResizeManager,
        outerInput:HTMLInputElement,
        
    ) {
        this.undoRedoManager=undoRedoManager;
        this.outerInput=outerInput;
        this.cellsManager = cellsManager;
        this.ifTileSelectionOn = ifTilesSelectionOn;
        this.ifRowSelectionOn = ifRowsSelectionOn;
        this.ifColumnSelectionOn = ifColumnSelectionOn;
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.selectionCoordinates = selectionCoordinates;
        this.resizeManager=resizeManager;
        this.autoScroll = this.autoScroll.bind(this);
        this.init();
    }

    /**
     * Sets up DOM event listeners for selection handling
     */
    private init() {
        this.tilesManager.gridDiv.addEventListener("pointerdown", (event) => this.tilePointerDown(event));
        this.rowsManager.rowsDivContainer.addEventListener("pointerdown", (event) => this.rowPointerDown(event));
        this.columnsManager.columnsDivContainer.addEventListener("pointerdown", (event) => this.columnPointerDown(event));
        this.tilesManager.gridDiv.addEventListener("dblclick", (event) => this.handleDoubleClick(event));
    }

    /**
     * Handles keyboard key release
     * @param {KeyboardEvent} event 
     */
    handleKeyUp(event: KeyboardEvent) {
        if (event.key === "Shift") this.ifShiftDown.value = false;
        if(event.key === "Control") this.ifCtrlDown.value=false;
    }

    /**
     * Handles key press for cell navigation and editing
     * @param {KeyboardEvent} event 
     */
    handleKeyDown(event: KeyboardEvent) {

        if(this.outerInputFocus) return ;
         const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

        if (arrowKeys.includes(event.key)) {
            event.preventDefault();
        }

        console.log(event.key);
        switch (event.key) {
            case "ArrowUp":
                this.handleArrowUp(); return;
            case "ArrowDown":
                this.handleArrowDown(); return;
            case "ArrowLeft":
                this.handleArrowLeft(); return;
            case "ArrowRight":
                this.handleArrowRight(); return;
            case "Enter":
                this.ifShiftDown.value ? this.handleArrowUp(true) : this.handleArrowDown();
                return;
            case "Shift":
                this.ifShiftDown.value = true;
                return;
            case "Control":
                this.ifCtrlDown.value=true;
                return ;

            case "z":
            case "Z":
                if(this.ifCtrlDown.value && !this.inputFocus.value){
                    this.undoRedoManager.undo();
                    return ;
                }

            case "y":
            case "Y":
                if(this.ifCtrlDown.value && !this.inputFocus.value){
                    this.undoRedoManager.redo();
                    return;
                }
            default:
                if (!this.inputFocus.value) this.directInput();
        }
    }


    

    /** Moves selection one row up */
    private handleArrowUp(ifEnter:boolean=false) {
        if(this.ifShiftDown.value && !ifEnter){
            this.selectionCoordinates.selectionEndRow=Math.max(1,this.selectionCoordinates.selectionEndRow-1);
        }else{

            this.selectionCoordinates.selectionStartRow = Math.max(1, this.selectionCoordinates.selectionStartRow - 1);
            this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
            this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
            this.saveInput();
        }
        this.rerender();
        this.handleArrowKeyScroll();
    }

    private handleArrowKeyScroll(){
        this.inputDiv=document.querySelector(".cellInput");
        if(this.inputDiv){
            const containerRect=this.sheetDiv.getBoundingClientRect();
            const inputRect=(this.inputDiv).getBoundingClientRect();
            if(containerRect.top - inputRect.top>=0){
                this.sheetDiv.scrollBy(0,inputRect.top - containerRect.top-25);
            }

            if(inputRect.bottom - containerRect.bottom>=0){
                this.sheetDiv.scrollBy(0,inputRect.bottom+18 - containerRect.bottom);
            }

            if(containerRect.left - inputRect.left>=0){
                this.sheetDiv.scrollBy(inputRect.left-containerRect.left-50,0);
            }

            if(inputRect.right - containerRect.right>=0){
                this.sheetDiv.scrollBy(inputRect.right+18 - containerRect.right,0);
            }
        }
    }

    /** Moves selection one row down */
    private handleArrowDown() {
        if(this.ifShiftDown.value){
            this.selectionCoordinates.selectionEndRow=Math.min(1000000,this.selectionCoordinates.selectionEndRow+1);
        }else{

            this.selectionCoordinates.selectionStartRow = Math.min(1000000, this.selectionCoordinates.selectionStartRow + 1);
            this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
            this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
            this.saveInput();
        }
        this.rerender();
        this.handleArrowKeyScroll();
    }

    /** Moves selection one column left */
    private handleArrowLeft() {
        if(this.ifShiftDown.value){
            this.selectionCoordinates.selectionEndColumn=Math.max(1,this.selectionCoordinates.selectionEndColumn-1);   
        }else{

            this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
            this.selectionCoordinates.selectionStartColumn = Math.max(1, this.selectionCoordinates.selectionStartColumn - 1);
            this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
            this.saveInput();
        }
        this.rerender();
        this.handleArrowKeyScroll();
    }

    /** Moves selection one column right */
    private handleArrowRight() {
        if(this.ifShiftDown.value){
            this.selectionCoordinates.selectionEndColumn=Math.min(1000,this.selectionCoordinates.selectionEndColumn+1);
        }else{

            this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
            this.selectionCoordinates.selectionStartColumn = Math.min(1000, this.selectionCoordinates.selectionStartColumn + 1);
            this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
            this.saveInput();
        }
        this.rerender();
        this.handleArrowKeyScroll();
    }

    /**
     * Handles global click to commit input if clicked outside
     * @param {MouseEvent} event 
     */
    handleWindowClick(event: MouseEvent) {
        // console.log("clicked : ",event.target);
        if(event.target===this.outerInput){
            this.outerInputFocus=true;
        }else{
            this.outerInputFocus=false;
        }
        if (!this.inputDiv || event.target === this.inputDiv) return;
        this.saveInput();
        this.rerender();
    }

    /**
     * Handles double-click on a cell to start editing
     * @param {MouseEvent} event 
     */
    private handleDoubleClick(event: MouseEvent) {
        this.inputDiv = document.querySelector(".cellInput") as HTMLInputElement;
        this.inputDiv.style.visibility = "visible";
        this.inputDiv.focus({preventScroll:true});
        this.putInput();
        this.inputFocus.value = true;
        this.ifCellEdited=true;
    }

    /**
     * Activates direct input without double-click
     */
    private directInput() {
        this.inputDiv = document.querySelector(".cellInput") as HTMLInputElement;
        this.inputDiv.style.visibility = "visible";
        this.inputDiv.value = "";
        this.inputDiv.focus({preventScroll:true});

        this.inputFocus.value = true;
        this.ifCellEdited=true;
    }

    /**
     * Saves the current input back to cell data
     */
    private saveInput() {
        if (!this.inputDiv || !this.ifCellEdited) return;
        const r = parseInt(this.inputDiv.getAttribute('row') as string);
        const c = parseInt(this.inputDiv.getAttribute('col') as string);
        // this.cellsManager.manageCellUpdate(r, c, this.inputDiv.value);
        const operation = new TextEditOperation(this.cellsManager,r,c,this.cellsManager.getCellValue(r,c),this.inputDiv.value,this.tilesManager);
        this.undoRedoManager.execute(operation);
        this.inputDiv.value = "";
        this.inputDiv.style.visibility = "hidden";
        this.inputDiv = null;
        this.inputFocus.value = false;
        this.ifCellEdited=false;
    }

    /**
     * Fills input box with cell value when editing starts
     */
    private putInput() {
        if (!this.inputDiv) return;
        const r = parseInt(this.inputDiv.getAttribute('row') as string);
        const c = parseInt(this.inputDiv.getAttribute('col') as string);
        this.inputDiv.value = this.cellsManager.getCellValue(r, c);
    }

    /**
     * Handles pointer down event on column headers for selection
     * @param {PointerEvent} event 
     */
    private columnPointerDown(event: PointerEvent) {
        if (this.resizeManager.ifColumnResizeOn.value || this.resizeManager.ifColumnResizePointerDown.value) return;

        const startColumn = this.getColumn(event.target as HTMLElement, event.clientX, event.clientY);
        if (!startColumn) return console.log("Not a valid canvas element in column pointer down");

        this.selectionCoordinates.selectionStartRow = 1;
        this.selectionCoordinates.selectionEndRow = 1000000;
        this.selectionCoordinates.selectionStartColumn = startColumn;
        this.selectionCoordinates.selectionEndColumn = startColumn;
        this.ifColumnSelectionOn.value = true;

        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;

        this.rerender();
        this.startAutoScroll();
    }

    /**
     * Handles pointer down event on row headers for selection
     * @param {PointerEvent} event 
     */
    private rowPointerDown(event: PointerEvent) {
        if (this.resizeManager.ifRowResizeOn.value || this.resizeManager.ifRowResizePointerDown.value) return;

        const startRow = this.getRow(event.target as HTMLElement, event.clientX, event.clientY);
        if (!startRow) return console.log("Not a valid canvas element in row pointer down");

        this.selectionCoordinates.selectionStartRow = startRow;
        this.selectionCoordinates.selectionEndRow = startRow;
        this.selectionCoordinates.selectionStartColumn = 1;
        this.selectionCoordinates.selectionEndColumn = 1000;
        this.ifRowSelectionOn.value = true;

        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;

        this.rerender();
        this.startAutoScroll();
    }

    /**
     * Calculates column number under cursor
     */
    private getColumn(canvas: HTMLElement, clientX: number, clientY: number) {
        if (!canvas || canvas.tagName !== "CANVAS") return null;

        const rect = canvas.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const currentCol = parseInt(canvas.getAttribute('col') as string);
        const arrIdx = currentCol - this.columnsManager.visibleColumns[0].columnID;
        const colBlock = this.columnsManager.visibleColumns[arrIdx];
        return currentCol * 25 + this.binarySearchUpperBound(colBlock.columnsPositionArr, offsetX) + 1;
    }

    /**
     * Calculates row number under cursor
     */
    private getRow(canvas: HTMLElement, clientX: number, clientY: number) {
        if (!canvas || canvas.tagName !== "CANVAS") return null;

        const rect = canvas.getBoundingClientRect();
        const offsetY = clientY - rect.top;
        const currentRow = parseInt(canvas.getAttribute('row') as string);
        const arrIdx = currentRow - this.rowsManager.visibleRows[0].rowID;
        const rowBlock = this.rowsManager.visibleRows[arrIdx];
        return currentRow * 25 + this.binarySearchUpperBound(rowBlock.rowsPositionArr, offsetY) + 1;
    }

    /**
     * Gets the row and column within a tile (grid cell canvas)
     */
    private getTileRowColumn(canvas: HTMLElement, clientX: number, clientY: number) {
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

    /**
     * Returns speed based on how far cursor is from edge
     */
    private calculateSpeed(distance: number) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }

    /**
     * Starts the continuous auto-scroll loop
     */
    private startAutoScroll() {
        if (this.scrollId !== null) return;
        this.scrollId = requestAnimationFrame(this.autoScroll);
    }

    /**
     * Auto-scrolls the sheet when selection drags outside viewport
     */
    private autoScroll() {
        if (!this.ifTileSelectionOn.value && !this.ifRowSelectionOn.value && !this.ifColumnSelectionOn.value) {
            this.scrollId = null;
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
        } else if (this.coordinateX < rect.left+50) {
            dx = -this.calculateSpeed(rect.left+50 - this.coordinateX);
        }

        this.sheetDiv.scrollBy(dx, dy);

        if (this.ifTileSelectionOn.value) {
            const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));
            const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
            const rc = this.getTileRowColumn(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX, canvasY);
            if (rc) {
                this.selectionCoordinates.selectionEndRow = rc.row;
                this.selectionCoordinates.selectionEndColumn = rc.col;
            }
        }

        if (this.ifRowSelectionOn.value) {
            const canvasX = this.rowsManager.defaultWidth / 2;
            const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
            const endRow = this.getRow(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX, canvasY);
            if (endRow) this.selectionCoordinates.selectionEndRow = endRow;
        }

        if (this.ifColumnSelectionOn.value) {
            const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));
            const canvasY = 216 + this.columnsManager.defaultHeight / 2;
            const endColumn = this.getColumn(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX, canvasY);
            if (endColumn) this.selectionCoordinates.selectionEndColumn = endColumn;
        }

        this.rerender();
        this.scrollId = requestAnimationFrame(this.autoScroll);
    }

    /**
     * Stores pointer position and updates if selection is active
     */
    pointerMove(event: PointerEvent) {
        if (!this.ifTileSelectionOn.value && !this.ifRowSelectionOn.value && !this.ifColumnSelectionOn.value) return;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }

    /**
     * Handles pointer down on grid to start selection
     */
    tilePointerDown(event: PointerEvent) {
        const rc = this.getTileRowColumn(event.target as HTMLElement, event.clientX, event.clientY);
        if (!rc) return;

        if (this.inputDiv) {
            const r = parseInt(this.inputDiv.getAttribute('row') as string);
            const c = parseInt(this.inputDiv.getAttribute('col') as string);
            if (rc.row === r && rc.col === c) return;
            this.inputDiv.style.visibility = "hidden";
            this.saveInput();
        }

        this.selectionCoordinates.selectionStartRow = rc.row;
        this.selectionCoordinates.selectionStartColumn = rc.col;
        this.selectionCoordinates.selectionEndRow = rc.row;
        this.selectionCoordinates.selectionEndColumn = rc.col;
        this.ifTileSelectionOn.value = true;

        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;

        this.rerender();
        this.startAutoScroll();
    }

    /**
     * Ends selection drag and finalizes range
     */
    pointerUp(_event: PointerEvent) {
        this.ifTileSelectionOn.value = false;
        this.ifRowSelectionOn.value = false;
        this.ifColumnSelectionOn.value = false;
    }

    /**
     * Forces re-render of tiles, rows, and columns
     */
    rerender() {
        this.tilesManager.rerender();
        this.rowsManager.rerender();
        this.columnsManager.rerender();
    }

    /**
     * Finds index where arr[idx] >= target
     */
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

    /**
     * Checks if column resize handle is targeted
     */
    // private ifColumnResize(event: PointerEvent): boolean {
    //     const target = event.target as HTMLElement;
    //     return target.tagName === "CANVAS" && target.classList.contains("columnResizeCanvas");
    // }

    /**
     * Checks if row resize handle is targeted
     */
    // private ifRowResize(event: PointerEvent): boolean {
    //     const target = event.target as HTMLElement;
    //     return target.tagName === "CANVAS" && target.classList.contains("rowResizeCanvas");
    // }
}

