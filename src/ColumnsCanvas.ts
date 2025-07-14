// ColumnsCanvas.ts with comments

// Imports remain unchanged
import { ColumnData } from "./types/ColumnRows";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";
import { NumberObj } from "./types/NumberObj";

/**
 * Manages the rendering and interaction of column headers on a canvas.
 * Handles column resizing and visual feedback for selections.
 */
export class ColumnsCanvas {
  /** A map storing custom widths for columns. */
  readonly columnWidths: ColumnData;
  /** Prefix sums of column widths, defining column boundaries. */
  readonly columnsPositionArr: number[];
  /** The unique identifier for this canvas block (0 for A-Y, 1 for Z-AY, etc.) */
  readonly columnID: number;
  /** The DOM container for this canvas and resize handle. */
  readonly columnCanvasDiv: HTMLDivElement;
  /** The canvas element used for drawing headers. */
  readonly columnCanvas: HTMLCanvasElement = document.createElement("canvas");
  /** The default column width. */
  private defaultWidth: number;
  /** The default header height. */
  private defaultHeight: number;
  /** The draggable resize indicator. */
  private resizeDiv: HTMLDivElement = document.createElement("div");
  /** Selection coordinates shared globally. */
  private selectionCoordinates: MultipleSelectionCoordinates;
  /** Used to track new width after resizing for undo. */
  private newValue: number = 100;

  constructor(
    columnID: number,
    columnWidths: ColumnData,
    defaultWidth: number,
    defaultHeight: number,
    selectionCoordinates: MultipleSelectionCoordinates
  ) {
    this.columnWidths = columnWidths;
    this.columnID = columnID;
    this.defaultHeight = defaultHeight;
    this.defaultWidth = defaultWidth;
    this.columnsPositionArr = [];
    this.selectionCoordinates = selectionCoordinates;
    this.setColumnsPositionArr();
    this.columnCanvasDiv = this.createcolumnCanvas();
  }

  getNewValue(): number {
    return this.newValue;
  }

  /**
   * Called by external resizer to change column width dynamically.
   */
  resizeColumn(newPosition: number, hoverIdx: number, columnKey: number) {
    newPosition = newPosition - this.columnCanvasDiv.getBoundingClientRect().left;
    let newWidth = hoverIdx !== 0
      ? newPosition - this.columnsPositionArr[hoverIdx - 1]
      : newPosition;

    newWidth = Math.max(50, Math.min(500, newWidth));
    this.resizeDiv.style.left = hoverIdx !== 0
      ? `${this.columnsPositionArr[hoverIdx - 1] + newWidth}px`
      : `${newWidth}px`;

    columnKey = this.columnID * 25 + hoverIdx + 1;
    this.changeWidth(newWidth, columnKey);
  }

  changeWidth(newWidth: number, columnKey: number) {
    this.newValue = newWidth;
    if (newWidth === this.defaultWidth) {
      this.columnWidths.delete(columnKey);
    } else {
      this.columnWidths.set(columnKey, { width: newWidth });
    }
    this.setColumnsPositionArr();
    this.drawCanvas();
  }

  binarySearchRange(num: number): number {
    let start = 0;
    let end = 24;
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
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

  private createcolumnCanvas(): HTMLDivElement {
    const columnDiv = document.createElement("div");
    columnDiv.id = `column${this.columnID}`;
    columnDiv.classList.add("subColumn");
    this.columnCanvas.setAttribute("col", `${this.columnID}`);
    this.drawCanvas();
    columnDiv.appendChild(this.columnCanvas);
    this.resizeDiv.classList.add("ColumnResizeDiv");
    columnDiv.appendChild(this.resizeDiv);
    return columnDiv;
  }

  drawCanvas() {
    const canvasStartColumn = Math.min(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
    const canvasEndColumn = Math.max(this.selectionCoordinates.selectionStartColumn, this.selectionCoordinates.selectionEndColumn);
    const startNum = this.columnID * 25 + 1;
    const dpr = window.devicePixelRatio || 1;
    this.columnCanvas.width = this.columnsPositionArr[24] * dpr;
    this.columnCanvas.height = this.defaultHeight * dpr;
    this.columnCanvas.style.width = `${this.columnsPositionArr[24]}px`;
    this.columnCanvas.style.height = `${this.defaultHeight}px`;

    const ctx = this.columnCanvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.columnsPositionArr[24], this.defaultHeight);
    ctx.scale(dpr, dpr);
    ctx.font = "12px Arial";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, this.columnsPositionArr[24], this.defaultHeight);

    ctx.strokeStyle = "#ddd";
    ctx.beginPath();
    ctx.moveTo(0, this.defaultHeight - 0.5);
    ctx.lineTo(this.columnsPositionArr[24], this.defaultHeight - 0.5);
    ctx.stroke();

    for (let i = 0; i < 25; i++) {
      const xLeft = i === 0 ? 0 : this.columnsPositionArr[i - 1];
      const xRight = this.columnsPositionArr[i];
      const colIndex = i + startNum;
      const xCenter = xRight - (xRight - xLeft) / 2;

      if (this.ifSelected(colIndex)) {
        if (this.ifSelectedWhole()) {
          ctx.fillStyle = "#107C41";
          ctx.fillRect(xLeft, 0, xRight - xLeft, this.defaultHeight);
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#ffffff";
        } else {
          ctx.fillStyle = "#CAEAD8";
          ctx.fillRect(xLeft, 0, xRight - xLeft, this.defaultHeight);
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#107C41";
          ctx.moveTo(xLeft, this.defaultHeight - 1);
          ctx.lineTo(xRight, this.defaultHeight - 1);
          ctx.stroke();
          ctx.fillStyle = "#0F703B";
          ctx.strokeStyle = "#A0D8B9";
        }
      } else {
        ctx.fillStyle = "#616161";
        ctx.strokeStyle = "#ddd";
      }

      ctx.beginPath();
      ctx.moveTo(this.columnsPositionArr[i] - 0.5, 0);
      ctx.lineTo(this.columnsPositionArr[i] - 0.5, this.defaultHeight);
      ctx.stroke();

      ctx.fillText(this.getColumnString(colIndex), xCenter, this.defaultHeight / 2 + 1);
    }
  }

  private ifSelected(num: number): boolean {
    const start = Math.min(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
    const end = Math.max(this.selectionCoordinates.selectionEndColumn, this.selectionCoordinates.selectionStartColumn);
    return num >= start && num <= end;
  }

  private ifSelectedWhole(): boolean {
    const start = Math.min(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
    const end = Math.max(this.selectionCoordinates.selectionEndRow, this.selectionCoordinates.selectionStartRow);
    return start === 1 && end === 1000000;
  }

  setColumnsPositionArr() {
    const startNum = this.columnID * 25 + 1;
    let prefixSum = 0;
    this.columnsPositionArr.length = 0;
    for (let i = 0; i < 25; i++) {
      const col = this.columnWidths.get(startNum + i);
      prefixSum += col ? col.width : this.defaultWidth;
      this.columnsPositionArr.push(prefixSum);
    }
  }

  private getColumnString(num: number): string {
    num--;
    if (num < 0) return "";
    return this.getColumnString(Math.floor(num / 26)) + String.fromCharCode("A".charCodeAt(0) + (num % 26));
  }
}