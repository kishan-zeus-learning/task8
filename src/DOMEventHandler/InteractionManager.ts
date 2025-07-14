import { CellsManager } from "../CellsManager.js";
import { ColumnsManager } from "../ColumnsManager.js";
import { RowsManager } from "../RowsManager.js";
import { TilesManager } from "../TilesManager.js";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates.js";
import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager.js";
import { CellSelectionEventHandler } from "./CellSelectionEventHandler.js";
import { ColumnsResizeEventHandler } from "./ColumnResizeEventHandler.js";
import { ColumnSelectionEventHandler } from "./ColumnSelectionEventHandler.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";
import { RowResizeEventHandler } from "./RowResizeEventHandler.js";
import { RowSelectionEventHandler } from "./RowSelectionEventHandler.js";
import { KeyboardHandler } from "./KeyBoardHandler.js";
import { CalculationEngine } from "../CalculationEngine.js";

/**
 * Central manager for all user interaction handlers including pointer, keyboard,
 * and selection operations. Bridges UI events with functional modules.
 */
export class InteractionManager {
    /** @type {RowsManager} Manager responsible for row operations and rendering */
    private rowsManager: RowsManager;

    /** @type {ColumnsManager} Manager responsible for column operations and rendering */
    private columnsManager: ColumnsManager;

    /** @type {TilesManager} Manager responsible for tile/cell operations and rendering */
    private tilesManager: TilesManager;

    /** @type {CellsManager} Manager responsible for cell data and operations */
    private cellsManager: CellsManager;

    /** @type {UndoRedoManager} Manager for undo/redo functionality */
    private undoRedoManager: UndoRedoManager;

    /** @type {CalculationEngine} Engine for handling formula calculations */
    private calculationEngineObj: CalculationEngine;

    /** @type {MultipleSelectionCoordinates} Tracks multiple selection coordinates */
    private selectionCoordinates: MultipleSelectionCoordinates;

    /** @type {PointerEventHandlerBase[]} Array of all registered pointer event handlers */
    private pointerEventHandlers: PointerEventHandlerBase[];

    /** @type {KeyboardHandler} Handler for keyboard input events */
    private keyboardHandler: KeyboardHandler;

    /** @type {CellSelectionEventHandler} Specialized handler for cell selection events */
    private cellSelectionHandler: CellSelectionEventHandler;

    /** @type {HTMLDivElement} Main sheet container div element */
    private sheetDiv: HTMLDivElement;

    /** @type {HTMLInputElement} Input element for formula/value entry */
    private outerInput: HTMLInputElement;

    /** @type {PointerEventHandlerBase | null} Currently active pointer handler during drag operations */
    private activePointerHandler: PointerEventHandlerBase | null = null;

    /** @type {Set<string>} Set of currently pressed keyboard keys */
    private pressedKeys: Set<string> = new Set();

    /**
     * Initializes the interaction manager with all handlers and listeners.
     * @param {RowsManager} rowsManager - Manager for row operations
     * @param {ColumnsManager} columnsManager - Manager for column operations
     * @param {TilesManager} tilesManager - Manager for tile operations
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Selection coordinate tracker
     * @param {CellsManager} cellsManager - Manager for cell data
     * @param {UndoRedoManager} undoRedoManager - Undo/redo functionality manager
     * @param {CalculationEngine} calculationEngineObj - Formula calculation engine
     */
    constructor(
        rowsManager: RowsManager,
        columnsManager: ColumnsManager,
        tilesManager: TilesManager,
        selectionCoordinates: MultipleSelectionCoordinates,
        cellsManager: CellsManager,
        undoRedoManager: UndoRedoManager,
        calculationEngineObj: CalculationEngine
    ) {
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.cellsManager = cellsManager;
        this.selectionCoordinates = selectionCoordinates;
        this.undoRedoManager = undoRedoManager;
        this.calculationEngineObj = calculationEngineObj;

        // Get required DOM elements
        this.sheetDiv = document.getElementById("sheet") as HTMLDivElement;
        this.outerInput = document.getElementById("outerInputBar") as HTMLInputElement;

        // Validate required DOM elements exist
        if (!this.sheetDiv || !this.outerInput) {
            throw new Error("Required DOM elements not found");
        }

        // Initialize cell selection handler with dependencies
        this.cellSelectionHandler = new CellSelectionEventHandler(
            this.rowsManager,
            this.columnsManager,
            this.tilesManager,
            this.cellsManager,
            this.undoRedoManager,
            this.selectionCoordinates,
            this.outerInput,
            this.pressedKeys
        );

        // Create all pointer event handlers
        this.pointerEventHandlers = this.createPointerEventHandlers();
        
        // Initialize keyboard handler
        this.keyboardHandler = new KeyboardHandler(
            this.undoRedoManager,
            this.cellSelectionHandler
        );

        // Set up all event listeners
        this.setupEventListeners();
        console.log("InteractionManager initialized with handlers:", this.pointerEventHandlers);
    }

    /**
     * Instantiates all pointer event handlers in priority order.
     * Handlers are tested in array order during hit testing.
     * @private
     * @returns {PointerEventHandlerBase[]} Array of initialized pointer handlers
     */
    private createPointerEventHandlers(): PointerEventHandlerBase[] {
        return [
            new RowResizeEventHandler(this.rowsManager, this.tilesManager, this.undoRedoManager),
            new ColumnsResizeEventHandler(this.columnsManager, this.tilesManager, this.undoRedoManager),
            new RowSelectionEventHandler(this.rowsManager, this.columnsManager, this.tilesManager, this.selectionCoordinates),
            new ColumnSelectionEventHandler(this.rowsManager, this.columnsManager, this.tilesManager, this.selectionCoordinates),
            this.cellSelectionHandler
        ];
    }

    /**
     * Sets up all necessary event listeners for user interactions.
     * @private
     */
    private setupEventListeners(): void {
        this.setupPointerEventListeners();
        this.setupKeyboardEventListeners();
        this.setupResizeEventListeners();
    }

    /**
     * Configures pointer event listeners for mouse and touch interactions.
     * @private
     */
    private setupPointerEventListeners(): void {
        // Handle pointer down events globally
        window.addEventListener("pointerdown", (e) => this.handlePointerDown(e));
        
        // Handle pointer move events globally for dragging
        window.addEventListener("pointermove", (e) => this.handlePointerMove(e));
        
        // Handle pointer up events globally and trigger calculation updates
        window.addEventListener("pointerup", (e) => {
            this.handlePointerUp(e);
            this.calculationEngineObj.handleSelection();
        });
    }

    /**
     * Configures keyboard event listeners for key press handling.
     * @private
     */
    private setupKeyboardEventListeners(): void {
        // Handle key down events and trigger calculation on shift key
        window.addEventListener("keydown", (e) => {
            this.handleKeyDown(e);
            if (e.shiftKey) this.calculationEngineObj.handleSelection();
        });

        // Handle key up events
        window.addEventListener("keyup", (e) => this.handleKeyUp(e));
    }

    /**
     * Configures window resize event listeners.
     * @private
     */
    private setupResizeEventListeners(): void {
        window.addEventListener("resize", () => {
            console.log("resizing");
        });
    }

    /**
     * Handles pointer down events by finding and activating the appropriate handler.
     * Uses hit testing to determine which handler should process the event.
     * @private
     * @param {PointerEvent} event - The pointer down event
     */
    private handlePointerDown(event: PointerEvent): void {
        // Prevent multiple active handlers
        if (this.activePointerHandler) {
            console.error("Error: Active pointer handler already exists");
            return;
        }

        // Test each handler in priority order
        for (const handler of this.pointerEventHandlers) {
            if (handler.hitTest(event)) {
                this.activePointerHandler = handler;
                handler.pointerDown(event);
                break;
            }
        }
    }

    /**
     * Handles pointer move events by delegating to active handler or updating cursor.
     * @private
     * @param {PointerEvent} event - The pointer move event
     */
    private handlePointerMove(event: PointerEvent): void {
        if (!this.activePointerHandler) {
            // No active handler, check for resize cursor updates
            this.getResizeCursor(event);
        } else {
            // Delegate to active handler
            this.activePointerHandler.pointerMove(event);
        }
    }

    /**
     * Handles pointer up events by completing the active handler operation.
     * @private
     * @param {PointerEvent} event - The pointer up event
     */
    private handlePointerUp(event: PointerEvent): void {
        if (!this.activePointerHandler) return;
        
        this.activePointerHandler.pointerUp(event);
        this.activePointerHandler = null;
    }

    /**
     * Handles key down events by tracking pressed keys and delegating to keyboard handler.
     * @private
     * @param {KeyboardEvent} event - The key down event
     */
    private handleKeyDown(event: KeyboardEvent): void {
        this.pressedKeys.add(event.key);
        this.keyboardHandler.handleKeyDown(event);
    }

    /**
     * Handles key up events by removing keys from pressed set and delegating to handler.
     * @private
     * @param {KeyboardEvent} event - The key up event
     */
    private handleKeyUp(event: KeyboardEvent): void {
        this.pressedKeys.delete(event.key);
        this.keyboardHandler.handleKeyUp(event);
    }

    /**
     * Handles window click events by delegating to cell selection handler.
     * @private
     * @param {MouseEvent} event - The mouse click event
     */
    private handleWindowClick(event: MouseEvent): void {
        this.cellSelectionHandler.handleWindowClick(event);
    }

    /**
     * Checks and updates cursor when hovering near resizable row areas.
     * Changes cursor to 'ns-resize' when hovering over row resize handles.
     * @private
     * @param {PointerEvent} event - The pointer event for cursor checking
     */
    private rowResizeCursor(event: PointerEvent): void {
        const currentElement = event.target;
        
        // Validate target is a canvas element within rows container
        if (
            !currentElement || !(currentElement instanceof HTMLCanvasElement) ||
            !this.rowsManager.rowsDivContainer.contains(currentElement)
        ) return;

        // Get row ID from canvas element
        const rowID = parseInt(currentElement.getAttribute("row") as string);
        const canvas = this.rowsManager.getCurrentRowCanvas(rowID);
        if (!canvas) return;

        // Calculate offset and check if hovering over resize handle
        const offsetY = event.clientY - currentElement.getBoundingClientRect().top;
        const hoverIdx = canvas.binarySearchRange(offsetY);

        // Update cursor based on hover state
        document.body.style.cursor = hoverIdx === -1 ? "" : "ns-resize";
    }

    /**
     * Checks and updates cursor when hovering near resizable column areas.
     * Changes cursor to 'ew-resize' when hovering over column resize handles.
     * @private
     * @param {PointerEvent} event - The pointer event for cursor checking
     */
    private columnResizeCursor(event: PointerEvent): void {
        const currentElement = event.target;
        
        // Validate target is a canvas element within columns container
        if (
            !currentElement || !(currentElement instanceof HTMLCanvasElement) ||
            !this.columnsManager.columnsDivContainer.contains(currentElement)
        ) return;

        // Get column ID from canvas element
        const columnID = parseInt(currentElement.getAttribute("col") as string);
        const canvas = this.columnsManager.getCurrentColumnCanvas(columnID);
        if (!canvas) return;

        // Calculate offset and check if hovering over resize handle
        const offsetX = event.clientX - currentElement.getBoundingClientRect().left;
        const hoverIdx = canvas.binarySearchRange(offsetX);

        // Update cursor based on hover state
        document.body.style.cursor = hoverIdx === -1 ? "" : "ew-resize";
    }

    /**
     * Determines and sets the appropriate resize cursor if needed.
     * Checks both row and column resize areas.
     * @private
     * @param {PointerEvent} event - The pointer event to check
     */
    private getResizeCursor(event: PointerEvent): void {
        this.rowResizeCursor(event);
        this.columnResizeCursor(event);
    }

    /**
     * Returns a copy of currently pressed keys.
     * @public
     * @returns {Set<string>} Set containing all currently pressed key names
     */
    public getPressedKeys(): Set<string> {
        return new Set(this.pressedKeys);
    }

    /**
     * Checks if a given key is currently pressed.
     * @public
     * @param {string} key - The key name to check
     * @returns {boolean} True if the key is currently pressed
     */
    public isKeyPressed(key: string): boolean {
        return this.pressedKeys.has(key);
    }

    /**
     * Returns the currently active pointer event handler, if any.
     * @public
     * @returns {PointerEventHandlerBase | null} Active handler or null if none active
     */
    public getActivePointerHandler(): PointerEventHandlerBase | null {
        return this.activePointerHandler;
    }

    /**
     * Returns the instance of the keyboard handler.
     * @public
     * @returns {KeyboardHandler} The keyboard handler instance
     */
    public getKeyboardHandler(): KeyboardHandler {
        return this.keyboardHandler;
    }

    /**
     * Returns the instance of the cell selection handler.
     * @public
     * @returns {CellSelectionEventHandler} The cell selection handler instance
     */
    public getCellSelectionHandler(): CellSelectionEventHandler {
        return this.cellSelectionHandler;
    }

    /**
     * Cleans up event listeners and internal state.
     * Should be called when the interaction manager is being destroyed.
     * @public
     */
    public cleanup(): void {
        // Remove all event listeners
        this.sheetDiv.removeEventListener("pointerdown", this.handlePointerDown);
        window.removeEventListener("pointermove", this.handlePointerMove);
        window.removeEventListener("pointerup", this.handlePointerUp);
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        window.removeEventListener("click", this.handleWindowClick);

        // Clear internal state
        this.activePointerHandler = null;
        this.pressedKeys.clear();
    }
}