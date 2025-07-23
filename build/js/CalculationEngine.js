/**
 * Manages statistical calculations like count, sum, average, min, and max
 * for a selected rectangular range of cells in the spreadsheet. It optimizes
 * calculation by choosing the most efficient iteration method (over selected range
 * or over existing cells map) based on the sparsity of the data.
 */
export class CalculationEngine {
    /**
     * Initializes the CalculationEngine instance.
     * @param {CellsMap} cellsMap - The main map of all cells (sparse 2D structure) in the spreadsheet.
     * @param {MultipleSelectionCoordinates} selectionCoordinates - The current selection range coordinates in the spreadsheet.
     */
    constructor(cellsMap, selectionCoordinates) {
        /**
         * @type {Map<CalculationKey, CalculationResult>} Holds the current result values of various calculations.
         * Each key corresponds to a specific calculation type (e.g., "count", "sum").
         */
        this.calculationResults = new Map();
        this.cellsMap = cellsMap;
        this.selectionCoordinates = selectionCoordinates;
        this.initializeCalculationResults(); // Set up initial default values for all calculations.
    }
    /**
     * Sets up the initial values for all calculation types in the `calculationResults` map.
     * Default values are chosen to correctly initialize sums (0), counts (0), and extreme values (MAX_VALUE for min, MIN_VALUE for max).
     */
    initializeCalculationResults() {
        this.calculationResults.set("count", { value: 0, visible: true });
        this.calculationResults.set("numericalCount", { value: 0, visible: true });
        this.calculationResults.set("sum", { value: 0, visible: true });
        this.calculationResults.set("average", { value: 0, visible: true });
        // Initialize min to the largest possible number so any actual number will be smaller.
        this.calculationResults.set("min", { value: Number.MAX_VALUE, visible: true });
        // Initialize max to the smallest possible number so any actual number will be larger.
        this.calculationResults.set("max", { value: Number.MIN_VALUE, visible: true });
    }
    /**
     * Safely retrieves a `CalculationResult` object from the `calculationResults` map using its key.
     * Throws an error if the specified `key` is not found, indicating a potential programming mistake.
     * @param {CalculationKey} key - The key identifying the desired calculation result.
     * @returns {CalculationResult} The `CalculationResult` object associated with the key.
     * @throws {Error} If the calculation result for the given key is not found.
     */
    getResult(key) {
        const result = this.calculationResults.get(key);
        if (!result) {
            // This error indicates an unexpected state, likely a typo in a key or uninitialized value.
            throw new Error(`Calculation result for '${key}' not found.`);
        }
        return result;
    }
    /**
     * Resets all calculation results to their default initial values.
     * This prepares the engine for a fresh recalculation, typically after a selection change.
     */
    resetCalculationResults() {
        this.getResult("count").value = 0;
        this.getResult("numericalCount").value = 0;
        this.getResult("sum").value = 0;
        this.getResult("average").value = 0;
        this.getResult("min").value = Number.MAX_VALUE; // Reset min to max value for comparison
        this.getResult("max").value = Number.MIN_VALUE; // Reset max to min value for comparison
    }
    /**
     * Handles the recalculation of all statistical values when the selection changes.
     * It first resets all previous results, then determines the most efficient way to
     * iterate over the relevant cells (either by iterating the selection range or the `cellsMap`),
     * processes the cells, finalizes the average, and then updates the display.
     */
    handleSelection() {
        this.resetCalculationResults(); // Clear previous results.
        // Get and normalize the selection coordinates to ensure start <= end.
        const { selectionStartRow, selectionEndRow, selectionStartColumn, selectionEndColumn } = this.selectionCoordinates;
        const startRow = Math.min(selectionStartRow, selectionEndRow);
        const endRow = Math.max(selectionStartRow, selectionEndRow);
        const startCol = Math.min(selectionStartColumn, selectionEndColumn);
        const endCol = Math.max(selectionStartColumn, selectionEndColumn);
        const rangeRowCount = endRow - startRow + 1; // Number of rows in the selected range.
        const mapRowCount = this.cellsMap.size; // Number of rows with at least one cell in the entire map.
        // Optimize iteration: If the number of rows in the selected range is smaller than
        // the number of *non-empty* rows in the entire spreadsheet, iterate over the range.
        // Otherwise, iterate over the sparse map (which is faster for very sparse data or large selections).
        if (mapRowCount > rangeRowCount) {
            this.iterateOverRange(startRow, endRow, startCol, endCol);
        }
        else {
            this.iterateOverMap(startRow, endRow, startCol, endCol);
        }
        this.finalizeAverage(); // Calculate the average after all cells are processed.
        this.displayCalculationsFromMap(); // Update the UI with the new calculation results.
    }
    /**
     * Iterates through each row and column within the defined rectangular selection range.
     * It checks if a cell exists at each position and, if so, processes it.
     * This method is generally efficient for dense selections or smaller total maps.
     * @param {number} startRow - The starting row index of the selection.
     * @param {number} endRow - The ending row index of the selection.
     * @param {number} startCol - The starting column index of the selection.
     * @param {number} endCol - The ending column index of the selection.
     */
    iterateOverRange(startRow, endRow, startCol, endCol) {
        // Loop through each row in the selected range.
        for (let i = startRow; i <= endRow; i++) {
            const row = this.cellsMap.get(i);
            if (!row)
                continue; // If the row has no cells, skip it.
            // Loop through each column in the selected range for the current row.
            for (let j = startCol; j <= endCol; j++) {
                const cell = row.get(j);
                if (!cell)
                    continue; // If the cell doesn't exist, skip it.
                this.processCell(cell); // Process the existing cell.
            }
        }
    }
    /**
     * Iterates only through existing non-empty cells in the `cellsMap`.
     * For each existing cell, it checks if it falls within the current selection range.
     * This method is generally more efficient for sparse data or very large selection ranges.
     * @param {number} startRow - The starting row index of the selection.
     * @param {number} endRow - The ending row index of the selection.
     * @param {number} startCol - The starting column index of the selection.
     * @param {number} endCol - The ending column index of the selection.
     */
    iterateOverMap(startRow, endRow, startCol, endCol) {
        // Iterate over each row that has at least one cell.
        for (const [rowIndex, row] of this.cellsMap.entries()) {
            // Skip rows that are outside the selected row range.
            if (rowIndex < startRow || rowIndex > endRow)
                continue;
            // Iterate over each cell within the current row.
            for (const [colIndex, cell] of row.entries()) {
                // Skip cells that are outside the selected column range.
                if (colIndex < startCol || colIndex > endCol)
                    continue;
                this.processCell(cell); // Process the cell if it's within the selection.
            }
        }
    }
    /**
     * Processes a single cell to update the `count`, `sum`, `min`, `max`, and `numericalCount` results.
     * It increments `count` for every non-empty cell. For numerical cells (where `leftAlign` is false),
     * it converts the value to a number and updates `sum`, `min`, `max`, and `numericalCount`.
     * @param {Cell} cell - The `Cell` instance to be processed. Assumes `leftAlign` correctly indicates numeric vs. non-numeric content.
     */
    processCell(cell) {
        this.getResult("count").value += 1; // Increment total cell count.
        if (!cell.leftAlign) {
            // If the cell is not left-aligned, it's assumed to contain a numerical value.
            const num = Number(cell.getValue()); // Convert cell value to a number.
            // Get references to the calculation results for easier access.
            const numerical = this.getResult("numericalCount");
            const sum = this.getResult("sum");
            const min = this.getResult("min");
            const max = this.getResult("max");
            numerical.value += 1; // Increment numerical cell count.
            sum.value += num; // Add to the total sum.
            min.value = Math.min(min.value, num); // Update minimum value.
            max.value = Math.max(max.value, num); // Update maximum value.
        }
    }
    /**
     * Computes the `average` calculation result based on the `sum` and `numericalCount`
     * of the processed cells. If `numericalCount` is zero, the average remains 0.
     */
    finalizeAverage() {
        const numericalCount = this.getResult("numericalCount").value;
        if (numericalCount > 0) {
            this.getResult("average").value = this.getResult("sum").value / numericalCount;
        }
        else {
            this.getResult("average").value = 0; // If no numerical values, average is 0.
        }
    }
    /**
     * Displays the calculated results in the `.calculationsValues` HTML container.
     * If one or zero cells are selected, the display container is cleared.
     * Otherwise, it dynamically generates HTML to show the relevant statistics.
     * If there are no numerical cells, only the "Count" is displayed.
     */
    displayCalculationsFromMap() {
        const count = this.getResult("count").value; // Total count of selected cells.
        const numericalCount = this.getResult("numericalCount").value; // Count of numerical cells.
        const container = document.querySelector('.calculationsValues'); // The HTML container for display.
        if (!container)
            return; // Exit if the display container is not found.
        // If only one or zero cells are selected, clear the display.
        if (count <= 1) {
            container.innerHTML = "";
            return;
        }
        // Helper function to generate display HTML for a specific calculation.
        const getDiv = (label, key) => this.getCalculationDisplayDiv(label, this.getResult(key).value, this.getResult(key).visible);
        let html = ""; // String to build the HTML content.
        // Determine which calculations to display based on whether numerical data exists.
        if (numericalCount === 0) {
            // If no numerical data, only display the total count.
            html += getDiv("Count", "count");
        }
        else {
            // If numerical data exists, display all relevant statistics.
            html += getDiv("Average", "average");
            html += getDiv("Count", "count");
            html += getDiv("Numerical Count", "numericalCount");
            html += getDiv("Min", "min");
            html += getDiv("Max", "max");
            html += getDiv("Sum", "sum");
        }
        container.innerHTML = html; // Update the content of the display container.
    }
    /**
     * Generates an HTML string for a single calculation result display box.
     * This div includes a label and the calculated value.
     * @param {string} label - The human-readable label for the calculation (e.g., "Sum", "Average").
     * @param {number} value - The numerical result of the calculation.
     * @param {boolean} visible - A flag to control the visibility of the div (adds "hide" class if false).
     * @returns {string} The HTML string for the calculation display div.
     */
    getCalculationDisplayDiv(label, value, visible) {
        // Format numbers to 2 decimal places for better readability, unless it's an integer.
        const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);
        return `
        <div class="calculationDisplay ${visible ? "" : "hide"}">
            ${label} <span> : ${formattedValue}</span>
        </div>`;
    }
}
