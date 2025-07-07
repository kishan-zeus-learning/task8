import { TextEditOperation } from "./TextEditOperation.js";
/**
 * Manages cell, row, and column selection, editing, and input interactions
 */
export class CellSelectionManager {
    /**
     * Initializes CellSelectionManager
     * @param {RowsManager} rowsManager
     * @param {TilesManager} tilesManager
     * @param {ColumnsManager} columnsManager
     * @param {GlobalBoolean} ifTilesSelectionOn
     * @param {GlobalBoolean} ifRowsSelectionOn
     * @param {GlobalBoolean} ifColumnSelectionOn
     * @param {MultipleSelectionCoordinates} selectionCoordinates
     * @param {CellsManager} cellsManager
     */
    constructor(rowsManager, tilesManager, columnsManager, ifTilesSelectionOn, ifRowsSelectionOn, ifColumnSelectionOn, selectionCoordinates, cellsManager, undoRedoManager) {
        /** @type {number} X coordinate for selection or auto-scroll */
        this.coordinateX = 0;
        /** @type {number} Y coordinate for selection or auto-scroll */
        this.coordinateY = 0;
        /** @type {number | null} Stores requestAnimationFrame ID for auto-scrolling */
        this.scrollId = null;
        /** @type {number} Max distance used to calculate auto-scroll speed */
        this.maxDistance = 100;
        /** @type {number} Max auto-scroll speed */
        this.maxSpeed = 10;
        /** @type {GlobalBoolean} Tracks focus state of input */
        this.inputFocus = { value: false };
        /** @type {HTMLInputElement | null} Editable input box for cell editing */
        this.inputDiv = null;
        /** @type {GlobalBoolean} Whether Shift key is currently pressed */
        this.ifShiftDown = { value: false };
        this.ifCtrlDown = { value: false };
        /** @type {HTMLDivElement} The main sheet container element */
        this.sheetDiv = document.getElementById('sheet');
        this.ifCellEdited = false;
        this.undoRedoManager = undoRedoManager;
        this.cellsManager = cellsManager;
        this.ifTileSelectionOn = ifTilesSelectionOn;
        this.ifRowSelectionOn = ifRowsSelectionOn;
        this.ifColumnSelectionOn = ifColumnSelectionOn;
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.selectionCoordinates = selectionCoordinates;
        this.autoScroll = this.autoScroll.bind(this);
        this.init();
    }
    /**
     * Sets up DOM event listeners for selection handling
     */
    init() {
        this.tilesManager.gridDiv.addEventListener("pointerdown", (event) => this.tilePointerDown(event));
        this.rowsManager.rowsDivContainer.addEventListener("pointerdown", (event) => this.rowPointerDown(event));
        this.columnsManager.columnsDivContainer.addEventListener("pointerdown", (event) => this.columnPointerDown(event));
        this.tilesManager.gridDiv.addEventListener("dblclick", (event) => this.handleDoubleClick(event));
    }
    /**
     * Handles keyboard key release
     * @param {KeyboardEvent} event
     */
    handleKeyUp(event) {
        if (event.key === "Shift")
            this.ifShiftDown.value = false;
        if (event.key === "Control")
            this.ifCtrlDown.value = false;
    }
    /**
     * Handles key press for cell navigation and editing
     * @param {KeyboardEvent} event
     */
    handleKeyDown(event) {
        const arrowKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
        if (arrowKeys.includes(event.key)) {
            event.preventDefault();
        }
        console.log(event.key);
        switch (event.key) {
            case "ArrowUp":
                this.handleArrowUp();
                return;
            case "ArrowDown":
                this.handleArrowDown();
                return;
            case "ArrowLeft":
                this.handleArrowLeft();
                return;
            case "ArrowRight":
                this.handleArrowRight();
                return;
            case "Enter":
                this.ifShiftDown.value ? this.handleArrowUp() : this.handleArrowDown();
                return;
            case "Shift":
                this.ifShiftDown.value = true;
                return;
            case "Control":
                this.ifCtrlDown.value = true;
                return;
            case "z":
            case "Z":
                if (this.ifCtrlDown.value && !this.inputFocus.value) {
                    this.undoRedoManager.undo();
                    return;
                }
            case "y":
            case "Y":
                if (this.ifCtrlDown.value && !this.inputFocus.value) {
                    this.undoRedoManager.redo();
                    return;
                }
            default:
                if (!this.inputFocus.value)
                    this.directInput();
        }
    }
    /** Moves selection one row up */
    handleArrowUp() {
        this.selectionCoordinates.selectionStartRow = Math.max(1, this.selectionCoordinates.selectionStartRow - 1);
        this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
        this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
        this.saveInput();
        this.rerender();
        this.handleArrowKeyScroll();
    }
    handleArrowKeyScroll() {
        this.inputDiv = document.querySelector(".cellInput");
        if (this.inputDiv) {
            const containerRect = this.sheetDiv.getBoundingClientRect();
            const inputRect = (this.inputDiv).getBoundingClientRect();
            // console.log("inputRect: ",inputRect);
            // console.log("containerRect: ",containerRect);
            if (containerRect.top - inputRect.top >= 0) {
                // console.log("inside container rect : ");
                // console.log(containerRect.top+25 - inputRect.top);
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
    }
    /** Moves selection one row down */
    handleArrowDown() {
        this.selectionCoordinates.selectionStartRow = Math.min(1000000, this.selectionCoordinates.selectionStartRow + 1);
        this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
        this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
        this.saveInput();
        this.rerender();
        this.handleArrowKeyScroll();
    }
    /** Moves selection one column left */
    handleArrowLeft() {
        this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
        this.selectionCoordinates.selectionStartColumn = Math.max(1, this.selectionCoordinates.selectionStartColumn - 1);
        this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
        this.saveInput();
        this.rerender();
        this.handleArrowKeyScroll();
    }
    /** Moves selection one column right */
    handleArrowRight() {
        this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
        this.selectionCoordinates.selectionStartColumn = Math.min(1000, this.selectionCoordinates.selectionStartColumn + 1);
        this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
        this.saveInput();
        this.rerender();
        this.handleArrowKeyScroll();
    }
    /**
     * Handles global click to commit input if clicked outside
     * @param {MouseEvent} event
     */
    handleWindowClick(event) {
        if (!this.inputDiv || event.target === this.inputDiv)
            return;
        this.saveInput();
        this.rerender();
    }
    /**
     * Handles double-click on a cell to start editing
     * @param {MouseEvent} event
     */
    handleDoubleClick(event) {
        this.inputDiv = document.querySelector(".cellInput");
        this.inputDiv.style.visibility = "visible";
        this.inputDiv.focus({ preventScroll: true });
        this.putInput();
        this.inputFocus.value = true;
        this.ifCellEdited = true;
    }
    /**
     * Activates direct input without double-click
     */
    directInput() {
        this.inputDiv = document.querySelector(".cellInput");
        this.inputDiv.style.visibility = "visible";
        this.inputDiv.value = "";
        this.inputDiv.focus({ preventScroll: true });
        this.inputFocus.value = true;
        this.ifCellEdited = true;
    }
    /**
     * Saves the current input back to cell data
     */
    saveInput() {
        if (!this.inputDiv || !this.ifCellEdited)
            return;
        const r = parseInt(this.inputDiv.getAttribute('row'));
        const c = parseInt(this.inputDiv.getAttribute('col'));
        // this.cellsManager.manageCellUpdate(r, c, this.inputDiv.value);
        const operation = new TextEditOperation(this.cellsManager, r, c, this.cellsManager.getCellValue(r, c), this.inputDiv.value, this.tilesManager);
        this.undoRedoManager.execute(operation);
        this.inputDiv.value = "";
        this.inputDiv.style.visibility = "hidden";
        this.inputDiv = null;
        this.inputFocus.value = false;
        this.ifCellEdited = false;
    }
    /**
     * Fills input box with cell value when editing starts
     */
    putInput() {
        if (!this.inputDiv)
            return;
        const r = parseInt(this.inputDiv.getAttribute('row'));
        const c = parseInt(this.inputDiv.getAttribute('col'));
        this.inputDiv.value = this.cellsManager.getCellValue(r, c);
    }
    /**
     * Handles pointer down event on column headers for selection
     * @param {PointerEvent} event
     */
    columnPointerDown(event) {
        if (this.ifColumnResize(event))
            return;
        const startColumn = this.getColumn(event.target, event.clientX, event.clientY);
        if (!startColumn)
            return console.log("Not a valid canvas element in column pointer down");
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
    rowPointerDown(event) {
        if (this.ifRowResize(event))
            return;
        const startRow = this.getRow(event.target, event.clientX, event.clientY);
        if (!startRow)
            return console.log("Not a valid canvas element in row pointer down");
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
    getColumn(canvas, clientX, clientY) {
        if (!canvas || canvas.tagName !== "CANVAS")
            return null;
        const rect = canvas.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const currentCol = parseInt(canvas.getAttribute('col'));
        const arrIdx = currentCol - this.columnsManager.visibleColumns[0].columnID;
        const colBlock = this.columnsManager.visibleColumns[arrIdx];
        return currentCol * 25 + this.binarySearchUpperBound(colBlock.columnsPositionArr, offsetX) + 1;
    }
    /**
     * Calculates row number under cursor
     */
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
    /**
     * Gets the row and column within a tile (grid cell canvas)
     */
    getTileRowColumn(canvas, clientX, clientY) {
        if (!canvas || canvas.tagName !== 'CANVAS')
            return null;
        const rect = canvas.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;
        const currentRow = parseInt(canvas.getAttribute('row'));
        const currentCol = parseInt(canvas.getAttribute('col'));
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
    calculateSpeed(distance) {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }
    /**
     * Starts the continuous auto-scroll loop
     */
    startAutoScroll() {
        if (this.scrollId !== null)
            return;
        this.scrollId = requestAnimationFrame(this.autoScroll);
    }
    /**
     * Auto-scrolls the sheet when selection drags outside viewport
     */
    autoScroll() {
        if (!this.ifTileSelectionOn.value && !this.ifRowSelectionOn.value && !this.ifColumnSelectionOn.value) {
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
        if (this.ifTileSelectionOn.value) {
            const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));
            const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
            const rc = this.getTileRowColumn(document.elementFromPoint(canvasX, canvasY), canvasX, canvasY);
            if (rc) {
                this.selectionCoordinates.selectionEndRow = rc.row;
                this.selectionCoordinates.selectionEndColumn = rc.col;
            }
        }
        if (this.ifRowSelectionOn.value) {
            const canvasX = this.rowsManager.defaultWidth / 2;
            const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
            const endRow = this.getRow(document.elementFromPoint(canvasX, canvasY), canvasX, canvasY);
            if (endRow)
                this.selectionCoordinates.selectionEndRow = endRow;
        }
        if (this.ifColumnSelectionOn.value) {
            const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));
            const canvasY = 216 + this.columnsManager.defaultHeight / 2;
            const endColumn = this.getColumn(document.elementFromPoint(canvasX, canvasY), canvasX, canvasY);
            if (endColumn)
                this.selectionCoordinates.selectionEndColumn = endColumn;
        }
        this.rerender();
        this.scrollId = requestAnimationFrame(this.autoScroll);
    }
    /**
     * Stores pointer position and updates if selection is active
     */
    pointerMove(event) {
        if (!this.ifTileSelectionOn.value && !this.ifRowSelectionOn.value && !this.ifColumnSelectionOn.value)
            return;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }
    /**
     * Handles pointer down on grid to start selection
     */
    tilePointerDown(event) {
        const rc = this.getTileRowColumn(event.target, event.clientX, event.clientY);
        if (!rc)
            return;
        if (this.inputDiv) {
            const r = parseInt(this.inputDiv.getAttribute('row'));
            const c = parseInt(this.inputDiv.getAttribute('col'));
            if (rc.row === r && rc.col === c)
                return;
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
    pointerUp(_event) {
        this.ifTileSelectionOn.value = false;
        this.ifRowSelectionOn.value = false;
        this.ifColumnSelectionOn.value = false;
        console.log("selection coordinates : ", this.selectionCoordinates);
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
    /**
     * Checks if column resize handle is targeted
     */
    ifColumnResize(event) {
        const target = event.target;
        return target.tagName === "CANVAS" && target.classList.contains("columnResizeCanvas");
    }
    /**
     * Checks if row resize handle is targeted
     */
    ifRowResize(event) {
        const target = event.target;
        return target.tagName === "CANVAS" && target.classList.contains("rowResizeCanvas");
    }
}
