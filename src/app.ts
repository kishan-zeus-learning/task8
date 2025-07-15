// === Importing core managers ===
import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./RowsManager.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";
import { UndoRedoManager } from "./UndoRedoManager/UndoRedoManager.js";
import { JSONUpload } from "./JSONUpload.js";
import { CalculationEngine } from "./CalculationEngine.js";
import { InteractionManager } from "./DOMEventHandler/InteractionManager.js";

// === Importing types ===
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";
import { CellsMap } from "./types/CellsMap.js";
import { ColumnData } from "./types/ColumnRows.js";
import { RowData } from "./types/RowsColumn.js";
import { CellsManager } from "./CellsManager.js";

/**
 * Main application class for initializing and managing the spreadsheet-like interface
 */
class App {
    // === Core Data Structures ===

    /** @type {CellsMap} Master map holding cell values and metadata */
    private cellData: CellsMap = new Map();

    /** @type {ColumnData} Stores column-related info like width */
    private columnData: ColumnData = new Map();

    /** @type {RowData} Stores row-related info like height */
    private rowData: RowData = new Map();

    // === Selection State ===

    /** @type {MultipleSelectionCoordinates} Tracks current selection range */
    private selectionCoordinates: MultipleSelectionCoordinates = {
        selectionStartRow: 1,
        selectionEndRow: 1,
        selectionStartColumn: 1,
        selectionEndColumn: 1
    };

    // === Managers ===

    /** @type {CellsManager} Handles access to cell values */
    private CellsManagerObj: CellsManager;

    /** @type {UndoRedoManager} Manages undo and redo operations */
    private undoRedoManager: UndoRedoManager;

    /** @type {ScrollManager} Handles scroll-based rendering updates */
    private ScrollManagerObj: ScrollManager;

    /** @type {RowsManager} Controls rendering and state of rows */
    private RowsManagerObj: RowsManager;

    /** @type {ColumnsManager} Controls rendering and state of columns */
    private ColumnsManagerObj: ColumnsManager;

    /** @type {TilesManager} Manages visible cell tiles and content rendering */
    private TilesManagerObj: TilesManager;

    /** @type {JSONUpload} Handles import of spreadsheet data from JSON */
    private JSONUploadObj: JSONUpload;

    /** @type {CalculationEngine} Performs calculations like sum, avg, min, max */
    private calculationEngineObj: CalculationEngine;

    /** @type {InteractionManager} Manages user input, selection, and editing */
    private InteractionManagerObj: InteractionManager;

    /**
     * Constructs the application and initializes all subsystems
     */
    constructor() {
        // Initialize manager for handling cell content
        this.CellsManagerObj = new CellsManager(this.cellData);

        // Undo/redo history stack manager
        this.undoRedoManager = new UndoRedoManager();

        // Scroll state and viewport offsets
        this.ScrollManagerObj = new ScrollManager();

        // RowsManager controls row height, scrolling, and virtualized row rendering
        this.RowsManagerObj = new RowsManager(
            this.rowData,
            0, // initially scrolled to row 0
            this.ScrollManagerObj.verticalNum, // number of visible rows
            this.selectionCoordinates
        );

        // ColumnsManager controls column width, scrolling, and rendering
        this.ColumnsManagerObj = new ColumnsManager(
            this.columnData,
            0,
            this.ScrollManagerObj.horizontalNum, // number of visible columns
            this.selectionCoordinates
        );

        // TilesManager handles cell rendering, merging selection + data
        this.TilesManagerObj = new TilesManager(
            this.RowsManagerObj,
            this.ColumnsManagerObj,
            this.ScrollManagerObj.verticalNum,
            this.ScrollManagerObj.horizontalNum,
            this.selectionCoordinates,
            this.CellsManagerObj,
            // this.RowsManagerObj.marginTop,
            // this.ColumnsManagerObj.marginLeft
        );

        // Enables uploading JSON file to populate spreadsheet
        this.JSONUploadObj = new JSONUpload(
            this.cellData,
            this.TilesManagerObj,
            this.RowsManagerObj,
            this.ColumnsManagerObj
        );

        // Calculation engine for sum, average, count, min, max in selection
        this.calculationEngineObj = new CalculationEngine(
            this.cellData,
            this.selectionCoordinates
        );

        // DOM-level event manager for clicks, drag-selection, input, etc.
        this.InteractionManagerObj = new InteractionManager(
            this.RowsManagerObj,
            this.ColumnsManagerObj,
            this.TilesManagerObj,
            this.selectionCoordinates,
            this.CellsManagerObj,
            this.undoRedoManager,
            this.calculationEngineObj
        );

        // ScrollManager is aware of Rows/Columns and renders visible viewport
        this.ScrollManagerObj.initializeManager(
            this.ColumnsManagerObj,
            this.RowsManagerObj,
            this.TilesManagerObj
        );
    }
}

// Launch spreadsheet application
new App();