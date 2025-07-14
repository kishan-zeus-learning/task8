import { CellsMap } from "./types/CellsMap";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";

type CalculationKey = "count" | "numericalCount" | "sum" | "average" | "min" | "max";
type CalculationResult = { value: number; visible: boolean };

/**
 * Manages statistical calculations like count, sum, average, min, and max
 * for a selected rectangular range of cells in the spreadsheet.
 */
export class CalculationEngine {
    /**
     * Holds the current result values of calculations.
     */
    private calculationResults: Map<CalculationKey, CalculationResult> = new Map();

    /**
     * Initializes the engine with cell data and selected range.
     * @param cellsMap Map of all cells (sparse 2D structure).
     * @param selectionCoordinates Current selection range in spreadsheet.
     */
    constructor(
        private cellsMap: CellsMap,
        private selectionCoordinates: MultipleSelectionCoordinates
    ) {
        this.initializeCalculationResults();
    }

    /**
     * Sets up initial values for all calculation types.
     */
    private initializeCalculationResults() {
        this.calculationResults.set("count", { value: 0, visible: true });
        this.calculationResults.set("numericalCount", { value: 0, visible: true });
        this.calculationResults.set("sum", { value: 0, visible: true });
        this.calculationResults.set("average", { value: 0, visible: true });
        this.calculationResults.set("min", { value: Number.MAX_VALUE, visible: true });
        this.calculationResults.set("max", { value: Number.MIN_VALUE, visible: true });
    }

    /**
     * Safely retrieves a result from the map. Throws an error if not found.
     */
    private getResult(key: CalculationKey): CalculationResult {
        const result = this.calculationResults.get(key);
        if (!result) throw new Error(`Calculation result for '${key}' not found.`);
        return result;
    }

    /**
     * Resets all calculations to default values before recalculation.
     */
    private resetCalculationResults() {
        this.getResult("count").value = 0;
        this.getResult("numericalCount").value = 0;
        this.getResult("sum").value = 0;
        this.getResult("average").value = 0;
        this.getResult("min").value = Number.MAX_VALUE;
        this.getResult("max").value = Number.MIN_VALUE;
    }

    /**
     * Triggers calculation on selection change.
     * Efficiently chooses between iterating over the range or the map based on size.
     */
    handleSelection() {
        this.resetCalculationResults();

        const { selectionStartRow, selectionEndRow, selectionStartColumn, selectionEndColumn } = this.selectionCoordinates;

        const startRow = Math.min(selectionStartRow, selectionEndRow);
        const endRow = Math.max(selectionStartRow, selectionEndRow);
        const startCol = Math.min(selectionStartColumn, selectionEndColumn);
        const endCol = Math.max(selectionStartColumn, selectionEndColumn);

        const rangeRowCount = endRow - startRow + 1;
        const mapRowCount = this.cellsMap.size;

        if (mapRowCount > rangeRowCount) {
            // Loop through selected range if it's smaller
            this.iterateOverRange(startRow, endRow, startCol, endCol);
        } else {
            // Loop through existing cells only (faster for sparse data)
            this.iterateOverMap(startRow, endRow, startCol, endCol);
        }

        this.finalizeAverage();         // Calculate average from sum/count
        this.displayCalculationsFromMap(); // Render result to UI
    }

    /**
     * Loops through cells in the selected rectangular region and processes them.
     */
    private iterateOverRange(startRow: number, endRow: number, startCol: number, endCol: number) {
        for (let i = startRow; i <= endRow; i++) {
            const row = this.cellsMap.get(i);
            if (!row) continue;

            for (let j = startCol; j <= endCol; j++) {
                const cell = row.get(j);
                if (!cell) continue;
                this.processCell(cell);
            }
        }
    }

    /**
     * Loops only through non-empty cells and processes them if they're within selection.
     */
    private iterateOverMap(startRow: number, endRow: number, startCol: number, endCol: number) {
        for (const [rowIndex, row] of this.cellsMap.entries()) {
            if (rowIndex < startRow || rowIndex > endRow) continue;

            for (const [colIndex, cell] of row.entries()) {
                if (colIndex < startCol || colIndex > endCol) continue;
                this.processCell(cell);
            }
        }
    }

    /**
     * Updates count, sum, min, max, and numerical count based on cell value.
     * Assumes `leftAlign === false` means the value is numeric.
     */
    private processCell(cell: { getValue: () => any; leftAlign: boolean }) {
        this.getResult("count").value += 1;

        if (!cell.leftAlign) {
            const num = Number(cell.getValue());

            const numerical = this.getResult("numericalCount");
            const sum = this.getResult("sum");
            const min = this.getResult("min");
            const max = this.getResult("max");

            numerical.value += 1;
            sum.value += num;
            min.value = Math.min(min.value, num);
            max.value = Math.max(max.value, num);
        }
    }

    /**
     * Computes average from sum and numerical count.
     */
    private finalizeAverage() {
        const numericalCount = this.getResult("numericalCount").value;
        if (numericalCount > 0) {
            this.getResult("average").value = this.getResult("sum").value / numericalCount;
        }
    }

    /**
     * Displays result values below the spreadsheet (in `.calculationsValues` container).
     * If only one or zero cells selected, clears the output.
     */
    private displayCalculationsFromMap() {
        const count = this.getResult("count").value;
        const numericalCount = this.getResult("numericalCount").value;
        const container = document.querySelector('.calculationsValues') as HTMLDivElement;
        if (!container) return;

        if (count <= 1) {
            container.innerHTML = "";
            return;
        }

        const getDiv = (label: string, key: CalculationKey) =>
            this.getCalculationDisplayDiv(label, this.getResult(key).value, this.getResult(key).visible);

        let html = "";

        if (numericalCount === 0) {
            html += getDiv("Count", "count");
        } else {
            html += getDiv("Average", "average");
            html += getDiv("Count", "count");
            html += getDiv("Numerical Count", "numericalCount");
            html += getDiv("Min", "min");
            html += getDiv("Max", "max");
            html += getDiv("Sum", "sum");
        }

        container.innerHTML = html;
    }

    /**
     * Returns HTML string for a result box (label + value).
     */
    private getCalculationDisplayDiv(label: string, value: number, visible: boolean): string {
        return `
        <div class="calculationDisplay ${visible ? "" : "hide"}">
            ${label} <span> : ${value}</span>
        </div>`;
    }
}