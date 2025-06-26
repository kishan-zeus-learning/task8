export class Cell {
    constructor(row, column, value = "") {
        this.row = row;
        this.column = column;
        this.value = value;
    }
    setValue(value) {
        this.value = value;
    }
    getValue() {
        return this.value;
    }
}
