export class GetScrollPosition {
    constructor(rowsManager, columnsManager) {
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
    }
    getIdxTop(scrollTop) {
        let sum = 0;
        for (let i = 1; i <= 4000; i++) {
            const currentSum = this.getSum25Row(i);
            if (sum + currentSum > scrollTop) {
                return { idx: (i - 1), top: sum };
            }
        }
        return { idx: 4000, top: sum };
    }
    getIdxLeft(scrollLeft) {
        let sum = 0;
        for (let i = 1; i <= 40; i++) {
            const currentSum = this.getSum25Column(i);
            if (sum + currentSum > scrollLeft) {
                return { idx: (i - 1), left: sum };
            }
        }
        return { idx: 40, left: sum };
    }
    getSum25Row(idx) {
        let currIdx = idx * 25;
        let sum = 0;
        for (let i = 0; i < 25; i++) {
            currIdx++;
            const currentHeight = this.rowsManager.rowHeights.get(currIdx);
            if (currentHeight) {
                sum += currentHeight.height;
            }
            else {
                sum += this.rowsManager.defaultHeight;
            }
        }
        return sum;
    }
    getSum25Column(idx) {
        let currIdx = idx * 25;
        let sum = 0;
        for (let i = 0; i < 25; i++) {
            currIdx++;
            const currentWidth = this.columnsManager.columnWidths.get(currIdx);
            if (currentWidth) {
                sum += currentWidth.width;
            }
            else {
                sum += this.columnsManager.defaultWidth;
            }
        }
        return sum;
    }
}
