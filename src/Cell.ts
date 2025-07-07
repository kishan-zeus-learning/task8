/**
 * Represents a single cell in the spreadsheet
 */
export class Cell {
    /** @type {number} The row index of the cell */
    readonly row: number;

    /** @type {number} The column index of the cell */
    readonly column: number;

    /** @type {string} The value stored in the cell */
    private value: string;

    /** @type {boolean} Whether the cell content should be left-aligned (non-numeric values) */
    readonly leftAlign: boolean;

    /**
     * Initializes a Cell object
     * @param {number} row - The row index of the cell
     * @param {number} column - The column index of the cell
     * @param {string} [value=""] - The initial value of the cell
     */
    constructor(row: number, column: number, value: string = "") {
        this.row = row;
        this.column = column;
        this.value = value;
        this.leftAlign = !Number.isFinite(Number(value));
    }

    /**
     * Updates the value of the cell
     * @param {string} value - The new value to set
     */
    setValue(value: string) {
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
