// === Importing core managers ===
import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./Rows/RowsManager.js";
import { ColumnsManager } from "./Columns/ColumnsManager.js";
import { TilesManager } from "./Tiles/TilesManager.js";
import { UndoRedoManager } from "./UndoRedoManager/UndoRedoManager.js";
import { JSONUpload } from "./JSONUpload.js";
import { CalculationEngine } from "./CalculationEngine.js";
import { InteractionManager } from "./DOMEventHandler/InteractionManager.js";

// === Importing types ===
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";
import { CellsMap } from "./types/CellsMap.js";
import { ColumnData } from "./types/ColumnRows.js";
import { RowData } from "./types/RowsColumn.js";
import { CellsManager } from "./Tiles/CellsManager.js";
import { TestingMethods } from "./TestingMethods.js";

/**
 * Main application class responsible for initializing and managing the spreadsheet-like interface.
 * It orchestrates the interaction between various managers (e.g., for cells, rows, columns, tiles, scrolling, and user input)
 * to provide a functional and responsive spreadsheet experience.
 */
class App {
    // === Core Data Structures ===

    /**
     * @type {CellsMap} A master `Map` that stores all cell values and their associated metadata.
     * It's a nested map where the outer key is the row number and the inner key is the column number.
     */
    private cellData: CellsMap = new Map();

    /**
     * @type {ColumnData} A `Map` that stores column-specific information, such as custom widths,
     * keyed by column index.
     */
    private columnData: ColumnData = new Map();

    /**
     * @type {RowData} A `Map` that stores row-specific information, such as custom heights,
     * keyed by row index.
     */
    private rowData: RowData = new Map();

    // === Selection State ===

    /**
     * @type {MultipleSelectionCoordinates} An object that tracks the current selection range
     * in the spreadsheet, including the start and end row and column indices. This object is
     * shared across various managers to keep the selection state synchronized.
     */
    private selectionCoordinates: MultipleSelectionCoordinates = {
        selectionStartRow: 1,
        selectionEndRow: 1,
        selectionStartColumn: 1,
        selectionEndColumn: 1
    };

    // === Managers ===

    /**
     * @type {CellsManager} An instance of `CellsManager` responsible for managing the creation,
     * update, and retrieval of individual cell data within the `cellData` map.
     */
    private CellsManagerObj: CellsManager;

    /**
     * @type {UndoRedoManager} An instance of `UndoRedoManager` that handles the history
     * of changes, allowing users to undo and redo operations.
     */
    private undoRedoManager: UndoRedoManager;

    /**
     * @type {ScrollManager} An instance of `ScrollManager` that observes the main spreadsheet
     * container's scroll position and triggers updates to the visible rows, columns, and cell tiles
     * to ensure efficient rendering of large datasets.
     */
    private ScrollManagerObj: ScrollManager;

    /**
     * @type {RowsManager} An instance of `RowsManager` that controls the rendering, height management,
     * and vertical virtualization of row headers and their associated content blocks.
     */
    private RowsManagerObj: RowsManager;

    /**
     * @type {ColumnsManager} An instance of `ColumnsManager` that controls the rendering, width management,
     * and horizontal virtualization of column headers and their associated content blocks.
     */
    private ColumnsManagerObj: ColumnsManager;

    /**
     * @type {TilesManager} An instance of `TilesManager` that manages the visible grid of cell "tiles"
     * (blocks of 25x25 cells). It is responsible for rendering cell content and selection highlights
     * by coordinating with `CellsManager`, `RowsManager`, and `ColumnsManager`.
     */
    private TilesManagerObj: TilesManager;

    /**
     * @type {JSONUpload} An instance of `JSONUpload` that provides functionality to import
     * spreadsheet data from a JSON file, populating the `cellData` and triggering UI updates.
     */
    private JSONUploadObj: JSONUpload;

    /**
     * @type {CalculationEngine} An instance of `CalculationEngine` that performs various
     * statistical calculations (e.g., sum, average, count, min, max) on the currently selected
     * range of cells and updates a display area with the results.
     */
    private calculationEngineObj: CalculationEngine;

    /**
     * @type {InteractionManager} An instance of `InteractionManager` that centralizes the handling
     * of all user interface events, including mouse clicks, drag-selection, keyboard input,
     * and coordinating these interactions with other managers to update the spreadsheet state and UI.
     */
    private InteractionManagerObj: InteractionManager;

    /**
     * Constructs the main application. This constructor initializes all core data structures
     * and instantiates all necessary manager classes, passing them the required dependencies
     * to set up the interactive spreadsheet environment.
     */
    constructor() {
        // Initialize manager for handling cell content, passing the master cell data map.
        this.CellsManagerObj = new CellsManager(this.cellData);

        // Initialize the Undo/Redo history stack manager.
        this.undoRedoManager = new UndoRedoManager();

        // Initialize the ScrollManager, which will later be linked to other managers.
        this.ScrollManagerObj = new ScrollManager();

        // Initialize RowsManager, responsible for vertical scrolling and row rendering.
        // It uses `rowData` for heights, starts at index 0, and gets visible row count
        // from `ScrollManagerObj`.
        this.RowsManagerObj = new RowsManager(
            this.rowData,
            0, // Initial starting row block index
            this.ScrollManagerObj.verticalNum, // Number of visible row blocks
            this.selectionCoordinates // Shared selection state
        );

        // Initialize ColumnsManager, responsible for horizontal scrolling and column rendering.
        // It uses `columnData` for widths, starts at index 0, and gets visible column count
        // from `ScrollManagerObj`.
        this.ColumnsManagerObj = new ColumnsManager(
            this.columnData,
            0, // Initial starting column block index
            this.ScrollManagerObj.horizontalNum, // Number of visible column blocks
            this.selectionCoordinates // Shared selection state
        );

        // Initialize TilesManager, which renders the actual cell grid.
        // It needs references to `RowsManagerObj`, `ColumnsManagerObj`, and `CellsManagerObj`
        // to get layout information and cell content, as well as the selection state.
        this.TilesManagerObj = new TilesManager(
            this.RowsManagerObj,
            this.ColumnsManagerObj,
            this.ScrollManagerObj.verticalNum,
            this.ScrollManagerObj.horizontalNum,
            this.selectionCoordinates,
            this.CellsManagerObj
        );

        // Initialize JSONUpload, enabling data import.
        // It requires access to `cellData` to populate the spreadsheet
        // and `TilesManagerObj` to trigger re-rendering after upload.
        this.JSONUploadObj = new JSONUpload(
            this.cellData,
            this.TilesManagerObj
        );

        // Initialize CalculationEngine, for performing statistical calculations.
        // It needs `cellData` to access cell values and `selectionCoordinates`
        // to know which range to calculate over.
        this.calculationEngineObj = new CalculationEngine(
            this.cellData,
            this.selectionCoordinates
        );

        // Initialize InteractionManager, which is the central hub for all user input.
        // It requires references to almost all other managers to respond to user actions
        // (e.g., update selection, edit cells, resize rows/columns, trigger undo/redo, recalculate).
        this.InteractionManagerObj = new InteractionManager(
            this.RowsManagerObj,
            this.ColumnsManagerObj,
            this.TilesManagerObj,
            this.selectionCoordinates,
            this.CellsManagerObj,
            this.undoRedoManager,
            this.calculationEngineObj
        );

        // Finally, initialize the ScrollManager with references to the other managers
        // it needs to coordinate scrolling and view updates.
        this.ScrollManagerObj.initializeManager(
            this.ColumnsManagerObj,
            this.RowsManagerObj,
            this.TilesManagerObj
        );

        new TestingMethods(this.selectionCoordinates,this.cellData,this.rowData,this.columnData)
    }
}

// Instantiate the App class to launch the spreadsheet application when the script loads.
new App();