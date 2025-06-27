export class ResizeManager {
    constructor(rowsManager, tilesManager, columnsManager) {
        this.rowsManager = rowsManager;
        this.tilesManager = tilesManager;
        this.columnsManager = columnsManager;
        this.handleRowsResize();
    }
    handleRowsResize() {
        this.rowsManager.visibleRows.forEach((visibleRow) => {
            visibleRow.rowCanvasDiv.addEventListener("mousemove", (event) => {
                console.log(`Hello from div id : ${visibleRow.rowID}`);
            });
        });
    }
}
