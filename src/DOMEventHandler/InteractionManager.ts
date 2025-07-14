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

export class InteractionManager {
    // Core managers
    private rowsManager: RowsManager;
    private columnsManager: ColumnsManager;
    private tilesManager: TilesManager;
    private cellsManager: CellsManager;
    private undoRedoManager: UndoRedoManager;
    private calculationEngineObj:CalculationEngine;
    private selectionCoordinates: MultipleSelectionCoordinates;
    
    // Event handlers
    private pointerEventHandlers: PointerEventHandlerBase[];
    private keyboardHandler: KeyboardHandler;
    private cellSelectionHandler: CellSelectionEventHandler;
    
    // DOM elements
    private sheetDiv: HTMLDivElement;
    private outerInput: HTMLInputElement;
    
    // State
    private activePointerHandler: PointerEventHandlerBase | null = null;
    private pressedKeys: Set<string> = new Set();

    constructor(
        rowsManager: RowsManager,
        columnsManager: ColumnsManager,
        tilesManager: TilesManager,
        selectionCoordinates: MultipleSelectionCoordinates,
        cellsManager: CellsManager,
        undoRedoManager: UndoRedoManager,
        calculationEngineObj:CalculationEngine
    ) {
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.cellsManager = cellsManager;
        
        this.selectionCoordinates = selectionCoordinates;
        this.undoRedoManager = undoRedoManager;
        
        // Initialize DOM elements
        this.sheetDiv = document.getElementById("sheet") as HTMLDivElement;
        this.outerInput = document.getElementById("outerInputBar") as HTMLInputElement;
        
        if (!this.sheetDiv || !this.outerInput) {
            throw new Error("Required DOM elements not found");
        }
        
        this.calculationEngineObj=calculationEngineObj;
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

        // Initialize event handlers
        this.pointerEventHandlers = this.createPointerEventHandlers();
        this.keyboardHandler = new KeyboardHandler(
            this.undoRedoManager,
            this.cellSelectionHandler
        );
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log("InteractionManager initialized with handlers:", this.pointerEventHandlers);
    }

    /**
     * Create and return array of pointer event handlers
     */
    private createPointerEventHandlers(): PointerEventHandlerBase[] {
        const rowResizeHandler = new RowResizeEventHandler(
            this.rowsManager,
            this.tilesManager,
            this.undoRedoManager
        );

        const columnResizeHandler = new ColumnsResizeEventHandler(
            this.columnsManager,
            this.tilesManager,
            this.undoRedoManager
        );

        const rowSelectionHandler = new RowSelectionEventHandler(
            this.rowsManager,
            this.columnsManager,
            this.tilesManager,
            this.selectionCoordinates
        );

        const columnSelectionHandler = new ColumnSelectionEventHandler(
            this.rowsManager,
            this.columnsManager,
            this.tilesManager,
            this.selectionCoordinates
        );

        

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
    private setupEventListeners(): void {
        this.setupPointerEventListeners();
        this.setupKeyboardEventListeners();
        this.setupResizeEventListeners();
        // this.setupWindowEventListeners();
    }

    /**
     * Setup pointer event listeners
     */
    private setupPointerEventListeners(): void {
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
    private setupKeyboardEventListeners(): void {
        window.addEventListener("keydown", (event) => {
            this.handleKeyDown(event);
            if(event.shiftKey) this.calculationEngineObj.handleSelection();
        });

        window.addEventListener("keyup", (event) => {
            this.handleKeyUp(event);

        });
    }

   private setupResizeEventListeners():void{
    window.addEventListener("resize",(event)=>{
        console.log("resizing");
    })
   }

    /**
     * Handle pointer down events
     */
    private handlePointerDown(event: PointerEvent): void {
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
    private handlePointerMove(event: PointerEvent): void {
        if (!this.activePointerHandler) this.getResizeCursor(event);
        
        else    this.activePointerHandler.pointerMove(event);
    }

    /**
     * Handle pointer up events
     */
    private handlePointerUp(event: PointerEvent): void {
        if (!this.activePointerHandler) return;
        
        this.activePointerHandler.pointerUp(event);
        this.activePointerHandler = null;
    }

    /**
     * Handle keyboard key down events
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // Update pressed keys state
        this.pressedKeys.add(event.key);
        
        // Delegate to keyboard handler
        this.keyboardHandler.handleKeyDown(event);
    }

    /**
     * Handle keyboard key up events
     */
    private handleKeyUp(event: KeyboardEvent): void {
        // Update pressed keys state
        this.pressedKeys.delete(event.key);
        
        // Delegate to keyboard handler
        this.keyboardHandler.handleKeyUp(event);
    }

    /**
     * Handle window click events
     */
    private handleWindowClick(event: MouseEvent): void {
        // Delegate to cell selection handler for input focus management
        this.cellSelectionHandler.handleWindowClick(event);
    }

    /**
     * Get current pressed keys (for debugging or external access)
     */
    public getPressedKeys(): Set<string> {
        return new Set(this.pressedKeys);
    }

    /**
     * Check if a specific key is currently pressed
     */
    public isKeyPressed(key: string): boolean {
        return this.pressedKeys.has(key);
    }

    /**
     * Get the currently active pointer handler
     */
    public getActivePointerHandler(): PointerEventHandlerBase | null {
        return this.activePointerHandler;
    }

    /**
     * Get the keyboard handler instance
     */
    public getKeyboardHandler(): KeyboardHandler {
        return this.keyboardHandler;
    }

    /**
     * Get the cell selection handler instance
     */
    public getCellSelectionHandler(): CellSelectionEventHandler {
        return this.cellSelectionHandler;
    }

    getResizeCursor(event:PointerEvent){
        this.rowResizeCursor(event);
        this.columnResizeCursor(event);
    }


    private rowResizeCursor(event:PointerEvent){
        const currentElement=event.target;
        if(!currentElement || !(currentElement instanceof HTMLCanvasElement) || !(this.rowsManager.rowsDivContainer.contains(currentElement))) return ;

        const rowID=parseInt(currentElement.getAttribute("row") as string);
        const currentCanvasObj=this.rowsManager.getCurrentRowCanvas(rowID);

        if(!currentCanvasObj) return ;
        const currentCanvasRect=currentElement.getBoundingClientRect();

        const offsetY=event.clientY - currentCanvasRect.top;


        let hoverIdx=currentCanvasObj.binarySearchRange(offsetY);
        console.log("hover IDX is : ",hoverIdx);
        // hoverIdx=this.rowsManager.getCurrentRowCanvas()

        if(hoverIdx===-1){
            document.body.style.cursor="";
        }else{
            document.body.style.cursor="ns-resize";
        }
    }

    private columnResizeCursor(event:PointerEvent){
        const currentElement=event.target;
        if(!currentElement || !(currentElement instanceof HTMLCanvasElement) || !(this.columnsManager.columnsDivContainer.contains(currentElement))) return ;

        const columnID=parseInt(currentElement.getAttribute("col") as string);

        const currentCanvasObj=this.columnsManager.getCurrentColumnCanvas(columnID);

        if(!currentCanvasObj) return ;

        const currentCanvasRect=currentElement.getBoundingClientRect();

        const offsetX=event.clientX - currentCanvasRect.left;


        let hoverIdx=currentCanvasObj.binarySearchRange(offsetX);


        if(hoverIdx===-1){
            document.body.style.cursor="";
        }else{
            document.body.style.cursor="ew-resize";
        }
    }

    /**
     * Cleanup method to remove event listeners
     */
    public cleanup(): void {
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