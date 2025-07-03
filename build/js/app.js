import { ScrollManager } from "./ScrollManager.js";
import { RowsManager } from "./RowsManager.js";
import { ColumnsManager } from "./ColumnsManager.js";
import { TilesManager } from "./TilesManager.js";
import { ResizeManager } from "./ResizeManager.js";
import { CellSelectionManager } from "./CellSelectionManager.js";
class App {
    constructor() {
        this.ifRowResizeOn = { value: false };
        this.ifRowResizePointerDown = { value: false };
        this.ifColumnResizeOn = { value: false };
        this.ifColumnResizePointerDown = { value: false };
        this.ifMultipleSelection = { value: false };
        this.selectionCoordinates = {
            selectionStartRow: 1,
            selectionEndRow: 1,
            selectionStartColumn: 1,
            selectionEndColumn: 1
        };
        this.initialize();
    }
    initialize() {
        const ScrollManagerObj = new ScrollManager();
        const RowsManagerObj = new RowsManager({ [5]: { height: 100 }, [30]: { height: 200 }, [55]: { height: 300 } }, 0, ScrollManagerObj.verticalNum, this.ifRowResizeOn, this.ifRowResizePointerDown, this.selectionCoordinates);
        const ColumnsManagerObj = new ColumnsManager({ [5]: { width: 200 }, [30]: { width: 300 }, [55]: { width: 400 } }, 0, ScrollManagerObj.horizontalNum, this.ifColumnResizeOn, this.ifColumnResizePointerDown);
        const TilesManagerObj = new TilesManager(RowsManagerObj.rowsPositionPrefixSumArr, ColumnsManagerObj.visibleColumnsPrefixSum, ScrollManagerObj.verticalNum, ScrollManagerObj.horizontalNum, this.selectionCoordinates, undefined, undefined, RowsManagerObj.marginTop, ColumnsManagerObj.marginLeft);
        const ResizeManagerObj = new ResizeManager(RowsManagerObj, TilesManagerObj, ColumnsManagerObj, this.ifRowResizeOn, this.ifRowResizePointerDown, this.ifColumnResizeOn, this.ifColumnResizePointerDown);
        const CellSelectionManagerObj = new CellSelectionManager(RowsManagerObj, TilesManagerObj, ColumnsManagerObj, this.ifMultipleSelection, this.selectionCoordinates);
        ScrollManagerObj.initializeManager(ColumnsManagerObj, RowsManagerObj, TilesManagerObj);
        window.addEventListener("pointerup", (event) => {
            ResizeManagerObj.pointerUpEventHandler(event);
            CellSelectionManagerObj.pointerUp(event);
        });
        window.addEventListener("pointermove", (event) => {
            ResizeManagerObj.pointerMove(event);
            CellSelectionManagerObj.pointerMove(event);
        });
    }
}
new App();
