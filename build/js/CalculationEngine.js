export class CalculationEngine {
    constructor(cellsMap, ifTilesSelectionOn, ifRowsSelectionOn, ifColumnsSelectionOn, selectionCoordinates) {
        this.calculationResults = new Map();
        this.cellsMap = cellsMap;
        this.ifTilesSelectionOn = ifTilesSelectionOn;
        this.ifRowsSelectionOn = ifRowsSelectionOn;
        this.ifColumnsSelectionOn = ifColumnsSelectionOn;
        this.selectionCoordinates = selectionCoordinates;
        // Set visibility only once here
        this.calculationResults.set("count", { value: 0, visible: true });
        this.calculationResults.set("numericalCount", { value: 0, visible: true });
        this.calculationResults.set("sum", { value: 0, visible: true });
        this.calculationResults.set("average", { value: 0, visible: true });
        this.calculationResults.set("min", { value: Number.MAX_VALUE, visible: true });
        this.calculationResults.set("max", { value: Number.MIN_VALUE, visible: true });
        this.handleDropDownVisibility();
        this.handleBottomDiv();
    }
    handlePointerUpEvent(event) {
        if (this.ifTilesSelectionOn.value) {
            this.handleTileSelection();
        }
        if (this.ifRowsSelectionOn.value) {
            this.handleRowsSelection();
        }
        if (this.ifColumnsSelectionOn.value) {
            this.handleColumnsSelection();
        }
    }
    resetCalculationResults() {
        this.calculationResults.get("count").value = 0;
        this.calculationResults.get("numericalCount").value = 0;
        this.calculationResults.get("sum").value = 0;
        this.calculationResults.get("average").value = 0;
        this.calculationResults.get("min").value = Number.MAX_VALUE;
        this.calculationResults.get("max").value = Number.MIN_VALUE;
    }
    handleTileSelection() {
        this.resetCalculationResults();
        const startRow = Math.min(this.selectionCoordinates.selectionStartRow, this.selectionCoordinates.selectionEndRow);
        const endRow = Math.max(this.selectionCoordinates.selectionStartRow, this.selectionCoordinates.selectionEndRow);
        const startColumn = Math.min(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const endColumn = Math.max(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        for (let i = startRow; i <= endRow; i++) {
            const currentRow = this.cellsMap.get(i);
            if (!currentRow)
                continue;
            for (let j = startColumn; j <= endColumn; j++) {
                const currentCell = currentRow.get(j);
                if (!currentCell)
                    continue;
                this.calculationResults.get("count").value += 1;
                if (!currentCell.leftAlign) {
                    const num = Number(currentCell.getValue());
                    this.calculationResults.get("numericalCount").value += 1;
                    this.calculationResults.get("sum").value += num;
                    this.calculationResults.get("min").value = Math.min(this.calculationResults.get("min").value, num);
                    this.calculationResults.get("max").value = Math.max(this.calculationResults.get("max").value, num);
                }
            }
        }
        if (this.calculationResults.get("numericalCount").value > 0) {
            this.calculationResults.get("average").value =
                this.calculationResults.get("sum").value / this.calculationResults.get("numericalCount").value;
        }
        this.displayCalculationsFromMap();
    }
    handleRowsSelection() {
        this.resetCalculationResults();
        const startRow = Math.min(this.selectionCoordinates.selectionStartRow, this.selectionCoordinates.selectionEndRow);
        const endRow = Math.max(this.selectionCoordinates.selectionStartRow, this.selectionCoordinates.selectionEndRow);
        for (let i = startRow; i <= endRow; i++) {
            const currentRow = this.cellsMap.get(i);
            if (!currentRow)
                continue;
            for (let cell of currentRow.values()) {
                this.calculationResults.get("count").value += 1;
                if (!cell.leftAlign) {
                    const num = Number(cell.getValue());
                    this.calculationResults.get("numericalCount").value += 1;
                    this.calculationResults.get("sum").value += num;
                    this.calculationResults.get("min").value = Math.min(this.calculationResults.get("min").value, num);
                    this.calculationResults.get("max").value = Math.max(this.calculationResults.get("max").value, num);
                }
            }
        }
        if (this.calculationResults.get("numericalCount").value > 0) {
            this.calculationResults.get("average").value =
                this.calculationResults.get("sum").value / this.calculationResults.get("numericalCount").value;
        }
        this.displayCalculationsFromMap();
    }
    handleColumnsSelection() {
        this.resetCalculationResults();
        const startColumn = Math.min(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        const endColumn = Math.max(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
        for (let columnMap of this.cellsMap.values()) {
            for (let j = startColumn; j <= endColumn; j++) {
                const currentCell = columnMap.get(j);
                if (!currentCell)
                    continue;
                this.calculationResults.get("count").value += 1;
                if (!currentCell.leftAlign) {
                    const num = Number(currentCell.getValue());
                    this.calculationResults.get("numericalCount").value += 1;
                    this.calculationResults.get("sum").value += num;
                    this.calculationResults.get("min").value = Math.min(this.calculationResults.get("min").value, num);
                    this.calculationResults.get("max").value = Math.max(this.calculationResults.get("max").value, num);
                }
            }
        }
        if (this.calculationResults.get("numericalCount").value > 0) {
            this.calculationResults.get("average").value =
                this.calculationResults.get("sum").value / this.calculationResults.get("numericalCount").value;
        }
        this.displayCalculationsFromMap();
    }
    displayCalculationsFromMap() {
        console.log({
            count: this.calculationResults.get("count").value,
            numericalCount: this.calculationResults.get("numericalCount").value,
            sum: this.calculationResults.get("sum").value,
            average: this.calculationResults.get("average").value,
            min: this.calculationResults.get("min").value,
            max: this.calculationResults.get("max").value,
        });
    }
    handleBottomDiv() {
        // Placeholder
    }
    handleDropDownVisibility() {
        const dropDownIcon = document.querySelector('.dropdownIcon');
        const dropDownOptions = document.querySelector('.dropDownOptions');
        dropDownOptions.style.visibility = "hidden";
        dropDownIcon.addEventListener("click", (event) => {
            dropDownOptions.style.visibility =
                dropDownOptions.style.visibility === "hidden" ? "visible" : "hidden";
        });
    }
}
