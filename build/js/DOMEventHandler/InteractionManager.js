import { CellSelectionEventHandler } from "./CellSelectionEventHandler.js";
import { ColumnsResizeEventHandler } from "./ColumnResizeEventHandler.js";
import { ColumnSelectionEventHandler } from "./ColumnSelectionEventHandler.js";
import { RowResizeEventHandler } from "./RowResizeEventHandler.js";
import { RowSelectionEventHandler } from "./RowSelectionEventHandler.js";
import { KeyboardHandler } from "./KeyBoardHandler.js";
export class InteractionManager {
    constructor(rowsManager, columnsManager, tilesManager, selectionCoordinates, cellsManager, undoRedoManager, calculationEngineObj) {
        // State
        this.activePointerHandler = null;
        this.pressedKeys = new Set();
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.cellsManager = cellsManager;
        this.selectionCoordinates = selectionCoordinates;
        this.undoRedoManager = undoRedoManager;
        // Initialize DOM elements
        this.sheetDiv = document.getElementById("sheet");
        this.outerInput = document.getElementById("outerInputBar");
        if (!this.sheetDiv || !this.outerInput) {
            throw new Error("Required DOM elements not found");
        }
        this.calculationEngineObj = calculationEngineObj;
        this.cellSelectionHandler = new CellSelectionEventHandler(this.rowsManager, this.columnsManager, this.tilesManager, this.cellsManager, this.undoRedoManager, this.selectionCoordinates, this.outerInput, this.pressedKeys);
        // Initialize event handlers
        this.pointerEventHandlers = this.createPointerEventHandlers();
        this.keyboardHandler = new KeyboardHandler(this.undoRedoManager, this.cellSelectionHandler);
        // Setup event listeners
        this.setupEventListeners();
        console.log("InteractionManager initialized with handlers:", this.pointerEventHandlers);
    }
    /**
     * Create and return array of pointer event handlers
     */
    createPointerEventHandlers() {
        const rowResizeHandler = new RowResizeEventHandler(this.rowsManager, this.tilesManager, this.undoRedoManager);
        const columnResizeHandler = new ColumnsResizeEventHandler(this.columnsManager, this.tilesManager, this.undoRedoManager);
        const rowSelectionHandler = new RowSelectionEventHandler(this.rowsManager, this.columnsManager, this.tilesManager, this.selectionCoordinates);
        const columnSelectionHandler = new ColumnSelectionEventHandler(this.rowsManager, this.columnsManager, this.tilesManager, this.selectionCoordinates);
        return [
            rowResizeHandler,
            columnResizeHandler,
            rowSelectionHandler,
            columnSelectionHandler,
            this.cellSelectionHandler
        ];
    }
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        this.setupPointerEventListeners();
        this.setupKeyboardEventListeners();
        this.setupResizeEventListeners();
        // this.setupWindowEventListeners();
    }
    /**
     * Setup pointer event listeners
     */
    setupPointerEventListeners() {
        this.sheetDiv.addEventListener("pointerdown", (event) => {
            this.handlePointerDown(event);
        });
        window.addEventListener("pointermove", (event) => {
            this.handlePointerMove(event);
        });
        window.addEventListener("pointerup", (event) => {
            this.handlePointerUp(event);
            this.calculationEngineObj.handleSelection();
        });
    }
    /**
     * Setup keyboard event listeners
     */
    setupKeyboardEventListeners() {
        window.addEventListener("keydown", (event) => {
            this.handleKeyDown(event);
            if (event.shiftKey)
                this.calculationEngineObj.handleSelection();
        });
        window.addEventListener("keyup", (event) => {
            this.handleKeyUp(event);
        });
    }
    setupResizeEventListeners() {
        window.addEventListener("resize", (event) => {
            console.log("resizing");
        });
    }
    /**
     * Handle pointer down events
     */
    handlePointerDown(event) {
        if (this.activePointerHandler) {
            console.error("Error: Active pointer handler already exists");
            return;
        }
        // Find the appropriate handler for this event
        for (const handler of this.pointerEventHandlers) {
            if (handler.hitTest(event)) {
                this.activePointerHandler = handler;
                this.activePointerHandler.pointerDown(event);
                break;
            }
        }
    }
    /**
     * Handle pointer move events
     */
    handlePointerMove(event) {
        if (!this.activePointerHandler)
            this.getResizeCursor(event);
        else
            this.activePointerHandler.pointerMove(event);
    }
    /**
     * Handle pointer up events
     */
    handlePointerUp(event) {
        if (!this.activePointerHandler)
            return;
        this.activePointerHandler.pointerUp(event);
        this.activePointerHandler = null;
    }
    /**
     * Handle keyboard key down events
     */
    handleKeyDown(event) {
        // Update pressed keys state
        this.pressedKeys.add(event.key);
        // Delegate to keyboard handler
        this.keyboardHandler.handleKeyDown(event);
    }
    /**
     * Handle keyboard key up events
     */
    handleKeyUp(event) {
        // Update pressed keys state
        this.pressedKeys.delete(event.key);
        // Delegate to keyboard handler
        this.keyboardHandler.handleKeyUp(event);
    }
    /**
     * Handle window click events
     */
    handleWindowClick(event) {
        // Delegate to cell selection handler for input focus management
        this.cellSelectionHandler.handleWindowClick(event);
    }
    /**
     * Get current pressed keys (for debugging or external access)
     */
    getPressedKeys() {
        return new Set(this.pressedKeys);
    }
    /**
     * Check if a specific key is currently pressed
     */
    isKeyPressed(key) {
        return this.pressedKeys.has(key);
    }
    /**
     * Get the currently active pointer handler
     */
    getActivePointerHandler() {
        return this.activePointerHandler;
    }
    /**
     * Get the keyboard handler instance
     */
    getKeyboardHandler() {
        return this.keyboardHandler;
    }
    /**
     * Get the cell selection handler instance
     */
    getCellSelectionHandler() {
        return this.cellSelectionHandler;
    }
    getResizeCursor(event) {
        this.rowResizeCursor(event);
        this.columnResizeCursor(event);
    }
    rowResizeCursor(event) {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement) || !(this.rowsManager.rowsDivContainer.contains(currentElement)))
            return;
        const rowID = parseInt(currentElement.getAttribute("row"));
        const currentCanvasObj = this.rowsManager.getCurrentRowCanvas(rowID);
        if (!currentCanvasObj)
            return;
        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetY = event.clientY - currentCanvasRect.top;
        let hoverIdx = currentCanvasObj.binarySearchRange(offsetY);
        console.log("hover IDX is : ", hoverIdx);
        // hoverIdx=this.rowsManager.getCurrentRowCanvas()
        if (hoverIdx === -1) {
            document.body.style.cursor = "";
        }
        else {
            document.body.style.cursor = "ns-resize";
        }
    }
    columnResizeCursor(event) {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement) || !(this.columnsManager.columnsDivContainer.contains(currentElement)))
            return;
        const columnID = parseInt(currentElement.getAttribute("col"));
        const currentCanvasObj = this.columnsManager.getCurrentColumnCanvas(columnID);
        if (!currentCanvasObj)
            return;
        const currentCanvasRect = currentElement.getBoundingClientRect();
        const offsetX = event.clientX - currentCanvasRect.left;
        let hoverIdx = currentCanvasObj.binarySearchRange(offsetX);
        if (hoverIdx === -1) {
            document.body.style.cursor = "";
        }
        else {
            document.body.style.cursor = "ew-resize";
        }
    }
    /**
     * Cleanup method to remove event listeners
     */
    cleanup() {
        // Remove pointer event listeners
        this.sheetDiv.removeEventListener("pointerdown", this.handlePointerDown);
        window.removeEventListener("pointermove", this.handlePointerMove);
        window.removeEventListener("pointerup", this.handlePointerUp);
        // Remove keyboard event listeners
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        // Remove window event listeners
        window.removeEventListener("click", this.handleWindowClick);
        // Clear state
        this.activePointerHandler = null;
        this.pressedKeys.clear();
    }
}
