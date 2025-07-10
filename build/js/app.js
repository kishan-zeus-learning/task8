// Importing required managers and types
import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./RowsManager.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";
import { ResizeManager } from "./ResizeManager.js";
import { CellSelectionManager } from "./CellSelectionManager.js";
import { CellsManager } from "./CellsManager.js";
import { UndoRedoManager } from "./UndoRedoManager.js";
import { JSONUpload } from "./JSONUpload.js";
import { CalculationEngine } from "./CalculationEngine.js";
/**
 * Main application class for initializing and managing the spreadsheet-like interface
 */
class App {
    /**
     * Initializes the App
     */
    constructor() {
        // Initialize boolean flags for various states
        this.ifRowResizeOn = { value: false };
        this.ifRowResizePointerDown = { value: false };
        this.ifColumnResizeOn = { value: false };
        this.ifColumnResizePointerDown = { value: false };
        this.ifTileSelectionOn = { value: false };
        this.ifRowSelectionOn = { value: false };
        this.ifColumnSelectionOn = { value: false };
        this.cellData = new Map();
        this.columnData = new Map();
        this.rowData = new Map();
        // Get reference to the outer input bar element
        this.outerInput = document.querySelector(".outerInputBar");
        // Initialize selection coordinates with default values
        this.selectionCoordinates = {
            selectionStartRow: 1,
            selectionEndRow: 1,
            selectionStartColumn: 1,
            selectionEndColumn: 1
        };
        // Initialize CalculationEngine
        this.CalculationEngineObj = new CalculationEngine(this.cellData, this.ifTileSelectionOn, this.ifRowSelectionOn, this.ifColumnSelectionOn, this.selectionCoordinates);
        // Initialize CellsManager
        this.CellsManagerObj = new CellsManager(this.cellData);
        // CellsManagerObj.manageCellUpdate(2, 2, "Hi"); // Example cell updates (commented out)
        // CellsManagerObj.manageCellUpdate(2, 3, "50"); // Example cell updates (commented out)
        // CellsManagerObj.manageCellUpdate(3, 5, "Zeus"); // Example cell updates (commented out)
        // Initialize UndoRedoManager
        this.undoRedoManager = new UndoRedoManager();
        // Initialize ScrollManager
        this.ScrollManagerObj = new ScrollManager();
        // Initialize RowsManager
        this.RowsManagerObj = new RowsManager(this.rowData, 0, this.ScrollManagerObj.verticalNum, this.ifRowResizeOn, this.ifRowResizePointerDown, this.selectionCoordinates, this.undoRedoManager);
        // Initialize ColumnsManager
        this.ColumnsManagerObj = new ColumnsManager(this.columnData, 0, this.ScrollManagerObj.horizontalNum, this.ifColumnResizeOn, this.ifColumnResizePointerDown, this.selectionCoordinates);
        // Initialize TilesManager
        this.TilesManagerObj = new TilesManager(this.RowsManagerObj.rowsPositionPrefixSumArr, this.ColumnsManagerObj.visibleColumnsPrefixSum, this.ScrollManagerObj.verticalNum, this.ScrollManagerObj.horizontalNum, this.selectionCoordinates, this.CellsManagerObj, undefined, // Placeholder for future use
        undefined, // Placeholder for future use
        this.RowsManagerObj.marginTop, this.ColumnsManagerObj.marginLeft);
        // Initialize JSONUpload
        this.JSONUploadObj = new JSONUpload(this.cellData, this.TilesManagerObj, this.RowsManagerObj, this.ColumnsManagerObj);
        // Initialize ResizeManager
        this.ResizeManagerObj = new ResizeManager(this.RowsManagerObj, this.TilesManagerObj, this.ColumnsManagerObj, this.ifRowResizeOn, this.ifRowResizePointerDown, this.ifColumnResizeOn, this.ifColumnResizePointerDown, this.undoRedoManager);
        // Initialize CellSelectionManager
        this.CellSelectionManagerObj = new CellSelectionManager(this.RowsManagerObj, this.TilesManagerObj, this.ColumnsManagerObj, this.ifTileSelectionOn, this.ifRowSelectionOn, this.ifColumnSelectionOn, this.selectionCoordinates, this.CellsManagerObj, this.undoRedoManager, this.ResizeManagerObj, this.outerInput);
        // Initialize ScrollManager with other managers
        this.ScrollManagerObj.initializeManager(this.ColumnsManagerObj, this.RowsManagerObj, this.TilesManagerObj);
        // Call the main initialization method
        this.initialize();
        // this.sheetDivListener(); // Commented out listener
    }
    /**
     * Main setup function to initialize all managers and event listeners
     */
    initialize() {
        // Add keyboard event listeners for keydown and keyup
        window.addEventListener("keydown", (event) => {
            this.CellSelectionManagerObj.handleKeyDown(event);
        });
        window.addEventListener("keyup", (event) => {
            this.CellSelectionManagerObj.handleKeyUp(event);
        });
        // Add click event listener to the window
        window.addEventListener("click", (event) => {
            this.CellSelectionManagerObj.handleWindowClick(event);
        });
        // Add pointer up event listener to the window
        window.addEventListener("pointerup", (event) => {
            this.ResizeManagerObj.pointerUpEventHandler(event); // Handle resize end
            this.CalculationEngineObj.handlePointerUpEvent(event); // Trigger calculations
            this.CellSelectionManagerObj.pointerUp(event); // Handle cell selection end
            this.cursorType(event); // Update cursor type
        });
        // Add pointer move event listener to the window
        window.addEventListener("pointermove", (event) => {
            this.ResizeManagerObj.pointerMove(event); // Handle resize movement
            this.CellSelectionManagerObj.pointerMove(event); // Handle cell selection movement
            this.cursorType(event); // Update cursor type
        });
    }
    /**
     * Sets the cursor type based on the current interaction state.
     * @param {PointerEvent} event - The pointer event.
     */
    cursorType(event) {
        switch (true) {
            // If row resize pointer is held down, show vertical resize cursor
            case this.ifRowResizePointerDown.value:
                document.body.style.cursor = "ns-resize";
                break;
            // If column resize pointer is held down, show horizontal resize cursor
            case this.ifColumnResizePointerDown.value:
                document.body.style.cursor = "ew-resize";
                break;
            // If row selection is active, show row selection cursor
            case this.ifRowSelectionOn.value:
                document.body.style.cursor = "url('./img/ArrowRight.png'), auto";
                break;
            // If column selection is active, show column selection cursor
            case this.ifColumnSelectionOn.value:
                document.body.style.cursor = "url('./img/ArrowDown.png'), auto";
                break;
            // If tile selection is active, show cell selection cursor
            case this.ifTileSelectionOn.value:
                document.body.style.cursor = "cell";
                break;
            // If row resize is active (but not necessarily pointer down), show vertical resize cursor
            case this.ifRowResizeOn.value:
                document.body.style.cursor = "ns-resize";
                break;
            // If column resize is active (but not necessarily pointer down), show horizontal resize cursor
            case this.ifColumnResizeOn.value:
                document.body.style.cursor = "ew-resize";
                break;
            // If hovering over a row, show row selection cursor
            case this.ifRowHover(event, this.RowsManagerObj):
                document.body.style.cursor = "url('./img/ArrowRight.png'), auto";
                break;
            // If hovering over a column, show column selection cursor
            case this.ifColumnHover(event, this.ColumnsManagerObj):
                document.body.style.cursor = "url('./img/ArrowDown.png'), auto";
                break;
            // If hovering over a tile, show cell selection cursor
            case this.ifTileHover(event, this.TilesManagerObj):
                document.body.style.cursor = "cell";
                break;
            // Default cursor
            default:
                document.body.style.cursor = "default";
                break;
        }
    }
    /**
     * Checks whether the pointer is currently hovering over a tile (cell area)
     * @param {PointerEvent} event - Pointer event
     * @param {TilesManager} tilesManager - TilesManager instance
     * @returns {boolean}
     */
    ifTileHover(event, tilesManager) {
        const rect = tilesManager.gridDiv.getBoundingClientRect();
        return (event.clientX <= rect.right &&
            event.clientX >= rect.left &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom);
    }
    /**
     * Checks whether the pointer is currently hovering over the row area
     * @param {PointerEvent} event - Pointer event
     * @param {RowsManager} rowsManager - RowsManager instance
     * @returns {boolean}
     */
    ifRowHover(event, rowsManager) {
        const rect = rowsManager.rowsDivContainer.getBoundingClientRect();
        return (event.clientX <= rect.right &&
            event.clientX >= rect.left &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom);
    }
    /**
     * Checks whether the pointer is currently hovering over the column area
     * @param {PointerEvent} event - Pointer event
     * @param {ColumnsManager} columnsManager - ColumnsManager instance
     * @returns {boolean}
     */
    ifColumnHover(event, columnsManager) {
        const rect = columnsManager.columnsDivContainer.getBoundingClientRect();
        return (event.clientX <= rect.right &&
            event.clientX >= rect.left &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom);
    }
}
// Instantiates the App
new App();
