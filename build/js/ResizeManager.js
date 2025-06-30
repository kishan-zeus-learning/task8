export class ResizeManager {
    constructor(rowsManager, tilesManager, columnsManager, ifRowResizeOn, ifRowResizePointerDown, ifColumnResizeOn, ifColumnPointerDown) {
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.columnsManager = columnsManager;
        this.ifRowResizeOn = ifRowResizeOn;
        this.ifRowResizePointerDown = ifRowResizePointerDown;
        this.ifColumnResizeOn = ifColumnResizeOn;
        this.ifColumnResizePointerDown = ifColumnPointerDown;
    }
    pointerUpEventHandler(event) {
        // console.log("pointer up called " );
        document.body.style.cursor = "default";
        // for row
        const rowCanvasDivs = document.querySelectorAll(".subRow");
        rowCanvasDivs.forEach(rowCanvasDiv => {
            const resizeDiv = rowCanvasDiv.lastElementChild;
            resizeDiv.style.display = "none";
        });
        if (this.ifRowResizePointerDown.value) {
            this.tilesManager.redrawRow(this.rowsManager.currentResizingRowCanvas.rowID);
            this.ifRowResizePointerDown.value = false;
        }
        // for column
        const columnCanvasDivs = document.querySelectorAll(".subColumn");
        columnCanvasDivs.forEach(columnCanvasDiv => {
            const resizeDiv = columnCanvasDiv.lastElementChild;
            resizeDiv.style.display = "none";
        });
        if (this.ifColumnResizePointerDown.value) {
            console.log("before in column manager : ", [...this.columnsManager.visibleColumnsPrefixSum]);
            this.tilesManager.redrawColumn(this.columnsManager.currentResizingColumnCanvas.columnID);
            console.log("after in column manager : ", [...this.columnsManager.visibleColumnsPrefixSum]);
            // console.log("pointer up value reset");
            this.ifColumnResizePointerDown.value = false;
        }
    }
    pointerMove(event) {
        //row 
        if (this.ifRowResizeOn.value || this.ifRowResizePointerDown.value) {
            document.body.style.cursor = "ns-resize";
        }
        else if (this.ifColumnResizeOn.value || this.ifColumnResizePointerDown.value) {
            document.body.style.cursor = "ew-resize";
        }
        else {
            document.body.style.cursor = "default";
        }
        if (this.ifRowResizePointerDown.value) {
            this.rowsManager.currentResizingRowCanvas.resizeRow(event.clientY);
        }
        //column
        if (this.ifColumnResizePointerDown.value) {
            console.log("pointer is down");
            this.columnsManager.currentResizingColumnCanvas.resizeColumn(event.clientX);
        }
    }
}
