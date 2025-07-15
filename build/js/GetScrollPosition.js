export class GetScrollPosition {
    constructor(rowsManager, columnsManager) {
        this.rowsManager = rowsManager;
        this.columnsManager = columnsManager;
    }
    getIdxTop(scrollTop) {
        let sum = 0;
        let prevSum = 0;
        for (let i = 0; i < 4000; i++) {
            const currentSum = this.getSum25Row(i);
            if (sum + currentSum > scrollTop) {
                return { idx: i - 1, top: prevSum };
            }
            prevSum = sum;
            sum += currentSum;
        }
        return { idx: 3999, top: sum };
    }
    getIdxLeft(scrollLeft) {
        let sum = 0;
        let prevSum = 0;
        for (let i = 0; i < 40; i++) {
            const currentSum = this.getSum25Column(i);
            if (sum + currentSum > scrollLeft) {
                return { idx: (i - 1), left: prevSum };
            }
            prevSum = sum;
            sum += currentSum;
        }
        return { idx: 39, left: prevSum };
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
