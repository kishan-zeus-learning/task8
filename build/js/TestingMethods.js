export class TestingMethods {
    constructor(selectedCells, cellData, rowsData, columnsData) {
        this.selectedCells = selectedCells;
        this.cellData = cellData;
        this.rowsData = rowsData;
        this.columnsData = columnsData;
        const params = new URLSearchParams(window.location.search);
        // console.log(params.get());
        if (params.get("testing") === "true") {
            console.log("inside if statement for the test hooks");
            console.log("this.selectedCells", this.selectedCells);
            window.testHooks = {
                getSelectedCells: () => this.selectedCells,
            };
            window.abc = "kishan kumar";
        }
        else {
            console.log("testing false");
        }
    }
}
