/**
 * Manages calculations (count, sum, average, min, max) for selected cells.
 */
export class CalculationEngine {
    /**
     * @param {CellsMap} cellsMap - A map containing all cell data.
     * @param {BooleanObj} ifTilesSelectionOn - Boolean object indicating if tile selection is active.
     * @param {BooleanObj} ifRowsSelectionOn - Boolean object indicating if row selection is active.
     * @param {BooleanObj} ifColumnsSelectionOn - Boolean object indicating if column selection is active.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - Object holding the coordinates of the current selection.
     */
    constructor(cellsMap, ifTilesSelectionOn, ifRowsSelectionOn, ifColumnsSelectionOn, selectionCoordinates) {
        this.cellsMap = cellsMap;
        this.ifTilesSelectionOn = ifTilesSelectionOn;
        this.ifRowsSelectionOn = ifRowsSelectionOn;
        this.ifColumnsSelectionOn = ifColumnsSelectionOn;
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
     * Handles the pointer up event to trigger calculations based on the active selection type.
     * @param {PointerEvent} _ - The pointer event object (unused but required by event listener signature).
     */
    handlePointerUpEvent(_) {
        if (this.ifTilesSelectionOn.value)
            this.handleTileSelection();
        if (this.ifRowsSelectionOn.value)
            this.handleRowsSelection();
        if (this.ifColumnsSelectionOn.value)
            this.handleColumnsSelection();
    }
    /**
     * Performs calculations for a selected range of cells (tiles).
     */
    handleTileSelection() {
        this.resetCalculationResults();
        const { selectionStartRow, selectionEndRow, selectionStartColumn, selectionEndColumn } = this.selectionCoordinates;
        const startRow = Math.min(selectionStartRow, selectionEndRow);
        const endRow = Math.max(selectionStartRow, selectionEndRow);
        const startCol = Math.min(selectionStartColumn, selectionEndColumn);
        const endCol = Math.max(selectionStartColumn, selectionEndColumn);
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
        this.finalizeAverage();
        this.displayCalculationsFromMap();
    }
    /**
     * Performs calculations for a selected range of rows.
     */
    handleRowsSelection() {
        this.resetCalculationResults();
        const start = Math.min(this.selectionCoordinates.selectionStartRow, this.selectionCoordinates.selectionEndRow);
        const end = Math.max(this.selectionCoordinates.selectionStartRow, this.selectionCoordinates.selectionEndRow);
        for (let i = start; i <= end; i++) {
            const row = this.cellsMap.get(i);
            if (!row)
                continue;
            for (const cell of row.values()) {
                this.processCell(cell);
            }
        }
        this.finalizeAverage();
        this.displayCalculationsFromMap();
    }
    /**
     * Performs calculations for a selected range of columns.
     */
    handleColumnsSelection() {
        this.resetCalculationResults();
        const start = Math.min(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const end = Math.max(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        for (const row of this.cellsMap.values()) {
            for (let j = start; j <= end; j++) {
                const cell = row.get(j);
                if (!cell)
                    continue;
                this.processCell(cell);
            }
        }
        this.finalizeAverage();
        this.displayCalculationsFromMap();
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
