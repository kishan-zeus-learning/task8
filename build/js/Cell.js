export class Cell {
    constructor(row, column, value = "") {
        this.row = row;
        this.column = column;
        this.value = value;
        this.leftAlign = Number.isFinite(Number(value));
    }
    setValue(value) {
        this.value = value;
    }
    getValue() {
        return this.value;
    }
}
