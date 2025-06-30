export class ResizeManager {
    constructor(rowsManager, tilesManager, columnsManager, ifResizeOn, ifResizePointerDown) {
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.columnsManager = columnsManager;
        this.ifResizeOn = ifResizeOn;
        this.ifResizePointerDown = ifResizePointerDown;
    }
    pointerUpEventHandler(event) {
        document.body.style.cursor = "default";
        // to be updated
        const rowCanvasDivs = document.querySelectorAll(".subRow");
        rowCanvasDivs.forEach(rowCanvasDiv => {
            const resizeDiv = rowCanvasDiv.lastElementChild;
            resizeDiv.style.display = "none";
        });
        this.tilesManager.redrawRow(this.rowsManager.currentResizingRowCanvas.rowID);
        this.ifResizePointerDown.value = false;
        // this.currentRowResizeObj=null;
    }
    pointerMove(event) {
        if (this.ifResizeOn.value || this.ifResizePointerDown.value) {
            document.body.style.cursor = "ns-resize";
        }
        else {
            document.body.style.cursor = "default";
        }
        if (this.ifResizePointerDown.value) {
            // console.log("reached here: ");
            this.rowsManager.currentResizingRowCanvas.resizeRow(event.clientY);
        }
    }
}
