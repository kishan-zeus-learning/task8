import { ColumnsResizeEventHandler } from "./ColumnResizeEventHandler.js";
import { ColumnSelectionEventHandler } from "./ColumnSelectionEventHandler.js";
import { RowResizeEventHandler } from "./RowResizeEventHandler.js";
import { RowSelectionEventHandler } from "./RowSelectionEventHandler.js";
export class InteractionManager {
    constructor(rowsManager, columnsManager, tilesManager, selectionCoordinates, undoRedoManager) {
        this.activeFeature = null;
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
        this.tilesManager = tilesManager;
        this.selectionCoordinates = selectionCoordinates;
        this.undoRedoManager = undoRedoManager;
        this.featuresArray = this.getArray();
        console.log("initialized : ", this.featuresArray);
        this.initializeEventListeners();
    }
    getArray() {
        const RowResizeEventHandlerObj = new RowResizeEventHandler(this.rowsManager, this.tilesManager, this.undoRedoManager);
        const ColumnsResizeEventHandlerObj = new ColumnsResizeEventHandler(this.columnsManager, this.tilesManager, this.undoRedoManager);
        const RowSelectionEventHandlerObj = new RowSelectionEventHandler(this.rowsManager, this.columnsManager, this.tilesManager, this.selectionCoordinates);
        const ColumnSelectionEventHandlerObj = new ColumnSelectionEventHandler(this.rowsManager, this.columnsManager, this.tilesManager, this.selectionCoordinates);
        return [RowResizeEventHandlerObj, ColumnsResizeEventHandlerObj, RowSelectionEventHandlerObj, ColumnSelectionEventHandlerObj];
    }
    initializeEventListeners() {
        const sheetDiv = document.getElementById("sheet");
        sheetDiv.addEventListener("pointerdown", (event) => {
            this.handlePointerDown(event);
        });
        window.addEventListener("pointermove", (event) => {
            this.handlePointerMove(event);
        });
        window.addEventListener("pointerup", (event) => {
            this.handlePointerUp(event);
        });
    }
    handlePointerDown(event) {
        if (this.activeFeature)
            return alert("some error occured at interaction manager pointer down");
        for (const currentFeature of this.featuresArray) {
            if (currentFeature.hitTest(event)) {
                this.activeFeature = currentFeature;
                this.activeFeature.pointerDown(event);
                break;
            }
        }
    }
    handlePointerMove(event) {
        if (!this.activeFeature)
            return;
        this.activeFeature.pointerMove(event);
    }
    handlePointerUp(event) {
        if (!this.activeFeature)
            return;
        this.activeFeature.pointerUp(event);
        this.activeFeature = null;
    }
}
