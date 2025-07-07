/**
 * Represents a single cell in the spreadsheet
 */
export class Cell {
    /**
     * Initializes a Cell object
     * @param {number} row - The row index of the cell
     * @param {number} column - The column index of the cell
     * @param {string} [value=""] - The initial value of the cell
     */
    constructor(row, column, value = "") {
        this.row = row;
        this.column = column;
        this.value = value;
        this.leftAlign = !Number.isFinite(Number(value));
    }
    /**
     * Updates the value of the cell
     * @param {string} value - The new value to set
     */
    setValue(value) {
        this.value = value;
    }
    /**
     * Retrieves the current value of the cell
     * @returns {string} The current cell value
     */
    getValue() {
        return this.value;
    }
}
