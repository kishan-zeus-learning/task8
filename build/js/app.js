// Importing required managers and types
import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./RowsManager.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";
import { ResizeManager } from "./ResizeManager.js";
import { CellSelectionManager } from "./CellSelectionManager.js";
import { CellsManager } from "./CellsManager.js";
import { UndoRedoManager } from "./UndoRedoManager.js";
/**
 * Main application class for initializing and managing the spreadsheet-like interface
 */
class App {
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
        this.selectionCoordinates = {
            selectionStartRow: 1,
            selectionEndRow: 1,
            selectionStartColumn: 1,
            selectionEndColumn: 1
        };
        this.initialize();
    }
    /**
     * Main setup function to initialize all managers and event listeners
     */
    initialize() {
        const CellsManagerObj = new CellsManager();
        CellsManagerObj.manageCellUpdate(2, 2, "Hi");
        CellsManagerObj.manageCellUpdate(2, 3, "50");
        CellsManagerObj.manageCellUpdate(3, 5, "Zeus");
        const undoRedoManager = new UndoRedoManager();
        const ScrollManagerObj = new ScrollManager();
        const RowsManagerObj = new RowsManager({ [5]: { height: 100 }, [30]: { height: 200 }, [55]: { height: 300 } }, 0, ScrollManagerObj.verticalNum, this.ifRowResizeOn, this.ifRowResizePointerDown, this.selectionCoordinates);
        const ColumnsManagerObj = new ColumnsManager({ [5]: { width: 200 }, [30]: { width: 300 }, [55]: { width: 400 } }, 0, ScrollManagerObj.horizontalNum, this.ifColumnResizeOn, this.ifColumnResizePointerDown, this.selectionCoordinates);
        const TilesManagerObj = new TilesManager(RowsManagerObj.rowsPositionPrefixSumArr, ColumnsManagerObj.visibleColumnsPrefixSum, ScrollManagerObj.verticalNum, ScrollManagerObj.horizontalNum, this.selectionCoordinates, CellsManagerObj, undefined, undefined, RowsManagerObj.marginTop, ColumnsManagerObj.marginLeft);
        const ResizeManagerObj = new ResizeManager(RowsManagerObj, TilesManagerObj, ColumnsManagerObj, this.ifRowResizeOn, this.ifRowResizePointerDown, this.ifColumnResizeOn, this.ifColumnResizePointerDown);
        const CellSelectionManagerObj = new CellSelectionManager(RowsManagerObj, TilesManagerObj, ColumnsManagerObj, this.ifTileSelectionOn, this.ifRowSelectionOn, this.ifColumnSelectionOn, this.selectionCoordinates, CellsManagerObj, undoRedoManager);
        ScrollManagerObj.initializeManager(ColumnsManagerObj, RowsManagerObj, TilesManagerObj);
        // Keyboard and click events
        window.addEventListener("keydown", (event) => {
            CellSelectionManagerObj.handleKeyDown(event);
        });
        window.addEventListener("keyup", (event) => {
            CellSelectionManagerObj.handleKeyUp(event);
        });
        window.addEventListener("click", (event) => {
            CellSelectionManagerObj.handleWindowClick(event);
        });
        // Pointer up event
        window.addEventListener("pointerup", (event) => {
            ResizeManagerObj.pointerUpEventHandler(event);
            CellSelectionManagerObj.pointerUp(event);
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
                case this.ifRowResizeOn.value:
                    document.body.style.cursor = "ns-resize";
                    break;
                case this.ifColumnResizeOn.value:
                    document.body.style.cursor = "ew-resize";
                    break;
                case this.ifRowHover(event, RowsManagerObj):
                    document.body.style.cursor = "url('./img/ArrowRight.png'), auto";
                    break;
                case this.ifColumnHover(event, ColumnsManagerObj):
                    document.body.style.cursor = "url('./img/ArrowDown.png'), auto";
                    break;
                case this.ifTileHover(event, TilesManagerObj):
                    document.body.style.cursor = "cell";
                    break;
                default:
                    document.body.style.cursor = "default";
                    break;
            }
        });
        // Pointer move event
        window.addEventListener("pointermove", (event) => {
            ResizeManagerObj.pointerMove(event);
            CellSelectionManagerObj.pointerMove(event);
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
                case this.ifRowHover(event, RowsManagerObj):
                    document.body.style.cursor = "url('./img/ArrowRight.png'), auto";
                    break;
                case this.ifColumnHover(event, ColumnsManagerObj):
                    document.body.style.cursor = "url('./img/ArrowDown.png'), auto";
                    break;
                case this.ifTileHover(event, TilesManagerObj):
                    document.body.style.cursor = "cell";
                    break;
                default:
                    document.body.style.cursor = "default";
                    break;
            }
        });
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
