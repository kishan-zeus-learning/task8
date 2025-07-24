export class TestingMethods {
    constructor(selectedCells, cellData, rowsData, columnsData) {
        this.selectedCells = selectedCells;
        this.cellData = cellData;
        this.rowsData = rowsData;
        this.columnsData = columnsData;
        const params = new URLSearchParams(window.location.search);
        if (params.get("testing") === "true") {
            console.log("inside if statement for the test hooks");
            console.log("this.selectedCells", this.selectedCells);
            window.testHooks = {
                getSelectedCells: () => this.selectedCells,
                getSelectedCoordinates: (startRow, endRow, startColumn, endColumn) => this.getCoordinates(startRow, endRow, startColumn, endColumn)
            };
            // window.abc="kishan kumar";
        }
        else {
            console.log("testing false");
        }
    }
    getCoordinates(startRow, endRow, startColumn, endColumn) {
        const gridDiv = document.getElementById("grid");
        const gridRect = gridDiv.getBoundingClientRect();
        const sheetDiv = document.getElementById("sheet");
        const sheetRect = sheetDiv.getBoundingClientRect();
        let selectionStartY = gridRect.top + 1;
        let selectionStartX = gridRect.left + 1;
        let selectionEndX = gridRect.left + 1;
        let selectionEndY = gridRect.top + 1;
        const visibleHeight = sheetRect.height - 25;
        const visibleWidth = sheetRect.width - 50;
        let offsetX = 1;
        let offsetY = 1;
        const cornerCellRow = Math.max(startRow, endRow);
        const cornerCellColumn = Math.max(startColumn, endColumn);
        for (let i = 1; i <= cornerCellRow; i++) {
            const currentRow = this.rowsData.get(i);
            if (currentRow) {
                offsetY += currentRow.height;
            }
            else {
                offsetY += 25;
            }
        }
        for (let j = 1; j <= cornerCellColumn; j++) {
            const currentColumn = this.columnsData.get(j);
            if (currentColumn) {
                offsetX += currentColumn.width;
            }
            else {
                offsetX += 100;
            }
        }
        let scrollX = 0;
        let scrollY = 0;
        if (offsetY >= visibleHeight) {
            scrollY = offsetY % visibleHeight + (Math.floor(offsetY / visibleHeight) - 1) * visibleHeight;
        }
        if (offsetX >= visibleWidth) {
            scrollX = offsetX % visibleWidth + (Math.floor(offsetX / visibleWidth) - 1) * visibleWidth;
        }
        for (let i = 1; i < startRow; i++) {
            const currentRow = this.rowsData.get(i);
            if (currentRow) {
                selectionStartY += currentRow.height;
            }
            else {
                selectionStartY += 25;
            }
        }
        for (let i = 1; i < endRow; i++) {
            const currentRow = this.rowsData.get(i);
            if (currentRow) {
                selectionEndY += currentRow.height;
            }
            else {
                selectionEndY += 25;
            }
        }
        for (let j = 1; j < startColumn; j++) {
            const currentColumn = this.columnsData.get(j);
            if (currentColumn) {
                selectionStartX += currentColumn.width;
            }
            else {
                selectionStartX += 100;
            }
        }
        for (let j = 1; j < endColumn; j++) {
            const currentColumn = this.columnsData.get(j);
            if (currentColumn) {
                selectionEndX += currentColumn.width;
            }
            else {
                selectionEndX += 100;
            }
        }
        selectionStartX -= scrollX;
        selectionEndX -= scrollX;
        selectionStartY -= scrollY;
        selectionEndY -= scrollY;
        return {
            selectionStartY,
            selectionEndY,
            selectionStartX,
            selectionEndX,
            scrollX,
            scrollY
        };
    }
}
