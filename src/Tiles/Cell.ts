/**
 * Represents a single cell in the spreadsheet.
 * Each cell holds its row and column indices, a string value, and a flag for text alignment.
 */
export class Cell {
    /**
     * @type {number} The **row index** of the cell. This is a read-only property, meaning it cannot be changed after the cell is created.
     */
    readonly row: number;

    /**
     * @type {number} The **column index** of the cell. This is also a read-only property, set during cell initialization.
     */
    readonly column: number;

    /**
     * @type {string} The **value** stored in the cell. This can be any string, including numbers, text, or formulas.
     */
    private value: string;

    /**
     * @type {boolean} A flag indicating whether the cell content should be **left-aligned**.
     * This is typically true for non-numeric values and false for numeric values (which are usually right-aligned in spreadsheets).
     */
    readonly leftAlign: boolean;

    /**
     * Initializes a new Cell object.
     * When a cell is created, its row and column are fixed. The `leftAlign` property is determined
     * based on whether the initial `value` can be parsed as a finite number.
     * @param {number} row - The row index of the cell (e.g., 1 for the first row).
     * @param {number} column - The column index of the cell (e.g., 1 for the first column).
     * @param {string} [value=""] - The initial value to store in the cell. Defaults to an empty string if not provided.
     */
    constructor(row: number, column: number, value: string = "") {
        this.row = row;
        this.column = column;
        this.value = value;
        // Determine alignment: if the value is NOT a finite number, it's left-aligned.
        this.leftAlign = !Number.isFinite(Number(value));
    }

    /**
     * Updates the **value** of the cell.
     * Note: This method only changes the `value` property. The `leftAlign` property is set during construction and does not automatically update with `setValue`.
     * If alignment needs to change dynamically, it would require re-evaluating `leftAlign` here or on render.
     * @param {string} value - The new string value to set for the cell.
     */
    setValue(value: string) {
        this.value = value;
    }

    /**
     * Retrieves the **current value** stored in the cell.
     * @returns {string} The current string content of the cell.
     */
    getValue(): string {
        return this.value;
    }
}