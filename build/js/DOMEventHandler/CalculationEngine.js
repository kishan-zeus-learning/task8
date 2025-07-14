/**
 * Manages calculations (count, sum, average, min, max) for selected cells.
 */
export class CalculationEngine {
    /**
     * @param {CellsMap} cellsMap - A map containing all cell data.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object holding the coordinates of the current selection.
     */
    constructor(cellsMap, selectionCoordinates) {
        this.cellsMap = cellsMap;
        this.selectionCoordinates = selectionCoordinates;
        /** @private @type {Map<CalculationKey, CalculationResult>} Stores the results of various calculations. */
        this.calculationResults = new Map();
        this.initializeCalculationResults();
    }
    /**
     * Initializes the calculation results map with default values.
     */
    initializeCalculationResults() {
        this.calculationResults.set("count", { value: 0, visible: true });
        this.calculationResults.set("numericalCount", { value: 0, visible: true });
        this.calculationResults.set("sum", { value: 0, visible: true });
        this.calculationResults.set("average", { value: 0, visible: true });
        this.calculationResults.set("min", { value: Number.MAX_VALUE, visible: true });
        this.calculationResults.set("max", { value: Number.MIN_VALUE, visible: true });
    }
    /**
     * Retrieves a specific calculation result from the map.
     * @param {CalculationKey} key - The key of the calculation result to retrieve.
     * @returns {CalculationResult} The calculation result object.
     * @throws {Error} If the calculation result for the given key is not found.
     */
    getResult(key) {
        const result = this.calculationResults.get(key);
        if (!result)
            throw new Error(`Calculation result for '${key}' not found.`);
        return result;
    }
    /**
     * Resets all calculation results to their initial default values.
     */
    resetCalculationResults() {
        this.getResult("count").value = 0;
        this.getResult("numericalCount").value = 0;
        this.getResult("sum").value = 0;
        this.getResult("average").value = 0;
        this.getResult("min").value = Number.MAX_VALUE;
        this.getResult("max").value = Number.MIN_VALUE;
    }
    /**
     * Handles the pointer up event to trigger calculations based on the selected range.
     * @param {PointerEvent} _ - The pointer event object (unused but required by event listener signature).
     */
    /**
     * Performs calculations for the selected range using optimized traversal logic.
     * Chooses between iterating over the range or the map based on efficiency.
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
        // If the map has more rows than the range, iterate over the range
        if (mapRowCount > rangeRowCount) {
            this.iterateOverRange(startRow, endRow, startCol, endCol);
        }
        else {
            // Otherwise, iterate over the map and check if cells are in range
            this.iterateOverMap(startRow, endRow, startCol, endCol);
        }
        this.finalizeAverage();
        this.displayCalculationsFromMap();
    }
    /**
     * Iterates over the specified range to process cells.
     * @param {number} startRow - Starting row index.
     * @param {number} endRow - Ending row index.
     * @param {number} startCol - Starting column index.
     * @param {number} endCol - Ending column index.
     */
    iterateOverRange(startRow, endRow, startCol, endCol) {
        for (let i = startRow; i <= endRow; i++) {
            const row = this.cellsMap.get(i);
            if (!row)
                continue;
            for (let j = startCol; j <= endCol; j++) {
                const cell = row.get(j);
                if (!cell)
                    continue;
                this.processCell(cell);
            }
        }
    }
    /**
     * Iterates over the map and processes cells that fall within the specified range.
     * @param {number} startRow - Starting row index.
     * @param {number} endRow - Ending row index.
     * @param {number} startCol - Starting column index.
     * @param {number} endCol - Ending column index.
     */
    iterateOverMap(startRow, endRow, startCol, endCol) {
        for (const [rowIndex, row] of this.cellsMap.entries()) {
            // Skip rows outside the selection range
            if (rowIndex < startRow || rowIndex > endRow)
                continue;
            for (const [colIndex, cell] of row.entries()) {
                // Skip columns outside the selection range
                if (colIndex < startCol || colIndex > endCol)
                    continue;
                this.processCell(cell);
            }
        }
    }
    /**
     * Processes a single cell to update calculation results.
     * @param {{ getValue: () => any; leftAlign: boolean }} cell - The cell object to process.
     */
    processCell(cell) {
        this.getResult("count").value += 1;
        if (!cell.leftAlign) { // Assuming !leftAlign means it's a numerical value
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
     * Calculates the average based on the sum and numerical count.
     */
    finalizeAverage() {
        const numericalCount = this.getResult("numericalCount").value;
        if (numericalCount > 0) {
            this.getResult("average").value = this.getResult("sum").value / numericalCount;
        }
    }
    /**
     * Displays the calculated results in the UI.
     */
    displayCalculationsFromMap() {
        const count = this.getResult("count").value;
        const numericalCount = this.getResult("numericalCount").value;
        const container = document.querySelector('.calculationsValues');
        if (!container)
            return;
        // Clear display if no or single cell is selected
        if (count <= 1) {
            container.innerHTML = "";
            return;
        }
        /**
         * Helper function to get the HTML string for a calculation display div.
         * @param {string} label - The label for the calculation (e.g., "Count", "Sum").
         * @param {CalculationKey} key - The key to retrieve the calculation result.
         * @returns {string} The HTML string for the calculation display div.
         */
        const getDiv = (label, key) => this.getCalculationDisplayDiv(label, this.getResult(key).value, this.getResult(key).visible);
        let html = "";
        // Display different sets of calculations based on whether numerical values are present
        if (numericalCount === 0) {
            html += getDiv("Count", "count");
        }
        else {
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
     * Generates the HTML string for a single calculation display div.
     * @param {string} label - The label to display for the calculation.
     * @param {number} value - The calculated value.
     * @param {boolean} visible - Whether the display div should be visible.
     * @returns {string} The HTML string.
     */
    getCalculationDisplayDiv(label, value, visible) {
        return `
        <div class="calculationDisplay ${visible ? "" : "hide"}">
            ${label} <span> : ${value}</span>
        </div>`;
    }
}
