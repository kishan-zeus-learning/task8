import { BooleanObj } from "./types/BooleanObj.js";
import { NumberObj } from "./types/NumberObj.js";
import { MultipleSelectionCoordinates } from "./types/MultipleSelectionCoordinates";
import { RowData } from "./types/RowsColumn";

/**
 * Represents a canvas-based rendering of a block of 25 rows.
 * Handles row drawing, resizing, and rendering optimizations.
 */
export class RowsCanvas {
    /** Map that stores custom row heights keyed by row number */
private rowHeights: RowData;


    /** Prefix sum of each row's vertical position */
    readonly rowsPositionArr: number[];

    /** Row block ID (each block represents 25 rows) */
    readonly rowID: number;

    /** Container div for rowCanvas and resize UI */
    readonly rowCanvasDiv: HTMLDivElement;

    /** The canvas element used to render rows */
    readonly rowCanvas: HTMLCanvasElement = document.createElement("canvas");

    /** Default width of each row (in pixels) */
    private defaultWidth: number;

    /** Default height of each row (in pixels) */
    private defaultHeight: number;

    /** The horizontal resize UI indicator element */
    private resizeDiv: HTMLDivElement = document.createElement("div");

    /** Global flag to show or hide resize line on hover */
    private ifResizeOn: { value: boolean };

    /** Global shared variable storing the currently resizing row ID */
    private currentResizingRow: NumberObj;

    /** Global flag indicating if the pointer is pressed during resize */
    private ifResizePointerDown: { value: boolean };

    /** Index of the row currently being hovered near a resize boundary */
    private hoverIdx: number = -1;

    private  selectionCoordinates:MultipleSelectionCoordinates;

    /**
     * Initializes the RowsCanvas with layout and resize behavior.
     * @param rowID Index of this row block
     * @param rowHeights Custom height map
     * @param defaultWidth Default width of rows
     * @param defaultHeight Default height of rows
     * @param ifResizeOn Shared global boolean for resize indicator
     * @param ifResizePointerDown Shared global boolean for pointer down
     * @param currentResizingRow Shared global row ID during resizing
     */
    constructor(
        rowID: number,
        rowHeights: RowData,
        defaultWidth: number,
        defaultHeight: number,
        ifResizeOn: BooleanObj,
        ifResizePointerDown: BooleanObj,
        currentResizingRow: NumberObj,
        selectionCoordinates:MultipleSelectionCoordinates
    ) {
        this.rowHeights = rowHeights;
        this.rowID = rowID;
        this.defaultHeight = defaultHeight;
        this.defaultWidth = defaultWidth;
        this.rowsPositionArr = [];
        this.currentResizingRow = currentResizingRow;
        this.ifResizeOn = ifResizeOn;
        this.ifResizePointerDown = ifResizePointerDown;
        this.selectionCoordinates=selectionCoordinates;
        this.setRowsPositionArr();
        this.rowCanvasDiv = this.createRowCanvas();
        this.handleResize();
    }

    /**
     * Adds resize behavior and hover logic to row borders.
     */
    private handleResize() {
        this.rowCanvasDiv.addEventListener("pointerdown", (event) => {
            if(this.binarySearchRange(event.offsetY)!==-1) this.ifResizePointerDown.value = true;
        });

        this.rowCanvasDiv.addEventListener("pointermove", (event) => {
            if (this.ifResizePointerDown.value) {
                this.currentResizingRow.value = this.rowID;
                return;
            }
            
            this.hoverIdx = this.binarySearchRange(event.offsetY);
            if (this.hoverIdx !== -1) {
                (this.ifResizeOn as BooleanObj).value = true;
                this.resizeDiv.style.display = "block";
                this.resizeDiv.style.top = `${this.rowsPositionArr[this.hoverIdx] - 1.5}px`;
                this.resizeDiv.style.zIndex = `10`;
            } else {
                if (!(this.ifResizePointerDown as BooleanObj).value) {
                    if (this.resizeDiv) this.resizeDiv.style.display = "none";
                }
                this.ifResizeOn.value = false;
            }
        });

        this.rowCanvasDiv.addEventListener("pointerout", (event) => {
            if (!(this.ifResizePointerDown as BooleanObj).value) {
                if (this.resizeDiv) this.resizeDiv.style.display = "none";
            }
            (this.ifResizeOn as BooleanObj).value = false;
        });
    }

    /**
     * Resizes a specific row when dragged, clamps height, and redraws.
     * @param newPosition The new Y position of the mouse
     */
    resizeRow(newPosition: number) {
        newPosition = newPosition - this.rowCanvasDiv.getBoundingClientRect().top;
        let newHeight=25;
        if(isNaN(newHeight)){
            console.log("nan at 1");
        }
        
        if (this.hoverIdx !== 0) {
            newHeight = newPosition - this.rowsPositionArr[this.hoverIdx - 1];
            if(isNaN(newHeight)){
                console.log("new height : ",this.hoverIdx);
            }
        } else {
            newHeight = newPosition;
        }
        if(isNaN(newHeight)){
            console.log("nan at 2");
        }
        newHeight = Math.max(25, newHeight);
        newHeight = Math.min(500, newHeight);
        if(isNaN(newHeight)){
            console.log("nan at 3");
        }
        if (this.hoverIdx !== 0) {
            (this.resizeDiv as HTMLDivElement).style.top = `${this.rowsPositionArr[this.hoverIdx - 1] + newHeight}px`;
        } else {
            (this.resizeDiv as HTMLDivElement).style.top = `${newHeight}px`;
        }

        if(isNaN(newHeight)){
            console.log("nan at 4");
        }

        
        const rowKey = this.rowID * 25 + this.hoverIdx + 1;
        if (newHeight === 25) {
            this.rowHeights.delete(rowKey);
        } else {
            this.rowHeights.set(rowKey, { height: newHeight });
        }

        
        if(isNaN(newHeight)){
            console.log("nan at 5");
        }

        this.setRowsPositionArr();
        this.drawCanvas();

    }

    /**
     * Finds the row index near the given vertical coordinate using binary search.
     * @param num The Y offset to check
     * @returns Row index if found near boundary, else -1
     */
    private binarySearchRange(num: number) {
        let start = 0;
        let end = 24;
        let mid;

        while (start <= end) {
            mid = Math.floor((start + end) / 2);

            if (Math.abs(num - this.rowsPositionArr[mid]) <= 5) {
                return mid;
            } else if (num > this.rowsPositionArr[mid]) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        // console.log("binary search num : ",num);
        return -1;
    }

    /**
     * Recalculates and stores vertical positions of rows using prefix sum.
     */
    private setRowsPositionArr() {
        let startNum = this.rowID * 25 + 1;
        let prefixSum = 0;

        this.rowsPositionArr.length = 0;
        for (let i = 0; i < 25; i++) {
    const rowData = this.rowHeights.get(i + startNum);
    if (rowData) {
        prefixSum += rowData.height;
    } else {
        prefixSum += this.defaultHeight;
    }
    this.rowsPositionArr.push(prefixSum);
}

    }

    /**
     * Creates and initializes the DOM structure for a single row block.
     * @returns HTMLDivElement containing canvas and resize line
     */
    private createRowCanvas() {
        const rowDiv = document.createElement("div");
        rowDiv.id = `row${this.rowID}`;
        rowDiv.classList.add("subRow");
        this.rowCanvas.setAttribute("row",`${this.rowID}`);
        this.drawCanvas();
        rowDiv.appendChild(this.rowCanvas);

        this.resizeDiv.classList.add("RowResizeDiv");
        rowDiv.appendChild(this.resizeDiv);

        return rowDiv;
    }

    /**
     * Draws row numbers and horizontal lines on the canvas.
     * Uses device pixel ratio for sharper rendering.
     */
drawCanvas() {
    if (!this.rowCanvas) return;
    const canvasStartRow=Math.min(this.selectionCoordinates.selectionEndRow,this.selectionCoordinates.selectionStartRow);
    const canvasEndRow=Math.max(this.selectionCoordinates.selectionEndRow,this.selectionCoordinates.selectionStartRow);
    const canvasStartColumn=Math.min(this.selectionCoordinates.selectionEndColumn,this.selectionCoordinates.selectionStartColumn);
    const canvasEndColumn=Math.max(this.selectionCoordinates.selectionEndColumn,this.selectionCoordinates.selectionStartColumn);

    const dpr = window.devicePixelRatio || 1;
    this.rowCanvas.width = this.defaultWidth * dpr;
    this.rowCanvas.height = this.rowsPositionArr[24] * dpr;
    this.rowCanvas.style.width = `${this.defaultWidth}px`;
    this.rowCanvas.style.height = `${this.rowsPositionArr[24]}px`;

    let widthOffset=0;

    const ctx = this.rowCanvas.getContext("2d") as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.defaultWidth, this.rowsPositionArr[24]);
    ctx.scale(dpr, dpr);

    // Fill background
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, this.defaultWidth, this.rowsPositionArr[24]);

    // === Draw Right Border First ===
    ctx.beginPath();
    ctx.strokeStyle = "#ddd";
    ctx.moveTo(this.defaultWidth - 0.5, 0);
    ctx.lineTo(this.defaultWidth - 0.5, this.rowsPositionArr[24]);
    ctx.stroke();

    // === Text and grid line setup ===
    ctx.font = '14px Arial';
    ctx.lineWidth = 1;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    let startNum = this.rowID * 25 + 1;
    const offset = 0.5 / dpr;

    for (let i = 0; i < 25; i++) {
        const yTop = (i === 0) ? 0 : this.rowsPositionArr[i - 1];
        const yBottom = this.rowsPositionArr[i];
        const yPos = Math.round(yBottom - (yBottom - yTop) / 2 + 1);

        const rowIndex = i + startNum;

        // Handle selection
        if (this.ifSelected(rowIndex)) {
            widthOffset=2;
            if (this.ifSelectedWhole()) {
                ctx.fillStyle = "#107C41";
                ctx.fillRect(0, yTop, this.defaultWidth, yBottom - yTop);
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#ffffff";
            } else {
                ctx.fillStyle = "#CAEAD8";
                ctx.fillRect(0, yTop, this.defaultWidth, yBottom - yTop);

                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.strokeStyle = "#107C41";
                ctx.moveTo(this.defaultWidth - 1, yTop);
                ctx.lineTo(this.defaultWidth - 1, yBottom);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.fillStyle = "#0F703B";
                ctx.strokeStyle = "#A0D8B9";
            }
        } else {
            ctx.fillStyle = "#616161";
            ctx.strokeStyle = "#ddd";
            widthOffset=0;
        }

        // Draw horizontal grid line
        ctx.beginPath();
        ctx.moveTo(0, this.rowsPositionArr[i] - offset);
        ctx.lineTo(this.defaultWidth-widthOffset, this.rowsPositionArr[i] - offset);
        ctx.stroke();

        // Draw text
        ctx.fillText(`${rowIndex}`, this.defaultWidth - 5, yPos);
    }

    
    // const canvas

    ctx.beginPath();
    if(this.ifSelectedWhole()){
        if(canvasEndRow<=this.rowID*25+25 && canvasEndRow>=this.rowID*25+1 && (canvasEndRow===this.selectionCoordinates.selectionStartRow || canvasEndRow=== this.selectionCoordinates.selectionEndRow)){
            const lastIdx=(canvasEndRow-1)%25;
            ctx.strokeStyle="#107C41";
            ctx.lineWidth=2;
            ctx.moveTo(0,this.rowsPositionArr[lastIdx]-1);
            ctx.lineTo(this.defaultWidth,this.rowsPositionArr[lastIdx]-1);
        }
    }else{
        if(canvasStartRow<=this.rowID*25+25 && canvasStartRow>=this.rowID*25+1 && (canvasStartRow===this.selectionCoordinates.selectionStartRow || canvasStartRow=== this.selectionCoordinates.selectionEndRow)){
            const firstIdx=(canvasStartRow-1)%25;
            ctx.strokeStyle="#A0D8B9";
            ctx.lineWidth=1;
            ctx.moveTo(0,(firstIdx===0)?0:this.rowsPositionArr[firstIdx-1]);
            ctx.lineTo(this.defaultWidth,(firstIdx===0)?0:this.rowsPositionArr[firstIdx-1]);
        }
    }


    ctx.stroke();
}

    private ifSelected(num:number){
    const canvasStartRow=Math.min(this.selectionCoordinates.selectionEndRow,this.selectionCoordinates.selectionStartRow);
    const canvasEndRow=Math.max(this.selectionCoordinates.selectionEndRow,this.selectionCoordinates.selectionStartRow);
    
        return num>=canvasStartRow && num<=canvasEndRow;
    }

    private ifSelectedWhole(){
        const canvasStartColumn=Math.min(this.selectionCoordinates.selectionEndColumn,this.selectionCoordinates.selectionStartColumn);
        const canvasEndColumn=Math.max(this.selectionCoordinates.selectionEndColumn,this.selectionCoordinates.selectionStartColumn);
        return canvasStartColumn===1 && canvasEndColumn===1000;
    }
}
