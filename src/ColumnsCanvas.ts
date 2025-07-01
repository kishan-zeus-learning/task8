import { columnData } from "./types/ColumnRows";
import { GlobalBoolean } from "./types/GlobalBoolean";
import { GlobalNumber } from "./types/GlobalNumber";

/**
 * Represents a canvas component for rendering a group of 25 Excel-style columns.
 * Supports rendering, resizing, and hover interactions for each column.
 */
export class ColumnsCanvas {
    /** Stores column widths for each column, keyed by column number */
    private columnWidths: columnData;

    /** Array storing the cumulative position (in px) of columns for rendering boundaries */
    public columnsPositionArr: number[];

    /** Unique ID for the current column block (25 columns per block) */
    readonly columnID: number;

    /** Main div containing the canvas and resize div */
    readonly columnCanvasDiv: HTMLDivElement;

    /** Canvas element where column headers are drawn */
    public columnCanvas: HTMLCanvasElement = document.createElement("canvas");

    /** Default column width if no custom width is specified */
    private defaultWidth: number;

    /** Default column height */
    private defaultHeight: number;

    /** Div used for displaying the resize line during hover/drag */
    private resizeDiv: HTMLDivElement = document.createElement("div");

    /** Global flag to indicate whether resize mode is active */
    private ifResizeOn: GlobalBoolean;

    /** Stores the index of the column currently being resized */
    private currentResizingColumn: GlobalNumber;

    /** Flag to detect if pointer is down during a resize action */
    private ifResizePointerDown: GlobalBoolean;

    /** Tracks the index of the column currently being hovered for resizing */
    private hoverIdx: number = -1;

    /**
     * Initializes the ColumnsCanvas
     * @param {number} columnID - Unique ID for the column block
     * @param {columnData} columnWidths - Object storing column width info
     * @param {number} defaultWidth - Default column width
     * @param {number} defaultHeight - Default column height
     * @param {GlobalBoolean} ifResizeOn - Global flag for resize hover
     * @param {GlobalBoolean} ifResizePointerDown - Global flag for active pointer during resize
     * @param {GlobalNumber} currentResizingColumn - Global index of the column currently being resized
     */
    constructor(
        columnID: number,
        columnWidths: columnData,
        defaultWidth: number,
        defaultHeight: number,
        ifResizeOn: GlobalBoolean,
        ifResizePointerDown: GlobalBoolean,
        currentResizingColumn: GlobalNumber
    ) {
        this.columnWidths = columnWidths;
        this.columnID = columnID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.columnsPositionArr = [];
        this.currentResizingColumn = currentResizingColumn;
        this.ifResizeOn = ifResizeOn;
        this.ifResizePointerDown = ifResizePointerDown;
        this.setColumnsPositionArr();
        this.columnCanvasDiv = this.createcolumnCanvas();
        this.handleResize();
    }

    /**
     * Attaches event listeners for handling column resize operations
     */
    private handleResize() {
        this.columnCanvasDiv.addEventListener("pointerdown", (event) => {
            this.ifResizePointerDown.value = true;
        });

        this.columnCanvasDiv.addEventListener("pointermove", (event) => {
            if (this.ifResizePointerDown.value) {
                this.currentResizingColumn.value = this.columnID;
                return;
            }

            this.hoverIdx = this.binarySearchRange(event.offsetX);

            if (this.hoverIdx !== -1) {
                this.ifResizeOn.value = true;
                this.resizeDiv.style.display = "block";
                this.resizeDiv.style.left = `${this.columnsPositionArr[this.hoverIdx] - 1.5}px`;
                this.resizeDiv.style.zIndex = `10`;
            } else {
                if (!this.ifResizePointerDown.value) {
                    this.resizeDiv.style.display = "none";
                }
                this.ifResizeOn.value = false;
            }
        });

        this.columnCanvasDiv.addEventListener("pointerout", (event) => {
            if (!this.ifResizePointerDown.value) {
                this.resizeDiv.style.display = "none";
            }
            this.ifResizeOn.value = false;
        });
    }

    /**
     * Resizes the selected column based on new pointer position
     * @param {number} newPosition - New pointer x-coordinate for resize
     */
    public resizeColumn(newPosition: number) {
        newPosition = newPosition - this.columnCanvasDiv.getBoundingClientRect().left;

        let newWidth;

        if (this.hoverIdx !== 0) {
            newWidth = newPosition - this.columnsPositionArr[this.hoverIdx - 1];
        } else {
            newWidth = newPosition;
        }

        // Clamp newWidth to acceptable limits
        newWidth = Math.max(50, newWidth);
        newWidth = Math.min(500, newWidth);

        if (this.hoverIdx !== 0) {
            this.resizeDiv.style.left = `${this.columnsPositionArr[this.hoverIdx - 1] + newWidth}px`;
        } else {
            this.resizeDiv.style.left = `${newWidth}px`;
        }

        // Update width in columnWidths or delete if default
        if (newWidth === this.defaultWidth)
            delete this.columnWidths[this.columnID * 25 + this.hoverIdx + 1];
        else
            this.columnWidths[this.columnID * 25 + this.hoverIdx + 1] = { width: newWidth };

        this.setColumnsPositionArr();
        this.drawCanvas();
    }

    /**
     * Performs binary search to determine if mouse is near a column boundary
     * @param {number} num - X-position of the mouse
     * @returns {number} Index of column near boundary, -1 if none
     */
    private binarySearchRange(num: number) {
        let start = 0;
        let end = 24;
        let mid;
        while (start <= end) {
            mid = Math.floor((start + end) / 2);

            if (this.columnsPositionArr[mid] + 5 >= num && num >= this.columnsPositionArr[mid] - 5) {
                return mid;
            } else if (num > this.columnsPositionArr[mid]) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        return -1;
    }

    /**
     * Creates the column canvas div and initializes rendering
     * @returns {HTMLDivElement} Column div container
     */
    private createcolumnCanvas() {
        const columnDiv = document.createElement("div");
        columnDiv.id = `column${this.columnID}`;
        columnDiv.classList.add("subColumn");

        this.drawCanvas();

        columnDiv.appendChild(this.columnCanvas);
        this.resizeDiv.classList.add("ColumnResizeDiv");
        columnDiv.appendChild(this.resizeDiv);

        return columnDiv;
    }

    /**
     * Draws the column headers on the canvas
     */
    drawCanvas() {
        this.columnCanvas.width = this.columnsPositionArr[24];
        this.columnCanvas.height = this.defaultHeight;

        const ctx = this.columnCanvas.getContext("2d") as CanvasRenderingContext2D;

        ctx.beginPath();
        ctx.fillStyle = "#f5f5f5";
        ctx.font = "12px Arial";
        ctx.lineWidth = 1;

        ctx.fillRect(0, 0, this.columnsPositionArr[24], this.defaultHeight);
        ctx.fillStyle = "#616161";

        let startNum = this.columnID * 25 + 1;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";

        ctx.strokeStyle="#ddd";

        for (let i = 0; i < 25; i++) {
            ctx.moveTo(this.columnsPositionArr[i] - 0.5, 0);
            ctx.lineTo(this.columnsPositionArr[i] - 0.5, this.defaultHeight);
            ctx.fillText(
                this.getColumnString(i + startNum),
                this.columnsPositionArr[i] -
                    (this.columnsPositionArr[i] - (i == 0 ? 0 : this.columnsPositionArr[i - 1])) / 2,
                this.defaultHeight / 2 + 1
            );
        }

        ctx.moveTo(0, this.defaultHeight);
        ctx.lineTo(this.columnsPositionArr[24] - 0.5, this.defaultHeight);
        ctx.moveTo(0, 0);
        ctx.lineTo(this.columnsPositionArr[24] - 0.5, 0);
        ctx.stroke();
    }

    /**
     * Updates `columnsPositionArr` based on current column widths
     */
    private setColumnsPositionArr() {
        let startNum = this.columnID * 25 + 1;
        let prefixSum = 0;
        this.columnsPositionArr.length = 0;

        for (let i = 0; i < 25; i++) {
            if (this.columnWidths[startNum + i]) {
                prefixSum += this.columnWidths[startNum + i].width;
            } else {
                prefixSum += this.defaultWidth;
            }
            this.columnsPositionArr.push(prefixSum);
        }
    }

    /**
     * Converts a numeric column index to its Excel-style string (e.g., 1 -> A, 27 -> AA)
     * @param {number} num - The column index (1-based)
     * @returns {string} Excel-style column label
     */
    private getColumnString(num: number): string {
        num--;
        if (num < 0) return "";
        return this.getColumnString(Math.floor(num / 26)) + String.fromCharCode("A".charCodeAt(0) + (num % 26));
    }
}
