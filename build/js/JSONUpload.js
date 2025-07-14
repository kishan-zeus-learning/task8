import { Cell } from "./Cell.js";
export class JSONUpload {
    /**
     * Initializes the JSONUpload class
     * @param {CellsMap} cellData The current cell map data structure
     * @param {TilesManager} tileManager The tile manager instance
     * @param {RowsManager} rowManager The row manager instance
     * @param {ColumnsManager} columnManager The column manager instance
     */
    constructor(cellData, tileManager, rowManager, columnManager) {
        /**
         * Stores the uploaded JSON data from the file
         * @type {JSON|null}
         */
        this.uploadedJSONData = null;
        /**
         * HTML input element used to upload JSON
         * @type {HTMLInputElement}
         */
        this.inputElement = document.getElementById("jsonUpload");
        this.cellData = cellData;
        this.tileManager = tileManager;
        this.rowManager = rowManager;
        this.columnManager = columnManager;
        this.init();
    }
    /**
     * Initializes the file input listener for uploading JSON files
     */
    init() {
        this.inputElement.addEventListener("change", (event) => {
            const input = event.target;
            if (!input.files || input.files.length === 0)
                return alert("No file selected");
            const file = input.files[0];
            if (!file.name.toLowerCase().endsWith(".json"))
                return alert("Please upload valid file");
            const reader = new FileReader();
            reader.onload = (event) => {
                var _a;
                try {
                    const json = JSON.parse((_a = event.target) === null || _a === void 0 ? void 0 : _a.result);
                    /** @type {JSON} Stores the parsed uploaded JSON data */
                    this.uploadedJSONData = json;
                    this.loadData();
                }
                catch (err) {
                    console.error("Error : ");
                }
            };
            reader.readAsText(file);
        });
    }
    /**
     * Parses and loads the uploaded JSON data into the cell map,
     * generates headers from keys, and populates cell values.
     */
    loadData() {
        if (Array.isArray(this.uploadedJSONData)) {
            let columnCnt = 1;
            let rowCnt = 2;
            /** @type {Map<string|number, number>} Maps column keys to column numbers */
            const columnMapping = new Map();
            let firstRow = this.cellData.get(1);
            if (!firstRow) {
                firstRow = new Map();
                this.cellData.set(1, firstRow);
            }
            for (let i = 0; i < this.uploadedJSONData.length; i++) {
                const columnMap = new Map();
                for (let columnValue of Object.keys(this.uploadedJSONData[i])) {
                    if (!columnMapping.has(columnValue)) {
                        // Add new column header
                        firstRow.set(columnCnt, new Cell(1, columnCnt, columnValue));
                        columnMapping.set(columnValue, columnCnt++);
                    }
                    const columnNum = columnMapping.get(columnValue);
                    // Add cell value to the row
                    columnMap.set(columnNum, new Cell(rowCnt, columnNum, this.uploadedJSONData[i][columnValue]));
                }
                this.cellData.set(rowCnt++, columnMap);
            }
        }
        this.tileManager.rerender();
    }
}
