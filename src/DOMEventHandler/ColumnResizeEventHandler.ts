import { ColumnsCanvas } from "../ColumnsCanvas.js";
import { ColumnsManager } from "../ColumnsManager.js";
import { TilesManager } from "../TilesManager.js";
import { ColumnResizingOperation } from "../UndoRedoManager/ColumnResizingOperation.js";
import { UndoRedoManager } from "../UndoRedoManager/UndoRedoManager.js";
import { PointerEventHandlerBase } from "./PointerEventHandlerBase.js";

export class ColumnsResizeEventHandler extends PointerEventHandlerBase{
    private ColumnDiv:HTMLDivElement;
    private columnsManager:ColumnsManager;
    private tilesManager:TilesManager;
    private undoRedoManager:UndoRedoManager;
    private currentCanvasObj:ColumnsCanvas|null;
    private columnID:number|null;
    private hoverIdx:number;
    private columnKey:number;
    private prevValue:number;
    private newValue:number;

    constructor(
        columnsManager:ColumnsManager,
        tilesManager:TilesManager,
        undoRedoManager:UndoRedoManager
    ){
        super();
        this.columnsManager=columnsManager;
        this.tilesManager=tilesManager;
        this.undoRedoManager=undoRedoManager;
        this.ColumnDiv=columnsManager.columnsDivContainer;
        this.currentCanvasObj=null;
        this.columnID=null;
        this.hoverIdx=-1;
        this.columnKey=-1;
        this.newValue=columnsManager.defaultWidth;
        this.prevValue=columnsManager.defaultWidth;
    }

    hitTest(event: PointerEvent): boolean {
        const currentElement=event.target;
        if(!currentElement || !(currentElement instanceof HTMLCanvasElement)) return false;

        if(!this.ColumnDiv.contains(currentElement)) return false;

        this.columnID=parseInt(currentElement.getAttribute("col") as string);

        this.currentCanvasObj=this.columnsManager.getCurrentColumnCanvas(this.columnID);

        if(!this.currentCanvasObj) return false;

        const currentCanvasRect=currentElement.getBoundingClientRect();

        const offsetX=event.clientX - currentCanvasRect.left;

        this.hoverIdx=this.currentCanvasObj.binarySearchRange(offsetX);

        return this.hoverIdx!==-1;
    }

    pointerDown(event: PointerEvent): void {
        document.body.style.cursor="ew-resize";
        
        this.columnKey=(this.columnID as number)*25 + 1 + this.hoverIdx;
        this.prevValue=this.columnsManager.columnWidths.get(this.columnKey)?.width || 100;
        this.newValue=this.prevValue;
    }

    pointerMove(event: PointerEvent): void {
        this.currentCanvasObj!.resizeColumn(event.clientX,this.hoverIdx,this.columnKey);
    }

    pointerUp(event: PointerEvent): void {
        document.body.style.cursor="";
        const columnResizeOperation = new ColumnResizingOperation(
            this.columnKey,
            this.prevValue,
            this.currentCanvasObj!.getNewValue(),
            this.currentCanvasObj!.columnWidths,
            this.columnsManager,
            this.tilesManager,
            this.currentCanvasObj!
        );

        this.undoRedoManager.execute(columnResizeOperation);
        this.tilesManager.redrawColumn(this.columnID!);
    }
}