// Importing required managers and types
import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./RowsManager.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";
import { ResizeManager } from "./ResizeManager.js";
import { BooleanObj } from "./types/BooleanObj.js";
import { CellSelectionManager } from "./CellSelectionManager.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates.js";
import { CellsManager } from "./CellsManager.js";
import { UndoRedoManager } from "./UndoRedoManager.js";
import { JSONUpload } from "./JSONUpload.js";
import { CellsMap } from "./types/CellsMap.js";
import { ColumnData } from "./types/ColumnRows.js";
import { RowData } from "./types/RowsColumn.js";

/**
 * Main application class for initializing and managing the spreadsheet-like interface
 */
class App {
    /**@type {BooleanObj} Indicates if row resizing is active */
    private ifRowResizeOn: BooleanObj;

    /**@type {BooleanObj} Indicates if row resize pointer is held down */
    private ifRowResizePointerDown: BooleanObj;

    /**@type {BooleanObj} Indicates if column resizing is active */
    private ifColumnResizeOn: BooleanObj;

    /**@type {BooleanObj} Indicates if column resize pointer is held down */
    private ifColumnResizePointerDown: BooleanObj;

    /**@type {BooleanObj} Indicates if tile (cell) selection is active */
    private ifTileSelectionOn: BooleanObj;

    /**@type {BooleanObj} Indicates if row selection is active */
    private ifRowSelectionOn: BooleanObj;

    /**@type {BooleanObj} Indicates if column selection is active */
    private ifColumnSelectionOn: BooleanObj;

    /**@type {MultipleSelectionCoordinates} Stores the selection start and end coordinates */
    private selectionCoordinates: MultipleSelectionCoordinates;

    private outerInput:HTMLInputElement;

    private cellData:CellsMap;

    private columnData:ColumnData;

    private rowData:RowData;

    private CellsManagerObj:CellsManager;

    private undoRedoManager:UndoRedoManager;

    private ScrollManagerObj:ScrollManager;

    private RowsManagerObj:RowsManager;

    private ColumnsManagerObj:ColumnsManager;

    private TilesManagerObj:TilesManager;

    private JSONUploadObj:JSONUpload;

    private ResizeManagerObj:ResizeManager;

    private CellSelectionManagerObj:CellSelectionManager;



    /**
     * Initializes the App
     */
    constructor() {
        this.ifRowResizeOn = { value: false };
        this.ifRowResizePointerDown = { value: false };
        this.ifColumnResizeOn = { value: false };
        this.ifColumnResizePointerDown = { value: false };
        this.ifTileSelectionOn = { value: false };
        this.ifRowSelectionOn = { value: false };
        this.ifColumnSelectionOn = { value: false };
        this.cellData=new Map();
        this.columnData=new Map();
        this.rowData= new Map();
        this.outerInput=document.querySelector(".outerInputBar") as HTMLInputElement;
        

        this.selectionCoordinates = {
            selectionStartRow: 1,
            selectionEndRow: 1,
            selectionStartColumn: 1,
            selectionEndColumn: 1
        };
        this.CellsManagerObj = new CellsManager(this.cellData);
        // CellsManagerObj.manageCellUpdate(2, 2, "Hi");
        // CellsManagerObj.manageCellUpdate(2, 3, "50");
        // CellsManagerObj.manageCellUpdate(3, 5, "Zeus");
        
        this.undoRedoManager= new UndoRedoManager();
        
        this.ScrollManagerObj = new ScrollManager();
        
        this.RowsManagerObj = new RowsManager(
            this.rowData,
            0,
            this.ScrollManagerObj.verticalNum,
            this.ifRowResizeOn,
            this.ifRowResizePointerDown,
            this.selectionCoordinates,
            this.undoRedoManager
        );
        
        this.ColumnsManagerObj = new ColumnsManager(
            this.columnData,
            0,
            this.ScrollManagerObj.horizontalNum,
            this.ifColumnResizeOn,
            this.ifColumnResizePointerDown,
            this.selectionCoordinates
        );
        
        this.TilesManagerObj = new TilesManager(
            this.RowsManagerObj.rowsPositionPrefixSumArr,
            this.ColumnsManagerObj.visibleColumnsPrefixSum,
            this.ScrollManagerObj.verticalNum,
            this.ScrollManagerObj.horizontalNum,
            this.selectionCoordinates,
            this.CellsManagerObj,
            undefined,
            undefined,
            this.RowsManagerObj.marginTop,
            this.ColumnsManagerObj.marginLeft
        );
        this.JSONUploadObj= new JSONUpload(this.cellData,this.TilesManagerObj,this.RowsManagerObj,this.ColumnsManagerObj);

        this.ResizeManagerObj = new ResizeManager(
            this.RowsManagerObj,
            this.TilesManagerObj,
            this.ColumnsManagerObj,
            this.ifRowResizeOn,
            this.ifRowResizePointerDown,
            this.ifColumnResizeOn,
            this.ifColumnResizePointerDown,
            this.undoRedoManager
        );

        this.CellSelectionManagerObj = new CellSelectionManager(
            this.RowsManagerObj,
            this.TilesManagerObj,
            this.ColumnsManagerObj,
            this.ifTileSelectionOn,
            this.ifRowSelectionOn,
            this.ifColumnSelectionOn,
            this.selectionCoordinates,
            this.CellsManagerObj,
            this.undoRedoManager,
            this.ResizeManagerObj,
            this.outerInput
        );

        this.ScrollManagerObj.initializeManager(this.ColumnsManagerObj, this.RowsManagerObj, this.TilesManagerObj);

        this.initialize();
    }

    /**
     * Main setup function to initialize all managers and event listeners
     */
    private initialize() {
        

        // Keyboard and click events
        window.addEventListener("keydown", (event) => {
            this.CellSelectionManagerObj.handleKeyDown(event);
        });

        window.addEventListener("keyup", (event) => {
            this.CellSelectionManagerObj.handleKeyUp(event);
        });

        window.addEventListener("click", (event) => {
            this.CellSelectionManagerObj.handleWindowClick(event);
        });

        // Pointer up event
        window.addEventListener("pointerup", (event) => {
            this.ResizeManagerObj.pointerUpEventHandler(event);
            this.CellSelectionManagerObj.pointerUp(event);

            this.cursorType(event);
        });

        // Pointer move event
        window.addEventListener("pointermove", (event) => {
            this.ResizeManagerObj.pointerMove(event);
            this.CellSelectionManagerObj.pointerMove(event);

            this.cursorType(event);

        });
    }


    private cursorType(event:PointerEvent){
                    switch (true) {
                case this.ifRowResizePointerDown.value:
                    document.body.style.cursor = "ns-resize";
                    break;

                case this.ifColumnResizePointerDown.value:
                    document.body.style.cursor = "ew-resize";
                    break;

                case this.ifRowSelectionOn.value:
                    document.body.style.cursor = "url('./img/ArrowRight.png'), auto";
                    break;

                case this.ifColumnSelectionOn.value:
                    document.body.style.cursor = "url('./img/ArrowDown.png'), auto";
                    break;

                case this.ifTileSelectionOn.value:
                    document.body.style.cursor = "cell";
                    break;

                case this.ifRowResizeOn.value:
                    document.body.style.cursor = "ns-resize";
                    break;

                case this.ifColumnResizeOn.value:
                    document.body.style.cursor = "ew-resize";
                    break;

                case this.ifRowHover(event, this.RowsManagerObj):
                    document.body.style.cursor = "url('./img/ArrowRight.png'), auto";
                    break;

                case this.ifColumnHover(event, this.ColumnsManagerObj):
                    document.body.style.cursor = "url('./img/ArrowDown.png'), auto";
                    break;

                case this.ifTileHover(event, this.TilesManagerObj):
                    document.body.style.cursor = "cell";
                    break;

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
    private ifTileHover(event: PointerEvent, tilesManager: TilesManager): boolean {
        const rect = tilesManager.gridDiv.getBoundingClientRect();
        return (
            event.clientX <= rect.right &&
            event.clientX >= rect.left &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        );
    }

    /**
     * Checks whether the pointer is currently hovering over the row area
     * @param {PointerEvent} event - Pointer event
     * @param {RowsManager} rowsManager - RowsManager instance
     * @returns {boolean}
     */
    private ifRowHover(event: PointerEvent, rowsManager: RowsManager): boolean {
        const rect = rowsManager.rowsDivContainer.getBoundingClientRect();
        return (
            event.clientX <= rect.right &&
            event.clientX >= rect.left &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        );
    }

    /**
     * Checks whether the pointer is currently hovering over the column area
     * @param {PointerEvent} event - Pointer event
     * @param {ColumnsManager} columnsManager - ColumnsManager instance
     * @returns {boolean}
     */
    private ifColumnHover(event: PointerEvent, columnsManager: ColumnsManager): boolean {
        const rect = columnsManager.columnsDivContainer.getBoundingClientRect();
        return (
            event.clientX <= rect.right &&
            event.clientX >= rect.left &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom
        );
    }
}

// Instantiates the App
new App();