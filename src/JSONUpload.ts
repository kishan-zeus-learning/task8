import { CellsMap } from "./types/CellsMap.js";
import { Cell } from "./Cell.js";
import { TilesManager } from "./TilesManager";
import { RowsManager } from "./RowsManager";
import { ColumnsManager } from "./ColumnsManager";
export class JSONUpload {
    /**
     * Stores the uploaded JSON data from the file
     * @type {JSON|null}
     */
    uploadedJSONData: JSON | null = null;

    /**
     * Stores the cell data as a map of rows to columns
     * @type {CellsMap}
     */
    private cellData: CellsMap;

    /**
     * HTML input element used to upload JSON
     * @type {HTMLInputElement}
     */
    private inputElement: HTMLInputElement = document.getElementById("jsonUpload") as HTMLInputElement;

    /**
     * Manages the rendering and control of tiles
     * @type {TilesManager}
     */
    private tileManager: TilesManager;

    /**
     * Manages the row structures
     * @type {RowsManager}
     */
    private rowManager: RowsManager;

    /**
     * Manages the column structures
     * @type {ColumnsManager}
     */
    private columnManager: ColumnsManager;

    /**
     * Initializes the JSONUpload class
     * @param {CellsMap} cellData The current cell map data structure
     * @param {TilesManager} tileManager The tile manager instance
     * @param {RowsManager} rowManager The row manager instance
     * @param {ColumnsManager} columnManager The column manager instance
     */
    constructor(cellData: CellsMap, tileManager: TilesManager, rowManager: RowsManager, columnManager: ColumnsManager) {
        this.cellData = cellData;
        this.tileManager = tileManager;
        this.rowManager = rowManager;
        this.columnManager = columnManager;
        this.init();
    }

    /**
     * Initializes the file input listener for uploading JSON files
     */
    private init() {
        this.inputElement.addEventListener("change", (event) => {
            const input = event.target as HTMLInputElement;

            if (!input.files || input.files.length === 0) return alert("No file selected");

            const file: File = input.files[0];

            if (!file.name.toLowerCase().endsWith(".json")) return alert("Please upload valid file");

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);

                    /** @type {JSON} Stores the parsed uploaded JSON data */
                    this.uploadedJSONData = json;

                    this.loadData();
                } catch (err) {
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
    private loadData() {
        if (Array.isArray(this.uploadedJSONData)) {
            let columnCnt = 1;
            let rowCnt = 2;

            /** @type {Map<string|number, number>} Maps column keys to column numbers */
            const columnMapping: Map<string | number, number> = new Map();

            let firstRow = this.cellData.get(1);
            if (!firstRow) {
                firstRow = new Map<number, Cell>();
                this.cellData.set(1, firstRow);
            }

            for (let i = 0; i < this.uploadedJSONData.length; i++) {
                const columnMap = new Map<number, Cell>();
                for (let columnValue of Object.keys(this.uploadedJSONData[i])) {
                    if (!columnMapping.has(columnValue)) {
                        // Add new column header
                        firstRow.set(columnCnt, new Cell(1, columnCnt, columnValue));
                        columnMapping.set(columnValue, columnCnt++);
                    }

                    const columnNum = columnMapping.get(columnValue) as number;

                    // Add cell value to the row
                    columnMap.set(columnNum, new Cell(rowCnt, columnNum, this.uploadedJSONData[i][columnValue]));
                }

                this.cellData.set(rowCnt++, columnMap);
            }
        }


        this.tileManager.rerender();
    }
}
