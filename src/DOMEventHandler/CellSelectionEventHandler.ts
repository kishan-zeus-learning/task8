import { RowsManager } from "../RowsManager.js";
import { ColumnsManager } from "../ColumnsManager.js";
import { TilesManager } from "../TilesManager.js";
import { CellsManager } from "../CellsManager.js";
import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager.js";
import { TextEditOperation } from "../UndoRedoManager/TextEditOperation.js";
import { MultipleSelectionCoordinates } from "../types/MultipleSelectionCoordinates.js";
// import { BooleanObj } from "../types/BooleanObj.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

/**
 * Handles cell selection events including mouse interactions, keyboard navigation,
 * and input management for spreadsheet cells. Supports drag selection, auto-scrolling,
 * and editing capabilities.
 */
export class CellSelectionEventHandler extends PointerEventHandlerBase {
    /**
     * Main grid container element
     * @type {HTMLDivElement}
     */
    private gridDiv: HTMLDivElement;
    
    /**
     * Sheet container element for scrolling
     * @type {HTMLDivElement}
     */
    private sheetDiv: HTMLDivElement = document.getElementById("sheet") as HTMLDivElement;
    
    /**
     * Manager for row operations and rendering
     * @type {RowsManager}
     */
    private rowsManager: RowsManager;
    
    /**
     * Manager for column operations and rendering
     * @type {ColumnsManager}
     */
    private columnsManager: ColumnsManager;
    
    /**
     * Manager for tile-based rendering system
     * @type {TilesManager}
     */
    private tilesManager: TilesManager;
    
    /**
     * Manager for cell data and operations
     * @type {CellsManager}
     */
    private cellsManager: CellsManager;
    
    /**
     * Manager for undo/redo operations
     * @type {UndoRedoManager}
     */
    private undoRedoManager: UndoRedoManager;
    
    /**
     * Stores current selection coordinates (start and end positions)
     * @type {MultipleSelectionCoordinates}
     */
    private selectionCoordinates: MultipleSelectionCoordinates;
    
    /**
     * Set of currently pressed keys from keyboard handler
     * @type {Set<string>}
     */
    private pressedKeys: Set<string>;
    
    /**
     * Current mouse X coordinate during selection
     * @type {number}
     */
    private coordinateX: number = 0;
    
    /**
     * Current mouse Y coordinate during selection
     * @type {number}
     */
    private coordinateY: number = 0;
    
    /**
     * Flag indicating if selection is currently active
     * @type {boolean}
     */
    private ifSelectionOn: boolean = false;
    
    /**
     * Animation frame ID for auto-scroll functionality
     * @type {number | null}
     */
    private scrollID: number | null = null;
    
    // Input handling properties
    /**
     * Input element for direct cell editing
     * @type {HTMLInputElement | null}
     */
    private inputDiv: HTMLInputElement | null = null;
    
    /**
     * Flag indicating if input element has focus
     * @type {boolean}
     */
    private inputFocus= false ;
    
    /**
     * Flag indicating if cell is currently being edited
     * @type {boolean}
     */
    private ifCellEdited: boolean = false;
    
    /**
     * External input element (formula bar)
     * @type {HTMLInputElement}
     */
    private outerInput: HTMLInputElement;
    
    /**
     * Flag indicating if external input has focus
     * @type {boolean}
     */
    private outerInputFocus: boolean = false;
    
    // Auto-scroll configuration
    /**
     * Maximum distance for auto-scroll calculation
     * @type {number}
     */
    readonly maxDistance: number = 100;
    
    /**
     * Maximum scroll speed in pixels per frame
     * @type {number}
     */
    readonly maxSpeed: number = 25;
    
    // Double-click simulation for pointer move
    /**
     * Timestamp of last pointer down event
     * @type {number}
     */
    private lastPointerDownTime: number = 0;
    
    /**
     * Target element of last pointer down event
     * @type {HTMLElement | null}
     */
    private lastPointerDownTarget: HTMLElement | null = null;
    
    /**
     * Time threshold for double-click detection in milliseconds
     * @type {number}
     */
    private readonly DOUBLE_CLICK_THRESHOLD: number = 300;

    /**
     * Initializes the cell selection event handler with required managers and configuration
     * @param {RowsManager} rowsManager Manager for row operations
     * @param {ColumnsManager} columnsManager Manager for column operations
     * @param {TilesManager} tilesManager Manager for tile rendering
     * @param {CellsManager} cellsManager Manager for cell data
     * @param {UndoRedoManager} undoRedoManager Manager for undo/redo operations
     * @param {MultipleSelectionCoordinates} selectionCoordinates Selection state object
     * @param {HTMLInputElement} outerInput External input element reference
     * @param {Set<string>} pressedKeys Set of currently pressed keys
     */
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
        
        // Bind auto-scroll method to maintain correct context
        this.autoScroll = this.autoScroll.bind(this);
    }

    /**
     * Tests if the event target is within the grid area
     * @param {PointerEvent} event The pointer event to test
     * @returns {boolean} True if the event should be handled by this handler
     */
    hitTest(event: PointerEvent): boolean {
        const currentElement = event.target;
        if (!currentElement || !(currentElement instanceof HTMLCanvasElement)) return false;
        return this.gridDiv.contains(currentElement);
    }

    /**
     * Handles pointer down events for cell selection
     * Manages double-click detection, input handling, and selection initiation
     * @param {PointerEvent} event The pointer down event
     */
    pointerDown(event: PointerEvent): void {
        // Ignore middle mouse button clicks
        if (event.button === 1) return;
        
        // Get the row and column from the click position
        const rc = this.getTileRowColumn(event.target as HTMLElement, event.clientX, event.clientY);
        if (!rc) return;

        // Double-click detection logic
        const currentTime = Date.now();
        const isSameTarget = this.lastPointerDownTarget === event.target;
        const isWithinTimeThreshold = currentTime - this.lastPointerDownTime < this.DOUBLE_CLICK_THRESHOLD;
        
        // Handle double-click for cell editing
        if (isSameTarget && isWithinTimeThreshold) {
            this.handleDoubleClick(event);
            return;
        }
        
        // Update double-click detection variables
        this.lastPointerDownTime = currentTime;
        this.lastPointerDownTarget = event.target as HTMLElement;

        // Handle existing input if clicking on different cell
        if (this.inputDiv) {
            const r = parseInt(this.inputDiv.getAttribute('row') as string);
            const c = parseInt(this.inputDiv.getAttribute('col') as string);
            
            // If clicking on the same cell, do nothing
            if (rc.row === r && rc.col === c) return;
            
            // Hide input and save changes
            this.inputDiv.style.visibility = "hidden";
            this.saveInput();
        }

        // Set new selection coordinates
        this.selectionCoordinates.selectionStartRow = rc.row;
        this.selectionCoordinates.selectionStartColumn = rc.col;
        this.selectionCoordinates.selectionEndRow = rc.row;
        this.selectionCoordinates.selectionEndColumn = rc.col;
        
        // Start selection mode
        this.ifSelectionOn = true;
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;

        // Update display and start auto-scroll
        this.rerender();
        this.startAutoScroll();
    }

    /**
     * Handles pointer move events during selection
     * Updates coordinates for auto-scroll and selection extension
     * @param {PointerEvent} event The pointer move event
     */
    pointerMove(event: PointerEvent): void {
        if (!this.ifSelectionOn) return;
        
        // Update current mouse coordinates
        this.coordinateX = event.clientX;
        this.coordinateY = event.clientY;
    }

    /**
     * Handles pointer up events to end selection
     * @param {PointerEvent} event The pointer up event
     */
    pointerUp(event: PointerEvent): void {
        this.ifSelectionOn = false;
    }

    /**
     * Handles window click events to manage input focus states
     * @param {MouseEvent} event The mouse click event
     */
    handleWindowClick(event: MouseEvent): void {
        // Update outer input focus state
        if (event.target === this.outerInput) {
            this.outerInputFocus = true;
        } else {
            this.outerInputFocus = false;
        }
        
        // If clicking on input element, don't save
        if (!this.inputDiv || event.target === this.inputDiv) return;
        
        // Save input and update display
        this.saveInput();
        this.rerender();
    }

    /**
     * Handles arrow key navigation for cell selection
     * Supports both normal navigation and shift-selection
     * @param {string} direction The direction of movement ('up', 'down', 'left', 'right')
     * @param {boolean} isShiftPressed Whether shift key is pressed for selection extension
     * @param {boolean} isEnterKey Whether this is called from Enter key handler
     */
    handleArrowKey(direction: 'up' | 'down' | 'left' | 'right', isShiftPressed: boolean = false, isEnterKey: boolean = false): void {
        // Determine if we're extending selection (shift pressed but not Enter)
        const isShift = isShiftPressed && !isEnterKey;
        
        switch (direction) {
            case 'up':
                if (isShift) {
                    // Extend selection upward
                    this.selectionCoordinates.selectionEndRow = Math.max(1, this.selectionCoordinates.selectionEndRow - 1);
                } else {
                    // Move selection up
                    this.selectionCoordinates.selectionStartRow = Math.max(1, this.selectionCoordinates.selectionStartRow - 1);
                    this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
                    this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
                    this.saveInput();
                }
                break;
                
            case 'down':
                if (isShift) {
                    // Extend selection downward
                    this.selectionCoordinates.selectionEndRow = Math.min(1000000, this.selectionCoordinates.selectionEndRow + 1);
                } else {
                    // Move selection down
                    this.selectionCoordinates.selectionStartRow = Math.min(1000000, this.selectionCoordinates.selectionStartRow + 1);
                    this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
                    this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
                    this.saveInput();
                }
                break;
                
            case 'left':
                if (isShift) {
                    // Extend selection leftward
                    this.selectionCoordinates.selectionEndColumn = Math.max(1, this.selectionCoordinates.selectionEndColumn - 1);
                } else {
                    // Move selection left
                    this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
                    this.selectionCoordinates.selectionStartColumn = Math.max(1, this.selectionCoordinates.selectionStartColumn - 1);
                    this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
                    this.saveInput();
                }
                break;
                
            case 'right':
                if (isShift) {
                    // Extend selection rightward
                    this.selectionCoordinates.selectionEndColumn = Math.min(1000, this.selectionCoordinates.selectionEndColumn + 1);
                } else {
                    // Move selection right
                    this.selectionCoordinates.selectionEndRow = this.selectionCoordinates.selectionStartRow;
                    this.selectionCoordinates.selectionStartColumn = Math.min(1000, this.selectionCoordinates.selectionStartColumn + 1);
                    this.selectionCoordinates.selectionEndColumn = this.selectionCoordinates.selectionStartColumn;
                    this.saveInput();
                }
                break;
        }
        
        // Update display and handle scrolling
        this.rerender();
        this.handleArrowKeyScroll();
    }

    /**
     * Handles Enter key navigation
     * Moves selection up (with Shift) or down (without Shift)
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
     * Activates direct input mode for the currently selected cell
     * Used for immediate typing without double-click
     */
    activateDirectInput(): void {
        // Don't activate if outer input has focus
        if (this.outerInputFocus) return;
        
        // Get the cell input element
        this.inputDiv = document.querySelector(".cellInput") as HTMLInputElement;
        if (!this.inputDiv) return;
        
        // Show and focus the input element
        this.inputDiv.style.visibility = "visible";
        this.inputDiv.value = "";
        this.inputDiv.focus({ preventScroll: true });
        this.inputFocus = true;
        this.ifCellEdited = true;
    }

    /**
     * Gets the current input focus state
     * @returns {boolean} True if input element has focus
     */
    isInputFocused(): boolean {
        return this.inputFocus;
    }

    /**
     * Gets the current outer input focus state
     * @returns {boolean} True if outer input element has focus
     */
    isOuterInputFocused(): boolean {
        return this.outerInputFocus;
    }

    /**
     * Handles double-click events for cell editing
     * Shows input element and populates it with current cell value
     * @param {PointerEvent} event The pointer event that triggered the double-click
     */
    private handleDoubleClick(event: PointerEvent): void {
        // Get the cell input element
        this.inputDiv = document.querySelector(".cellInput") as HTMLInputElement;
        if (!this.inputDiv) return;
        
        // Show input, focus it, and populate with current cell value
        this.inputDiv.style.visibility = "visible";
        // this.inputDiv.focus({ preventScroll: true });
        this.inputDiv.focus();
        console.log("Focus attempt:", document.activeElement);
        this.putInput();
        this.inputFocus = true;
        this.ifCellEdited = true;
    }

    /**
     * Saves the current input value to the cell and creates an undo operation
     * Only saves if input has been edited
     */
    private saveInput(): void {
        if (!this.inputDiv || !this.ifCellEdited) return;
        
        // Get cell coordinates from input attributes
        const r = parseInt(this.inputDiv.getAttribute('row') as string);
        const c = parseInt(this.inputDiv.getAttribute('col') as string);
        
        // Create and execute text edit operation for undo/redo
        const operation = new TextEditOperation(
            this.cellsManager,
            r,
            c,
            this.cellsManager.getCellValue(r, c), // Old value
            this.inputDiv.value,                  // New value
            this.tilesManager
        );
        
        this.undoRedoManager.execute(operation);
        
        // Reset input state
        this.inputDiv.value = "";
        this.inputDiv.style.visibility = "hidden";
        this.inputDiv = null;
        this.inputFocus = false;
        this.ifCellEdited = false;
    }

    /**
     * Populates the input element with the current cell value
     * Used when entering edit mode via double-click
     */
    private putInput(): void {
        if (!this.inputDiv) return;
        
        // Get cell coordinates and populate input with cell value
        const r = parseInt(this.inputDiv.getAttribute('row') as string);
        const c = parseInt(this.inputDiv.getAttribute('col') as string);
        this.inputDiv.value = this.cellsManager.getCellValue(r, c);
    }

    /**
     * Handles scrolling when navigating with arrow keys
     * Ensures the input element stays visible within the container
     */
    private handleArrowKeyScroll(): void {
        this.inputDiv = document.querySelector(".cellInput");
        if (!this.inputDiv) return;
        
        // Get bounding rectangles for scroll calculations
        const containerRect = this.sheetDiv.getBoundingClientRect();
        const inputRect = this.inputDiv.getBoundingClientRect();
        
        // Scroll up if input is above visible area
        if (containerRect.top - inputRect.top >= 0) {
            this.sheetDiv.scrollBy(0, inputRect.top - containerRect.top - 25);
        }
        
        // Scroll down if input is below visible area
        if (inputRect.bottom - containerRect.bottom >= 0) {
            this.sheetDiv.scrollBy(0, inputRect.bottom + 18 - containerRect.bottom);
        }
        
        // Scroll left if input is to the left of visible area
        if (containerRect.left - inputRect.left >= 0) {
            this.sheetDiv.scrollBy(inputRect.left - containerRect.left - 50, 0);
        }
        
        // Scroll right if input is to the right of visible area
        if (inputRect.right - containerRect.right >= 0) {
            this.sheetDiv.scrollBy(inputRect.right + 18 - containerRect.right, 0);
        }
    }

    /**
     * Converts screen coordinates to tile row/column coordinates
     * @param {HTMLElement} canvas The canvas element that was clicked
     * @param {number} clientX The X coordinate of the click
     * @param {number} clientY The Y coordinate of the click
     * @returns {Object|null} Object with row and col properties, or null if invalid
     */
    private getTileRowColumn(canvas: HTMLElement, clientX: number, clientY: number): {row: number, col: number} | null {
        if (!canvas || canvas.tagName !== 'CANVAS') return null;

        // Calculate offset within the canvas
        const rect = canvas.getBoundingClientRect();
        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        // Get tile coordinates from canvas attributes
        const currentRow = parseInt(canvas.getAttribute('row') as string);
        const currentCol = parseInt(canvas.getAttribute('col') as string);

        // Calculate array indices for the tile
        const arrRowIdx = currentRow - this.tilesManager.visibleTiles[0][0].row;
        const arrColIdx = currentCol - this.tilesManager.visibleTiles[0][0].col;

        // Get the specific tile
        const tile = this.tilesManager.visibleTiles[arrRowIdx][arrColIdx];

        // Calculate final row and column using binary search
        const row = currentRow * 25 + this.binarySearchUpperBound(tile.rowsPositionArr, offsetY) + 1;
        const col = currentCol * 25 + this.binarySearchUpperBound(tile.colsPositionArr, offsetX) + 1;

        return { row, col };
    }

    /**
     * Starts the auto-scroll animation if not already running
     */
    private startAutoScroll(): void {
        if (this.scrollID !== null) return;
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    /**
     * Auto-scroll animation function
     * Continuously scrolls the sheet when dragging near edges
     */
    private autoScroll(): void {
        
        // Stop scrolling if selection is not active
        if (!this.ifSelectionOn) {
            this.scrollID = null;
            return;
        }

        // Calculate scroll deltas based on mouse position
        const rect = this.sheetDiv.getBoundingClientRect();
        let dx = 0, dy = 0;

        // Vertical scrolling
        if (this.coordinateY > rect.bottom - 30) {
            dy = this.calculateSpeed(this.coordinateY - rect.bottom + 30);
        } else if (this.coordinateY < rect.top) {
            dy = -this.calculateSpeed(rect.top - this.coordinateY);
        }

        // Horizontal scrolling
        if (this.coordinateX > rect.right - 30) {
            dx = this.calculateSpeed(this.coordinateX - rect.right + 30);
        } else if (this.coordinateX < rect.left + 50) {
            dx = -this.calculateSpeed(rect.left + 50 - this.coordinateX);
        }

        // Apply scroll
        this.sheetDiv.scrollBy(dx, dy);

        // Update selection during drag
        // Clamp coordinates to visible area
        const canvasX = Math.min(rect.right - 18, Math.max(this.coordinateX, rect.left + 1 + this.rowsManager.defaultWidth));
        const canvasY = Math.min(rect.bottom - 18, Math.max(this.coordinateY, this.columnsManager.defaultHeight + 1 + rect.top));
        
        // Get new selection coordinates
        const rc = this.getTileRowColumn(document.elementFromPoint(canvasX, canvasY) as HTMLElement, canvasX, canvasY);
        if (rc) {
            this.selectionCoordinates.selectionEndRow = rc.row;
            this.selectionCoordinates.selectionEndColumn = rc.col;
        }

        // Continue animation
        this.rerender();
        this.scrollID = requestAnimationFrame(this.autoScroll);
    }

    /**
     * Calculates scroll speed based on distance from edge
     * @param {number} distance Distance from container edge
     * @returns {number} Calculated scroll speed
     */
    private calculateSpeed(distance: number): number {
        return Math.min(distance / this.maxDistance, 1) * this.maxSpeed;
    }

    /**
     * Triggers rerendering of all visual components
     */
    private rerender(): void {
        this.tilesManager.rerender();
        this.rowsManager.rerender();
        this.columnsManager.rerender();
    }

    /**
     * Binary search to find the upper bound index in a sorted array
     * @param {number[]} arr The sorted array to search
     * @param {number} target The target value to find
     * @returns {number} The index of the upper bound, or 24 if not found
     */
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